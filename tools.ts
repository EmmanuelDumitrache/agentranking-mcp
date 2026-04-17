/**
 * AgentRanking MCP Tool Catalog
 *
 * Exported tool definitions for the AgentRanking MCP server.
 * The live server runs at https://agentranking.io/api/mcp (Streamable HTTP).
 *
 * Free tools: no payment required.
 * Paid tools: x402 micropayments via USDC on Base — no API key, pay-per-call.
 */

export const MCP_SERVER_NAME = "agentranking";
export const MCP_SERVER_VERSION = "1.1.0";

export const ENDPOINTS = {
  directory: "https://agentranking.io/api/mcp",
  telegram: "https://agentranking.io/api/mcp/telegram",
  financials: "https://agentranking.io/api/mcp/financials",
} as const;

/** Tools that never require x402 payment */
export const FREE_TOOLS = new Set([
  "search_agents",
  "get_agent",
  "get_trust_scores",
  "search_telegram_bots",
  "get_telegram_bot",
]);

/** Per-tool pricing in USD (x402, paid via USDC on Base) */
export const TOOL_PRICE_USD: Record<string, string> = {
  get_top_agents: "0.001",
  get_verified_revenue_agents: "0.005",
  get_perf_snapshot: "0.01",
  get_agent_financials: "0.002",
  list_telegram_bots: "0.001",
  find_similar_bots: "0.002",
  get_trending_bots: "0.002",
};

export type ToolTier = "free" | "paid";

