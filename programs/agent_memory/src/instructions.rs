use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::*;

/// Default duration for access grants (30 days)
pub const DEFAULT_GRANT_DURATION: i64 = 30 * 24 * 60 * 60;
/// Maximum memory count per vault
pub const MAX_MEMORY_COUNT: u64 = 1_000_000;

/// ============================================================================
/// VAULT INITIALIZATION
/// ============================================================================

/// Initializes a new memory vault and agent profile
/// 
/// # Arguments
/// * `ctx` - Context containing vault and profile accounts
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    encryption_pubkey: [u8; 32],
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let agent_profile = &mut ctx.accounts.agent_profile;
    let owner = &ctx.accounts.owner;
    let agent_key = &ctx.accounts.agent_key;
    let clock = Clock::get()?;
    
    // Initialize vault
    vault.owner = owner.key();
    vault.agent_key = agent_key.key();
    vault.encryption_pubkey = encryption_pubkey;
    vault.created_at = clock.unix_timestamp;
    vault.updated_at = clock.unix_timestamp;
    vault.memory_count = 0;
    vault.total_memory_size = 0;
    vault.staked_amount = 0;
    vault.reward_points = 0;
    vault.is_active = true;
    vault.bump = ctx.bumps.vault;
    
    // Initialize agent profile
    agent_profile.agent_key = agent_key.key();
    agent_profile.owner = owner.key();
    agent_profile.vault = vault.key();
    agent_profile.name = String::new();
    agent_profile.capabilities = Vec::new();
    agent_profile.reputation_score = 0;
    agent_profile.tasks_completed = 0;
    agent_profile.created_at = clock.unix_timestamp;
    agent_profile.updated_at = clock.unix_timestamp;
    agent_profile.last_task_at = 0;
    agent_profile.is_public = false;
    agent_profile.bump = ctx.bumps.agent_profile;
    
    emit!(VaultInitialized {
        vault: vault.key(),
        profile: agent_profile.key(),
        owner: owner.key(),
        agent_key: agent_key.key(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// MEMORY OPERATIONS
/// ============================================================================

/// Creates a new encrypted memory shard
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// * `key` - Memory key identifier
/// * `content_hash` - Hash of the encrypted content
/// * `content_size` - Size of the content in bytes
/// * `metadata` - Memory metadata
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `KeyTooLong` - If key exceeds max length
/// * `ContentTooLarge` - If content exceeds max size
/// * `InvalidContentSize` - If content size is zero
pub fn create_memory(
    ctx: Context<CreateMemory>,
    key: String,
    content_hash: [u8; 32],
    content_size: u32,
    metadata: MemoryMetadata,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    // Validate key
    require!(!key.is_empty(), AgentMemoryError::EmptyKey);
    require!(
        key.len() <= MAX_KEY_LENGTH,
        AgentMemoryError::KeyTooLong
    );
    
    // Validate content size
    require!(
        content_size > 0,
        AgentMemoryError::InvalidContentSize
    );
    require!(
        content_size <= MAX_CONTENT_SIZE,
        AgentMemoryError::ContentTooLarge
    );
    
    // Validate importance
    require!(
        metadata.importance <= 100,
        AgentMemoryError::InvalidImportance
    );
    
    let vault = &mut ctx.accounts.vault;
    let memory_shard = &mut ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    // Update vault stats with checked arithmetic
    vault.memory_count = vault
        .memory_count
        .checked_add(1)
        .ok_or(AgentMemoryError::Overflow)?;
    vault.total_memory_size = vault
        .total_memory_size
        .checked_add(content_size as u64)
        .ok_or(AgentMemoryError::Overflow)?;
    vault.updated_at = clock.unix_timestamp;
    
    // Initialize memory shard
    memory_shard.vault = vault.key();
    memory_shard.key = key.clone();
    memory_shard.content_hash = content_hash;
    memory_shard.content_size = content_size;
    memory_shard.metadata = metadata;
    memory_shard.created_at = clock.unix_timestamp;
    memory_shard.updated_at = clock.unix_timestamp;
    memory_shard.version = 1;
    memory_shard.is_deleted = false;
    memory_shard.deleted_at = None;
    memory_shard.previous_version_hash = None;
    memory_shard.bump = ctx.bumps.memory_shard;
    
    emit!(MemoryCreated {
        vault: vault.key(),
        memory: memory_shard.key(),
        key,
        version: 1,
        content_size,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Updates an existing memory shard
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// * `content_hash` - New content hash
/// * `content_size` - New content size
/// * `metadata` - Updated metadata
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `MemoryAlreadyDeleted` - If memory is already deleted
/// * `ContentTooLarge` - If content exceeds max size
pub fn update_memory(
    ctx: Context<UpdateMemory>,
    content_hash: [u8; 32],
    content_size: u32,
    metadata: MemoryMetadata,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    // Validate content size
    require!(
        content_size <= MAX_CONTENT_SIZE,
        AgentMemoryError::ContentTooLarge
    );
    
    // Validate importance
    require!(
        metadata.importance <= 100,
        AgentMemoryError::InvalidImportance
    );
    
    let vault = &mut ctx.accounts.vault;
    let memory_shard = &mut ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    let old_version = memory_shard.version;
    let old_size = memory_shard.content_size;
    
    // Update vault size with checked arithmetic
    if content_size > old_size {
        let diff = (content_size - old_size) as u64;
        vault.total_memory_size = vault
            .total_memory_size
            .checked_add(diff)
            .ok_or(AgentMemoryError::Overflow)?;
    } else {
        let diff = (old_size - content_size) as u64;
        vault.total_memory_size = vault
            .total_memory_size
            .saturating_sub(diff);
    }
    
    // Store previous version hash
    memory_shard.previous_version_hash = Some(memory_shard.content_hash);
    
    // Update memory shard
    memory_shard.content_hash = content_hash;
    memory_shard.content_size = content_size;
    memory_shard.metadata = metadata;
    memory_shard.updated_at = clock.unix_timestamp;
    memory_shard.version = memory_shard
        .version
        .checked_add(1)
        .ok_or(AgentMemoryError::Overflow)?;
    
    vault.updated_at = clock.unix_timestamp;
    
    emit!(MemoryUpdated {
        vault: vault.key(),
        memory: memory_shard.key(),
        key: memory_shard.key.clone(),
        old_version,
        new_version: memory_shard.version,
        content_size,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Soft deletes a memory shard
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `MemoryAlreadyDeleted` - If memory is already deleted
pub fn delete_memory(ctx: Context<DeleteMemory>) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    let memory_shard = &mut ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    memory_shard.is_deleted = true;
    memory_shard.deleted_at = Some(clock.unix_timestamp);
    memory_shard.updated_at = clock.unix_timestamp;
    
    emit!(MemoryDeleted {
        vault: ctx.accounts.vault.key(),
        memory: memory_shard.key(),
        key: memory_shard.key.clone(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Permanently deletes a memory shard
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// 
/// # Errors
/// * `MemoryNotDeleted` - If memory is not soft-deleted first
pub fn permanent_delete_memory(ctx: Context<PermanentDeleteMemory>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let memory_shard = &ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    // Update vault stats
    vault.memory_count = vault
        .memory_count
        .saturating_sub(1);
    vault.total_memory_size = vault
        .total_memory_size
        .saturating_sub(memory_shard.content_size as u64);
    vault.updated_at = clock.unix_timestamp;
    
    emit!(MemoryPermanentlyDeleted {
        vault: vault.key(),
        memory: memory_shard.key(),
        key: memory_shard.key.clone(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Restores a soft-deleted memory shard
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
pub fn restore_memory(ctx: Context<RestoreMemory>) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    let memory_shard = &mut ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    memory_shard.is_deleted = false;
    memory_shard.deleted_at = None;
    memory_shard.updated_at = clock.unix_timestamp;
    
    emit!(MemoryRestored {
        vault: ctx.accounts.vault.key(),
        memory: memory_shard.key(),
        key: memory_shard.key.clone(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Rolls back memory to a previous version
/// 
/// # Arguments
/// * `ctx` - Context containing vault and memory shard accounts
/// * `target_version` - Version to roll back to
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `InvalidRollbackVersion` - If target version is invalid
pub fn rollback_memory(
    ctx: Context<RollbackMemory>,
    target_version: u32,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    let memory_shard = &mut ctx.accounts.memory_shard;
    let clock = Clock::get()?;
    
    require!(
        target_version > 0 && target_version < memory_shard.version,
        AgentMemoryError::InvalidRollbackVersion
    );
    
    let from_version = memory_shard.version;
    
    memory_shard.version = memory_shard
        .version
        .checked_add(1)
        .ok_or(AgentMemoryError::Overflow)?;
    memory_shard.updated_at = clock.unix_timestamp;
    
    emit!(MemoryRolledBack {
        vault: ctx.accounts.vault.key(),
        memory: memory_shard.key(),
        key: memory_shard.key.clone(),
        from_version,
        to_version: target_version,
        new_version: memory_shard.version,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// BATCH OPERATIONS
/// ============================================================================

/// Creates multiple memory shards in a single transaction
/// 
/// # Arguments
/// * `ctx` - Context containing vault account
/// * `memories` - Vector of memory inputs
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `EmptyBatch` - If memories vector is empty
/// * `BatchTooLarge` - If batch exceeds max size
/// * `ArithmeticOverflow` - If memory count overflow
pub fn batch_create_memories(
    ctx: Context<BatchCreateMemories>,
    memories: Vec<BatchMemoryInput>,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    require!(!memories.is_empty(), AgentMemoryError::EmptyBatch);
    require!(
        memories.len() <= MAX_BATCH_SIZE,
        AgentMemoryError::BatchTooLarge
    );
    
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    // Calculate new memory count with checked arithmetic
    let current_count = vault.memory_count as u64;
    let new_count = current_count
        .checked_add(memories.len() as u64)
        .ok_or(AgentMemoryError::Overflow)?;
    
    require!(
        new_count <= MAX_MEMORY_COUNT,
        AgentMemoryError::Overflow
    );
    
    // Calculate total size
    let mut total_size: u64 = 0;
    for memory in &memories {
        total_size = total_size
            .checked_add(memory.content_size as u64)
            .ok_or(AgentMemoryError::Overflow)?;
    }
    
    // Update vault stats
    vault.memory_count = new_count as u32;
    vault.total_memory_size = vault
        .total_memory_size
        .checked_add(total_size)
        .ok_or(AgentMemoryError::Overflow)?;
    vault.updated_at = clock.unix_timestamp;
    
    emit!(BatchMemoryCreated {
        vault: vault.key(),
        owner: vault.owner,
        count: memories.len() as u32,
        total_size,
        storage_fee: 0,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Deletes multiple memory shards in a single transaction
/// 
/// # Arguments
/// * `ctx` - Context containing vault account
/// * `keys` - Vector of memory keys to delete
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
pub fn batch_delete_memories(
    ctx: Context<BatchDeleteMemories>,
    keys: Vec<String>,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    require!(!keys.is_empty(), AgentMemoryError::EmptyBatch);
    require!(
        keys.len() <= MAX_BATCH_SIZE,
        AgentMemoryError::BatchTooLarge
    );
    
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    // Update vault stats with checked arithmetic
    vault.memory_count = vault
        .memory_count
        .saturating_sub(keys.len() as u32);
    vault.updated_at = clock.unix_timestamp;
    
    emit!(BatchMemoryDeleted {
        vault: vault.key(),
        owner: vault.owner,
        count: keys.len() as u32,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// ACCESS CONTROL
/// ============================================================================

/// Grants access to a vault
/// 
/// # Arguments
/// * `ctx` - Context containing vault and access grant accounts
/// * `permission_level` - Level of permission to grant
/// * `expires_at` - Optional expiration timestamp
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
/// * `CannotGrantToOwner` - If trying to grant access to vault owner
/// * `InvalidExpiration` - If expiration is in the past
pub fn grant_access(
    ctx: Context<GrantAccess>,
    permission_level: PermissionLevel,
    expires_at: Option<i64>,
) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    let vault = &ctx.accounts.vault;
    let grantee = ctx.accounts.grantee.key();
    let owner = ctx.accounts.owner.key();
    
    // Validate grantee is not the owner
    require!(
        grantee != owner,
        AgentMemoryError::CannotGrantToOwner
    );
    
    // Validate permission level is not None
    require!(
        permission_level != PermissionLevel::None,
        AgentMemoryError::InvalidPermission
    );
    
    let access_grant = &mut ctx.accounts.access_grant;
    let clock = Clock::get()?;
    
    // Validate expiration if provided
    if let Some(exp) = expires_at {
        require!(
            exp > clock.unix_timestamp,
            AgentMemoryError::InvalidExpiration
        );
        require!(
            exp <= clock.unix_timestamp + (365 * 24 * 60 * 60),
            AgentMemoryError::ExpirationTooFar
        );
    }
    
    access_grant.vault = vault.key();
    access_grant.grantee = grantee;
    access_grant.permission_level = permission_level;
    access_grant.granted_at = clock.unix_timestamp;
    access_grant.expires_at = expires_at;
    access_grant.is_active = true;
    access_grant.revoked_at = None;
    access_grant.bump = ctx.bumps.access_grant;
    
    emit!(AccessGranted {
        vault: vault.key(),
        grantee,
        granted_by: owner,
        permission_level: permission_level as u8,
        granted_at: clock.unix_timestamp,
        expires_at,
    });
    
    Ok(())
}

/// Revokes access to a vault
/// 
/// # Arguments
/// * `ctx` - Context containing vault and access grant accounts
/// 
/// # Errors
/// * `ProgramPaused` - If protocol is currently paused
pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
    // Check program is not paused
    require!(
        !ctx.accounts.protocol_config.is_paused,
        AgentMemoryError::ProtocolPaused
    );
    
    let access_grant = &mut ctx.accounts.access_grant;
    let clock = Clock::get()?;
    
    access_grant.is_active = false;
    access_grant.revoked_at = Some(clock.unix_timestamp);
    
    emit!(AccessRevoked {
        vault: ctx.accounts.vault.key(),
        grantee: access_grant.grantee,
        revoked_by: ctx.accounts.owner.key(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// PROFILE OPERATIONS
/// ============================================================================

/// Updates agent profile
/// 
/// # Arguments
/// * `ctx` - Context containing profile account
/// * `name` - Optional new name
/// * `capabilities` - Optional new capabilities
/// * `is_public` - Optional visibility setting
/// 
/// # Errors
/// * `NameTooLong` - If name exceeds max length
/// * `TooManyCapabilities` - If too many capabilities
pub fn update_profile(
    ctx: Context<UpdateProfile>,
    name: Option<String>,
    capabilities: Option<Vec<String>>,
    is_public: Option<bool>,
) -> Result<()> {
    let profile = &mut ctx.accounts.agent_profile;
    let clock = Clock::get()?;
    let mut updated_fields: u8 = 0;
    
    if let Some(new_name) = name {
        require!(!new_name.is_empty(), AgentMemoryError::EmptyName);
        require!(
            new_name.len() <= MAX_NAME_LENGTH,
            AgentMemoryError::NameTooLong
        );
        profile.name = new_name;
        updated_fields |= 1;
    }
    
    if let Some(new_caps) = capabilities {
        require!(
            new_caps.len() <= MAX_CAPABILITIES,
            AgentMemoryError::TooManyCapabilities
        );
        for cap in &new_caps {
            require!(!cap.is_empty(), AgentMemoryError::EmptyCapability);
            require!(
                cap.len() <= MAX_CAPABILITY_LENGTH,
                AgentMemoryError::CapabilityTooLong
            );
        }
        profile.capabilities = new_caps;
        updated_fields |= 2;
    }
    
    if let Some(public) = is_public {
        profile.is_public = public;
        updated_fields |= 4;
    }
    
    profile.updated_at = clock.unix_timestamp;
    
    emit!(ProfileUpdated {
        profile: profile.key(),
        agent_key: profile.agent_key,
        updated_fields,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Records task completion and updates reputation
/// 
/// # Arguments
/// * `ctx` - Context containing profile account
/// 
/// # Errors
/// * `TaskRateLimitExceeded` - If called too frequently
pub fn record_task(ctx: Context<RecordTask>) -> Result<()> {
    let profile = &mut ctx.accounts.agent_profile;
    let clock = Clock::get()?;
    
    // Check rate limit
    require!(
        clock.unix_timestamp - profile.last_task_at >= TASK_RATE_LIMIT_SECONDS,
        AgentMemoryError::TaskRateLimitExceeded
    );
    
    // Update task count with checked arithmetic
    profile.tasks_completed = profile
        .tasks_completed
        .checked_add(1)
        .ok_or(AgentMemoryError::Overflow)?;
    
    // Update reputation
    profile.reputation_score = (profile.reputation_score + REPUTATION_PER_TASK)
        .min(MAX_REPUTATION);
    
    profile.last_task_at = clock.unix_timestamp;
    
    emit!(TaskCompleted {
        profile: profile.key(),
        agent_key: profile.agent_key,
        tasks_completed: profile.tasks_completed,
        reputation_score: profile.reputation_score,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// SHARING GROUPS
/// ============================================================================

/// Creates a new sharing group
/// 
/// # Arguments
/// * `ctx` - Context containing vault and group accounts
/// * `name` - Group name
/// * `description` - Group description
/// 
/// # Errors
/// * `EmptyGroupName` - If name is empty
/// * `GroupNameTooLong` - If name is too long
pub fn create_sharing_group(
    ctx: Context<CreateSharingGroup>,
    name: String,
    description: String,
) -> Result<()> {
    require!(!name.is_empty(), AgentMemoryError::EmptyGroupName);
    require!(
        name.len() <= MAX_GROUP_NAME_LENGTH,
        AgentMemoryError::GroupNameTooLong
    );
    require!(
        description.len() <= MAX_GROUP_DESC_LENGTH,
        AgentMemoryError::GroupDescTooLong
    );
    
    let group = &mut ctx.accounts.sharing_group;
    let clock = Clock::get()?;
    
    group.creator = ctx.accounts.owner.key();
    group.vault = ctx.accounts.vault.key();
    group.name = name;
    group.description = description;
    group.members = Vec::new();
    group.member_count = 0;
    group.created_at = clock.unix_timestamp;
    group.updated_at = clock.unix_timestamp;
    group.is_active = true;
    group.bump = ctx.bumps.sharing_group;
    
    emit!(SharingGroupCreated {
        group: group.key(),
        creator: group.creator,
        vault: group.vault,
        name: group.name.clone(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// ============================================================================
/// PROTOCOL CONFIG
/// ============================================================================

/// Initializes protocol configuration
/// 
/// # Arguments
/// * `ctx` - Context containing config account
/// * `params` - Configuration parameters
pub fn initialize_protocol_config(
    ctx: Context<InitializeProtocolConfig>,
    params: ProtocolConfigParams,
) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;
    let clock = Clock::get()?;
    
    config.admin = ctx.accounts.admin.key();
    config.storage_fee_per_byte = params.storage_fee_per_byte;
    config.min_stake_per_byte = params.min_stake_per_byte;
    config.max_batch_size = params.max_batch_size;
    config.max_memory_size = params.max_memory_size;
    config.max_key_length = params.max_key_length;
    config.reward_rate = params.reward_rate;
    config.created_at = clock.unix_timestamp;
    config.updated_at = clock.unix_timestamp;
    config.is_paused = false;
    config.bump = ctx.bumps.protocol_config;
    
    emit!(ProtocolConfigInitialized {
        config: config.key(),
        admin: config.admin,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Updates protocol configuration
/// 
/// # Arguments
/// * `ctx` - Context containing config account
/// * `update` - Configuration updates
pub fn update_protocol_config(
    ctx: Context<UpdateProtocolConfig>,
    update: ProtocolConfigUpdate,
) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;
    let clock = Clock::get()?;
    let mut updated_fields: u8 = 0;
    
    if let Some(fee) = update.storage_fee_per_byte {
        config.storage_fee_per_byte = fee;
        updated_fields |= 1;
    }
    
    if let Some(stake) = update.min_stake_per_byte {
        config.min_stake_per_byte = stake;
        updated_fields |= 2;
    }
    
    if let Some(batch_size) = update.max_batch_size {
        config.max_batch_size = batch_size;
        updated_fields |= 4;
    }
    
    if let Some(memory_size) = update.max_memory_size {
        config.max_memory_size = memory_size;
        updated_fields |= 8;
    }
    
    if let Some(rate) = update.reward_rate {
        config.reward_rate = rate;
        updated_fields |= 16;
    }
    
    config.updated_at = clock.unix_timestamp;
    
    emit!(ProtocolConfigUpdated {
        config: config.key(),
        admin: config.admin,
        updated_fields,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Toggles protocol pause state
/// 
/// # Arguments
/// * `ctx` - Context containing config account
/// * `paused` - New pause state
pub fn set_protocol_pause(ctx: Context<UpdateProtocolConfig>, paused: bool) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;
    let clock = Clock::get()?;
    
    config.is_paused = paused;
    config.updated_at = clock.unix_timestamp;
    
    emit!(ProtocolPauseChanged {
        config: config.key(),
        admin: ctx.accounts.admin.key(),
        paused,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

/// Transfers admin rights
/// 
/// # Arguments
/// * `ctx` - Context containing config account
/// * `new_admin` - New admin public key
pub fn transfer_admin(ctx: Context<TransferAdmin>, new_admin: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;
    let old_admin = config.admin;
    let clock = Clock::get()?;
    
    config.admin = new_admin;
    config.updated_at = clock.unix_timestamp;
    
    emit!(AdminTransferred {
        config: config.key(),
        old_admin,
        new_admin,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}
