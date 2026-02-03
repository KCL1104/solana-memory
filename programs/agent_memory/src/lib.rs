// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub profile: Pubkey,
    pub owner: Pubkey,
    pub agent_key: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MemoryCreated {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub version: u32,
    pub content_size: u32,
    pub timestamp: i64,
}

#[event]
pub struct MemoryUpdated {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub old_version: u32,
    pub new_version: u32,
    pub content_size: u32,
    pub timestamp: i64,
}

#[event]
pub struct MemoryDeleted {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub timestamp: i64,
}

#[event]
pub struct MemoryRestored {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub timestamp: i64,
}

#[event]
pub struct MemoryPermanentlyDeleted {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub timestamp: i64,
}

#[event]
pub struct MemoryRolledBack {
    pub vault: Pubkey,
    pub memory: Pubkey,
    pub key: String,
    pub from_version: u32,
    pub to_version: u32,
    pub new_version: u32,
    pub timestamp: i64,
}

#[event]
pub struct BatchMemoryCreated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub count: u32,
    pub total_size: u64,
    pub storage_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct BatchMemoryDeleted {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub count: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProfileUpdated {
    pub profile: Pubkey,
    pub agent_key: Pubkey,
    pub updated_fields: u8, // Bitmask: 1=name, 2=capabilities, 4=is_public
    pub timestamp: i64,
}

#[event]
pub struct TaskCompleted {
    pub profile: Pubkey,
    pub agent_key: Pubkey,
    pub tasks_completed: u32,
    pub reputation_score: u32,
    pub timestamp: i64,
}

#[event]
pub struct AccessGranted {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub granted_by: Pubkey,
    pub permission_level: u8,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
}

#[event]
pub struct AccessRevoked {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub revoked_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SharingGroupCreated {
    pub group: Pubkey,
    pub creator: Pubkey,
    pub vault: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct GroupMemberAdded {
    pub group: Pubkey,
    pub member: Pubkey,
    pub permission: u8,
    pub timestamp: i64,
}

#[event]
pub struct GroupMemberRemoved {
    pub group: Pubkey,
    pub member: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MemoryAccessLogged {
    pub memory: Pubkey,
    pub accessor: Pubkey,
    pub access_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct TokensStaked {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensUnstaked {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub remaining_stake: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub points: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolConfigInitialized {
    pub config: Pubkey,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolConfigUpdated {
    pub config: Pubkey,
    pub admin: Pubkey,
    pub updated_fields: u8,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolPauseChanged {
    pub config: Pubkey,
    pub admin: Pubkey,
    pub paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct AdminTransferred {
    pub config: Pubkey,
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
    pub timestamp: i64,
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

/// Memory vault - top-level container for an agent's memory
/// 
/// # Size
/// Approximately 169 bytes (8 byte discriminator + 161 bytes data)
#[account]
#[derive(InitSpace)]
pub struct MemoryVault {
    pub owner: Pubkey,           // 32 bytes
    pub agent_key: Pubkey,       // 32 bytes
    pub encryption_pubkey: [u8; 32], // 32 bytes
    pub created_at: i64,         // 8 bytes
    pub updated_at: i64,         // 8 bytes
    pub memory_count: u32,       // 4 bytes
    pub total_memory_size: u64,  // 8 bytes
    pub staked_amount: u64,      // 8 bytes
    pub reward_points: u32,      // 4 bytes
    pub is_active: bool,         // 1 byte
    pub bump: u8,                // 1 byte
}

/// Individual memory shard with version tracking
/// 
/// # Size
/// Approximately 171 bytes + key length (max 235 bytes total)
#[account]
#[derive(InitSpace)]
pub struct MemoryShard {
    pub vault: Pubkey,              // 32 bytes
    #[max_len(MAX_KEY_LENGTH)]
    pub key: String,                // 4 + up to 64 bytes
    pub content_hash: [u8; 32],     // 32 bytes
    pub content_size: u32,          // 4 bytes
    pub metadata: MemoryMetadata,   // 59 bytes
    pub created_at: i64,            // 8 bytes
    pub updated_at: i64,            // 8 bytes
    pub version: u32,               // 4 bytes
    pub is_deleted: bool,           // 1 byte
    pub deleted_at: Option<i64>,    // 1 + 8 bytes
    pub previous_version_hash: Option<[u8; 32]>, // 1 + 32 bytes
    pub bump: u8,                   // 1 byte
}

/// Agent profile - public information
/// 
/// # Size
/// Approximately 262 bytes + dynamic fields
#[account]
#[derive(InitSpace)]
pub struct AgentProfile {
    pub agent_key: Pubkey,              // 32 bytes
    pub owner: Pubkey,                  // 32 bytes
    pub vault: Pubkey,                  // 32 bytes
    #[max_len(MAX_NAME_LENGTH)]
    pub name: String,                   // 4 + up to 128 bytes
    #[max_len(MAX_CAPABILITIES, MAX_CAPABILITY_LENGTH)]
    pub capabilities: Vec<String>,      // 4 + up to 20 * (4 + 64) bytes
    pub reputation_score: u32,          // 4 bytes
    pub tasks_completed: u32,           // 4 bytes
    pub created_at: i64,                // 8 bytes
    pub updated_at: i64,                // 8 bytes
    pub last_task_at: i64,              // 8 bytes
    pub is_public: bool,                // 1 byte
    pub bump: u8,                       // 1 byte
}

/// Access control with permission levels
/// 
/// # Size
/// Approximately 74 bytes
#[account]
#[derive(InitSpace)]
pub struct AccessGrant {
    pub vault: Pubkey,              // 32 bytes
    pub grantee: Pubkey,            // 32 bytes
    pub permission_level: PermissionLevel, // 1 byte
    pub granted_at: i64,            // 8 bytes
    pub expires_at: Option<i64>,    // 1 + 8 bytes
    pub is_active: bool,            // 1 byte
    pub revoked_at: Option<i64>,    // 1 + 8 bytes
    pub bump: u8,                   // 1 byte
}

/// Sharing group for collaborative memory access
/// 
/// # Size
/// Approximately 428 bytes + dynamic fields
#[account]
#[derive(InitSpace)]
pub struct SharingGroup {
    pub creator: Pubkey,            // 32 bytes
    pub vault: Pubkey,              // 32 bytes
    #[max_len(MAX_GROUP_NAME_LENGTH)]
    pub name: String,               // 4 + up to 64 bytes
    #[max_len(MAX_GROUP_DESC_LENGTH)]
    pub description: String,        // 4 + up to 256 bytes
    #[max_len(MAX_GROUP_MEMBERS)]
    pub members: Vec<GroupMember>,  // 4 + up to 50 * 41 bytes
    pub member_count: u32,          // 4 bytes
    pub created_at: i64,            // 8 bytes
    pub updated_at: i64,            // 8 bytes
    pub is_active: bool,            // 1 byte
    pub bump: u8,                   // 1 byte
}

/// Group member entry
/// 
/// # Size
/// 41 bytes
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct GroupMember {
    pub member: Pubkey,             // 32 bytes
    pub permission: PermissionLevel, // 1 byte
    pub joined_at: i64,             // 8 bytes
}

/// Access log entry
/// 
/// # Size
/// Approximately 51 bytes
#[account]
#[derive(InitSpace)]
pub struct AccessLog {
    pub memory: Pubkey,             // 32 bytes
    pub accessor: Pubkey,           // 32 bytes
    pub access_type: AccessType,    // 1 byte
    pub timestamp: i64,             // 8 bytes
    pub bump: u8,                   // 1 byte
}

/// Protocol configuration
/// 
/// # Size
/// Approximately 77 bytes
#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub admin: Pubkey,              // 32 bytes
    pub storage_fee_per_byte: u64,  // 8 bytes
    pub min_stake_per_byte: u64,    // 8 bytes
    pub max_batch_size: u32,        // 4 bytes
    pub max_memory_size: u32,       // 4 bytes
    pub max_key_length: u32,        // 4 bytes
    pub reward_rate: u32,           // 4 bytes
    pub created_at: i64,            // 8 bytes
    pub updated_at: i64,            // 8 bytes
    pub is_paused: bool,            // 1 byte
    pub bump: u8,                   // 1 byte
}

/// Metadata for memory shards
/// 
/// # Size
/// 59 bytes
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MemoryMetadata {
    pub memory_type: MemoryType,    // 1 byte
    pub importance: u8,             // 1 byte (0-100)
    pub tags: [u8; 8],              // 8 bytes (bitmask/tags)
    pub ipfs_cid: Option<[u8; 46]>, // 1 + 46 bytes for IPFS v1 CID
}

/// Types of memory storage
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum MemoryType {
    Conversation,   // 0
    Learning,       // 1
    Preference,     // 2
    Task,           // 3
    Relationship,   // 4
    Knowledge,      // 5
    System,         // 6
}

impl Default for MemoryType {
    fn default() -> Self {
        MemoryType::Conversation
    }
}

/// Permission levels for access control
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq)]
pub enum PermissionLevel {
    None = 0,
    Read = 1,
    Write = 2,
    Admin = 3,
}

impl Default for PermissionLevel {
    fn default() -> Self {
        PermissionLevel::None
    }
}

/// Access types for logging
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub enum AccessType {
    Read = 0,
    Write = 1,
    Delete = 2,
    Share = 3,
}

// ============================================================================
// INPUT STRUCTURES
// ============================================================================

/// Input for batch memory creation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BatchMemoryInput {
    pub key: String,
    pub content_hash: [u8; 32],
    pub content_size: u32,
    pub metadata: MemoryMetadata,
}

/// Tag update for batch operations
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TagUpdate {
    pub memory_key: String,
    pub new_tags: [u8; 8],
}

/// Protocol config initialization params
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProtocolConfigParams {
    pub storage_fee_per_byte: u64,
    pub min_stake_per_byte: u64,
    pub max_batch_size: u32,
    pub max_memory_size: u32,
    pub max_key_length: u32,
    pub reward_rate: u32,
}

/// Protocol config update params
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProtocolConfigUpdate {
    pub storage_fee_per_byte: Option<u64>,
    pub min_stake_per_byte: Option<u64>,
    pub max_batch_size: Option<u32>,
    pub max_memory_size: Option<u32>,
    pub reward_rate: Option<u32>,
}

// ============================================================================
// CONTEXT STRUCTURES
// ============================================================================

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Agent key is provided by owner, used as PDA seed only
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

#[derive(Accounts)]
#[instruction(key: String)]
pub struct CreateMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + MemoryShard::INIT_SPACE,
        seeds = [b"memory", vault.key().as_ref(), key.as_bytes()],
        bump
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Protocol config for pause state
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
        constraint = !memory_shard.is_deleted @ AgentMemoryError::MemoryAlreadyDeleted,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Protocol config for pause state
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct DeleteMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
        constraint = !memory_shard.is_deleted @ AgentMemoryError::MemoryAlreadyDeleted,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Protocol config for pause state
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct PermanentDeleteMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        close = owner,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
        constraint = memory_shard.is_deleted @ AgentMemoryError::MemoryNotDeleted,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RollbackMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
        constraint = !memory_shard.is_deleted @ AgentMemoryError::MemoryAlreadyDeleted,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Protocol config for pause state
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct RestoreMemory<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Protocol config for pause state
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", agent_profile.agent_key.as_ref()],
        bump = agent_profile.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
}

#[derive(Accounts)]
pub struct RecordTask<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", agent_profile.agent_key.as_ref()],
        bump = agent_profile.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
}

#[derive(Accounts)]
#[instruction(permission_level: PermissionLevel)]
pub struct GrantAccess<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
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

#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"access", vault.key().as_ref(), access_grant.grantee.as_ref()],
        bump = access_grant.bump,
    )]
    pub access_grant: Account<'info, AccessGrant>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateSharingGroup<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + SharingGroup::INIT_SPACE,
        seeds = [b"group", vault.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub sharing_group: Account<'info, SharingGroup>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageGroupMember<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = sharing_group.creator == owner.key() @ AgentMemoryError::NotGroupCreator,
    )]
    pub sharing_group: Account<'info, SharingGroup>,
}

#[derive(Accounts)]
pub struct LogMemoryAccess<'info> {
    #[account(mut)]
    pub accessor: Signer<'info>,
    
    pub memory_shard: Account<'info, MemoryShard>,
    
    /// CHECK: Access log PDA derived off-chain
    #[account(
        init,
        payer = accessor,
        space = 8 + AccessLog::INIT_SPACE,
        seeds = [b"log", memory_shard.key().as_ref(), accessor.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()[..4]],
        bump
    )]
    pub access_log: Account<'info, AccessLog>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BatchCreateMemories<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
}

