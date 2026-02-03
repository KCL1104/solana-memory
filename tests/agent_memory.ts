import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { AgentMemory } from '../target/types/agent_memory';
import { expect } from 'chai';

describe('agent_memory - Comprehensive Test Suite', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgentMemory as Program<AgentMemory>;
  
  // Test accounts
  const owner = anchor.web3.Keypair.generate();
  const agentKey = anchor.web3.Keypair.generate();
  const grantee = anchor.web3.Keypair.generate();
  const unauthorizedUser = anchor.web3.Keypair.generate();

  let vaultPda: anchor.web3.PublicKey;
  let profilePda: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    const signatures = await Promise.all([
      provider.connection.requestAirdrop(owner.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(unauthorizedUser.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(grantee.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
    ]);
    
    await Promise.all(signatures.map(sig => provider.connection.confirmTransaction(sig)));

    // Derive PDAs
    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.publicKey.toBuffer(), agentKey.publicKey.toBuffer()],
      program.programId
    );

    [profilePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('profile'), agentKey.publicKey.toBuffer()],
      program.programId
    );
  });

  // ============================================
  // VAULT INITIALIZATION TESTS
  // ============================================
  describe('Vault Initialization', () => {
    it('Initialize vault successfully', async () => {
      const encryptionPubkey = Buffer.alloc(32, 1);

      await program.methods
        .initializeVault(Array.from(encryptionPubkey))
        .accounts({
          owner: owner.publicKey,
          agentKey: agentKey.publicKey,
          vault: vaultPda,
          agentProfile: profilePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const vault = await program.account.memoryVault.fetch(vaultPda);
      expect(vault.owner.toString()).to.equal(owner.publicKey.toString());
      expect(vault.agentKey.toString()).to.equal(agentKey.publicKey.toString());
      expect(vault.memoryCount).to.equal(0);
      expect(vault.totalMemorySize).to.equal(0);
      expect(Array.from(vault.encryptionPubkey)).to.deep.equal(Array.from(encryptionPubkey));
    });

    it('Cannot initialize vault twice (should fail)', async () => {
      const encryptionPubkey = Buffer.alloc(32, 2);

      try {
        await program.methods
          .initializeVault(Array.from(encryptionPubkey))
          .accounts({
            owner: owner.publicKey,
            agentKey: agentKey.publicKey,
            vault: vaultPda,
            agentProfile: profilePda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('custom program error');
      }
    });
  });

  // ============================================
  // MEMORY STORAGE TESTS
  // ============================================
  describe('Memory Storage', () => {
    it('Store memory shard successfully', async () => {
      const key = 'test_memory';
      const contentHash = Buffer.alloc(32, 2);
      const contentSize = 1024;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      await program.methods
        .storeMemory(
          key,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { conversation: {} },
            importance: 100,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const vault = await program.account.memoryVault.fetch(vaultPda);
      expect(vault.memoryCount).to.equal(1);
      expect(vault.totalMemorySize).to.equal(contentSize);

      const memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.key).to.equal(key);
      expect(memory.version).to.equal(1);
      expect(memory.contentSize).to.equal(contentSize);
    });

    it('Update existing memory shard (version increment)', async () => {
      const key = 'test_memory';
      const newContentHash = Buffer.alloc(32, 3);
      const newContentSize = 2048;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      const vaultBefore = await program.account.memoryVault.fetch(vaultPda);
      
      await program.methods
        .storeMemory(
          key,
          Array.from(newContentHash),
          newContentSize,
          {
            memoryType: { learning: {} },
            importance: 150,
            tags: [1, 0, 0, 0, 0, 0, 0, 0],
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const vaultAfter = await program.account.memoryVault.fetch(vaultPda);
      expect(vaultAfter.memoryCount).to.equal(vaultBefore.memoryCount); // Count unchanged
      expect(vaultAfter.totalMemorySize).to.equal(newContentSize); // Size updated

      const memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.version).to.equal(2);
      expect(Array.from(memory.contentHash)).to.deep.equal(Array.from(newContentHash));
    });

    it('Store multiple memories', async () => {
      const memories = [
        { key: 'memory_1', size: 512, type: { preference: {} } },
        { key: 'memory_2', size: 1024, type: { task: {} } },
        { key: 'memory_3', size: 768, type: { knowledge: {} } },
      ];

      const vaultBefore = await program.account.memoryVault.fetch(vaultPda);
      let totalSize = Number(vaultBefore.totalMemorySize);

      for (const mem of memories) {
        const contentHash = Buffer.alloc(32, mem.key.charCodeAt(0));
        const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(mem.key)],
          program.programId
        );

        await program.methods
          .storeMemory(
            mem.key,
            Array.from(contentHash),
            mem.size,
            {
              memoryType: mem.type,
              importance: 50,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();

        totalSize += mem.size;
      }

      const vaultAfter = await program.account.memoryVault.fetch(vaultPda);
      expect(vaultAfter.memoryCount).to.equal(vaultBefore.memoryCount + memories.length);
      expect(vaultAfter.totalMemorySize).to.equal(totalSize);
    });

    it('Store memory with IPFS CID', async () => {
      const key = 'large_file_memory';
      const contentHash = Buffer.alloc(32, 99);
      const contentSize = 100000;
      const ipfsCid = Buffer.alloc(46, 1);

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      await program.methods
        .storeMemory(
          key,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { system: {} },
            importance: 200,
            tags: [255, 255, 0, 0, 0, 0, 0, 0],
            ipfsCid: Array.from(ipfsCid),
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.metadata.ipfsCid).to.not.be.null;
      expect(Array.from(memory.metadata.ipfsCid!)).to.deep.equal(Array.from(ipfsCid));
    });
  });

  // ============================================
  // BOUNDARY CONDITION TESTS
  // ============================================
  describe('Boundary Conditions', () => {
    it('Fail when key is too long (> 64 characters)', async () => {
      const longKey = 'a'.repeat(65);
      const contentHash = Buffer.alloc(32, 1);
      const contentSize = 1024;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(longKey)],
        program.programId
      );

      try {
        await program.methods
          .storeMemory(
            longKey,
            Array.from(contentHash),
            contentSize,
            {
              memoryType: { conversation: {} },
              importance: 100,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown KeyTooLong error');
      } catch (error: any) {
        expect(error.toString()).to.match(/(KeyTooLong|0x1770|6000)/);
      }
    });

    it('Accept key at maximum length (64 characters)', async () => {
      const maxKey = 'b'.repeat(64);
      const contentHash = Buffer.alloc(32, 1);
      const contentSize = 1024;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(maxKey)],
        program.programId
      );

      await program.methods
        .storeMemory(
          maxKey,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { conversation: {} },
            importance: 100,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.key).to.equal(maxKey);
    });

    it('Fail when content is too large (> 10MB)', async () => {
      const key = 'oversized_content';
      const contentHash = Buffer.alloc(32, 1);
      const contentSize = 10_000_001; // 1 byte over limit

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      try {
        await program.methods
          .storeMemory(
            key,
            Array.from(contentHash),
            contentSize,
            {
              memoryType: { conversation: {} },
              importance: 100,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown ContentTooLarge error');
      } catch (error: any) {
        expect(error.toString()).to.match(/(ContentTooLarge|0x1771|6001)/);
      }
    });

    it('Accept content at maximum size (10MB)', async () => {
      const key = 'max_size_content';
      const contentHash = Buffer.alloc(32, 1);
      const contentSize = 10_000_000; // Exactly at limit

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      await program.methods
        .storeMemory(
          key,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { conversation: {} },
            importance: 100,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.contentSize).to.equal(contentSize);
    });
  });

  // ============================================
  // MEMORY DELETION TESTS
  // ============================================
  describe('Memory Deletion', () => {
    it('Delete memory shard successfully', async () => {
      const key = 'delete_test_memory';
      const contentHash = Buffer.alloc(32, 5);
      const contentSize = 2048;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      // First, create the memory
      await program.methods
        .storeMemory(
          key,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { conversation: {} },
            importance: 50,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const vaultBefore = await program.account.memoryVault.fetch(vaultPda);
      const memoryBefore = await program.account.memoryShard.fetch(memoryPda);

      // Now delete it
      await program.methods
        .deleteMemory()
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const vaultAfter = await program.account.memoryVault.fetch(vaultPda);
      expect(vaultAfter.memoryCount).to.equal(vaultBefore.memoryCount - 1);
      expect(vaultAfter.totalMemorySize).to.equal(
        vaultBefore.totalMemorySize - memoryBefore.contentSize
      );

      // Memory account should be closed
      const memoryAccount = await program.account.memoryShard.fetchNullable(memoryPda);
      expect(memoryAccount).to.be.null;
    });

    it('Fail to delete memory with unauthorized user', async () => {
      const key = 'unauthorized_delete_test';
      const contentHash = Buffer.alloc(32, 6);
      const contentSize = 1024;

      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      // Create memory
      await program.methods
        .storeMemory(
          key,
          Array.from(contentHash),
          contentSize,
          {
            memoryType: { conversation: {} },
            importance: 50,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      // Try to delete with unauthorized user
      try {
        await program.methods
          .deleteMemory()
          .accounts({
            owner: unauthorizedUser.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('has_one constraint');
      }
    });
  });

  // ============================================
  // AGENT PROFILE TESTS
  // ============================================
  describe('Agent Profile', () => {
    it('Update agent profile with all fields', async () => {
      await program.methods
        .updateProfile(
          'Test Agent',
          ['coding', 'solana', 'ai', 'rust'],
          true
        )
        .accounts({
          owner: owner.publicKey,
          agentProfile: profilePda,
        })
        .signers([owner])
        .rpc();

      const profile = await program.account.agentProfile.fetch(profilePda);
      expect(profile.name).to.equal('Test Agent');
      expect(profile.capabilities).to.deep.equal(['coding', 'solana', 'ai', 'rust']);
      expect(profile.isPublic).to.equal(true);
    });

    it('Update profile name only', async () => {
      await program.methods
        .updateProfile(
          'Updated Agent Name',
          null,
          null
        )
        .accounts({
          owner: owner.publicKey,
          agentProfile: profilePda,
        })
        .signers([owner])
        .rpc();

      const profile = await program.account.agentProfile.fetch(profilePda);
      expect(profile.name).to.equal('Updated Agent Name');
      // Capabilities should remain unchanged
      expect(profile.capabilities.length).to.be.greaterThan(0);
    });

    it('Update profile capabilities only', async () => {
      await program.methods
        .updateProfile(
          null,
          ['blockchain', 'defi'],
          null
        )
        .accounts({
          owner: owner.publicKey,
          agentProfile: profilePda,
        })
        .signers([owner])
        .rpc();

      const profile = await program.account.agentProfile.fetch(profilePda);
      expect(profile.capabilities).to.deep.equal(['blockchain', 'defi']);
    });

    it('Update profile visibility only', async () => {
      await program.methods
        .updateProfile(
          null,
          null,
          false
        )
        .accounts({
          owner: owner.publicKey,
          agentProfile: profilePda,
        })
        .signers([owner])
        .rpc();

      const profile = await program.account.agentProfile.fetch(profilePda);
      expect(profile.isPublic).to.equal(false);
    });

    it('Fail when name is too long (> 128 characters)', async () => {
      const longName = 'n'.repeat(129);

      try {
        await program.methods
          .updateProfile(
            longName,
            null,
            null
          )
          .accounts({
            owner: owner.publicKey,
            agentProfile: profilePda,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown NameTooLong error');
      } catch (error: any) {
        expect(error.toString()).to.match(/(NameTooLong|0x1772|6002)/);
      }
    });

    it('Fail when too many capabilities (> 20)', async () => {
      const tooManyCaps = Array(21).fill('skill');

      try {
        await program.methods
          .updateProfile(
            null,
            tooManyCaps,
            null
          )
          .accounts({
            owner: owner.publicKey,
            agentProfile: profilePda,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown TooManyCapabilities error');
      } catch (error: any) {
        expect(error.toString()).to.match(/(TooManyCapabilities|0x1773|6003)/);
      }
    });

    it('Fail when capability is too long (> 64 characters)', async () => {
      const longCap = ['a'.repeat(65)];

      try {
        await program.methods
          .updateProfile(
            null,
            longCap,
            null
          )
          .accounts({
            owner: owner.publicKey,
            agentProfile: profilePda,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown CapabilityTooLong error');
      } catch (error: any) {
        expect(error.toString()).to.match(/(CapabilityTooLong|0x1774|6004)/);
      }
    });

    it('Fail to update profile with unauthorized user', async () => {
      try {
        await program.methods
          .updateProfile(
            'Hacked Name',
            null,
            null
          )
          .accounts({
            owner: unauthorizedUser.publicKey,
            agentProfile: profilePda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('has_one constraint');
      }
    });
  });

  // ============================================
  // TASK COMPLETION TESTS
  // ============================================
  describe('Task Completion', () => {
    it('Record single task completion', async () => {
      const profileBefore = await program.account.agentProfile.fetch(profilePda);
      
      await program.methods
        .recordTaskCompletion()
        .accounts({
          owner: owner.publicKey,
          agentProfile: profilePda,
        })
        .signers([owner])
        .rpc();

      const profileAfter = await program.account.agentProfile.fetch(profilePda);
      expect(profileAfter.tasksCompleted).to.equal(profileBefore.tasksCompleted + 1);
      expect(profileAfter.reputationScore).to.equal(profileAfter.tasksCompleted * 10);
    });

    it('Record multiple task completions', async () => {
      const profileBefore = await program.account.agentProfile.fetch(profilePda);
      const tasksToRecord = 5;

      for (let i = 0; i < tasksToRecord; i++) {
        await program.methods
          .recordTaskCompletion()
          .accounts({
            owner: owner.publicKey,
            agentProfile: profilePda,
          })
          .signers([owner])
          .rpc();
      }

      const profileAfter = await program.account.agentProfile.fetch(profilePda);
      expect(profileAfter.tasksCompleted).to.equal(profileBefore.tasksCompleted + tasksToRecord);
      expect(profileAfter.reputationScore).to.equal(profileAfter.tasksCompleted * 10);
    });

    it('Reputation score caps at 10000', async () => {
      // Create a new profile for this test
      const testAgent = anchor.web3.Keypair.generate();
      const [testProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), testAgent.publicKey.toBuffer()],
        program.programId
      );
      const [testVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), owner.publicKey.toBuffer(), testAgent.publicKey.toBuffer()],
        program.programId
      );

      // Initialize vault for test agent
      await program.methods
        .initializeVault(Array.from(Buffer.alloc(32, 1)))
        .accounts({
          owner: owner.publicKey,
          agentKey: testAgent.publicKey,
          vault: testVaultPda,
          agentProfile: testProfilePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      // Record many tasks - need 1000+ to hit cap
      // We'll record 1010 tasks, which should cap at 10000
      for (let i = 0; i < 1010; i++) {
        await program.methods
          .recordTaskCompletion()
          .accounts({
            owner: owner.publicKey,
            agentProfile: testProfilePda,
          })
          .signers([owner])
          .rpc();
      }

      const profile = await program.account.agentProfile.fetch(testProfilePda);
      expect(profile.tasksCompleted).to.equal(1010);
      expect(profile.reputationScore).to.equal(10000); // Capped
    });

    it('Fail to record task with unauthorized user', async () => {
      try {
        await program.methods
          .recordTaskCompletion()
          .accounts({
            owner: unauthorizedUser.publicKey,
            agentProfile: profilePda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('has_one constraint');
      }
    });
  });

  // ============================================
  // ACCESS CONTROL TESTS
  // ============================================
  describe('Access Control', () => {
    let accessGrantPda: anchor.web3.PublicKey;

    it('Grant access to another agent', async () => {
      [accessGrantPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('access'), vaultPda.toBuffer(), grantee.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .grantAccess(null) // No expiration
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          grantee: grantee.publicKey,
          accessGrant: accessGrantPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const accessGrant = await program.account.accessGrant.fetch(accessGrantPda);
      expect(accessGrant.vault.toString()).to.equal(vaultPda.toString());
      expect(accessGrant.grantee.toString()).to.equal(grantee.publicKey.toString());
      expect(accessGrant.isActive).to.equal(true);
      expect(accessGrant.expiresAt).to.be.null;
    });

    it('Grant access with expiration', async () => {
      const testGrantee = anchor.web3.Keypair.generate();
      const [testAccessGrantPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('access'), vaultPda.toBuffer(), testGrantee.publicKey.toBuffer()],
        program.programId
      );

      const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      await program.methods
        .grantAccess(new anchor.BN(expiration))
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          grantee: testGrantee.publicKey,
          accessGrant: testAccessGrantPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const accessGrant = await program.account.accessGrant.fetch(testAccessGrantPda);
      expect(accessGrant.isActive).to.equal(true);
      expect(accessGrant.expiresAt).to.not.be.null;
      expect(Number(accessGrant.expiresAt)).to.equal(expiration);
    });

    it('Revoke access', async () => {
      await program.methods
        .revokeAccess()
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          accessGrant: accessGrantPda,
        })
        .signers([owner])
        .rpc();

      const accessGrant = await program.account.accessGrant.fetch(accessGrantPda);
      expect(accessGrant.isActive).to.equal(false);
    });

    it('Fail to grant access with unauthorized user', async () => {
      const testGrantee = anchor.web3.Keypair.generate();
      const [testAccessGrantPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('access'), vaultPda.toBuffer(), testGrantee.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .grantAccess(null)
          .accounts({
            owner: unauthorizedUser.publicKey,
            vault: vaultPda,
            grantee: testGrantee.publicKey,
            accessGrant: testAccessGrantPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('has_one constraint');
      }
    });

    it('Fail to revoke access with unauthorized user', async () => {
      // First grant access again
      await program.methods
        .grantAccess(null)
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          grantee: grantee.publicKey,
          accessGrant: accessGrantPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      // Try to revoke with unauthorized user
      try {
        await program.methods
          .revokeAccess()
          .accounts({
            owner: unauthorizedUser.publicKey,
            vault: vaultPda,
            accessGrant: accessGrantPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('has_one constraint');
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('Fail to store memory to non-existent vault', async () => {
      const fakeVault = anchor.web3.Keypair.generate().publicKey;
      const key = 'fake_memory';
      
      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), fakeVault.toBuffer(), Buffer.from(key)],
        program.programId
      );

      try {
        await program.methods
          .storeMemory(
            key,
            Array.from(Buffer.alloc(32, 1)),
            1024,
            {
              memoryType: { conversation: {} },
              importance: 100,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: fakeVault,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('AccountNotFound');
      }
    });

    it('Fail to update non-existent profile', async () => {
      const fakeProfile = anchor.web3.Keypair.generate().publicKey;

      try {
        await program.methods
          .updateProfile('Test', null, null)
          .accounts({
            owner: owner.publicKey,
            agentProfile: fakeProfile,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('AccountNotFound');
      }
    });

    it('Fail to delete non-existent memory', async () => {
      const fakeMemory = anchor.web3.Keypair.generate().publicKey;

      try {
        await program.methods
          .deleteMemory()
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: fakeMemory,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.toString()).to.include('AccountNotFound');
      }
    });
  });

  // ============================================
  // MULTIPLE MEMORY OPERATIONS TESTS
  // ============================================
  describe('Multiple Memory Operations', () => {
    it('Create, update, and delete memory in sequence', async () => {
      const key = 'lifecycle_test';
      const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
        program.programId
      );

      // Create
      await program.methods
        .storeMemory(
          key,
          Array.from(Buffer.alloc(32, 1)),
          1000,
          {
            memoryType: { conversation: {} },
            importance: 50,
            tags: Array(8).fill(0),
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      let memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.version).to.equal(1);
      expect(memory.contentSize).to.equal(1000);

      // Update
      await program.methods
        .storeMemory(
          key,
          Array.from(Buffer.alloc(32, 2)),
          2000,
          {
            memoryType: { learning: {} },
            importance: 75,
            tags: [1, 2, 3, 0, 0, 0, 0, 0],
            ipfsCid: null,
          }
        )
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      memory = await program.account.memoryShard.fetch(memoryPda);
      expect(memory.version).to.equal(2);
      expect(memory.contentSize).to.equal(2000);

      // Delete
      await program.methods
        .deleteMemory()
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          memoryShard: memoryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      const deletedMemory = await program.account.memoryShard.fetchNullable(memoryPda);
      expect(deletedMemory).to.be.null;
    });

    it('Batch create multiple memories', async () => {
      const memories = Array.from({ length: 10 }, (_, i) => ({
        key: `batch_memory_${i}`,
        size: 100 * (i + 1),
        importance: i * 10,
      }));

      const vaultBefore = await program.account.memoryVault.fetch(vaultPda);

      for (const mem of memories) {
        const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(mem.key)],
          program.programId
        );

        await program.methods
          .storeMemory(
            mem.key,
            Array.from(Buffer.alloc(32, mem.key.charCodeAt(0))),
            mem.size,
            {
              memoryType: { knowledge: {} },
              importance: mem.importance,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
      }

      const vaultAfter = await program.account.memoryVault.fetch(vaultPda);
      expect(vaultAfter.memoryCount).to.equal(vaultBefore.memoryCount + memories.length);
    });

    it('Store memories with all memory types', async () => {
      const memoryTypes = [
        { type: 'conversation', variant: { conversation: {} } },
        { type: 'learning', variant: { learning: {} } },
        { type: 'preference', variant: { preference: {} } },
        { type: 'task', variant: { task: {} } },
        { type: 'relationship', variant: { relationship: {} } },
        { type: 'knowledge', variant: { knowledge: {} } },
        { type: 'system', variant: { system: {} } },
      ];

      for (const memType of memoryTypes) {
        const key = `type_test_${memType.type}`;
        const [memoryPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from('memory'), vaultPda.toBuffer(), Buffer.from(key)],
          program.programId
        );

        await program.methods
          .storeMemory(
            key,
            Array.from(Buffer.alloc(32, memType.type.charCodeAt(0))),
            500,
            {
              memoryType: memType.variant as any,
              importance: 50,
              tags: Array(8).fill(0),
              ipfsCid: null,
            }
          )
          .accounts({
            owner: owner.publicKey,
            vault: vaultPda,
            memoryShard: memoryPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();

        const memory = await program.account.memoryShard.fetch(memoryPda);
        expect(memory.key).to.equal(key);
      }
    });
  });
});
