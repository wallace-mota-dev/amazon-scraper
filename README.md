# Amazon Product Scraper

A web scraper that extracts product listings (title, rating, reviews, image) from Amazon's first search results page.

![Scraper Demo ](./github/Amazon-Product-Scraper.gif)

## Features

- **Backend**: Scrapes Amazon using Axios + JSDOM or Puppeteer (fallback)
- **Frontend**: Clean UI with search input and results grid
- **Error Handling**: Graceful degradation for blocked requests
- **Proxies**: Rotation to avoid IP blocking
- **Debug**: Saves HTML snapshots for troubleshooting

## Technologies

- **Backend**: Bun, Express, Axios, JSDOM, Puppeteer
- **Frontend**: Vite, Vanilla JS, CSS

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

```amazon-scraper/
├── backend/
│ ├── server.js # Scraping logic
│ ├── debug/ # HTML files for debugging
│ └── package.json
├── frontend/
│ ├── src/ # Frontend code
│ ├── public/
│ └── package.json
└── README.md
```

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

# Response

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