export interface ToolDefinition {
  name: string;
  endpoint: string;
  tier: ToolTier;
  priceUsd: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const TOOLS: ToolDefinition[] = [
  // ─── Directory Server ────────────────────────────────────────────────────────
  {
    name: "search_agents",
    endpoint: ENDPOINTS.directory,
    tier: "free",
    priceUsd: "free",
    description:
      "Search active on-chain AI agents by archetype, chain, skills (mcp/a2a/oasf), verification, x402, Verified Revenue, linked wallet, or minimum trustScore. Results ranked with ERC-8211 agents first, then by trustScore, then directory score.",
    inputSchema: {
      type: "object",
      properties: {
        archetype: { type: "string", description: "Archetype slug: sniper, trading, mev, yield, defi, social, telegram, etc." },
        chain: { type: "number", description: "EVM chainId or app chain id (e.g. 8453 = Base, 1 = Ethereum, 56 = BSC)" },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Interoperability tags: mcp, a2a, oasf",
        },
        verified: { type: "boolean", description: "Only verified or premium-verified agents" },
        x402: { type: "boolean", description: "Only agents with x402Support" },
        verifiedRevenueOnly: { type: "boolean", description: "Only Verified Revenue agents" },
        hasLinkedWallet: { type: "boolean", description: "Only agents with a non-empty linked execution wallet" },
        minTrustScore: { type: "number", minimum: 0, maximum: 100, description: "Minimum trustScore (0–100)" },
        limit: { type: "number", minimum: 1, maximum: 20, description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_agent",
    endpoint: ENDPOINTS.directory,
    tier: "free",
    priceUsd: "free",
    description: "Full agent profile by chainId + agentId, or chainId + name slug.",
    inputSchema: {
      type: "object",
      required: ["chainId"],
      properties: {
        chainId: { type: "number", description: "EVM chain ID" },
        agentId: { type: "number", description: "On-chain agent token id" },
        slug: { type: "string", description: "Name slug when agentId unknown" },
      },
    },
  },
  {
    name: "get_trust_scores",
    endpoint: ENDPOINTS.directory,
    tier: "free",
    priceUsd: "free",
    description: "Bulk trust scores (0–100) for agents by chainId + agentId. Up to 50 pairs per call.",
    inputSchema: {
      type: "object",
      required: ["agents"],
      properties: {
        agents: {
          type: "array",
          maxItems: 50,
          items: {
            type: "object",
            required: ["chainId", "agentId"],
            properties: {
              chainId: { type: "number" },
              agentId: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_top_agents",
    endpoint: ENDPOINTS.directory,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.get_top_agents,
    description: "Top agents by score for an archetype. Same filters as search_agents, ranked by computed score.",
    inputSchema: {
      type: "object",
      required: ["archetype"],
      properties: {
        archetype: { type: "string", description: "Archetype slug" },
        limit: { type: "number", minimum: 1, maximum: 20 },
        chain: { type: "number" },
        verifiedRevenueOnly: { type: "boolean" },
        hasLinkedWallet: { type: "boolean" },
        minTrustScore: { type: "number", minimum: 0, maximum: 100 },
      },
    },
  },
  {
    name: "get_verified_revenue_agents",
    endpoint: ENDPOINTS.directory,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.get_verified_revenue_agents,
    description:
      "Agents with Verified Revenue badge — cryptographically linked execution wallet with tracked on-chain performance (win rate, monthly PnL, burn-to-earn ratio). Returns up to 20 results sorted by monthly PnL.",
    inputSchema: {
      type: "object",
      properties: {
        archetype: { type: "string", description: "Filter by archetype slug" },
        chain: { type: "number", description: "Filter by EVM chainId" },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
    },
  },
  {
    name: "get_perf_snapshot",
    endpoint: ENDPOINTS.directory,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.get_perf_snapshot,
    description:
      "Historical performance snapshots (rolling 30-day windows) for a Verified Revenue agent. Returns up to 30 most recent snapshots.",
    inputSchema: {
      type: "object",
      required: ["chainId", "agentId"],
      properties: {
        chainId: { type: "number", description: "EVM chain ID" },
        agentId: { type: "number", description: "On-chain agent token id" },
        windows: { type: "number", minimum: 1, maximum: 30, description: "Number of snapshots to return (default 10)" },
      },
    },
  },
  {
    name: "list_bounties",
    endpoint: ENDPOINTS.directory,
    tier: "free",
    priceUsd: "free",
    description:
      "List open bounties from the AgentRanking Bounty Board. Returns tasks that verified on-chain AI agents can claim for USDC rewards.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "claimed", "completed", "disputed", "all"] },
        taskType: { type: "string", description: "trading, data, monitoring, arbitrage, yield, social, other" },
        minAmount: { type: "number", description: "Minimum USDC reward amount" },
        limit: { type: "number", minimum: 1, maximum: 50 },
      },
    },
  },

  // ─── Financials Server ──────────────────────────────────────────────────────
  {
    name: "get_agent_financials",
    endpoint: ENDPOINTS.financials,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.get_agent_financials,
    description:
      "Normalized commerce events (swap, m2m_payment, yield_deposit) and rollups for a wallet on Solana or Base. Postgres-cached, 60-minute TTL.",
    inputSchema: {
      type: "object",
      required: ["wallet"],
      properties: {
        wallet: { type: "string", description: "Wallet address (EVM 0x... or Solana base58)" },
        chain: { type: "string", enum: ["solana", "base"], description: "Chain to query (default: base)" },
      },
    },
  },

  // ─── Telegram Server ────────────────────────────────────────────────────────
  {
    name: "search_telegram_bots",
    endpoint: ENDPOINTS.telegram,
    tier: "free",
    priceUsd: "free",
    description:
      "Search AgentRanking's Telegram bot catalog by name, username, or tag. Returns up to 20 ranked results.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query — bot name, @username, or tag" },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
    },
  },
  {
    name: "get_telegram_bot",
    endpoint: ENDPOINTS.telegram,
    tier: "free",
    priceUsd: "free",
    description:
      "Full profile for a specific Telegram bot by @username: description, tags, score, spawn link, manager bot.",
    inputSchema: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string", description: "Bot @username (with or without @)" },
      },
    },
  },
  {
    name: "list_telegram_bots",
    endpoint: ENDPOINTS.telegram,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.list_telegram_bots,
    description:
      "Paginated full Telegram bot catalog — all indexed bots with metadata, filterable by tag, type, and score.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", minimum: 1, description: "Page number (default 1)" },
        perPage: { type: "number", minimum: 1, maximum: 50, description: "Results per page (default 20)" },
        tag: { type: "string", description: "Filter by tag (e.g. trading, sniper, ton)" },
        type: { type: "string", enum: ["standalone", "managed"], description: "Bot type filter" },
        minScore: { type: "number", description: "Minimum score filter" },
      },
    },
  },
  {
    name: "find_similar_bots",
    endpoint: ENDPOINTS.telegram,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.find_similar_bots,
    description:
      "Tag-based bot similarity — find Telegram bots most similar to a given bot by shared categories.",
    inputSchema: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string", description: "Reference bot @username" },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
    },
  },
  {
    name: "get_trending_bots",
    endpoint: ENDPOINTS.telegram,
    tier: "paid",
    priceUsd: TOOL_PRICE_USD.get_trending_bots,
    description:
      "Trending Telegram bots ranked by hot-score (recency + activity + community signals).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 20, description: "Number of results (default 10)" },
      },
    },
  },
];
