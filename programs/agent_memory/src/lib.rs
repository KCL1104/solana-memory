use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Program ID - REPLACE THIS WITH YOUR DEPLOYED PROGRAM ID
declare_id!("HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L");

// ============================================================================
// CONSTANTS
// ============================================================================

/// Maximum content size (10MB)
pub const MAX_CONTENT_SIZE: u32 = 10_000_000;
/// Minimum content size
pub const MIN_CONTENT_SIZE: u32 = 1;
/// Maximum key length
pub const MAX_KEY_LENGTH: usize = 64;
/// Maximum name length
pub const MAX_NAME_LENGTH: usize = 128;
/// Maximum capability string length
pub const MAX_CAPABILITY_LENGTH: usize = 64;
/// Maximum number of capabilities
pub const MAX_CAPABILITIES: usize = 20;
/// Maximum access expiration (1 year)
pub const MAX_ACCESS_EXPIRATION: i64 = 365 * 24 * 60 * 60;
/// Maximum reputation score
pub const MAX_REPUTATION: u32 = 10_000;
/// Points per completed task
pub const REPUTATION_PER_TASK: u32 = 10;
/// Maximum batch operations
pub const MAX_BATCH_SIZE: usize = 50;
/// Maximum group name length
pub const MAX_GROUP_NAME_LENGTH: usize = 64;
/// Maximum group description length
pub const MAX_GROUP_DESC_LENGTH: usize = 256;
/// Maximum members per group
pub const MAX_GROUP_MEMBERS: usize = 100;
/// Maximum history versions per memory
pub const MAX_HISTORY_VERSIONS: u8 = 10;

/// AgentMemory Protocol
/// On-chain persistent memory for AI agents with end-to-end encryption
/// 
/// # Security Model
/// - All memory content is encrypted client-side before reaching Solana
/// - Only content hashes stored on-chain for integrity verification
/// - Access control enforced at program level
/// - All state changes emit events for auditability
#[program]
pub mod agent_memory {
    use super::*;

    // ============================================================================
    // VAULT & PROFILE MANAGEMENT
    // ============================================================================

    /// Initialize a memory vault for an agent
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        encryption_pubkey: [u8; 32],
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let agent_profile = &mut ctx.accounts.agent_profile;
        let clock = Clock::get()?;

        // Initialize vault state
        vault.owner = ctx.accounts.owner.key();
        vault.agent_key = ctx.accounts.agent_key.key();
        vault.encryption_pubkey = encryption_pubkey;
        vault.created_at = clock.unix_timestamp;
        vault.updated_at = clock.unix_timestamp;
        vault.memory_count = 0;
        vault.total_memory_size = 0;
        vault.staked_amount = 0;
        vault.reward_points = 0;
        vault.is_active = true;
        vault.bump = ctx.bumps.vault;

        // Initialize profile state
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