#[derive(Accounts)]
pub struct BatchDeleteMemories<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
}

#[derive(Accounts)]
pub struct BatchUpdateTags<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct StakeForStorage<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key() @ AgentMemoryError::InvalidTokenAccount,
        constraint = owner_token_account.amount >= amount @ AgentMemoryError::InsufficientBalance,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = owner,
        seeds = [b"vault_tokens", vault.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    pub token_program: Program<'info, Token>,
    
    pub system_program: Program<'info, System>,
    
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct UnstakeTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"vault_tokens", vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key() @ AgentMemoryError::InvalidTokenAccount,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner @ AgentMemoryError::UnauthorizedOwner,
    )]
    pub vault: Account<'info, MemoryVault>,
}

#[derive(Accounts)]
pub struct InitializeProtocolConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProtocolConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = protocol_config.bump,
        has_one = admin @ AgentMemoryError::UnauthorizedAdmin,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct TransferAdmin<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = protocol_config.bump,
        has_one = admin @ AgentMemoryError::UnauthorizedAdmin,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum AgentMemoryError {
    #[msg("Memory key too long (max 64 characters)")]
    KeyTooLong,
    
    #[msg("Content too large (max 10MB)")]
    ContentTooLarge,
    
    #[msg("Invalid content size (must be > 0)")]
    InvalidContentSize,
    
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
    
    #[msg("Invalid expiration time (must be in the future)")]
    InvalidExpiration,
    
    #[msg("Expiration too far (max 1 year)")]
    ExpirationTooFar,
    
    #[msg("Invalid importance value (must be 0-100)")]
    InvalidImportance,
    
    #[msg("Memory shard already exists")]
    MemoryAlreadyExists,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Empty key not allowed")]
    EmptyKey,
    
    #[msg("Empty name not allowed")]
    EmptyName,
    
    #[msg("Empty capability not allowed")]
    EmptyCapability,
    
    #[msg("Task rate limit exceeded (max 1 per minute)")]
    TaskRateLimitExceeded,
    
    #[msg("Invalid version number")]
    InvalidVersion,
    
    #[msg("Invalid rollback version")]
    InvalidRollbackVersion,
    
    #[msg("Version not found in history")]
    VersionNotFound,
    
    #[msg("Empty batch not allowed")]
    EmptyBatch,
    
    #[msg("Batch too large (max 10 items)")]
    BatchTooLarge,
    
    #[msg("Memory not soft-deleted")]
    MemoryNotDeleted,
    
    #[msg("Memory already deleted")]
    MemoryAlreadyDeleted,
    
    #[msg("Empty group name not allowed")]
    EmptyGroupName,
    
    #[msg("Group name too long (max 64 characters)")]
    GroupNameTooLong,
    
    #[msg("Group description too long (max 256 characters)")]
    GroupDescTooLong,
    
    #[msg("Group too large (max 50 members)")]
    GroupTooLarge,
    
    #[msg("Member already exists in group")]
    MemberAlreadyExists,
    
    #[msg("Member not found in group")]
    MemberNotFound,
    
    #[msg("Not group creator")]
    NotGroupCreator,
    
    #[msg("Cannot remove group creator")]
    CannotRemoveCreator,
    
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[msg("Invalid unstake amount")]
    InvalidUnstakeAmount,
    
    #[msg("Insufficient stake")]
    InsufficientStake,
    
    #[msg("Stake below minimum required for storage")]
    StakeBelowMinimum,
    
    #[msg("No rewards available")]
    NoRewardsAvailable,
    
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    
    #[msg("Protocol is paused")]
    ProtocolPaused,
    
    #[msg("Unauthorized owner")]
    UnauthorizedOwner,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance,
}
