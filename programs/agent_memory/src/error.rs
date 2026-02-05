use anchor_lang::prelude::*;

/// Error codes for the Agent Memory program
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
    
    #[msg("Program is currently paused")]
    ProtocolPaused,
    
    #[msg("Unauthorized owner")]
    UnauthorizedOwner,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance,
    
    #[msg("Cannot grant access to owner")]
    CannotGrantToOwner,
    
    #[msg("Invalid access permission")]
    InvalidPermission,
    
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,
}
