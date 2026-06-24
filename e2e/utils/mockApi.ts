import { type Page } from "@playwright/test";
import {
  buildAssetWithHealth,
  buildBridge
} from "../../frontend/src/test/factories";

const assetsFixture = [
  buildAssetWithHealth({ symbol: "XLM", name: "Stellar Lumens" }, 100),
  buildAssetWithHealth({ symbol: "USDC", name: "USD Coin" }, 101),
];

const assetHealthFixture = {
  XLM: assetsFixture[0].health,
  USDC: assetsFixture[1].health,
};

const bridgesFixture = {
  bridges: [
    buildBridge({ name: "Allbridge", status: "healthy" }, 200),
    buildBridge({ name: "Wormhole", status: "healthy" }, 201),
  ]
};

const transactionsFixture = {
  transactions: [
    {
      id: "tx-1",
      txHash: "0x1234",
      bridge: "Circle",
      asset: "USDC",
      amount: 1000,
      sourceChain: "Ethereum",
      destinationChain: "Stellar",
      senderAddress: "0xabcd",
      recipientAddress: "GABC",
      status: "completed" as const,
      fee: 0.1,
      timestamp: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      stellarTxHash: "stellar-tx-1",
      ethereumTxHash: "ethereum-tx-1",
      blockNumber: 12345,
    },
    {
      id: "tx-2",
      txHash: "0x5678",
      bridge: "Allbridge",
      asset: "XLM",
      amount: 500,
      sourceChain: "Stellar",
      destinationChain: "Solana",
      senderAddress: "GXYZ",
      recipientAddress: "sol-addr",
      status: "completed" as const,
      fee: 0.05,
      timestamp: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      stellarTxHash: "stellar-tx-2",
      ethereumTxHash: null,
      blockNumber: 12346,
    }
  ],
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

const jsonHeaders = { "content-type": "application/json" };

export async function mockCoreApi(page: Page): Promise<void> {
  // Catch-all for any other API routes to prevent proxy errors
  // Registered first so specific routes registered later take precedence in Playwright's reverse-order routing
  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });

  await page.route("**/api/v1/transactions**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(transactionsFixture),
    });
  });

  await page.route("**/api/v1/assets", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(assetsFixture),
    });
  });

  await page.route("**/api/v1/assets/*/health*", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/api\/v1\/assets\/([^/]+)\/health/);
    const symbol = match?.[1] ?? "";
    const body = (assetHealthFixture as Record<string, unknown>)[symbol] ?? null;

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
  });

  await page.route("**/api/v1/bridges**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(bridgesFixture),
    });
  });

  await page.route("**/health**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {},
      }),
    });
  });

  await page.route("**/api/v1/external-dependencies**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ dependencies: [], summary: { total: 0, healthy: 0, degraded: 0 } }),
    });
  });
}
