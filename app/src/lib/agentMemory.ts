/**
 * AgentMemory Protocol - Frontend SDK Re-export
 * 
 * This file re-exports the SDK for backwards compatibility.
 * The SDK has been extracted to the root package.
 * 
 * For new code, import directly from '@agent-memory/sdk':
 * ```typescript
 * import { AgentMemoryClient } from '@agent-memory/sdk';
 * ```
 */

// Re-export everything from the root SDK
export * from '@agent-memory/sdk';

// Also support default export
export { AgentMemoryClient as default } from '@agent-memory/sdk';
