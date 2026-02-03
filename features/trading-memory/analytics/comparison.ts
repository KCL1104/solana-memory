/**
 * Strategy Comparison Tool
 * Compare multiple strategies across various metrics
 */

import { Strategy, PerformanceSummary, StrategyType, RiskLevel } from './memory';

/**
 * Comparison metrics
 */
export interface ComparisonMetrics {
  returns: {
    totalPnL: number;
    winRate: number;
    profitFactor: number;
    averageTrade: number;
  };
  risk: {
    maxDrawdown: number;
    sharpeRatio: number;
    riskAdjustedReturn: number;
  };
  activity: {
    totalTrades: number;
    avgHoldTime: number;
    tradesPerDay: number;
  };
  consistency: {
    winStreak: number;
    lossStreak: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
}

/**
 * Comparison result
 */
export interface StrategyComparison {
  strategies: Array<{
    id: string;
    name: string;
    type: StrategyType;
    riskLevel: RiskLevel;
    metrics: ComparisonMetrics;
    score: number;
    rank: number;
  }>;
  winner: string;
  analysis: string;
  recommendations: string[];
}

/**
 * Benchmark data
 */
export interface Benchmark {
  name: string;
  description: string;
  metrics: Partial<ComparisonMetrics>;
}

/**
 * Strategy Comparator
 */
export class StrategyComparator {
  private benchmarks: Map<string, Benchmark> = new Map();

  constructor() {
    this.initializeBenchmarks();
  }

  private initializeBenchmarks(): void {
    this.benchmarks.set('hodl_btc', {
      name: 'HODL BTC',
      description: 'Buy and hold Bitcoin',
      metrics: {
        returns: { winRate: 65, profitFactor: 2.5, averageTrade: 15, totalPnL: 0 },
        risk: { maxDrawdown: 30, sharpeRatio: 1.2 },
      },
    });

    this.benchmarks.set('sp500', {
      name: 'S&P 500',
      description: 'S&P 500 Index average',
      metrics: {
        returns: { winRate: 53, profitFactor: 1.3, averageTrade: 8, totalPnL: 0 },
        risk: { maxDrawdown: 20, sharpeRatio: 0.9 },
      },
    });

    this.benchmarks.set('day_trader_avg', {
      name: 'Day Trader Avg',
      description: 'Average day trader performance',
      metrics: {
        returns: { winRate: 45, profitFactor: 1.1, averageTrade: -2, totalPnL: 0 },
        risk: { maxDrawdown: 50, sharpeRatio: 0.3 },
      },
    });
  }

  /**
   * Calculate comprehensive metrics for a strategy
   */
  calculateMetrics(strategy: Strategy): ComparisonMetrics {
    const perf = strategy.performance;
    
    if (!perf) {
      return {
        returns: { totalPnL: 0, winRate: 0, profitFactor: 0, averageTrade: 0 },
        risk: { maxDrawdown: 0, sharpeRatio: 0, riskAdjustedReturn: 0 },
        activity: { totalTrades: 0, avgHoldTime: 0, tradesPerDay: 0 },
        consistency: { winStreak: 0, lossStreak: 0, consecutiveWins: 0, consecutiveLosses: 0 },
      };
    }

    // Calculate trades per day
    const daysSinceStart = Math.max(1, (Date.now() - strategy.createdAt) / (1000 * 60 * 60 * 24));
    const tradesPerDay = perf.totalTrades / daysSinceStart;

    // Calculate consecutive wins/losses
    const { maxWinStreak, maxLossStreak, currentWinStreak, currentLossStreak } = 
      this.calculateStreaks(strategy.id);

    // Risk-adjusted return
    const riskAdjustedReturn = perf.maxDrawdown > 0 
      ? perf.totalPnL / perf.maxDrawdown 
      : perf.totalPnL;

    return {
      returns: {
        totalPnL: perf.totalPnL,
        winRate: perf.winRate,
        profitFactor: perf.profitFactor,
        averageTrade: perf.totalTrades > 0 ? perf.totalPnL / perf.totalTrades : 0,
      },
      risk: {
        maxDrawdown: perf.maxDrawdown,
        sharpeRatio: perf.sharpeRatio,
        riskAdjustedReturn,
      },
      activity: {
        totalTrades: perf.totalTrades,
        avgHoldTime: perf.averageHoldTime,
        tradesPerDay,
      },
      consistency: {
        winStreak: maxWinStreak,
        lossStreak: maxLossStreak,
        consecutiveWins: currentWinStreak,
        consecutiveLosses: currentLossStreak,
      },
    };
  }

