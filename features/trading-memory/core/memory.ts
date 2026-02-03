/**
 * Trading Strategy Memory Core
 * Stores and manages trading strategies, their parameters, and performance
 */

import { EventEmitter } from 'events';

/**
 * Trading strategy types
 */
export type StrategyType = 
  | 'momentum'
  | 'mean_reversion'
  | 'arbitrage'
  | 'grid_trading'
  | 'dca'
  | 'breakout'
  | 'scalping'
  | 'trend_following'
  | 'market_making';

/**
 * Risk tolerance levels
 */
export type RiskLevel = 'conservative' | 'moderate' | 'aggressive' | 'degen';

/**
 * Strategy status
 */
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'stopped' | 'archived';

/**
 * Strategy parameters base interface
 */
export interface StrategyParams {
  // Common parameters
  entryThreshold: number;
  exitThreshold: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  maxSlippage: number;
  
  // Time parameters
  timeframe: string;
  holdTimeMax: number;
  
  // Risk parameters
  maxDrawdown: number;
  riskPerTrade: number;
  maxPositions: number;
}

/**
 * Momentum strategy specific params
 */
export interface MomentumParams extends StrategyParams {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  volumeMultiplier: number;
  momentumWindow: number;
}

/**
 * Mean reversion strategy specific params
 */
export interface MeanReversionParams extends StrategyParams {
  bollingerPeriod: number;
  bollingerStdDev: number;
  meanWindow: number;
  deviationThreshold: number;
}

/**
 * Grid trading strategy specific params
 */
export interface GridParams extends StrategyParams {
  gridLevels: number;
  gridSpacing: number;
  upperLimit: number;
  lowerLimit: number;
  rebalanceThreshold: number;
}

/**
 * DCA strategy specific params
 */
export interface DCAParams extends StrategyParams {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  investmentAmount: number;
  numPurchases: number;
  priceDeviationTrigger: number;
}

/**
 * Union type for all strategy params
 */
export type AllStrategyParams = 
  | StrategyParams 
  | MomentumParams 
  | MeanReversionParams 
  | GridParams 
  | DCAParams;

/**
 * Strategy definition
 */
export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  status: StrategyStatus;
  riskLevel: RiskLevel;
  params: AllStrategyParams;
  
  // Token pairs
  pairs: Array<{
    input: string;
    output: string;
    weight: number;
  }>;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  lastExecutedAt?: number;
  executionCount: number;
  
  // Performance summary
  performance?: PerformanceSummary;
  
  // Tags for categorization
  tags: string[];
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // P&L
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  
  // Risk metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  
  // Time metrics
  averageHoldTime: number;
  bestTrade: TradeRecord;
  worstTrade: TradeRecord;
  
  // Updated timestamp
  lastUpdated: number;
}

/**
 * Trade record
 */
export interface TradeRecord {
  id: string;
  strategyId: string;
  
  // Trade details
  pair: {
    input: string;
    output: string;
    inputSymbol: string;
    outputSymbol: string;
  };
  
  // Entry
  entryPrice: number;
  entryAmount: number;
  entryTimestamp: number;
  entryTxHash?: string;
  
  // Exit
  exitPrice?: number;
  exitAmount?: number;
  exitTimestamp?: number;
  exitTxHash?: string;
  
  // Calculated
  pnl?: number;
  pnlPercent?: number;
  fees?: number;
  slippage?: number;
  
  // Status
  status: 'open' | 'closed' | 'cancelled';
  
  // Metadata
  trigger: 'manual' | 'auto' | 'stop_loss' | 'take_profit' | 'strategy';
  notes?: string;
}

/**
 * Market conditions snapshot
 */
export interface MarketConditions {
  timestamp: number;
  pair: string;
  
  // Price data
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  volatility24h: number;
  
  // Volume data
  volume24h: number;
  volumeChange24h: number;
  
  // Liquidity
  liquidityUsd: number;
  liquidityDepth: Record<string, number>;
  
  // Market indicators
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  bollinger?: { upper: number; middle: number; lower: number };
  
  // Jupiter specific
  priceImpact: Record<string, number>;
  bestRoute: string;
  routeEfficiency: number;
}

/**
 * Strategy memory storage
 */
export interface StrategyMemory {
  strategies: Map<string, Strategy>;
  trades: Map<string, TradeRecord>;
  marketSnapshots: Map<string, MarketConditions[]>;
  
  // Indices
  tradesByStrategy: Map<string, string[]>;
  tradesByPair: Map<string, string[]>;
  marketSnapshotsByPair: Map<string, string[]>;
}

