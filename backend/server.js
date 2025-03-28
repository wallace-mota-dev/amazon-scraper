import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import cors from 'cors';
import httpsProxyAgent from 'https-proxy-agent';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

// Initial configuration
const app = express();
const PORT = 3000;
puppeteer.use(StealthPlugin());

// Middleware CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  })
);

// Proxy configuration (update with valid proxies)
const PROXIES = [
  'http://138.68.60.8:3128',
  'http://45.79.139.97:80',
  'http://45.61.118.199:8080'
].filter(Boolean);

// Utility functions
const getRandomUserAgent = () => {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};

const getRandomProxy = () =>
  PROXIES.length > 0
    ? PROXIES[Math.floor(Math.random() * PROXIES.length)]
    : null;

const generateCookies = () => ({
  Cookie:
    `session-id=${Math.random().toString(36).substring(2)}; ` +
    `session-id-time=${Date.now()}; ` +
    `ubid-main=${Math.random().toString(36).substring(2)}`
});

// Function to save HTML for debugging
const debugPageContent = (html, keyword) => {
  const debugDir = path.join(process.cwd(), 'debug');

  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugFile = path.join(debugDir, `debug_${keyword}_${timestamp}.html`);

  fs.writeFileSync(debugFile, html);
  console.log(`Debug file saved: ${debugFile}`);
};

// Scraping methods
async function scrapeWithAxios(url, useProxy = false) {
  const headers = {
    'User-Agent': getRandomUserAgent(),
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.google.com/',
    ...generateCookies(),
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate'
  };

  const config = {
    headers,
    timeout: 20000,
    ...(useProxy &&
      getRandomProxy() && {
        httpsAgent: new httpsProxyAgent.HttpsProxyAgent(getRandomProxy())
      })
  };

  await new Promise(resolve =>
    setTimeout(resolve, Math.random() * 3000 + 2000)
  );
  const response = await axios.get(url, config);
  return response.data;
}

async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setExtraHTTPHeaders(generateCookies());

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  const content = await page.content();
  await browser.close();
  return content;
}

// Product extraction with updated selectors
function extractProducts(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const items = document.querySelectorAll(
      '[data-component-type="s-search-result"]'
    );

    const products = Array.from(items)
      .map(item => {
        const title =
          item.querySelector('h2 a span')?.textContent?.trim() ||
          item.querySelector('span.a-size-medium')?.textContent?.trim() ||
          item.querySelector('span.a-text-normal')?.textContent?.trim() ||
          'N/A';

        if (title === 'N/A' || title.includes('Sponsored')) return null;

        const rating =
          item.querySelector('.a-icon-alt')?.textContent?.split(' ')[0] ||
          'N/A';
        const reviews =
          item
            .querySelector('[aria-label*="stars"]')
            ?.nextSibling?.textContent?.trim()
            ?.replace(/,/g, '') || '0';
        const imageUrl =
          item.querySelector('img.s-image')?.src ||
          item.querySelector('img[data-image-latency]')?.src ||
          'https://via.placeholder.com/150';

        return { title, rating, reviews, imageUrl };
      })
      .filter(Boolean);

    return products;
  } catch (error) {
    console.error('Error extracting products:', error);
    return [];
  }
}

// Main scraping endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword parameter is required'
      });
    }

    const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
      keyword
    )}`;
    console.log(`Starting scrape for: "${keyword}"`);

    let htmlContent;
    let methodUsed = '';

    try {
      htmlContent = await scrapeWithPuppeteer(amazonUrl);
      methodUsed = 'Puppeteer';
      console.log('Success with Puppeteer');
    } catch (puppeteerError) {
      console.log('Puppeteer failed, trying Axios with proxy...');
      try {
        htmlContent = await scrapeWithAxios(amazonUrl, true);
        methodUsed = 'Axios with Proxy';
        console.log('Success with Axios');
      } catch (axiosError) {
        console.error('All methods failed:', axiosError);
        throw new Error(`All scraping methods failed: ${axiosError.message}`);
      }
    }

    debugPageContent(htmlContent, keyword);
    const products = extractProducts(htmlContent);
    console.log(`Found ${products.length} products`);

    res.json({
      success: true,
      keyword,
      methodUsed,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Final scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Amazon',
      details: error.message,
      data: [],
      count: 0,
      solution: 'Try again later or use a different keyword',
      debugTip: 'Check server logs and debug HTML files in /debug folder'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    proxiesAvailable: PROXIES.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Available proxies: ${PROXIES.length}`);
  console.log(`Endpoints:`);
  console.log(
    `- Scrape: http://localhost:${PORT}/api/scrape?keyword=product_name`
  );
  console.log(`- Health: http://localhost:${PORT}/api/health\n`);
});
