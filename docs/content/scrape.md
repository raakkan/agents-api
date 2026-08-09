# Scrape API

The `/v1/scrape` endpoint allows you to extract content from any webpage in various formats, executing JavaScript and waiting for the page to fully load.

## Request

**Endpoint:** `POST /v1/scrape`  
**Content-Type:** `application/json`

### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The target URL to scrape |
| `format` | string | No | `"markdown"` | Output format (see formats below) |
| `profile` | string | No | `"fast"` | Browsing profile (see profiles below) |
| `waitFor` | number | No | `0` | Extra time to wait in ms before extracting |

### Formats

| Format | Description |
|--------|-------------|
| `markdown` | Cleaned, readable markdown representation of the main content |
| `html` | The full outer HTML of the DOM |
| `text` | Raw text content stripped of HTML |
| `links` | Array of all outbound links found on the page |

### Profiles

| Profile | Description |
|---------|-------------|
| `fast` | Disables images, CSS, and fonts for maximum speed |
| `stealth` | Modifies user-agent and navigator properties to bypass basic anti-bot |
| `heavy` | Loads everything, simulates human scrolling to trigger lazy-loaded elements |

## Response

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "content": "# Example Domain\n\nThis domain is for use in illustrative examples..."
  },
  "metadata": {
    "duration_ms": 1250,
    "format": "markdown"
  }
}
```

## Examples

### cURL
```bash
curl -X POST http://localhost:3000/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com", "format": "markdown", "profile": "stealth"}'
```

### Python
```python
import requests

response = requests.post(
    "http://localhost:3000/v1/scrape",
    json={
        "url": "https://news.ycombinator.com",
        "format": "markdown",
        "profile": "stealth"
    }
)
print(response.json()["data"]["content"])
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3000/v1/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://news.ycombinator.com',
    format: 'markdown'
  })
});
const result = await response.json();
console.log(result.data.content);
```