  /**
   * Calculate win/loss streaks (would need trade history)
   */
  private calculateStreaks(strategyId: string): {
    maxWinStreak: number;
    maxLossStreak: number;
    currentWinStreak: number;
    currentLossStreak: number;
  } {
    // Simplified - would use actual trade history
    return {
      maxWinStreak: 0,
      maxLossStreak: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
    };
  }

  /**
   * Calculate composite score for ranking
   */
  calculateScore(metrics: ComparisonMetrics, weights?: Partial<{
    returns: number;
    risk: number;
    consistency: number;
  }>): number {
    const w = { returns: 0.4, risk: 0.4, consistency: 0.2, ...weights };

    // Returns score (0-100)
    const returnsScore = Math.min(100, Math.max(0,
      (metrics.returns.winRate * 0.3) +
      (Math.min(5, metrics.returns.profitFactor) * 10) +
      (metrics.returns.totalPnL > 0 ? 20 : 0)
    ));

    // Risk score (0-100, higher is better)
    const riskScore = Math.min(100, Math.max(0,
      100 - (metrics.risk.maxDrawdown * 2) +
      (metrics.risk.sharpeRatio * 20)
    ));

    // Consistency score (0-100)
    const consistencyScore = Math.min(100, Math.max(0,
      (metrics.consistency.winStreak * 5) +
      (metrics.activity.tradesPerDay > 0 ? 20 : 0)
    ));

    return (returnsScore * w.returns) + 
           (riskScore * w.risk) + 
           (consistencyScore * w.consistency);
  }

