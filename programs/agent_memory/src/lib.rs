use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Program ID - will be replaced with actual key
// declare_id!("...");

/// AgentMemory Protocol
/// On-chain persistent memory for AI agents
#[program]
pub mod agent_memory {
    use super::*;

    /// Initialize a memory vault for an agent
    /// This is called once per agent-human pair
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        encryption_pubkey: [u8; 32],
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let agent_profile = &mut ctx.accounts.agent_profile;
        let clock = Clock::get()?;

        vault.owner = ctx.accounts.owner.key();
        vault.agent_key = ctx.accounts.agent_key.key();
        vault.encryption_pubkey = encryption_pubkey;
        vault.created_at = clock.unix_timestamp;
        vault.updated_at = clock.unix_timestamp;
        vault.memory_count = 0;
        vault.total_memory_size = 0;
        vault.bump = ctx.bumps.vault;

        agent_profile.agent_key = ctx.accounts.agent_key.key();
        agent_profile.owner = ctx.accounts.owner.key();
        agent_profile.vault = vault.key();
        agent_profile.name = String::new();
        agent_profile.capabilities = Vec::new();
        agent_profile.reputation_score = 0;
        agent_profile.tasks_completed = 0;
        agent_profile.created_at = clock.unix_timestamp;
        agent_profile.updated_at = clock.unix_timestamp;
        agent_profile.is_public = true;
        agent_profile.bump = ctx.bumps.agent_profile;

        msg!("Vault initialized for agent: {}", ctx.accounts.agent_key.key());
        Ok(())
    }

    /// Store a memory shard
    /// Memory content is stored encrypted (client-side encryption)
    pub fn store_memory(
        ctx: Context<StoreMemory>,
        key: String,
        content_hash: [u8; 32],
        content_size: u32,
        metadata: MemoryMetadata,
    ) -> Result<()> {
        require!(key.len() <= 64, AgentMemoryError::KeyTooLong);
        require!(content_size <= 10_000_000, AgentMemoryError::ContentTooLarge);

        let vault = &mut ctx.accounts.vault;
        let memory_shard = &mut ctx.accounts.memory_shard;
        let clock = Clock::get()?;

        // Check if memory with this key already exists
        // If so, this is an update
        let is_update = memory_shard.created_at != 0;

        if !is_update {
            // New memory
            vault.memory_count += 1;
        } else {
            // Update - adjust size
            vault.total_memory_size = vault.total_memory_size
                .saturating_sub(memory_shard.content_size as u64);
        }

        memory_shard.vault = vault.key();
        memory_shard.key = key.clone();
        memory_shard.content_hash = content_hash;
        memory_shard.content_size = content_size;
        memory_shard.metadata = metadata;
        memory_shard.created_at = if is_update { memory_shard.created_at } else { clock.unix_timestamp };
        memory_shard.updated_at = clock.unix_timestamp;
        memory_shard.version += 1;
        memory_shard.bump = ctx.bumps.memory_shard;

        vault.total_memory_size += content_size as u64;
        vault.updated_at = clock.unix_timestamp;

        msg!("Memory stored: {} (version: {})", key, memory_shard.version);
        Ok(())
    }

    /// Delete a memory shard
    pub fn delete_memory(ctx: Context<DeleteMemory>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let memory_shard = &ctx.accounts.memory_shard;

        vault.memory_count = vault.memory_count.saturating_sub(1);
        vault.total_memory_size = vault.total_memory_size
            .saturating_sub(memory_shard.content_size as u64);
        vault.updated_at = Clock::get()?.unix_timestamp;

        msg!("Memory deleted: {}", memory_shard.key);
        Ok(())
    }

    /// Update agent profile
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        name: Option<String>,
        capabilities: Option<Vec<String>>,
        is_public: Option<bool>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.agent_profile;
        let clock = Clock::get()?;

        if let Some(name) = name {
            require!(name.len() <= 128, AgentMemoryError::NameTooLong);
            profile.name = name;
        }

        if let Some(capabilities) = capabilities {
            require!(capabilities.len() <= 20, AgentMemoryError::TooManyCapabilities);
            for cap in &capabilities {
                require!(cap.len() <= 64, AgentMemoryError::CapabilityTooLong);
            }
            profile.capabilities = capabilities;
        }

        if let Some(is_public) = is_public {
            profile.is_public = is_public;
        }

        profile.updated_at = clock.unix_timestamp;

        msg!("Profile updated for agent: {}", profile.agent_key);
        Ok(())
    }

    /// Record a completed task (reputation building)
    pub fn record_task_completion(ctx: Context<RecordTask>) -> Result<()> {
        let profile = &mut ctx.accounts.agent_profile;
        
        profile.tasks_completed += 1;
        // Simple reputation formula: 10 points per task, capped at 10000
        profile.reputation_score = (profile.tasks_completed * 10).min(10000);
        profile.updated_at = Clock::get()?.unix_timestamp;

        msg!("Task recorded. Total completed: {}", profile.tasks_completed);
        Ok(())
    }

    /// Grant memory access to another agent
    pub fn grant_access(
        ctx: Context<GrantAccess>,
        expiration: Option<i64>,
    ) -> Result<()> {
        let access_grant = &mut ctx.accounts.access_grant;
        let clock = Clock::get()?;

        access_grant.vault = ctx.accounts.vault.key();
        access_grant.grantee = ctx.accounts.grantee.key();
        access_grant.granted_at = clock.unix_timestamp;
        access_grant.expires_at = expiration;
        access_grant.is_active = true;
        access_grant.bump = ctx.bumps.access_grant;

        msg!("Access granted to: {}", ctx.accounts.grantee.key());
        Ok(())
    }

    /// Revoke memory access
    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let access_grant = &mut ctx.accounts.access_grant;
        access_grant.is_active = false;

        msg!("Access revoked for: {}", access_grant.grantee);
        Ok(())
    }
}

