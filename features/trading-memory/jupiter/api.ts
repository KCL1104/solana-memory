/**
 * Jupiter API Integration Module
 * Handles DEX aggregation, swap routing, and price fetching
 */

const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

/**
 * Token pair for trading
 */
export interface TokenPair {
  inputMint: string;
  outputMint: string;
  inputSymbol: string;
  outputSymbol: string;
  decimals: number;
}

/**
 * Swap quote from Jupiter
 */
export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: RouteStep[];
  contextSlot: number;
  timeTaken: number;
}

export interface RouteStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

/**
 * Price data from Jupiter
 */
export interface PriceData {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    lastSwappedPrice?: {
      lastJupiterSellPrice: string;
      lastJupiterBuyPrice: string;
    };
    quotedPrice?: {
      buyPrice: string;
      buyAt: number;
      sellPrice: string;
      sellAt: number;
    };
    confidenceLevel?: string;
    depth?: {
      buyPriceImpactRatio: { depth: Record<string, number>; };
      sellPriceImpactRatio: { depth: Record<string, number>; };
    };
  };
}

/**
 * Jupiter API Client
 */
export class JupiterClient {
  private apiKey?: string;
  private lastRequestTime: number = 0;
  private requestDelay: number = 100; // ms between requests

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestDelay) {
      await new Promise(r => setTimeout(r, this.requestDelay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Get swap quote for a token pair
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50,
    swapMode: 'ExactIn' | 'ExactOut' = 'ExactIn'
  ): Promise<SwapQuote> {
    await this.throttle();
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
      swapMode,
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const response = await fetch(`${JUPITER_API_BASE}/quote?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Get price for multiple tokens
   */
  async getPrices(mints: string[], showExtraInfo: boolean = true): Promise<Record<string, PriceData>> {
    await this.throttle();
    
    const ids = mints.join(',');
    const response = await fetch(
      `${JUPITER_PRICE_API}?ids=${ids}&showExtraInfo=${showExtraInfo}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Jupiter Price API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get swap transaction
   */
  async getSwapTransaction(
    quoteResponse: SwapQuote,
    userPublicKey: string,
    wrapAndUnwrapSol: boolean = true,
    dynamicComputeUnitLimit: boolean = true,
    prioritizationFeeLamports?: number
  ): Promise<{ swapTransaction: string; lastValidBlockHeight: number }> {
    await this.throttle();

    const body: Record<string, any> = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol,
      dynamicComputeUnitLimit,
    };

    if (prioritizationFeeLamports) {
      body.prioritizationFeeLamports = prioritizationFeeLamports;
    }

    const response = await fetch(`${JUPITER_API_BASE}/swap`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap error: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Get supported tokens
   */
  async getTokens(): Promise<Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
  }>> {
    await this.throttle();
    
    const response = await fetch('https://token.jup.ag/all', {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Jupiter token list error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Calculate price impact category
   */
  categorizePriceImpact(priceImpactPct: string): 'low' | 'medium' | 'high' | 'extreme' {
    const impact = parseFloat(priceImpactPct);
    if (impact < 0.1) return 'low';
    if (impact < 1) return 'medium';
    if (impact < 3) return 'high';
    return 'extreme';
  }

  /**
   * Get common token mints
   */
  static getCommonTokens(): Record<string, { mint: string; symbol: string; decimals: number }> {
    return {
      SOL: { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', decimals: 9 },
      USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6 },
      USDT: { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', decimals: 6 },
      BONK: { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', decimals: 5 },
      JUP: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', decimals: 6 },
      RAY: { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', symbol: 'RAY', decimals: 6 },
      ORCA: { mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', decimals: 6 },
      mSOL: { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', decimals: 9 },
      wSOL: { mint: 'So11111111111111111111111111111111111111112', symbol: 'wSOL', decimals: 9 },
    };
  }
}

export default JupiterClient;
