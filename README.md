# Amazon Product Scraper API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Bun](https://img.shields.io/badge/Bun-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

Uma API robusta para scraping de produtos da Amazon com múltiplas estratégias de resiliência contra bloqueios.

## 📌 Visão Geral

Esta solução oferece:
- Scraping de produtos da Amazon com informações completas (título, avaliação, reviews, imagem)
- 3 camadas de fallback (Puppeteer Stealth, Axios com proxy, e retentativas)
- Sistema de debug integrado
- Resposta padronizada para fácil consumo no frontend

## 🚀 Começando

### Pré-requisitos

- [Bun](https://bun.sh/) (versão 1.0 ou superior)
- Node.js (18.x ou superior)
- Acesso à internet (para requisições à Amazon)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/amazon-scraper.git
cd amazon-scraper
