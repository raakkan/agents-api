# Introduction

**agent-api** is an open-source web scraper, crawler, and screenshot REST API built for AI agents, developers, and researchers.

## Features

- 🔍 **Web scraping**: Extract Markdown, HTML, text, and links from any webpage.
- 📸 **Full-page screenshots**: Capture beautiful pixel-perfect screenshots encoded in base64.
- 🕸️ **Async BFS crawler**: Scale data extraction across entire websites asynchronously.
- 🗺️ **URL mapper**: Extract site structure and sitemap information.
- 🌐 **Meta-search**: Query search engines including Google, Bing, and DuckDuckGo.
- 🔐 **Authentication**: Secure your API instance with Bearer token authentication.
- 🐳 **Docker Compose**: Spin up the entire stack with a single command.

## Service Architecture

agent-api operates using a microservices architecture:

| Service | Description | Port |
|---------|-------------|------|
| **agent-api** | Main REST API server handling user requests | 3000 |
| **chrome** | Headless browser for rendering and screenshots | 9222 |
| **redis** | Queue and caching layer | 6379 |
| **searxng** | Meta-search engine backend | 8080 |
| **docs** | Static documentation site | 80 |

## Quick Start

You can easily interact with the API using curl:

```bash
# Scrape a webpage to Markdown
curl -X POST http://localhost:3000/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Take a screenshot
curl -X POST http://localhost:3000/v1/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "fullPage": true}'
```

## Authentication

If you configure an API key by setting the `API_KEY` environment variable in your `.env` file, all requests must include it in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/v1/scrape
```
