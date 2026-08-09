# Map API

The `/v1/map` endpoint is designed to rapidly discover and extract the structure of a website. It returns a hierarchical or flat list of URLs belonging to the domain, without downloading or rendering the full contents of every page.

It achieves this by parsing `robots.txt`, XML sitemaps, and performing shallow link extraction on the homepage.

## Request

**Endpoint:** `POST /v1/map`  
**Content-Type:** `application/json`

### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The target domain to map |

## Response

```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "urls": [
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/pricing",
      "https://example.com/contact",
      "https://example.com/blog"
    ],
    "sitemaps": [
      "https://example.com/sitemap.xml"
    ]
  }
}
```

## Use Cases

- **Agent Planning**: Provide an AI agent with the structure of a site so it can decide which specific page to scrape next.
- **Pre-crawling**: Generate a list of URLs to feed into the Crawl API.

## Examples

### cURL
```bash
curl -X POST http://localhost:3000/v1/map \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com"}'
```

### JavaScript
```javascript
const getSiteMap = async (domain) => {
  const res = await fetch('http://localhost:3000/v1/map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: domain })
  });
  const json = await res.json();
  return json.data.urls;
};

const urls = await getSiteMap('https://stripe.com');
console.log(`Discovered ${urls.length} URLs`);
```
