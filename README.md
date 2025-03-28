# Amazon Product Scraper

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Bun](https://img.shields.io/badge/Bun-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

## 📋 Description

A complete API for scraping Amazon products with:

- Backend built with Bun/Node.js
- Frontend powered by Vite.js
- Multiple anti-blocking strategies
- Intuitive web interface

## 🚀 Installation

```bash
# Clone the repository
git clone git@github.com:wallace-mota-dev/amazon-scraper.git
cd amazon-scraper

# Backend
cd backend
bun install

# Frontend
cd ../frontend
npm install
```

## 🏗️ Project Structure

amazon-scraper/
├── backend/
│ ├── server.js # Scraping logic
│ ├── debug/ # HTML files for debugging
│ └── package.json
├── frontend/
│ ├── src/ # Frontend code
│ ├── public/
│ └── package.json
└── README.md

## 💻 Running the Application

# Backend (terminal 1)

cd backend
bun run server.js

# Frontend (terminal 2)

cd frontend
npm run dev

Access the app at: http://localhost:5173

## 🌐 API Endpoints

# GET /api/scrape

# Parameters

** keyword**: Search term
** Example: **
curl "http://localhost:3000/api/scrape?keyword=iphone"

# Resposta

{
"success": true,
"data": [
{
"title": "iPhone 13",
"rating": "4.8",
"reviews": "12543",
"imageUrl": "https://example.com/image.jpg"
}
]
}

## ⚙️ Configuration

# Backend (server.js)

const PROXIES = [
'http://proxy1.example.com:8080',
'http://user:pass@proxy2.example.com:8000'
];

const TEST_KEYWORDS = ["iphone", "kindle"];

# Frontend (main.js)

const API_URL = "http://localhost:3000"; // Altere se necessário

## 🔍 Troubleshooting

Problem | Solution
Error 503 | Update User-Agents and proxies
No results | Check the files in debug/
Frontend errors | Check the browser console

## 🤝 Contribution

1.Fork the project

2.Create your branch (git checkout -b feature)

3.Commit your changes (git commit -m 'Add feature')

4.Push to your branch (git push origin feature)

5.Open a pull request

## 📄 License

MIT © wallace-mota-dev

## ✉️ Contact

Email: wallacemota.dev@gmail.com
