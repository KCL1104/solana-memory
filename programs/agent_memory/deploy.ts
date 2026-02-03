import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { AgentMemory } from '../target/types/agent_memory';
import * as fs from 'fs';
import * as path from 'path';

// Deployment script for AgentMemory program
async function main() {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load program
  const program = anchor.workspace.AgentMemory as Program<AgentMemory>;

  console.log('Deploying AgentMemory program...');
  console.log('Program ID:', program.programId.toString());
  console.log('Cluster:', provider.connection.rpcEndpoint);

  // Save program ID to file
  const envContent = `
NEXT_PUBLIC_AGENT_MEMORY_PROGRAM_ID=${program.programId.toString()}
NEXT_PUBLIC_SOLANA_RPC_URL=${provider.connection.rpcEndpoint}
`;

  fs.writeFileSync(
    path.join(__dirname, '../../app/.env.local'),
    envContent
  );

  console.log('\n✅ Program deployed successfully!');
  console.log('Program ID saved to app/.env.local');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