/**
 * Strategy Memory Manager
 */
export class StrategyMemoryManager extends EventEmitter {
  private memory: StrategyMemory;
  private autoSave: boolean;
  private saveInterval?: NodeJS.Timeout;
  private storagePath: string;

  constructor(options: { autoSave?: boolean; storagePath?: string } = {}) {
    super();
    this.memory = {
      strategies: new Map(),
      trades: new Map(),
      marketSnapshots: new Map(),
      tradesByStrategy: new Map(),
      tradesByPair: new Map(),
      marketSnapshotsByPair: new Map(),
    };
    this.autoSave = options.autoSave ?? true;
    this.storagePath = options.storagePath || './strategy-memory.json';
    
    if (this.autoSave) {
      this.saveInterval = setInterval(() => this.save(), 30000);
    }
    
    this.load();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new strategy
   */
  createStrategy(
    name: string,
    type: StrategyType,
    params: AllStrategyParams,
    options: {
      description?: string;
      riskLevel?: RiskLevel;
      pairs?: Array<{ input: string; output: string; weight?: number }>;
      tags?: string[];
    } = {}
  ): Strategy {
    const now = Date.now();
    const strategy: Strategy = {
      id: this.generateId(),
      name,
      description: options.description || `${type} strategy for ${name}`,
      type,
      status: 'draft',
      riskLevel: options.riskLevel || 'moderate',
      params,
      pairs: options.pairs?.map(p => ({ ...p, weight: p.weight || 1 })) || [],
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      tags: options.tags || [type, options.riskLevel || 'moderate'],
    };

    this.memory.strategies.set(strategy.id, strategy);
    this.emit('strategy:created', strategy);
    
    if (this.autoSave) this.save();
    
    return strategy;
  }

  /**
   * Get strategy by ID
   */
  getStrategy(id: string): Strategy | undefined {
    return this.memory.strategies.get(id);
  }

  /**
   * Get all strategies
   */
  getAllStrategies(filters?: {
    type?: StrategyType;
    status?: StrategyStatus;
    riskLevel?: RiskLevel;
    tags?: string[];
  }): Strategy[] {
    let strategies = Array.from(this.memory.strategies.values());
    
    if (filters?.type) {
      strategies = strategies.filter(s => s.type === filters.type);
    }
    if (filters?.status) {
      strategies = strategies.filter(s => s.status === filters.status);
    }
    if (filters?.riskLevel) {
      strategies = strategies.filter(s => s.riskLevel === filters.riskLevel);
    }
    if (filters?.tags) {
      strategies = strategies.filter(s => 
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }
    
    return strategies;
  }

  /**
   * Update strategy
   */
  updateStrategy(id: string, updates: Partial<Omit<Strategy, 'id' | 'createdAt'>>): Strategy | null {
    const strategy = this.memory.strategies.get(id);
    if (!strategy) return null;

    Object.assign(strategy, updates, { updatedAt: Date.now() });
    this.emit('strategy:updated', strategy);
    
    if (this.autoSave) this.save();
    
    return strategy;
  }

  /**
   * Delete strategy
   */
  deleteStrategy(id: string): boolean {
    const deleted = this.memory.strategies.delete(id);
    if (deleted) {
      this.emit('strategy:deleted', { id });
      if (this.autoSave) this.save();
    }
    return deleted;
  }

  /**
   * Activate strategy
   */
  activateStrategy(id: string): Strategy | null {
    return this.updateStrategy(id, { status: 'active', lastExecutedAt: Date.now() });
  }

  /**
   * Pause strategy
   */
  pauseStrategy(id: string): Strategy | null {
    return this.updateStrategy(id, { status: 'paused' });
  }

  /**
   * Record a new trade
   */
  recordTrade(tradeData: Omit<TradeRecord, 'id'>): TradeRecord {
    const trade: TradeRecord = {
      ...tradeData,
      id: this.generateId(),
    };

    this.memory.trades.set(trade.id, trade);
    
    // Update indices
    const strategyTrades = this.memory.tradesByStrategy.get(trade.strategyId) || [];
    strategyTrades.push(trade.id);
    this.memory.tradesByStrategy.set(trade.strategyId, strategyTrades);
    
    const pairKey = `${trade.pair.input}-${trade.pair.output}`;
    const pairTrades = this.memory.tradesByPair.get(pairKey) || [];
    pairTrades.push(trade.id);
    this.memory.tradesByPair.set(pairKey, pairTrades);
    
    // Update strategy execution count
    const strategy = this.memory.strategies.get(trade.strategyId);
    if (strategy) {
      strategy.executionCount++;
      strategy.lastExecutedAt = Date.now();
    }
    
    this.emit('trade:recorded', trade);
    
    if (this.autoSave) this.save();
    
    return trade;
  }

  /**
   * Update trade
   */
  updateTrade(id: string, updates: Partial<TradeRecord>): TradeRecord | null {
    const trade = this.memory.trades.get(id);
    if (!trade) return null;

    Object.assign(trade, updates);
    this.emit('trade:updated', trade);
    
    if (this.autoSave) this.save();
    
    return trade;
  }

  /**
   * Close a trade
   */
  closeTrade(
    tradeId: string,
    exitPrice: number,
    exitAmount: number,
    options: {
      exitTxHash?: string;
      trigger?: TradeRecord['trigger'];
      notes?: string;
    } = {}
  ): TradeRecord | null {
    const trade = this.memory.trades.get(tradeId);
    if (!trade || trade.status !== 'open') return null;

    const exitTimestamp = Date.now();
    const holdTime = exitTimestamp - trade.entryTimestamp;
    
    // Calculate P&L
    const fees = (trade.fees || 0) + (options.exitTxHash ? 0.003 * exitAmount : 0); // Estimate fees
    const pnl = exitAmount - trade.entryAmount - fees;
    const pnlPercent = (pnl / trade.entryAmount) * 100;

    const updates: Partial<TradeRecord> = {
      exitPrice,
      exitAmount,
      exitTimestamp,
      status: 'closed',
      pnl,
      pnlPercent,
      fees,
      trigger: options.trigger || trade.trigger,
      notes: options.notes || trade.notes,
    };

    if (options.exitTxHash) updates.exitTxHash = options.exitTxHash;

    const updated = this.updateTrade(tradeId, updates);
    
    // Update strategy performance
    this.recalculateStrategyPerformance(trade.strategyId);
    
    this.emit('trade:closed', updated);
    
    return updated;
  }

  /**
   * Get trades by strategy
   */
  getTradesByStrategy(strategyId: string, options: { status?: TradeRecord['status'] } = {}): TradeRecord[] {
    const tradeIds = this.memory.tradesByStrategy.get(strategyId) || [];
    let trades = tradeIds.map(id => this.memory.trades.get(id)!).filter(Boolean);
    
    if (options.status) {
      trades = trades.filter(t => t.status === options.status);
    }
    
    return trades.sort((a, b) => b.entryTimestamp - a.entryTimestamp);
  }

  /**
   * Get trades by pair
   */
  getTradesByPair(input: string, output: string): TradeRecord[] {
    const pairKey = `${input}-${output}`;
    const tradeIds = this.memory.tradesByPair.get(pairKey) || [];
    return tradeIds.map(id => this.memory.trades.get(id)!).filter(Boolean);
  }

  /**
   * Get all trades
   */
  getAllTrades(filters?: {
    strategyId?: string;
    status?: TradeRecord['status'];
    startTime?: number;
    endTime?: number;
  }): TradeRecord[] {
    let trades = Array.from(this.memory.trades.values());
    
    if (filters?.strategyId) {
      trades = trades.filter(t => t.strategyId === filters.strategyId);
    }
    if (filters?.status) {
      trades = trades.filter(t => t.status === filters.status);
    }
    if (filters?.startTime) {
      trades = trades.filter(t => t.entryTimestamp >= filters.startTime!);
    }
    if (filters?.endTime) {
      trades = trades.filter(t => t.entryTimestamp <= filters.endTime!);
    }
    
    return trades.sort((a, b) => b.entryTimestamp - a.entryTimestamp);
  }

  /**
   * Record market conditions
   */
  recordMarketConditions(conditions: Omit<MarketConditions, 'timestamp'>): MarketConditions {
    const snapshot: MarketConditions = {
      ...conditions,
      timestamp: Date.now(),
    };

    const pairKey = snapshot.pair;
    const existing = this.memory.marketSnapshots.get(pairKey) || [];
    existing.push(snapshot);
    
    // Keep last 1000 snapshots per pair
    if (existing.length > 1000) {
      existing.shift();
    }
    
    this.memory.marketSnapshots.set(pairKey, existing);
    this.emit('market:snapshot', snapshot);
    
    if (this.autoSave) this.save();
    
    return snapshot;
  }

  /**
   * Get market history
   */
  getMarketHistory(pair: string, limit: number = 100): MarketConditions[] {
    const snapshots = this.memory.marketSnapshots.get(pair) || [];
    return snapshots.slice(-limit);
  }

  /**
   * Recalculate strategy performance
   */
  recalculateStrategyPerformance(strategyId: string): PerformanceSummary | null {
    const trades = this.getTradesByStrategy(strategyId).filter(t => t.status === 'closed');
    
    if (trades.length === 0) return null;

    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) <= 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const wins = winningTrades.map(t => t.pnl || 0);
    const losses = losingTrades.map(t => Math.abs(t.pnl || 0));
    
    const averageWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const averageLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    // Calculate drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnL = 0;
    
    for (const trade of trades.sort((a, b) => a.entryTimestamp - b.entryTimestamp)) {
      runningPnL += trade.pnl || 0;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Best and worst trades
    const sortedByPnL = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestTrade = sortedByPnL[0];
    const worstTrade = sortedByPnL[sortedByPnL.length - 1];
    
    // Average hold time
    const holdTimes = trades
      .filter(t => t.exitTimestamp)
      .map(t => (t.exitTimestamp! - t.entryTimestamp));
    const averageHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length 
      : 0;

    const performance: PerformanceSummary = {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalPnL,
      totalPnLPercent: 0, // Would need initial capital
      averageWin,
      averageLoss,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      maxDrawdown,
      maxDrawdownPercent: 0, // Would need portfolio value
      sharpeRatio: 0, // Would need returns data
      sortinoRatio: 0, // Would need returns data
      averageHoldTime,
      bestTrade,
      worstTrade,
      lastUpdated: Date.now(),
    };

    const strategy = this.memory.strategies.get(strategyId);
    if (strategy) {
      strategy.performance = performance;
    }

    return performance;
  }

  /**
   * Get portfolio overview
   */
  getPortfolioOverview(): {
    totalStrategies: number;
    activeStrategies: number;
    totalTrades: number;
    openTrades: number;
    totalPnL: number;
    winRate: number;
    bestStrategy?: string;
    worstStrategy?: string;
  } {
    const strategies = Array.from(this.memory.strategies.values());
    const trades = Array.from(this.memory.trades.values());
    
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    
    // Find best and worst strategies
    let bestStrategy: string | undefined;
    let worstStrategy: string | undefined;
    let bestPnL = -Infinity;
    let worstPnL = Infinity;
    
    for (const strategy of strategies) {
      if (strategy.performance) {
        if (strategy.performance.totalPnL > bestPnL) {
          bestPnL = strategy.performance.totalPnL;
          bestStrategy = strategy.name;
        }
        if (strategy.performance.totalPnL < worstPnL) {
          worstPnL = strategy.performance.totalPnL;
          worstStrategy = strategy.name;
        }
      }
    }

    return {
      totalStrategies: strategies.length,
      activeStrategies: strategies.filter(s => s.status === 'active').length,
      totalTrades: trades.length,
      openTrades: trades.filter(t => t.status === 'open').length,
      totalPnL,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      bestStrategy,
      worstStrategy,
    };
  }

  /**
   * Save memory to storage
   */
  save(): void {
    const data = {
      strategies: Array.from(this.memory.strategies.entries()),
      trades: Array.from(this.memory.trades.entries()),
      marketSnapshots: Array.from(this.memory.marketSnapshots.entries()),
      tradesByStrategy: Array.from(this.memory.tradesByStrategy.entries()),
      tradesByPair: Array.from(this.memory.tradesByPair.entries()),
    };
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trading-memory', JSON.stringify(data));
    } else {
      // Node.js environment - would use fs
      try {
        const fs = require('fs');
        fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
      } catch (e) {
        // Silent fail in browser
      }
    }
  }

  /**
   * Load memory from storage
   */
  load(): void {
    try {
      let data: any;
      
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('trading-memory');
        if (stored) data = JSON.parse(stored);
      } else {
        const fs = require('fs');
        if (fs.existsSync(this.storagePath)) {
          data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        }
      }
      
      if (data) {
        this.memory.strategies = new Map(data.strategies);
        this.memory.trades = new Map(data.trades);
        this.memory.marketSnapshots = new Map(data.marketSnapshots);
        this.memory.tradesByStrategy = new Map(data.tradesByStrategy);
        this.memory.tradesByPair = new Map(data.tradesByPair);
      }
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.memory.strategies.clear();
    this.memory.trades.clear();
    this.memory.marketSnapshots.clear();
    this.memory.tradesByStrategy.clear();
    this.memory.tradesByPair.clear();
    this.save();
    this.emit('memory:cleared');
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.removeAllListeners();
  }
}

export default StrategyMemoryManager;
