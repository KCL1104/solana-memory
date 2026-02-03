import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { AgentMemory } from '../target/types/agent_memory';
import { expect } from 'chai';

describe('agent_memory', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgentMemory as Program<AgentMemory>;
  
  const owner = anchor.web3.Keypair.generate();
  const agentKey = anchor.web3.Keypair.generate();
  const grantee = anchor.web3.Keypair.generate();

  let vaultPda: anchor.web3.PublicKey;
  let profilePda: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to owner
    const signature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

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

  it('Initialize vault', async () => {
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
  });

  it('Store memory shard', async () => {
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
  });

  it('Update agent profile', async () => {
    await program.methods
      .updateProfile(
        'Test Agent',
        ['coding', 'solana', 'ai'],
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
    expect(profile.capabilities).to.deep.equal(['coding', 'solana', 'ai']);
    expect(profile.isPublic).to.equal(true);
  });

  it('Record task completion', async () => {
    await program.methods
      .recordTaskCompletion()
      .accounts({
        owner: owner.publicKey,
        agentProfile: profilePda,
      })
      .signers([owner])
      .rpc();

    const profile = await program.account.agentProfile.fetch(profilePda);
    expect(profile.tasksCompleted).to.equal(1);
    expect(profile.reputationScore).to.equal(10);
  });
});
