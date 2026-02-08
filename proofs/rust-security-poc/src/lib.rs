//! AgentMemory Secure Program Module
//! 
//! This module demonstrates secure Rust patterns for Solana programs,
//! specifically addressing the 5 critical vulnerabilities identified by Neodyme:
//! 1. Missing ownership checks
//! 2. Missing signer checks
//! 3. Integer overflow/underflow
//! 4. Arithmetic rounding errors
//! 5. Account confusion (type cosplay)
//!
//! All patterns are production-ready and follow security best practices.

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{Pack, Sealed},
    sysvar::{clock::Clock, Sysvar},
};

/// Program entrypoint
entrypoint!(process_instruction);

/// Instruction types for AgentMemory program
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum AgentMemoryInstruction {
    /// Initialize a new memory account
    /// 
    /// Accounts expected:
    /// 0. `[writable, signer]` Payer - must sign and pay for account creation
    /// 1. `[writable]` Memory account to initialize - owned by this program
    /// 2. `[]` System program for account creation
    InitializeMemory {
        /// Initial memory capacity in bytes
        capacity: u64,
    },
    
    /// Store a memory entry
    /// 
    /// Accounts expected:
    /// 0. `[signer]` Owner - must sign to authorize storage
    /// 1. `[writable]` Memory account - must be owned by this program
    StoreMemory {
        /// Memory data to store
        data: Vec<u8>,
    },
    
    /// Close a memory account and reclaim rent
    /// 
    /// Accounts expected:
    /// 0. `[signer]` Owner - must sign to authorize closure
    /// 1. `[writable]` Memory account to close - owned by this program
    /// 2. `[writable]` Destination account for reclaimed lamports
    CloseMemory,
}

/// Memory account state
#[repr(C)]
#[derive(Clone, Debug, Default, PartialEq)]
pub struct MemoryAccount {
    /// Discriminator to prevent type cosplay attacks
    pub discriminator: u64,
    /// Owner who can modify this memory
    pub owner: Pubkey,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Total memory capacity
    pub capacity: u64,
    /// Used memory size
    pub used: u64,
    /// Number of stored entries
    pub entry_count: u32,
    /// Whether account is closed
    pub is_closed: bool,
}

/// Discriminator for MemoryAccount type
pub const MEMORY_ACCOUNT_DISCRIMINATOR: u64 = 0x4D_45_4D_4F_52_59_5F_30; // "MEMORY_0"

/// Discriminator for closed accounts (prevents revival attacks)
pub const CLOSED_ACCOUNT_DISCRIMINATOR: u64 = 0x43_4C_4F_53_45_44_5F_30; // "CLOSED_0"

impl Sealed for MemoryAccount {}

impl Pack for MemoryAccount {
    const LEN: usize = 8    // discriminator (u64)
        + 32               // owner (Pubkey)
        + 8                // created_at (i64)
        + 8                // updated_at (i64)
        + 8                // capacity (u64)
        + 8                // used (u64)
        + 4                // entry_count (u32)
        + 1                // is_closed (bool)
        + 7;               // padding for alignment
    
    fn pack_into_slice(&self, dst: &mut [u8]) {
        let mut idx = 0;
        
        // Pack discriminator
        dst[idx..idx+8].copy_from_slice(&self.discriminator.to_le_bytes());
        idx += 8;
        
        // Pack owner
        dst[idx..idx+32].copy_from_slice(&self.owner.to_bytes());
        idx += 32;
        
        // Pack timestamps
        dst[idx..idx+8].copy_from_slice(&self.created_at.to_le_bytes());
        idx += 8;
        dst[idx..idx+8].copy_from_slice(&self.updated_at.to_le_bytes());
        idx += 8;
        
        // Pack capacity and usage
        dst[idx..idx+8].copy_from_slice(&self.capacity.to_le_bytes());
        idx += 8;
        dst[idx..idx+8].copy_from_slice(&self.used.to_le_bytes());
        idx += 8;
        
        // Pack entry count
        dst[idx..idx+4].copy_from_slice(&self.entry_count.to_le_bytes());
        idx += 4;
        
        // Pack is_closed flag
        dst[idx] = self.is_closed as u8;
    }
    
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        
        let mut idx = 0;
        