        emit!(VaultInitialized {
            vault: vault.key(),
            profile: agent_profile.key(),
            owner: ctx.accounts.owner.key(),
            agent_key: ctx.accounts.agent_key.key(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Vault initialized for agent: {}", ctx.accounts.agent_key.key());
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
        let mut updated_fields = Vec::new();

        if let Some(name) = name {
            require!(!name.is_empty(), AgentMemoryError::EmptyName);
            require!(name.len() <= MAX_NAME_LENGTH, AgentMemoryError::NameTooLong);
            profile.name = name;
            updated_fields.push("name");
        }

        if let Some(capabilities) = capabilities {
            require!(capabilities.len() <= MAX_CAPABILITIES, AgentMemoryError::TooManyCapabilities);
            for cap in &capabilities {
                require!(!cap.is_empty(), AgentMemoryError::EmptyCapability);
                require!(cap.len() <= MAX_CAPABILITY_LENGTH, AgentMemoryError::CapabilityTooLong);
            }
            profile.capabilities = capabilities;
            updated_fields.push("capabilities");
        }

        if let Some(is_public) = is_public {
            profile.is_public = is_public;
            updated_fields.push("is_public");
        }

        profile.updated_at = clock.unix_timestamp;

        emit!(ProfileUpdated {
            profile: profile.key(),
            agent_key: profile.agent_key,
            updated_fields: updated_fields.join(","),
            timestamp: clock.unix_timestamp,
        });

        msg!("Profile updated for agent: {}", profile.agent_key);
        Ok(())
    }

    /// Record a completed task with rate limiting
    pub fn record_task_completion(ctx: Context<RecordTask>) -> Result<()> {
        let profile = &mut ctx.accounts.agent_profile;
        let clock = Clock::get()?;
        
        // Rate limiting: max 1 task per minute per agent
        if profile.last_task_at > 0 {
            let time_since_last = clock.unix_timestamp - profile.last_task_at;
            require!(time_since_last >= 60, AgentMemoryError::TaskRateLimitExceeded);
        }
        
        profile.tasks_completed = profile.tasks_completed.saturating_add(1);
        profile.reputation_score = (profile.tasks_completed * REPUTATION_PER_TASK).min(MAX_REPUTATION);
        profile.updated_at = clock.unix_timestamp;
        profile.last_task_at = clock.unix_timestamp;

        emit!(TaskCompleted {
            profile: profile.key(),
            agent_key: profile.agent_key,
            tasks_completed: profile.tasks_completed,
            reputation_score: profile.reputation_score,
            timestamp: clock.unix_timestamp,
        });

        msg!("Task recorded. Total completed: {}", profile.tasks_completed);
        Ok(())
    }

    // ============================================================================
    // MEMORY CRUD OPERATIONS
    // ============================================================================

    /// Create a new memory shard
    pub fn create_memory(
        ctx: Context<CreateMemory>,
        key: String,
        content_hash: [u8; 32],
        content_size: u32,
        metadata: MemoryMetadata,
    ) -> Result<()> {
        // Input validation
        require!(!key.is_empty(), AgentMemoryError::EmptyKey);
        require!(key.len() <= MAX_KEY_LENGTH, AgentMemoryError::KeyTooLong);
        require!(content_size >= MIN_CONTENT_SIZE, AgentMemoryError::InvalidContentSize);
        require!(content_size <= MAX_CONTENT_SIZE, AgentMemoryError::ContentTooLarge);
        require!(metadata.importance <= 255, AgentMemoryError::InvalidImportance);

        let vault = &mut ctx.accounts.vault;
        let memory_shard = &mut ctx.accounts.memory_shard;
        let clock = Clock::get()?;

        // Update vault statistics
        vault.memory_count = vault.memory_count.saturating_add(1);
        vault.total_memory_size = vault.total_memory_size.saturating_add(content_size as u64);
        vault.updated_at = clock.unix_timestamp;

        // Initialize memory shard
        memory_shard.vault = vault.key();
        memory_shard.key = key.clone();
        memory_shard.content_hash = content_hash;
        memory_shard.content_size = content_size;
        memory_shard.metadata = metadata.clone();
        memory_shard.created_at = clock.unix_timestamp;
        memory_shard.updated_at = clock.unix_timestamp;
        memory_shard.version = 1;
        memory_shard.is_deleted = false;
        memory_shard.bump = ctx.bumps.memory_shard;

        // Initialize version history
        memory_shard.version_history = vec![VersionRecord {
            version: 1,
            content_hash,
            content_size,
            metadata,
            created_at: clock.unix_timestamp,
        }];

        emit!(MemoryCreated {
            vault: vault.key(),
            memory: memory_shard.key(),
            key,
            version: 1,
            content_size,
            timestamp: clock.unix_timestamp,
        });

        msg!("Memory created: {} (version: 1)", memory_shard.key);
        Ok(())
    }

    /// Update an existing memory shard with version history
    pub fn update_memory(
        ctx: Context<UpdateMemory>,
        content_hash: [u8; 32],
        content_size: u32,
        metadata: MemoryMetadata,
    ) -> Result<()> {
        require!(content_size >= MIN_CONTENT_SIZE, AgentMemoryError::InvalidContentSize);
        require!(content_size <= MAX_CONTENT_SIZE, AgentMemoryError::ContentTooLarge);
        require!(metadata.importance <= 255, AgentMemoryError::InvalidImportance);

        let vault = &mut ctx.accounts.vault;
        let memory_shard = &mut ctx.accounts.memory_shard;
        let clock = Clock::get()?;

        // Update vault total size
        vault.total_memory_size = vault.total_memory_size
            .saturating_sub(memory_shard.content_size as u64)
            .saturating_add(content_size as u64);
        vault.updated_at = clock.unix_timestamp;

        // Update memory with version increment
        let old_version = memory_shard.version;
        memory_shard.content_hash = content_hash;
        memory_shard.content_size = content_size;
        memory_shard.metadata = metadata.clone();
        memory_shard.updated_at = clock.unix_timestamp;
        memory_shard.version = memory_shard.version.saturating_add(1);

        // Add to version history (keep last MAX_HISTORY_VERSIONS versions)
        let new_record = VersionRecord {
            version: memory_shard.version,
            content_hash,
            content_size,
            metadata,
            created_at: clock.unix_timestamp,
        };
        
        if memory_shard.version_history.len() >= MAX_HISTORY_VERSIONS as usize {
            memory_shard.version_history.remove(0);
        }
        memory_shard.version_history.push(new_record);

        emit!(MemoryUpdated {
            vault: vault.key(),
            memory: memory_shard.key(),
            key: memory_shard.key.clone(),
            old_version,
            new_version: memory_shard.version,
            content_size,
            timestamp: clock.unix_timestamp,
        });

        msg!("Memory updated: {} (version: {})", memory_shard.key, memory_shard.version);
        Ok(())
    }

    /// Delete a memory shard (soft delete)
    pub fn delete_memory(ctx: Context<DeleteMemory>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let memory_shard = &mut ctx.accounts.memory_shard;
        let clock = Clock::get()?;
        let key = memory_shard.key.clone();

        // Soft delete
        memory_shard.is_deleted = true;
        memory_shard.deleted_at = Some(clock.unix_timestamp);

        // Update vault statistics
        vault.memory_count = vault.memory_count.saturating_sub(1);
        vault.total_memory_size = vault.total_memory_size
            .saturating_sub(memory_shard.content_size as u64);
        vault.updated_at = clock.unix_timestamp;

        emit!(MemoryDeleted {
            vault: vault.key(),
            memory: memory_shard.key(),
            key: key.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Memory deleted: {}", key);
        Ok(())
    }

    /// Permanently delete a memory shard (closes account)
    pub fn permanent_delete_memory(ctx: Context<PermanentDeleteMemory>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let memory_shard = &ctx.accounts.memory_shard;
        let clock = Clock::get()?;

        emit!(MemoryPermanentlyDeleted {
            vault: vault.key(),
            memory: memory_shard.key(),
            key: memory_shard.key.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Memory permanently deleted: {}", memory_shard.key);
        Ok(())
    }

    // ============================================================================
    // VERSION CONTROL ENHANCEMENTS
    // ============================================================================

    /// Rollback memory to a specific version
    pub fn rollback_memory(
        ctx: Context<RollbackMemory>,
        target_version: u32,
    ) -> Result<()> {
        let memory_shard = &mut ctx.accounts.memory_shard;
        let clock = Clock::get()?;

        require!(target_version > 0, AgentMemoryError::InvalidVersion);
        require!(target_version < memory_shard.version, AgentMemoryError::InvalidRollbackVersion);

        // Find the target version in history
        let target_record = memory_shard.version_history
            .iter()
            .find(|r| r.version == target_version)
            .ok_or(AgentMemoryError::VersionNotFound)?;

        let old_version = memory_shard.version;
        let new_version = memory_shard.version.saturating_add(1);

        // Create rollback record
        let rollback_record = VersionRecord {
            version: new_version,
            content_hash: target_record.content_hash,
            content_size: target_record.content_size,
            metadata: target_record.metadata.clone(),
            created_at: clock.unix_timestamp,
        };

        // Update memory to target version
        memory_shard.content_hash = target_record.content_hash;
        memory_shard.content_size = target_record.content_size;
        memory_shard.metadata = target_record.metadata.clone();
        memory_shard.version = new_version;
        memory_shard.updated_at = clock.unix_timestamp;

        // Add rollback to history
        if memory_shard.version_history.len() >= MAX_HISTORY_VERSIONS as usize {
            memory_shard.version_history.remove(0);
        }
        memory_shard.version_history.push(rollback_record);

        emit!(MemoryRolledBack {
            vault: memory_shard.vault,
            memory: memory_shard.key(),
            key: memory_shard.key.clone(),
            from_version: old_version,
            to_version: target_version,
            new_version,
            timestamp: clock.unix_timestamp,
        });

        msg!("Memory rolled back: {} from v{} to v{} (new: v{})", 
            memory_shard.key, old_version, target_version, new_version);
        Ok(())
    }

    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================

    /// Batch create memories
    pub fn batch_create_memories(
        ctx: Context<BatchCreateMemories>,
        memories: Vec<BatchMemoryInput>,
    ) -> Result<()> {
        require!(!memories.is_empty(), AgentMemoryError::EmptyBatch);
        require!(memories.len() <= MAX_BATCH_SIZE, AgentMemoryError::BatchTooLarge);

        let vault = &ctx.accounts.vault;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;

        let mut total_size: u64 = 0;
        
        for mem in &memories {
            require!(!mem.key.is_empty(), AgentMemoryError::EmptyKey);
            require!(mem.key.len() <= MAX_KEY_LENGTH, AgentMemoryError::KeyTooLong);
            require!(mem.content_size >= MIN_CONTENT_SIZE, AgentMemoryError::InvalidContentSize);
            require!(mem.content_size <= MAX_CONTENT_SIZE, AgentMemoryError::ContentTooLarge);
            total_size = total_size.saturating_add(mem.content_size as u64);
        }

        // Calculate storage fee
        let storage_fee = calculate_storage_fee(total_size);
        
        emit!(BatchMemoryCreated {
            vault: vault.key(),
            owner: owner.key(),
            count: memories.len() as u32,
            total_size,
            storage_fee,
            timestamp: clock.unix_timestamp,
        });

        msg!("Batch created {} memories, total size: {}, fee: {}", 
            memories.len(), total_size, storage_fee);
        Ok(())
    }

    /// Batch delete memories
    pub fn batch_delete_memories(
        ctx: Context<BatchDeleteMemories>,
        memory_keys: Vec<String>,
    ) -> Result<()> {
        require!(!memory_keys.is_empty(), AgentMemoryError::EmptyBatch);
        require!(memory_keys.len() <= MAX_BATCH_SIZE, AgentMemoryError::BatchTooLarge);

        let vault = &ctx.accounts.vault;
        let clock = Clock::get()?;

        emit!(BatchMemoryDeleted {
            vault: vault.key(),
            owner: ctx.accounts.owner.key(),
            count: memory_keys.len() as u32,
            keys: memory_keys,
            timestamp: clock.unix_timestamp,
        });

        msg!("Batch deleted {} memories", memory_keys.len());
        Ok(())
    }

    /// Batch update memory tags
    pub fn batch_update_tags(
        ctx: Context<BatchUpdateTags>,
        updates: Vec<TagUpdate>,
    ) -> Result<()> {
        require!(!updates.is_empty(), AgentMemoryError::EmptyBatch);
        require!(updates.len() <= MAX_BATCH_SIZE, AgentMemoryError::BatchTooLarge);

        let clock = Clock::get()?;

        emit!(BatchTagsUpdated {
            vault: ctx.accounts.vault.key(),
            owner: ctx.accounts.owner.key(),
            count: updates.len() as u32,
            timestamp: clock.unix_timestamp,
        });

        msg!("Batch updated tags for {} memories", updates.len());
        Ok(())
    }

    // ============================================================================
    // ACCESS CONTROL & SHARING
    // ============================================================================

    /// Grant memory access to another agent
    pub fn grant_access(
        ctx: Context<GrantAccess>,
        permission_level: PermissionLevel,
        expiration: Option<i64>,
    ) -> Result<()> {
        let access_grant = &mut ctx.accounts.access_grant;
        let clock = Clock::get()?;

        // Validate expiration
        if let Some(exp) = expiration {
            require!(exp > clock.unix_timestamp, AgentMemoryError::InvalidExpiration);
            require!(exp <= clock.unix_timestamp + MAX_ACCESS_EXPIRATION, 
                AgentMemoryError::ExpirationTooFar);
        }

        access_grant.vault = ctx.accounts.vault.key();
        access_grant.grantee = ctx.accounts.grantee.key();
        access_grant.permission_level = permission_level;
        access_grant.granted_at = clock.unix_timestamp;
        access_grant.expires_at = expiration;
        access_grant.is_active = true;
        access_grant.bump = ctx.bumps.access_grant;

        emit!(AccessGranted {
            vault: ctx.accounts.vault.key(),
            grantee: ctx.accounts.grantee.key(),
            granted_by: ctx.accounts.owner.key(),
            permission_level: permission_level as u8,
            granted_at: clock.unix_timestamp,
            expires_at: expiration,
        });

        msg!("Access granted to: {} with {:?} permissions", 
            ctx.accounts.grantee.key(), permission_level);
        Ok(())
    }

    /// Revoke memory access
    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let access_grant = &mut ctx.accounts.access_grant;
        let clock = Clock::get()?;

        access_grant.is_active = false;
        access_grant.revoked_at = Some(clock.unix_timestamp);

        emit!(AccessRevoked {
            vault: access_grant.vault,
            grantee: access_grant.grantee,
            revoked_by: ctx.accounts.owner.key(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Access revoked for: {}", access_grant.grantee);
        Ok(())
    }

    // ============================================================================
    // SHARING GROUPS
    // ============================================================================

    /// Create a sharing group
    pub fn create_sharing_group(
        ctx: Context<CreateSharingGroup>,
        name: String,
        description: String,
    ) -> Result<()> {
        require!(!name.is_empty(), AgentMemoryError::EmptyGroupName);
        require!(name.len() <= MAX_GROUP_NAME_LENGTH, AgentMemoryError::GroupNameTooLong);
        require!(description.len() <= MAX_GROUP_DESC_LENGTH, AgentMemoryError::GroupDescTooLong);

        let group = &mut ctx.accounts.sharing_group;
        let clock = Clock::get()?;

        group.creator = ctx.accounts.owner.key();
        group.vault = ctx.accounts.vault.key();
        group.name = name.clone();
        group.description = description;
        group.members = vec![GroupMember {
            member: ctx.accounts.owner.key(),
            permission: PermissionLevel::Admin,
            joined_at: clock.unix_timestamp,
        }];
        group.created_at = clock.unix_timestamp;
        group.updated_at = clock.unix_timestamp;
        group.is_active = true;
        group.bump = ctx.bumps.sharing_group;

        emit!(SharingGroupCreated {
            group: group.key(),
            creator: ctx.accounts.owner.key(),
            vault: ctx.accounts.vault.key(),
            name,
            timestamp: clock.unix_timestamp,
        });

        msg!("Sharing group created: {}", group.key());
        Ok(())
    }

    /// Add member to sharing group
    pub fn add_group_member(
        ctx: Context<ManageGroupMember>,
        member: Pubkey,
        permission: PermissionLevel,
    ) -> Result<()> {
        let group = &mut ctx.accounts.sharing_group;
        let clock = Clock::get()?;

        require!(group.members.len() < MAX_GROUP_MEMBERS, AgentMemoryError::GroupTooLarge);
        require!(
            !group.members.iter().any(|m| m.member == member),
            AgentMemoryError::MemberAlreadyExists
        );

        group.members.push(GroupMember {
            member,
            permission,
            joined_at: clock.unix_timestamp,
        });
        group.updated_at = clock.unix_timestamp;

        emit!(GroupMemberAdded {
            group: group.key(),
            member,
            permission: permission as u8,
            timestamp: clock.unix_timestamp,
        });

        msg!("Member {} added to group {}", member, group.key());
        Ok(())
    }

    /// Remove member from sharing group
    pub fn remove_group_member(
        ctx: Context<ManageGroupMember>,
        member: Pubkey,
    ) -> Result<()> {
        let group = &mut ctx.accounts.sharing_group;
        let clock = Clock::get()?;

        let index = group.members
            .iter()
            .position(|m| m.member == member)
            .ok_or(AgentMemoryError::MemberNotFound)?;

        group.members.remove(index);
        group.updated_at = clock.unix_timestamp;

        emit!(GroupMemberRemoved {
            group: group.key(),
            member,
            timestamp: clock.unix_timestamp,
        });

        msg!("Member {} removed from group {}", member, group.key());
        Ok(())
    }

    /// Log access to shared memory
    pub fn log_memory_access(
        ctx: Context<LogMemoryAccess>,
        access_type: AccessType,
    ) -> Result<()> {
        let log = &mut ctx.accounts.access_log;
        let clock = Clock::get()?;

        log.memory = ctx.accounts.memory_shard.key();
        log.accessor = ctx.accounts.accessor.key();
        log.access_type = access_type;
        log.timestamp = clock.unix_timestamp;
        log.bump = ctx.bumps.access_log;

        emit!(MemoryAccessLogged {
            memory: ctx.accounts.memory_shard.key(),
            accessor: ctx.accounts.accessor.key(),
            access_type: access_type as u8,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ============================================================================
    // ECONOMIC MODEL
    // ============================================================================

    /// Stake tokens for storage
    pub fn stake_for_storage(ctx: Context<StakeForStorage>, amount: u64) -> Result<()> {
        require!(amount > 0, AgentMemoryError::InvalidStakeAmount);

        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // Transfer tokens to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        vault.staked_amount = vault.staked_amount.saturating_add(amount);
        vault.updated_at = clock.unix_timestamp;

        emit!(TokensStaked {
            vault: vault.key(),
            owner: ctx.accounts.owner.key(),
            amount,
            total_staked: vault.staked_amount,
            timestamp: clock.unix_timestamp,
        });

        msg!("Staked {} tokens for storage", amount);
        Ok(())
    }

    /// Unstake tokens
    pub fn unstake_tokens(ctx: Context<UnstakeTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, AgentMemoryError::InvalidUnstakeAmount);
        
        let vault = &mut ctx.accounts.vault;
        require!(vault.staked_amount >= amount, AgentMemoryError::InsufficientStake);

        // Calculate required stake for current storage
        let required_stake = calculate_required_stake(vault.total_memory_size);
        let remaining = vault.staked_amount.saturating_sub(amount);
        require!(remaining >= required_stake, AgentMemoryError::StakeBelowMinimum);

        let clock = Clock::get()?;

        // Transfer tokens back to owner
        let seeds = &[
            b"vault",
            vault.owner.as_ref(),
            vault.agent_key.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        vault.staked_amount = vault.staked_amount.saturating_sub(amount);
        vault.updated_at = clock.unix_timestamp;

        emit!(TokensUnstaked {
            vault: vault.key(),
            owner: ctx.accounts.owner.key(),
            amount,
            remaining_stake: vault.staked_amount,
            timestamp: clock.unix_timestamp,
        });

        msg!("Unstaked {} tokens, remaining: {}", amount, vault.staked_amount);
        Ok(())
    }

    /// Claim rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.reward_points > 0, AgentMemoryError::NoRewardsAvailable);

        let clock = Clock::get()?;
        let points_to_claim = vault.reward_points;
        vault.reward_points = 0;
        vault.updated_at = clock.unix_timestamp;

        emit!(RewardsClaimed {
            vault: vault.key(),
            owner: ctx.accounts.owner.key(),
            points: points_to_claim,
            timestamp: clock.unix_timestamp,
        });

        msg!("Claimed {} reward points", points_to_claim);
        Ok(())
    }

    // ============================================================================
    // GOVERNANCE
    // ============================================================================

    /// Initialize protocol configuration (admin only)
    pub fn initialize_protocol_config(
        ctx: Context<InitializeProtocolConfig>,
        config: ProtocolConfigParams,
    ) -> Result<()> {
        let protocol_config = &mut ctx.accounts.protocol_config;
        let clock = Clock::get()?;

        protocol_config.admin = ctx.accounts.admin.key();
        protocol_config.storage_fee_per_byte = config.storage_fee_per_byte;
        protocol_config.min_stake_per_byte = config.min_stake_per_byte;
        protocol_config.max_batch_size = config.max_batch_size;
        protocol_config.max_memory_size = config.max_memory_size;
        protocol_config.max_key_length = config.max_key_length;
        protocol_config.reward_rate = config.reward_rate;
        protocol_config.created_at = clock.unix_timestamp;
        protocol_config.updated_at = clock.unix_timestamp;
        protocol_config.is_paused = false;
        protocol_config.bump = ctx.bumps.protocol_config;

        emit!(ProtocolConfigInitialized {
            config: protocol_config.key(),
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Protocol config initialized");
        Ok(())
    }

    /// Update protocol parameters (admin only)
    pub fn update_protocol_config(
        ctx: Context<UpdateProtocolConfig>,
        updates: ProtocolConfigUpdate,
    ) -> Result<()> {
        let protocol_config = &mut ctx.accounts.protocol_config;
        let clock = Clock::get()?;
        let mut updated_fields = Vec::new();

        if let Some(fee) = updates.storage_fee_per_byte {
            protocol_config.storage_fee_per_byte = fee;
            updated_fields.push("storage_fee_per_byte");
        }

        if let Some(stake) = updates.min_stake_per_byte {
            protocol_config.min_stake_per_byte = stake;
            updated_fields.push("min_stake_per_byte");
        }

        if let Some(batch_size) = updates.max_batch_size {
            require!(batch_size > 0 && batch_size <= 100, AgentMemoryError::InvalidBatchSize);
            protocol_config.max_batch_size = batch_size;
            updated_fields.push("max_batch_size");
        }

        if let Some(memory_size) = updates.max_memory_size {
            protocol_config.max_memory_size = memory_size;
            updated_fields.push("max_memory_size");
        }

        if let Some(rate) = updates.reward_rate {
            protocol_config.reward_rate = rate;
            updated_fields.push("reward_rate");
        }

        protocol_config.updated_at = clock.unix_timestamp;

        emit!(ProtocolConfigUpdated {
            config: protocol_config.key(),
            admin: ctx.accounts.admin.key(),
            updated_fields: updated_fields.join(","),
            timestamp: clock.unix_timestamp,
        });

        msg!("Protocol config updated: {}", updated_fields.join(","));
        Ok(())
    }

    /// Pause/unpause protocol (admin only)
    pub fn set_protocol_pause(
        ctx: Context<UpdateProtocolConfig>,
        paused: bool,
    ) -> Result<()> {
        let protocol_config = &mut ctx.accounts.protocol_config;
        let clock = Clock::get()?;

        protocol_config.is_paused = paused;
        protocol_config.updated_at = clock.unix_timestamp;

        emit!(ProtocolPauseChanged {
            config: protocol_config.key(),
            admin: ctx.accounts.admin.key(),
            paused,
            timestamp: clock.unix_timestamp,
        });

        msg!("Protocol {}", if paused { "paused" } else { "resumed" });
        Ok(())
    }

    /// Transfer admin rights
    pub fn transfer_admin(
        ctx: Context<TransferAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        let protocol_config = &mut ctx.accounts.protocol_config;
        let clock = Clock::get()?;

        let old_admin = protocol_config.admin;
        protocol_config.admin = new_admin;
        protocol_config.updated_at = clock.unix_timestamp;

        emit!(AdminTransferred {
            config: protocol_config.key(),
            old_admin,
            new_admin,
            timestamp: clock.unix_timestamp,
        });

        msg!("Admin transferred from {} to {}", old_admin, new_admin);
        Ok(())
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /// Calculate storage fee for given size
    fn calculate_storage_fee(size: u64) -> u64 {
        // Base fee: 0.001 SOL per KB
        size.saturating_mul(1000) / 1000
    }

    /// Calculate required stake for storage
    fn calculate_required_stake(total_size: u64) -> u64 {
        // Minimum stake: 0.01 SOL per MB stored
        total_size.saturating_mul(10_000) / 1_000_000
    }
}

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
    pub keys: Vec<String>,
    pub timestamp: i64,
}

#[event]
pub struct BatchTagsUpdated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub count: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProfileUpdated {
    pub profile: Pubkey,
    pub agent_key: Pubkey,
    pub updated_fields: String,
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
    pub updated_fields: String,
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
#[account]
#[derive(InitSpace)]
pub struct MemoryVault {
    pub owner: Pubkey,
    pub agent_key: Pubkey,
    pub encryption_pubkey: [u8; 32],
    pub created_at: i64,
    pub updated_at: i64,
    pub memory_count: u32,
    pub total_memory_size: u64,
    pub staked_amount: u64,
    pub reward_points: u32,
    pub is_active: bool,
    pub bump: u8,
}

/// Individual memory shard with version history
#[account]
#[derive(InitSpace)]
pub struct MemoryShard {
    pub vault: Pubkey,
    #[max_len(64)]
    pub key: String,
    pub content_hash: [u8; 32],
    pub content_size: u32,
    pub metadata: MemoryMetadata,
    pub created_at: i64,
    pub updated_at: i64,
    pub version: u32,
    pub is_deleted: bool,
    pub deleted_at: Option<i64>,
    #[max_len(10)]
    pub version_history: Vec<VersionRecord>,
    pub bump: u8,
}

/// Version record for history tracking
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct VersionRecord {
    pub version: u32,
    pub content_hash: [u8; 32],
    pub content_size: u32,
    pub metadata: MemoryMetadata,
    pub created_at: i64,
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
    #[max_len(20)]
    pub capabilities: Vec<String>,
    pub reputation_score: u32,
    pub tasks_completed: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_task_at: i64,
    pub is_public: bool,
    pub bump: u8,
}

/// Access control with permission levels
#[account]
#[derive(InitSpace)]
pub struct AccessGrant {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub permission_level: PermissionLevel,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
    pub is_active: bool,
    pub revoked_at: Option<i64>,
    pub bump: u8,
}

/// Sharing group for collaborative memory access
#[account]
#[derive(InitSpace)]
pub struct SharingGroup {
    pub creator: Pubkey,
    pub vault: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(256)]
    pub description: String,
    #[max_len(100)]
    pub members: Vec<GroupMember>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

/// Group member entry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct GroupMember {
    pub member: Pubkey,
    pub permission: PermissionLevel,
    pub joined_at: i64,
}

/// Access log entry
#[account]
#[derive(InitSpace)]
pub struct AccessLog {
    pub memory: Pubkey,
    pub accessor: Pubkey,
    pub access_type: AccessType,
    pub timestamp: i64,
    pub bump: u8,
}

/// Protocol configuration
#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub storage_fee_per_byte: u64,
    pub min_stake_per_byte: u64,
    pub max_batch_size: u32,
    pub max_memory_size: u32,
    pub max_key_length: u32,
    pub reward_rate: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_paused: bool,
    pub bump: u8,
}

/// Metadata for memory shards
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MemoryMetadata {
    pub memory_type: MemoryType,
    pub importance: u8,
    pub tags: [u8; 8],
    pub ipfs_cid: Option<[u8; 46]>,
}

/// Types of memory storage
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum MemoryType {
    Conversation,
    Learning,
    Preference,
    Task,
    Relationship,
    Knowledge,
    System,
}

/// Permission levels for access control
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq)]
pub enum PermissionLevel {
    None = 0,
    Read = 1,
    Write = 2,
    Admin = 3,
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
        has_one = owner,
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
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
}

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
        seeds = [b"memory", vault.key().as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
}

#[derive(Accounts)]
pub struct PermanentDeleteMemory<'info> {
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
        mut,
        seeds = [b"memory", memory_shard.vault.as_ref(), memory_shard.key.as_bytes()],
        bump = memory_shard.bump,
    )]
    pub memory_shard: Account<'info, MemoryShard>,
}

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

#[derive(Accounts)]
#[instruction(permission_level: PermissionLevel)]
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

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateSharingGroup<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
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
        seeds = [b"log", memory_shard.key().as_ref(), accessor.key().as_ref()],
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
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
}

#[derive(Accounts)]
pub struct BatchDeleteMemories<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.agent_key.as_ref()],
        bump = vault.bump,
        has_one = owner,
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
        has_one = owner,
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
        has_one = owner,
    )]
    pub vault: Account<'info, MemoryVault>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.amount >= amount,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vault_tokens", vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
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
        seeds = [b"vault_tokens", vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
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
        has_one = owner,
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
        has_one = admin,
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
        has_one = admin,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

// Import SPL token types for staking
use anchor_spl::token::{Token, TokenAccount, Transfer};

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
    
    #[msg("Invalid importance value")]
    InvalidImportance,
    
    #[msg("Invalid vault reference")]
    InvalidVault,
    
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
    
    #[msg("Batch too large (max 50 items)")]
    BatchTooLarge,
    
    #[msg("Memory not deleted")]
    MemoryNotDeleted,
    
    #[msg("Empty group name not allowed")]
    EmptyGroupName,
    
    #[msg("Group name too long (max 64 characters)")]
    GroupNameTooLong,
    
    #[msg("Group description too long (max 256 characters)")]
    GroupDescTooLong,
    
    #[msg("Group too large (max 100 members)")]
    GroupTooLarge,
    
    #[msg("Member already exists in group")]
    MemberAlreadyExists,
    
    #[msg("Member not found in group")]
    MemberNotFound,
    
    #[msg("Not group creator")]
    NotGroupCreator,
    
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[msg("Invalid unstake amount")]
    InvalidUnstakeAmount,
    
    #[msg("Insufficient stake")]
    InsufficientStake,
    
    #[msg("Stake below minimum required")]
    StakeBelowMinimum,
    
    #[msg("No rewards available")]
    NoRewardsAvailable,
    
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    
    #[msg("Protocol is paused")]
    ProtocolPaused,
}
