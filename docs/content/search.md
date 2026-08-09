# Search API

The `/v1/search` endpoint allows you to query multiple search engines simultaneously, aggregating and parsing the results into a clean JSON structure. Under the hood, this is powered by a locally hosted instance of [SearXNG](https://github.com/searxng/searxng).

## Request

**Endpoint:** `POST /v1/search`  
**Content-Type:** `application/json`

### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | The search query string |
| `categories` | array | No | `["general"]` | Categories to search (e.g., `["news", "it"]`) |
| `language` | string | No | `"en-US"` | Language code for results |

### Popular Categories
- `general`: Google, Bing, DuckDuckGo, Wikipedia
- `news`: Google News, Bing News
- `it`: StackOverflow, GitHub, Docker Hub
- `science`: ArXiv, PubMed

## Response

```json
{
  "success": true,
  "data": {
    "query": "artificial intelligence",
    "results": [
      {
        "title": "Artificial intelligence - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "content": "Artificial intelligence (AI), in its broadest sense, is intelligence exhibited by machines, particularly computer systems...",
        "engine": "wikipedia",
        "score": 1.0
      },
      {
        "title": "What is AI? - IBM",
        "url": "https://www.ibm.com/topics/artificial-intelligence",
        "content": "At its simplest form, artificial intelligence is a field, which combines computer science and robust datasets...",
        "engine": "google",
        "score": 0.95
      }
    ]
  }
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `title` | The title of the search result |
| `url` | The destination link |
| `content` | The snippet or excerpt provided by the search engine |
| `engine` | The specific engine that provided this result |
| `score` | Relevancy score provided by the meta-engine |

## Examples

### cURL

```bash
curl -X POST http://localhost:3000/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "latest advancements in quantum computing", "categories": ["science", "it"]}'
```
