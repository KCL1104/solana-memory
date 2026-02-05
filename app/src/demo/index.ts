/**
 * Demo Module - AgentMemory Demo Data
 * 
 * This module provides demo data and utilities for showcasing
 * the AgentMemory platform capabilities.
 */

// Export all demo data
export {
  demoMemories,
  getMemoriesByCategory,
  getMemoriesByTag,
  getHighImportanceMemories,
  toSDKFormat,
  getAllDemoMemoriesForBatch,
  getCategorySummary,
  getAllTags,
  getTotalImportance,
  getAverageImportance,
} from './data';

// Export types
export type { DemoMemory } from './data';
