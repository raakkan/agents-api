# 🤖 agents-api

> **High-Performance, Self-Hosted Web Scraping, Search & Screenshot REST API for AI Agents**

`agents-api` is an open-source, Firecrawl & Tavily-compatible REST API engine designed for AI agents (Claude Code, Cursor, Windsurf, LangChain, LlamaIndex, AutoGen). Built with **TypeScript**, **Playwright**, **LightPanda CDP**, **SearXNG**, and **Browserless Stealth**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Code Style](https://img.shields.io/badge/Security-SSRF%20Protected-brightgreen)](#-security--hardening)

---

## ✨ Features

- 🔍 **Meta-Search (`POST /v1/search`)**: Aggregates search results from **Google, Bing, DuckDuckGo** simultaneously via built-in SearXNG — no API keys required.
- 📄 **Web Scraping (`POST /v1/scrape`)**: Convert any webpage into clean **Markdown**, **HTML**, **Text**, **Links**, or **Screenshots** using LightPanda CDP (10x faster than full Chrome).
- 📸 **Full-Page Screenshots (`POST /v1/screenshot`)**: Capture full-page, high-resolution PNG/JPEG screenshots of complex SPAs and bot-protected sites using anti-fingerprint Chrome Stealth.
- 🕸️ **Async BFS Crawler (`POST /v1/crawl` & `GET /v1/crawl/:id`)**: Asynchronously crawl entire domains, track progress, and poll results.
- 🗺️ **URL Mapper (`POST /v1/map`)**: Rapidly discover internal links on any site for sitemap generation or crawl planning.
- 📖 **Built-in Docs SPA (`GET /`)**: Embedded single-page documentation site with live code tabs, dark theme, and search.
- 🛡️ **Enterprise Security**: Timing-safe Bearer token auth, SSRF protection against internal IP ranges, and strict Zod runtime schema validation.

---

## 🏗️ Architecture

```
                       ┌─────────────────────────────────────────┐
                       │               Client / AI Agent         │
                       └───────────────────┬─────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          agents-api (Express + TypeScript :3000)                │
│  ├── Auth Middleware (Timing-Safe Bearer Token)                                 │
│  ├── SSRF Protection (Internal IP & Cloud Metadata Blocker)                    │
│  └── Zod Runtime Input Validation                                               │
└──────┬──────────────────────┬──────────────────────┬──────────────────────┬─────┘
       │                      │                      │                      │
       ▼                      ▼                      ▼                      ▼
 🔍 SearXNG             🐼 LightPanda           🌐 Chrome            🥷 Chrome-Stealth
  (HTTP :8080)            (CDP :9222)            (CDP :3000)           (CDP :3000)
 Meta-Search            Fast Web Scraping        Heavy SPA Backup      Anti-Fingerprint
  Google+Bing+DDG         & Crawling             Complex SPAs           Screenshots
```

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the repository
```bash
git clone https://github.com/raakkan/agents-api.git
cd agents-api
```

### 2. Configure environment
```bash
cp .env.example .env
```
> **Note:** By default, `API_KEY` is empty for self-hosted mode (no authentication needed). Set `API_KEY=your_secret_key` in `.env` to enable Bearer token protection.

### 3. Start all 5 services
```bash
docker compose up -d
```

### 4. Verify deployment
```bash
curl http://localhost:3000/health
```
Response:
```json
{ "success": true, "status": "ok", "version": "1.0.0", "uptime": 12.4 }
```

---

## 🔌 API Endpoints Reference

### 1. Search (`POST /v1/search`)
Query Google, Bing, and DuckDuckGo in parallel.

```bash
curl -X POST http://localhost:3000/v1/search \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"renewable energy trends", "limit": 3}'
```

---

### 2. Scrape (`POST /v1/scrape`)
Scrape any URL into Markdown, HTML, Text, or Links.

```bash
curl -X POST http://localhost:3000/v1/scrape \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown", "html", "links"],
    "profile": "fast"
  }'
```

---

### 3. Full-Page Screenshot (`POST /v1/screenshot`)
Capture a high-resolution PNG or JPEG screenshot.

```bash
curl -X POST http://localhost:3000/v1/screenshot \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1280,
    "height": 800,
    "format": "png"
  }' --output screenshot.png
```

---

### 4. Discover Links (`POST /v1/map`)
Extract all same-domain internal links from a URL.

```bash
curl -X POST http://localhost:3000/v1/map \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com", "limit": 10}'
```

---

### 5. Async Domain Crawler (`POST /v1/crawl` & `GET /v1/crawl/:id`)
Asynchronously crawl an entire website up to `maxPages`.

```bash
# Start Crawl Job
CRAWL_RES=$(curl -s -X POST http://localhost:3000/v1/crawl \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxPages": 5}')

# Extract Job ID and Poll Status
JOB_ID=$(echo $CRAWL_RES | jq -r '.jobId')
curl -s http://localhost:3000/v1/crawl/$JOB_ID -H "Authorization: Bearer $API_KEY"
```

---

## 🛡️ Security & Hardening

`agents-api` includes built-in security protections for production deployment:

1. **SSRF Protection**: Automatically blocks requests attempting to target internal Docker services (`searxng`, `lightpanda`, `chrome`), private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), or cloud metadata endpoints (`169.254.169.254`).
2. **Timing-Safe Auth**: Uses Node.js `crypto.timingSafeEqual()` for Bearer token validation to eliminate side-channel timing attacks.
3. **Zod Validation**: Rejects invalid payloads before execution with detailed field-level error messages.
4. **Helmet & Rate Limiting**: Includes security headers and configurable IP rate limiting out of the box.

---

## 🚀 Coolify Deployment Guide

`agents-api` is 100% compatible with [Coolify](https://coolify.io).

1. In Coolify, create a **New Resource** ➔ **Public/Private Git Repository**.
2. Connect your repo `https://github.com/raakkan/agents-api.git`.
3. Set **Build Pack** to **Docker Compose**.
4. Set **Docker Compose Location** to `/docker-compose.yml`.
5. Enter your public domain in Coolify UI (e.g. `https://api.yourdomain.com`).
6. Set Environment Variables in Coolify UI (`PORT=3000`, `API_KEY=your_secret`).
7. Click **Deploy**!

---

## 💻 Development & Testing

```bash
# Install dependencies
npm install

# Run TypeScript build
npm run build

# Run Jest unit & integration test suite
npm test

# Run test coverage
npm run test:coverage
```

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