/// Memory vault - top-level container for an agent's memory
#[account]
#[derive(InitSpace)]
pub struct MemoryVault {
    pub owner: Pubkey,                    // Human owner
    pub agent_key: Pubkey,                // Agent's public key
    pub encryption_pubkey: [u8; 32],      // For client-side encryption
    pub created_at: i64,
    pub updated_at: i64,
    pub memory_count: u32,
    pub total_memory_size: u64,           // Total bytes stored
    pub bump: u8,
}

/// Individual memory shard
#[account]
#[derive(InitSpace)]
pub struct MemoryShard {
    pub vault: Pubkey,                    // Parent vault
    #[max_len(64)]
    pub key: String,                      // Memory key/label
    pub content_hash: [u8; 32],           // SHA-256 hash of encrypted content
    pub content_size: u32,                // Size in bytes
    pub metadata: MemoryMetadata,
    pub created_at: i64,
    pub updated_at: i64,
    pub version: u32,                     // For versioning/history
    pub bump: u8,
}

/// Agent profile - public information
#[account]
#[derive(InitSpace)]
pub struct AgentProfile {
    pub agent_key: Pubkey,
    pub owner: Pubkey,
    pub vault: Pubkey,
    #[max_len(128)]
    pub name: String,
    #[max_len(20)]  // Max 20 capabilities
    pub capabilities: Vec<String>,
    pub reputation_score: u32,
    pub tasks_completed: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_public: bool,
    pub bump: u8,
}

/// Access control for memory sharing
#[account]
#[derive(InitSpace)]
pub struct AccessGrant {
    pub vault: Pubkey,
    pub grantee: Pubkey,                  // Agent being granted access
    pub granted_at: i64,
    pub expires_at: Option<i64>,
    pub is_active: bool,
    pub bump: u8,
}

/// Metadata for memory shards
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MemoryMetadata {
    pub memory_type: MemoryType,
    pub importance: u8,                   // 0-255, for pruning decisions
    pub tags: [u8; 8],                    // Bitmask for quick categorization
    pub ipfs_cid: Option<[u8; 46]>,       // Optional IPFS reference for large content
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum MemoryType {
    Conversation,      // Chat history
    Learning,          // Something learned
    Preference,        // User/agent preferences
    Task,              // Task-related info
    Relationship,      // Info about other agents/humans
    Knowledge,         // General knowledge
    System,            // System configuration
}

/// Initialize vault context
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Agent key is provided by owner, we verify through PDA
    pub agent_key: AccountInfo<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + MemoryVault::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref(), agent_key.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + AgentProfile::INIT_SPACE,
        seeds = [b"profile", agent_key.key().as_ref()],
        bump
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    
    pub system_program: Program<'info, System>,
}

/// Store memory context
#[derive(Accounts)]
#[instruction(key: String)]
pub struct StoreMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + MemoryShard::INIT_SPACE,
        seeds = [b"memory", vault.key().as_ref(), key.as_bytes()],
        bump
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    pub system_program: Program<'info, System>,
}

/// Delete memory context
#[derive(Accounts)]
pub struct DeleteMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        close = owner,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    pub system_program: Program<'info, System>,
}

/// Update profile context
#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", agent_profile.agent_key.as_ref()],
        bump = agent_profile.bump,
        has_one = owner,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
}

/// Record task context
#[derive(Accounts)]
pub struct RecordTask<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", agent_profile.agent_key.as_ref()],
        bump = agent_profile.bump,
        has_one = owner,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
}

/// Grant access context
#[derive(Accounts)]
pub struct GrantAccess<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    /// CHECK: The agent being granted access
    pub grantee: AccountInfo<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + AccessGrant::INIT_SPACE,
        seeds = [b"access", vault.key().as_ref(), grantee.key().as_ref()],
        bump
    )]
    pub access_grant: Account<'info, AccessGrant>,
    
    pub system_program: Program<'info, System>,
}

/// Revoke access context
#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"access", vault.key().as_ref(), access_grant.grantee.as_ref()],
        bump = access_grant.bump,
    )]
    pub access_grant: Account<'info, AccessGrant>,
}

/// Custom errors
#[error_code]
pub enum AgentMemoryError {
    #[msg("Memory key too long (max 64 characters)")]
    KeyTooLong,
    #[msg("Content too large (max 10MB)")]
    ContentTooLarge,
    #[msg("Name too long (max 128 characters)")]
    NameTooLong,
    #[msg("Too many capabilities (max 20)")]
    TooManyCapabilities,
    #[msg("Capability description too long (max 64 characters)")]
    CapabilityTooLong,
    #[msg("Access expired")]
    AccessExpired,
    #[msg("Access not granted")]
    AccessNotGranted,
}
