# Crawl API

The Crawl API allows you to extract content from multiple pages across a website simultaneously. It uses a Breadth-First Search (BFS) approach and runs asynchronously.

Since crawling takes time, the process involves two steps:
1. Start the crawl job
2. Poll the job status until completion

## 1. Start a Crawl

**Endpoint:** `POST /v1/crawl`  
**Content-Type:** `application/json`

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The starting URL |
| `maxPages` | number | No | `10` | Maximum number of pages to crawl |
| `format` | string | No | `"markdown"` | Output format for each page |

### Response

```json
{
  "success": true,
  "jobId": "job_a1b2c3d4e5f6",
  "status": "pending",
  "message": "Crawl job started. Poll /v1/crawl/job_a1b2c3d4e5f6 for results."
}
```

## 2. Poll Job Status

**Endpoint:** `GET /v1/crawl/:jobId`

### Response (In Progress)

```json
{
  "success": true,
  "jobId": "job_a1b2c3d4e5f6",
  "status": "running",
  "pagesCrawled": 3,
  "maxPages": 10
}
```

### Response (Completed)

```json
{
  "success": true,
  "jobId": "job_a1b2c3d4e5f6",
  "status": "completed",
  "results": [
    {
      "url": "https://example.com",
      "content": "..."
    },
    {
      "url": "https://example.com/about",
      "content": "..."
    }
  ]
}
```

## Polling Example (Python)

```python
import requests
import time

# 1. Start job
res = requests.post("http://localhost:3000/v1/crawl", json={
    "url": "https://docs.docker.com",
    "maxPages": 5
}).json()

job_id = res["jobId"]
print(f"Started job: {job_id}")

# 2. Poll loop
while True:
    status_res = requests.get(f"http://localhost:3000/v1/crawl/{job_id}").json()
    status = status_res["status"]
    
    if status == "completed":
        print(f"Done! Crawled {len(status_res['results'])} pages.")
        break
    elif status == "failed":
        print("Crawl failed!")
        break
        
    print(f"Status: {status}... waiting 2 seconds")
    time.sleep(2)
```
