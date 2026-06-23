import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BSC_BURN_ADDRESS,
  BSC_ION_TOKEN,
  ION_BSC_LP_POOL,
} from "../src/constants/official-ion-addresses.js";
import { OFFICIAL_ION_BSC_ADDRESSES } from "../src/services/scraping/market-price.js";
import {
  parseCoinGeckoPrice,
  parseCoinMarketCapPrice,
  parseOkxWeb3TokenPrice,
} from "../src/services/scraping/parse-market-price.js";

describe("official ION BSC addresses", () => {
  it("matches Master-confirmed token, LP pool, and burn sink", () => {
    assert.equal(BSC_ION_TOKEN.toLowerCase(), "0xe1ab61f7b093435204df32f5b3a405de55445ea8");
    assert.equal(BSC_BURN_ADDRESS.toLowerCase(), "0x000000000000000000000000000000000000dead");
    assert.equal(ION_BSC_LP_POOL.toLowerCase(), "0x6487725b383954e05ca56f3c2b93a104b3dd2c25");
    assert.equal(OFFICIAL_ION_BSC_ADDRESSES.token, BSC_ION_TOKEN);
    assert.equal(OFFICIAL_ION_BSC_ADDRESSES.burnSink, BSC_BURN_ADDRESS);
  });
});

describe("scraping market price parsers", () => {
  it("parses CoinMarketCap __NEXT_DATA__ statistics.price", () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          detailRes: {
            detail: {
              statistics: { price: 21.011953080488844, priceChangePercentage24h: -25.00074243 },
            },
          },
        },
      },
    })}</script></html>`;
    const parsed = parseCoinMarketCapPrice(html);
    assert.ok(parsed);
    assert.equal(parsed.priceUsd, 21.011953080488844);
    assert.equal(parsed.change24hPct, -25.00074243);
    assert.equal(parsed.source, "coinmarketcap");
  });

  it("parses OKX Web3 token page og:description price", () => {
    const html = `<html><head>
      <meta property="og:description" content="ION (Ice Open Network) 的实时价格为 $0.0001315，市值为 $847.47K。" />
      <title>ION $0.0001315 (Ice Open Network) | BNB Chain</title>
    </head></html>`;
    const parsed = parseOkxWeb3TokenPrice(html);
    assert.ok(parsed);
    assert.equal(parsed.priceUsd, 0.0001315);
    assert.equal(parsed.source, "okx-web3");
  });

  it("parses CoinGecko ExchangeRateSpecification JSON-LD", () => {
    const html = `<html><script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ExchangeRateSpecification",
      currentExchangeRate: { "@type": "UnitPriceSpecification", price: 0.0421 },
    })}</script></html>`;
    const parsed = parseCoinGeckoPrice(html);
    assert.ok(parsed);
    assert.equal(parsed.priceUsd, 0.0421);
    assert.equal(parsed.source, "coingecko");
  });
});
