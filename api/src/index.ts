#!/usr/bin/env node
/**
 * AgentMemory REST API Server
 * 
 * Provides HTTP endpoints for AI agents to store, retrieve, and manage
 * persistent memory on Solana blockchain.
 * 
 * @version 1.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'agentmemory-api',
    version: '1.0.0',
    network: process.env.SOLANA_NETWORK || 'devnet',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/vaults', require('./routes/vaults'));
app.use('/api/v1/memories', require('./routes/memories'));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  AgentMemory REST API                                  ║
║  Version: 1.0.0                                       ║
║  Port: ${PORT}                                          ║
║  Network: ${process.env.SOLANA_NETWORK || 'devnet'}     ║
╚════════════════════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  GET  /health           - Health check');
  console.log('  POST /api/v1/vaults    - Create vault');
  console.log('  GET  /api/v1/vaults    - List vaults');
  console.log('  POST /api/v1/memories  - Store memory');
  console.log('  GET  /api/v1/memories  - Retrieve memories');
});

export default app;
