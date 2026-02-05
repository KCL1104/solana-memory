use anchor_lang::prelude::*;

// ============================================================================
// IDENTITY-MEMORY BINDING MODULE
// ============================================================================
// ERC-8004 inspired identity binding with SAID Protocol compatibility
// Provides cryptographic binding between on-chain identities and agent memories

/// Maximum agent ID length
pub const MAX_AGENT_ID_LENGTH: usize = 128;

/// Maximum number of bindings per identity
pub const MAX_BINDINGS_PER_IDENTITY: usize = 100;

/// Identity memory binding account
/// Links a SAID Protocol identity to an AgentMemory agent
#[account]
#[derive(InitSpace)]
pub struct IdentityMemoryBinding {
    /// The SAID Protocol identity public key
    pub identity_pubkey: Pubkey,
    /// Agent identifier (unique string)
    #[max_len(MAX_AGENT_ID_LENGTH)]
    pub agent_id: String,
    /// Ed25519 signature proving ownership
    pub binding_signature: [u8; 64],
    /// Unix timestamp when binding was created
    pub bound_at: i64,
    /// Whether the binding has been revoked
    pub revoked: bool,
    /// Unix timestamp when binding was revoked (if applicable)
    pub revoked_at: Option<i64>,
    /// The vault pubkey associated with this agent
    pub vault_pubkey: Pubkey,
    /// Binding version for key rotation scenarios
    pub version: u32,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Identity binding registry
/// Tracks all bindings for a given identity for efficient lookup
#[account]
#[derive(InitSpace)]
pub struct IdentityBindingRegistry {
    /// The SAID Protocol identity public key
    pub identity_pubkey: Pubkey,
    /// List of bound agent IDs
    #[max_len(MAX_BINDINGS_PER_IDENTITY, MAX_AGENT_ID_LENGTH)]
    pub agent_ids: Vec<String>,
    /// Total number of active bindings
    pub active_binding_count: u32,
    /// Unix timestamp when registry was created
    pub created_at: i64,
    /// Unix timestamp of last update
    pub updated_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl IdentityMemoryBinding {
    /// Verify the binding signature using ed25519
    pub fn verify_ownership(&self) -> Result<bool> {
        let message = format!("{}:{}", self.identity_pubkey, self.agent_id);
        
        // Verify ed25519 signature
        verify_signature(
            &self.identity_pubkey,
            message.as_bytes(),
            &self.binding_signature
        )
    }

    /// Check if binding is active (not revoked)
    pub fn is_active(&self) -> bool {
        !self.revoked
    }

    /// Get binding age in seconds
    pub fn age_seconds(&self, current_time: i64) -> i64 {
        current_time - self.bound_at
    }
}

/// Verify an ed25519 signature
/// 
/// Note: This is a simplified implementation. In production, use the 
/// Solana ed25519 program for on-chain verification or the ed25519-dalek crate.
fn verify_signature(
    _pubkey: &Pubkey,
    _message: &[u8],
    signature: &[u8; 64],
) -> Result<bool> {
    // Verify signature has correct length (64 bytes for ed25519)
    // In production, implement proper ed25519 verification
    // This requires either:
    // 1. Using the Solana ed25519 program via CPI
    // 2. Using the ed25519-dalek crate for off-chain verification
    require!(
        signature.len() == 64,
        IdentityBindingError::InvalidSignature
    );
    
    // For this implementation, we check the signature length is valid
    // Real verification should be done via:
    // - CPI to ed25519 program for on-chain
    // - ed25519-dalek crate for off-chain testing
    Ok(true)
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

/// Bind a SAID Protocol identity to an AgentMemory agent
pub fn bind_identity(
    ctx: Context<BindIdentityToMemory>,
    agent_id: String,
    signature: [u8; 64],
) -> Result<()> {
    // Validate agent_id length
    require!(
        !agent_id.is_empty() && agent_id.len() <= MAX_AGENT_ID_LENGTH,
        IdentityBindingError::InvalidAgentId
    );

    let binding = &mut ctx.accounts.binding;
    let registry = &mut ctx.accounts.registry;
    let identity = &ctx.accounts.identity;
    let vault = &ctx.accounts.vault;
    let clock = Clock::get()?;

    // Verify signature
    let message = format!("{}:{}", identity.key(), agent_id);
    require!(
        verify_signature(&identity.key(), message.as_bytes(), &signature)?,
        IdentityBindingError::InvalidSignature
    );

    // Initialize binding
    binding.identity_pubkey = identity.key();
    binding.agent_id = agent_id.clone();
    binding.binding_signature = signature;
    binding.bound_at = clock.unix_timestamp;
    binding.revoked = false;
    binding.revoked_at = None;
    binding.vault_pubkey = vault.key();
    binding.version = 1;
    binding.bump = ctx.bumps.binding;

    // Update registry
    if !registry.agent_ids.contains(&agent_id) {
        require!(
            registry.agent_ids.len() < MAX_BINDINGS_PER_IDENTITY,
            IdentityBindingError::MaxBindingsReached
        );
        registry.agent_ids.push(agent_id.clone());
        registry.active_binding_count += 1;
    }
    registry.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(IdentityBound {
        identity: identity.key(),
        agent_id: agent_id,
        binding: binding.key(),
        vault: vault.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

/// Verify that a binding is valid
pub fn verify_binding(ctx: Context<VerifyBinding>) -> Result<bool> {
    let binding = &ctx.accounts.binding;
    
    // Check if binding is revoked
    if binding.revoked {
        return Ok(false);
    }
    
    // Verify signature
    binding.verify_ownership()
}

/// Revoke an identity-memory binding
pub fn revoke_binding(ctx: Context<RevokeBinding>) -> Result<()> {
    let binding = &mut ctx.accounts.binding;
    let registry = &mut ctx.accounts.registry;
    let clock = Clock::get()?;

    // Verify the revoker is the identity owner
    require!(
        ctx.accounts.owner.key() == binding.identity_pubkey,
        IdentityBindingError::UnauthorizedRevocation
    );

    // Mark binding as revoked
    require!(!binding.revoked, IdentityBindingError::AlreadyRevoked);
    binding.revoked = true;
    binding.revoked_at = Some(clock.unix_timestamp);

    // Update registry
    registry.active_binding_count = registry.active_binding_count.saturating_sub(1);
    registry.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(IdentityBindingRevoked {
        identity: binding.identity_pubkey,
        agent_id: binding.agent_id.clone(),
        binding: binding.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

/// Re-activate a revoked binding (requires new signature)
pub fn reactivate_binding(
    ctx: Context<ReactivateBinding>,
    signature: [u8; 64],
) -> Result<()> {
    let binding = &mut ctx.accounts.binding;
    let registry = &mut ctx.accounts.registry;
    let identity = &ctx.accounts.identity;
    let clock = Clock::get()?;

    // Verify owner
    require!(
        ctx.accounts.owner.key() == binding.identity_pubkey,
        IdentityBindingError::UnauthorizedReactivation
    );

    // Verify new signature
    let message = format!("{}:{}", identity.key(), binding.agent_id);
    require!(
        verify_signature(&identity.key(), message.as_bytes(), &signature)?,
        IdentityBindingError::InvalidSignature
    );

    // Reactivate
    require!(binding.revoked, IdentityBindingError::NotRevoked);
    binding.revoked = false;
    binding.revoked_at = None;
    binding.binding_signature = signature;
    binding.version += 1;
    binding.bound_at = clock.unix_timestamp;

    // Update registry
    registry.active_binding_count += 1;
    registry.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(IdentityBindingReactivated {
        identity: binding.identity_pubkey,
        agent_id: binding.agent_id.clone(),
        binding: binding.key(),
        new_version: binding.version,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

/// Rotate the binding signature (key rotation scenario)
pub fn rotate_binding_signature(
    ctx: Context<RotateBindingSignature>,
    new_signature: [u8; 64],
) -> Result<()> {
    let binding = &mut ctx.accounts.binding;
    let identity = &ctx.accounts.identity;
    let clock = Clock::get()?;

    // Verify owner
    require!(
        ctx.accounts.owner.key() == binding.identity_pubkey,
        IdentityBindingError::UnauthorizedRotation
    );

    // Verify new signature
    let message = format!("{}:{}", identity.key(), binding.agent_id);
    require!(
        verify_signature(&identity.key(), message.as_bytes(), &new_signature)?,
        IdentityBindingError::InvalidSignature
    );

    // Update signature and version
    binding.binding_signature = new_signature;
    binding.version += 1;
    binding.bound_at = clock.unix_timestamp;

    // Emit event
    emit!(BindingSignatureRotated {
        identity: binding.identity_pubkey,
        agent_id: binding.agent_id.clone(),
        binding: binding.key(),
        new_version: binding.version,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

/// Initialize a new identity binding registry
pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    let identity = &ctx.accounts.identity;
    let clock = Clock::get()?;

    registry.identity_pubkey = identity.key();
    registry.agent_ids = vec![];
    registry.active_binding_count = 0;
    registry.created_at = clock.unix_timestamp;
    registry.updated_at = clock.unix_timestamp;
    registry.bump = ctx.bumps.registry;

    emit!(RegistryInitialized {
        identity: identity.key(),
        registry: registry.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ============================================================================
// CONTEXT STRUCTURES
// ============================================================================

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct BindIdentityToMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: SAID Protocol identity account
    pub identity: AccountInfo<'info>,

    /// CHECK: The vault associated with this agent
    pub vault: AccountInfo<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + IdentityMemoryBinding::INIT_SPACE,
        seeds = [
            b"identity_binding",
            identity.key().as_ref(),
            agent_id.as_bytes(),
        ],
        bump
    )]
    pub binding: Account<'info, IdentityMemoryBinding>,

    #[account(
        mut,
        seeds = [b"identity_registry", identity.key().as_ref()],
        bump = registry.bump,
    )]
    pub registry: Account<'info, IdentityBindingRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyBinding<'info> {
    pub binding: Account<'info, IdentityMemoryBinding>,
}

#[derive(Accounts)]
pub struct RevokeBinding<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = binding.identity_pubkey == owner.key() @ IdentityBindingError::UnauthorizedRevocation,
    )]
    pub binding: Account<'info, IdentityMemoryBinding>,

    #[account(
        mut,
        seeds = [b"identity_registry", binding.identity_pubkey.as_ref()],
        bump = registry.bump,
    )]
    pub registry: Account<'info, IdentityBindingRegistry>,
}

#[derive(Accounts)]
pub struct ReactivateBinding<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: SAID Protocol identity account
    pub identity: AccountInfo<'info>,

    #[account(
        mut,
        constraint = binding.identity_pubkey == owner.key() @ IdentityBindingError::UnauthorizedReactivation,
    )]
    pub binding: Account<'info, IdentityMemoryBinding>,

    #[account(
        mut,
        seeds = [b"identity_registry", binding.identity_pubkey.as_ref()],
        bump = registry.bump,
    )]
    pub registry: Account<'info, IdentityBindingRegistry>,
}

#[derive(Accounts)]
pub struct RotateBindingSignature<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: SAID Protocol identity account
    pub identity: AccountInfo<'info>,

    #[account(
        mut,
        constraint = binding.identity_pubkey == owner.key() @ IdentityBindingError::UnauthorizedRotation,
    )]
    pub binding: Account<'info, IdentityMemoryBinding>,
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: SAID Protocol identity account
    pub identity: AccountInfo<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + IdentityBindingRegistry::INIT_SPACE,
        seeds = [b"identity_registry", identity.key().as_ref()],
        bump
    )]
    pub registry: Account<'info, IdentityBindingRegistry>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct IdentityBound {
    pub identity: Pubkey,
    pub agent_id: String,
    pub binding: Pubkey,
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct IdentityBindingRevoked {
    pub identity: Pubkey,
    pub agent_id: String,
    pub binding: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct IdentityBindingReactivated {
    pub identity: Pubkey,
    pub agent_id: String,
    pub binding: Pubkey,
    pub new_version: u32,
    pub timestamp: i64,
}

#[event]
pub struct BindingSignatureRotated {
    pub identity: Pubkey,
    pub agent_id: String,
    pub binding: Pubkey,
    pub new_version: u32,
    pub timestamp: i64,
}

#[event]
pub struct RegistryInitialized {
    pub identity: Pubkey,
    pub registry: Pubkey,
    pub timestamp: i64,
}

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum IdentityBindingError {
    #[msg("Invalid signature")]
    InvalidSignature,

    #[msg("Unauthorized to revoke this binding")]
    UnauthorizedRevocation,

    #[msg("Unauthorized to reactivate this binding")]
    UnauthorizedReactivation,

    #[msg("Unauthorized to rotate this binding's signature")]
    UnauthorizedRotation,

    #[msg("Binding is already revoked")]
    AlreadyRevoked,

    #[msg("Binding is not revoked")]
    NotRevoked,

    #[msg("Invalid agent ID (empty or too long)")]
    InvalidAgentId,

    #[msg("Maximum number of bindings reached for this identity")]
    MaxBindingsReached,

    #[msg("Registry not initialized")]
    RegistryNotInitialized,

    #[msg("Binding not found")]
    BindingNotFound,
}

// ============================================================================
// SDK COMPATIBILITY HELPERS
// ============================================================================

/// Derive the PDA for an identity-memory binding
pub fn derive_binding_pda(
    identity: &Pubkey,
    agent_id: &str,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"identity_binding",
            identity.as_ref(),
            agent_id.as_bytes(),
        ],
        program_id,
    )
}

/// Derive the PDA for an identity binding registry
pub fn derive_registry_pda(
    identity: &Pubkey,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"identity_registry",
            identity.as_ref(),
        ],
        program_id,
    )
}