  /**
   * Compare multiple strategies
   */
  compare(strategies: Strategy[]): StrategyComparison {
    const results = strategies.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      riskLevel: strategy.riskLevel,
      metrics: this.calculateMetrics(strategy),
      score: 0,
      rank: 0,
    }));

    // Calculate scores
    results.forEach(r => {
      r.score = this.calculateScore(r.metrics);
    });

    // Sort by score and assign ranks
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => { r.rank = i + 1; });

    // Generate analysis
    const winner = results[0];
    const analysis = this.generateAnalysis(results);
    const recommendations = this.generateRecommendations(results);

    return {
      strategies: results,
      winner: winner?.id || '',
      analysis,
      recommendations,
    };
  }

  /**
   * Compare strategy against benchmark
   */
  compareToBenchmark(strategy: Strategy, benchmarkKey: string): {
    comparison: Record<string, { strategy: number; benchmark: number; difference: number }>;
    outperforms: boolean;
    summary: string;
  } {
    const benchmark = this.benchmarks.get(benchmarkKey);
    if (!benchmark) {
      throw new Error(`Benchmark ${benchmarkKey} not found`);
    }

    const metrics = this.calculateMetrics(strategy);
    const comparison: Record<string, { strategy: number; benchmark: number; difference: number }> = {};

    // Compare key metrics
    if (benchmark.metrics.returns?.winRate !== undefined) {
      comparison.winRate = {
        strategy: metrics.returns.winRate,
        benchmark: benchmark.metrics.returns.winRate,
        difference: metrics.returns.winRate - benchmark.metrics.returns.winRate,
      };
    }

    if (benchmark.metrics.risk?.maxDrawdown !== undefined) {
      comparison.maxDrawdown = {
        strategy: metrics.risk.maxDrawdown,
        benchmark: benchmark.metrics.risk.maxDrawdown,
        difference: benchmark.metrics.risk.maxDrawdown - metrics.risk.maxDrawdown, // Lower is better
      };
    }

    if (benchmark.metrics.returns?.profitFactor !== undefined) {
      comparison.profitFactor = {
        strategy: metrics.returns.profitFactor,
        benchmark: benchmark.metrics.returns.profitFactor,
        difference: metrics.returns.profitFactor - benchmark.metrics.returns.profitFactor,
      };
    }

    const positiveMetrics = Object.values(comparison).filter(c => c.difference > 0).length;
    const totalMetrics = Object.keys(comparison).length;
    const outperforms = positiveMetrics / totalMetrics > 0.5;

    return {
      comparison,
      outperforms,
      summary: `${strategy.name} ${outperforms ? 'outperforms' : 'underperforms'} ${benchmark.name} in ${positiveMetrics}/${totalMetrics} key metrics`,
    };
  }

  /**
   * Generate analysis text
   */
  private generateAnalysis(results: StrategyComparison['strategies']): string {
    if (results.length === 0) return 'No strategies to compare';
    
    const winner = results[0];
    const loser = results[results.length - 1];
    
    return `${winner.name} is the top performer with a score of ${winner.score.toFixed(1)}/100. ` +
           `It shows ${winner.metrics.returns.winRate > 50 ? 'strong' : 'moderate'} win rate (${winner.metrics.returns.winRate.toFixed(1)}%) ` +
           `with a profit factor of ${winner.metrics.returns.profitFactor.toFixed(2)}. ` +
           `${results.length > 1 ? `${loser.name} needs improvement with a score of ${loser.score.toFixed(1)}/100.` : ''}`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: StrategyComparison['strategies']): string[] {
    const recommendations: string[] = [];
    
    for (const result of results) {
      const m = result.metrics;
      
      if (m.returns.winRate < 40) {
        recommendations.push(`${result.name}: Win rate is low (${m.returns.winRate.toFixed(1)}%). Consider adjusting entry criteria.`);
      }
      
      if (m.risk.maxDrawdown > 20) {
        recommendations.push(`${result.name}: High drawdown (${m.risk.maxDrawdown.toFixed(1)}%). Implement tighter stop losses.`);
      }
      
      if (m.returns.profitFactor < 1.5) {
        recommendations.push(`${result.name}: Profit factor is suboptimal (${m.returns.profitFactor.toFixed(2)}). Review risk/reward ratio.`);
      }
      
      if (m.activity.tradesPerDay > 10) {
        recommendations.push(`${result.name}: High trade frequency may indicate overtrading. Consider longer timeframes.`);
      }
    }
    
    return recommendations;
  }

  /**
   * Get correlation between strategies
   */
  calculateCorrelation(strategyA: Strategy, strategyB: Strategy): number {
    // Simplified correlation based on type similarity
    if (strategyA.type === strategyB.type) return 0.8;
    
    const complementaryTypes: Array<[StrategyType, StrategyType]> = [
      ['momentum', 'mean_reversion'],
      ['trend_following', 'breakout'],
      ['grid_trading', 'market_making'],
    ];
    
    for (const [typeA, typeB] of complementaryTypes) {
      if ((strategyA.type === typeA && strategyB.type === typeB) ||
          (strategyA.type === typeB && strategyB.type === typeA)) {
        return -0.3; // Slightly negative correlation
      }
    }
    
    return 0.2; // Low correlation
  }

  /**
   * Suggest portfolio allocation
   */
  suggestAllocation(strategies: Strategy[], totalCapital: number): Array<{
    strategyId: string;
    name: string;
    allocation: number;
    amount: number;
    reasoning: string;
  }> {
    const scored = strategies.map(s => ({
      strategy: s,
      score: this.calculateScore(this.calculateMetrics(s)),
    }));

    // Weight by score and risk level
    const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
    
    return scored.map(({ strategy, score }) => {
      const baseAllocation = totalScore > 0 ? (score / totalScore) : (1 / strategies.length);
      
      // Adjust for risk
      let riskMultiplier = 1;
      if (strategy.riskLevel === 'conservative') riskMultiplier = 1.2;
      if (strategy.riskLevel === 'aggressive') riskMultiplier = 0.8;
      if (strategy.riskLevel === 'degen') riskMultiplier = 0.5;
      
      const allocation = Math.min(0.5, baseAllocation * riskMultiplier); // Max 50% per strategy
      
      return {
        strategyId: strategy.id,
        name: strategy.name,
        allocation,
        amount: totalCapital * allocation,
        reasoning: `Score: ${score.toFixed(1)}/100, Risk: ${strategy.riskLevel}`,
      };
    });
  }
}

export default StrategyComparator;