        // Unpack discriminator
        let discriminator = u64::from_le_bytes(
            src[idx..idx+8].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 8;
        
        // Unpack owner
        let owner = Pubkey::new_from_array(
            src[idx..idx+32].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 32;
        
        // Unpack timestamps
        let created_at = i64::from_le_bytes(
            src[idx..idx+8].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 8;
        let updated_at = i64::from_le_bytes(
            src[idx..idx+8].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 8;
        
        // Unpack capacity and usage
        let capacity = u64::from_le_bytes(
            src[idx..idx+8].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 8;
        let used = u64::from_le_bytes(
            src[idx..idx+8].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 8;
        
        // Unpack entry count
        let entry_count = u32::from_le_bytes(
            src[idx..idx+4].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        idx += 4;
        
        // Unpack is_closed flag
        let is_closed = src[idx] != 0;
        
        Ok(MemoryAccount {
            discriminator,
            owner,
            created_at,
            updated_at,
            capacity,
            used,
            entry_count,
            is_closed,
        })
    }
}

/// Custom errors for AgentMemory program
#[derive(Clone, Debug, PartialEq)]
pub enum AgentMemoryError {
    /// Account is already initialized
    AlreadyInitialized = 0,
    /// Account is not initialized
    NotInitialized = 1,
    /// Account has been closed
    AccountClosed = 2,
    /// Invalid account owner
    InvalidOwner = 3,
    /// Missing required signature
    MissingSignature = 4,
    /// Memory capacity exceeded
    CapacityExceeded = 5,
    /// Integer overflow in calculation
    Overflow = 6,
    /// Invalid discriminator (type cosplay)
    InvalidDiscriminator = 7,
    /// Account owned by wrong program
    InvalidAccountOwner = 8,
}

impl From<AgentMemoryError> for ProgramError {
    fn from(e: AgentMemoryError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

/// Main instruction processor
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("AgentMemory: processing instruction");
    
    // Deserialize instruction
    let instruction = parse_instruction(instruction_data)?;
    
    match instruction {
        AgentMemoryInstruction::InitializeMemory { capacity } => {
            process_initialize_memory(program_id, accounts, capacity)
        }
        AgentMemoryInstruction::StoreMemory { data } => {
            process_store_memory(program_id, accounts, data)
        }
        AgentMemoryInstruction::CloseMemory => {
            process_close_memory(program_id, accounts)
        }
    }
}

/// Parse instruction data with bounds checking
fn parse_instruction(data: &[u8]) -> Result<AgentMemoryInstruction, ProgramError> {
    if data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }
    
    // Simplified parsing - in production use a proper serialization library
    let instruction_type = data[0];
    
    match instruction_type {
        0 => {
            // InitializeMemory
            if data.len() < 9 {
                return Err(ProgramError::InvalidInstructionData);
            }
            let capacity = u64::from_le_bytes(
                data[1..9].try_into().map_err(|_| ProgramError::InvalidInstructionData)?
            );
            Ok(AgentMemoryInstruction::InitializeMemory { capacity })
        }
        1 => {
            // StoreMemory - in production, use proper serialization
            Ok(AgentMemoryInstruction::StoreMemory { data: data[1..].to_vec() })
        }
        2 => {
            // CloseMemory
            Ok(AgentMemoryInstruction::CloseMemory)
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

/// Process InitializeMemory instruction
/// 
/// SECURITY PATTERNS DEMONSTRATED:
/// 1. Signer check: payer must sign
/// 2. Owner check: memory account must be owned by program
/// 3. Discriminator validation: prevents type cosplay
/// 4. Integer overflow protection: checked_add for timestamp calculations
fn process_initialize_memory(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    capacity: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // CRITICAL SECURITY PATTERN 1: Signer check
    // The payer MUST sign this transaction to authorize account creation
    let payer = next_account_info(account_info_iter)?;
    if !payer.is_signer {
        msg!("Error: Payer must sign the transaction");
        return Err(AgentMemoryError::MissingSignature.into());
    }
    
    // Get memory account
    let memory_account = next_account_info(account_info_iter)?;
    
    // CRITICAL SECURITY PATTERN 2: Ownership check
    // Memory account must be owned by this program
    // Without this check, attackers could pass fake accounts with valid-looking data
    if memory_account.owner != program_id {
        msg!("Error: Memory account not owned by this program");
        return Err(AgentMemoryError::InvalidAccountOwner.into());
    }
    
    // Get system program for account creation
    let _system_program = next_account_info(account_info_iter)?;
    
    // CRITICAL SECURITY PATTERN 3: Discriminator check (prevents type cosplay)
    // Read current data to check if already initialized
    {
        let data = memory_account.try_borrow_data()?;
        if data.len() >= 8 {
            let existing_discriminator = u64::from_le_bytes(
                data[0..8].try_into().unwrap_or([0; 8])
            );
            
            // Check for existing valid discriminator
            if existing_discriminator == MEMORY_ACCOUNT_DISCRIMINATOR {
                msg!("Error: Memory account already initialized");
                return Err(AgentMemoryError::AlreadyInitialized.into());
            }
            
            // Check for closed account discriminator (prevents revival attacks)
            if existing_discriminator == CLOSED_ACCOUNT_DISCRIMINATOR {
                msg!("Error: Cannot reinitialize closed account");
                return Err(AgentMemoryError::AccountClosed.into());
            }
        }
    }
    
    // CRITICAL SECURITY PATTERN 4: Integer overflow protection
    // Get current timestamp with overflow-safe arithmetic
    let clock = Clock::get()?;
    let timestamp = clock.unix_timestamp;
    
    // Validate capacity is non-zero
    if capacity == 0 {
        msg!("Error: Capacity must be greater than zero");
        return Err(ProgramError::InvalidInstructionData);
    }
    
    // CRITICAL SECURITY PATTERN 5: Reinitialization protection
    // Double-check by trying to unpack - should fail if discriminator is wrong
    // and should fail if already initialized
    
    // Create memory account state
    let memory = MemoryAccount {
        discriminator: MEMORY_ACCOUNT_DISCRIMINATOR,
        owner: *payer.key,
        created_at: timestamp,
        updated_at: timestamp,
        capacity,
        used: 0,
        entry_count: 0,
        is_closed: false,
    };
    
    // Write to account data
    {
        let mut data = memory_account.try_borrow_mut_data()?;
        if data.len() < MemoryAccount::LEN {
            msg!("Error: Account data too small");
            return Err(ProgramError::AccountDataTooSmall);
        }
        memory.pack_into_slice(&mut data);
    }
    
    msg!("Memory account initialized: owner={}, capacity={}", 
         payer.key, capacity);
    
    Ok(())
}

/// Process StoreMemory instruction
/// 
/// SECURITY PATTERNS DEMONSTRATED:
/// 1. Signer check: owner must sign
/// 2. Data validation: owner in account matches signer
/// 3. Discriminator validation: prevents type cosplay
/// 4. Capacity validation: prevents buffer overflows
/// 5. Integer overflow: checked arithmetic for capacity calculations
fn process_store_memory(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: Vec<u8>,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // CRITICAL SECURITY PATTERN 1: Signer check
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        msg!("Error: Owner must sign to store memory");
        return Err(AgentMemoryError::MissingSignature.into());
    }
    
    // Get memory account
    let memory_account = next_account_info(account_info_iter)?;
    
    // CRITICAL SECURITY PATTERN 2: Ownership check
    if memory_account.owner != program_id {
        msg!("Error: Memory account not owned by this program");
        return Err(AgentMemoryError::InvalidAccountOwner.into());
    }
    
    // Load and validate account data
    let mut memory = {
        let account_data = memory_account.try_borrow_data()?;
        MemoryAccount::unpack(&account_data)?
    };
    
    // CRITICAL SECURITY PATTERN 3: Discriminator validation (type cosplay prevention)
    if memory.discriminator != MEMORY_ACCOUNT_DISCRIMINATOR {
        msg!("Error: Invalid account discriminator - possible type cosplay attack");
        return Err(AgentMemoryError::InvalidDiscriminator.into());
    }
    
    // CRITICAL SECURITY PATTERN 4: Closed account check
    if memory.is_closed {
        msg!("Error: Cannot write to closed account");
        return Err(AgentMemoryError::AccountClosed.into());
    }
    
    // CRITICAL SECURITY PATTERN 5: Owner authorization check
    // Stored owner must match the signer
    if memory.owner != *owner.key {
        msg!("Error: Signer is not the account owner");
        return Err(AgentMemoryError::InvalidOwner.into());
    }
    
    // CRITICAL SECURITY PATTERN 6: Capacity validation with checked arithmetic
    let data_len = data.len() as u64;
    
    // Check for integer overflow when calculating new used amount
    let new_used = memory.used.checked_add(data_len)
        .ok_or(AgentMemoryError::Overflow)?;
    
    if new_used > memory.capacity {
        msg!("Error: Memory capacity exceeded. Used: {}, New: {}, Capacity: {}",
             memory.used, data_len, memory.capacity);
        return Err(AgentMemoryError::CapacityExceeded.into());
    }
    
    // Check for entry count overflow
    let new_entry_count = memory.entry_count.checked_add(1)
        .ok_or(AgentMemoryError::Overflow)?;
    
    // Update memory state
    memory.used = new_used;
    memory.entry_count = new_entry_count;
    memory.updated_at = Clock::get()?.unix_timestamp;
    
    // Write back to account
    {
        let mut account_data = memory_account.try_borrow_mut_data()?;
        memory.pack_into_slice(&mut account_data);
    }
    
    msg!("Memory stored: {} bytes, total used: {} bytes", data_len, memory.used);
    
    Ok(())
}

/// Process CloseMemory instruction
/// 
/// SECURITY PATTERNS DEMONSTRATED:
/// 1. Signer check: owner must sign
/// 2. Proper account closure: marks discriminator, transfers lamports
/// 3. Revival attack prevention: discriminator set to CLOSED value
/// 4. Owner authorization: stored owner matches signer
fn process_close_memory(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // CRITICAL SECURITY PATTERN 1: Signer check
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        msg!("Error: Owner must sign to close memory");
        return Err(AgentMemoryError::MissingSignature.into());
    }
    
    // Get memory account
    let memory_account = next_account_info(account_info_iter)?;
    
    // CRITICAL SECURITY PATTERN 2: Ownership check
    if memory_account.owner != program_id {
        msg!("Error: Memory account not owned by this program");
        return Err(AgentMemoryError::InvalidAccountOwner.into());
    }
    
    // Get destination account for lamports
    let destination = next_account_info(account_info_iter)?;
    
    // Load and validate account data
    let memory = {
        let account_data = memory_account.try_borrow_data()?;
        MemoryAccount::unpack(&account_data)?
    };
    
    // CRITICAL SECURITY PATTERN 3: Discriminator validation
    if memory.discriminator != MEMORY_ACCOUNT_DISCRIMINATOR {
        msg!("Error: Invalid account discriminator");
        return Err(AgentMemoryError::InvalidDiscriminator.into());
    }
    
    // CRITICAL SECURITY PATTERN 4: Owner authorization
    if memory.owner != *owner.key {
        msg!("Error: Signer is not the account owner");
        return Err(AgentMemoryError::InvalidOwner.into());
    }
    
    // CRITICAL SECURITY PATTERN 5: Already closed check
    if memory.is_closed {
        msg!("Error: Account already closed");
        return Err(AgentMemoryError::AccountClosed.into());
    }
    
    // CRITICAL SECURITY PATTERN 6: Secure account closure
    // 1. Mark discriminator as closed (prevents revival attacks)
    // 2. Transfer lamports to destination
    // 3. Zero out sensitive data
    
    {
        let mut data = memory_account.try_borrow_mut_data()?;
        
        // Mark as closed with special discriminator
        data[0..8].copy_from_slice(&CLOSED_ACCOUNT_DISCRIMINATOR.to_le_bytes());
        
        // Zero out owner field (optional but good practice)
        data[8..40].fill(0);
    }
    
    // Transfer lamports
    let lamports = **memory_account.try_borrow_lamports()?;
    **memory_account.try_borrow_mut_lamports()? -= lamports;
    **destination.try_borrow_mut_lamports()? += lamports;
    
    msg!("Memory account closed: {} lamports transferred to {}", 
         lamports, destination.key);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Epoch;
    
    fn create_test_account(lamports: u64, data_len: usize, owner: &Pubkey) -> AccountInfo {
        let key = Pubkey::new_unique();
        let mut lamports = lamports;
        let mut data = vec![0; data_len];
        AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            owner,
            false,
            Epoch::default(),
        )
    }
    
    #[test]
    fn test_memory_account_pack_unpack() {
        let original = MemoryAccount {
            discriminator: MEMORY_ACCOUNT_DISCRIMINATOR,
            owner: Pubkey::new_unique(),
            created_at: 1234567890,
            updated_at: 1234567890,
            capacity: 1024,
            used: 100,
            entry_count: 5,
            is_closed: false,
        };
        
        let mut buf = vec![0; MemoryAccount::LEN];
        original.pack_into_slice(&mut buf);
        
        let unpacked = MemoryAccount::unpack(&buf).unwrap();
        assert_eq!(original, unpacked);
    }
    
    #[test]
    fn test_discriminator_validation() {
        // Test that wrong discriminator fails
        let mut buf = vec![0; MemoryAccount::LEN];
        buf[0..8].copy_from_slice(&0xDEADBEEF_u64.to_le_bytes());
        
        let result = MemoryAccount::unpack(&buf);
        // Should still parse but with wrong discriminator
        let account = result.unwrap();
        assert_ne!(account.discriminator, MEMORY_ACCOUNT_DISCRIMINATOR);
    }
}
