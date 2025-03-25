import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import cors from 'cors';
import httpsProxyAgent from 'https-proxy-agent';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

// Configuração inicial
const app = express();
const PORT = 3000;
puppeteer.use(StealthPlugin());

// Middleware CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Palavras-chave de teste garantidas
const TEST_KEYWORDS = [
  "iphone", "airpods", "kindle", "echo dot", "playstation 5",
  "nike air force", "lego", "harry potter", "yeti cup",
  "fitbit", "instant pot", "dove soap", "python book",
  "anker charger", "amazon basics"
];

// Configuração de proxies (atualize com proxies válidos)
const PROXIES = [
  'http://138.68.60.8:3128',
  'http://45.79.139.97:80',
  'http://45.61.118.199:8080'
].filter(Boolean);

// Utilitários
const getRandomUserAgent = () => {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};

const getRandomProxy = () => PROXIES.length > 0 ? PROXIES[Math.floor(Math.random() * PROXIES.length)] : null;

const generateCookies = () => ({
  'Cookie': `session-id=${Math.random().toString(36).substring(2)}; ` +
            `session-id-time=${Date.now()}; ` +
            `ubid-main=${Math.random().toString(36).substring(2)}`
});

// Função para salvar HTML para debug
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

// Métodos de scraping
async function scrapeWithAxios(url, useProxy = false) {
  const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
    ...generateCookies(),
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate'
  };

  const config = {
    headers,
    timeout: 20000,
    ...(useProxy && getRandomProxy() && { 
      httpsAgent: new httpsProxyAgent.HttpsProxyAgent(getRandomProxy())
    })
  };

  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
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

// Extração de produtos com seletores atualizados
function extractProducts(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Seletores atualizados para Dezembro 2023
    const items = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    const products = Array.from(items).map(item => {
      // Extrai título - prioriza diferentes seletores
      const title = item.querySelector('h2 a span')?.textContent?.trim() || 
                   item.querySelector('span.a-size-medium')?.textContent?.trim() || 
                   item.querySelector('span.a-text-normal')?.textContent?.trim() || 'N/A';
      
      // Remove resultados patrocinados
      if (title === 'N/A' || title.includes('Sponsored')) return null;

      // Extrai rating
      const rating = item.querySelector('.a-icon-alt')?.textContent?.split(' ')[0] || 'N/A';

      // Extrai número de reviews
      const reviews = item.querySelector('[aria-label*="stars"]')?.nextSibling?.textContent?.trim()?.replace(/,/g, '') || '0';

      // Extrai URL da imagem
      const imageUrl = item.querySelector('img.s-image')?.src || 
                      item.querySelector('img[data-image-latency]')?.src || 
                      'https://via.placeholder.com/150';

      return { title, rating, reviews, imageUrl };
    }).filter(Boolean); // Remove entradas nulas

    return products;
  } catch (error) {
    console.error('Error extracting products:', error);
    return []; // Retorna array vazio em caso de erro
  }
}

// Rota principal
app.get('/api/scrape', async (req, res) => {
  try {
    const keyword = req.query.keyword || TEST_KEYWORDS[Math.floor(Math.random() * TEST_KEYWORDS.length)];
    const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    
    console.log(`Starting scrape for: "${keyword}"`);

    let htmlContent;
    let methodUsed = '';
    
    // Tentativa com Puppeteer primeiro
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

    // Debug: salva o HTML completo
    debugPageContent(htmlContent, keyword);

    // Processa os resultados
    const products = extractProducts(htmlContent);
    console.log(`Found ${products.length} products`);

    // Retorna resposta padronizada
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

// Rota de teste
app.get('/api/test', async (req, res) => {
  const testResults = [];
  
  for (const keyword of TEST_KEYWORDS.slice(0, 3)) {
    try {
      const response = await axios.get(`http://localhost:${PORT}/api/scrape?keyword=${encodeURIComponent(keyword)}`);
      testResults.push({
        keyword,
        success: true,
        productsCount: response.data.count,
        methodUsed: response.data.methodUsed
      });
    } catch (error) {
      testResults.push({
        keyword,
        success: false,
        error: error.message
      });
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // Delay entre testes
  }

  res.json({
    message: 'Test completed',
    results: testResults,
    proxiesCount: PROXIES.length
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    proxiesAvailable: PROXIES.length,
    testKeywordsAvailable: TEST_KEYWORDS.length
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Available proxies: ${PROXIES.length}`);
  console.log(`Test keywords: ${TEST_KEYWORDS.join(', ')}`);
  console.log(`Endpoints:`);
  console.log(`- Scrape: http://localhost:${PORT}/api/scrape?keyword=iphone`);
  console.log(`- Test: http://localhost:${PORT}/api/test`);
  console.log(`- Health: http://localhost:${PORT}/api/health\n`);
});