# Screenshot API ✨

Capture high-quality, pixel-perfect screenshots of any webpage. The `/v1/screenshot` endpoint handles complex layouts, infinite scrolling, and lazy-loaded images.

## Request

**Endpoint:** `POST /v1/screenshot`  
**Content-Type:** `application/json`

### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The target URL to screenshot |
| `fullPage` | boolean| No | `true` | Capture the entire scrollable page |
| `darkMode` | boolean| No | `false` | Emulate `prefers-color-scheme: dark` |
| `mobile` | boolean| No | `false` | Emulate mobile device viewport and user-agent |
| `width` | number | No | `1920` | Viewport width |
| `height` | number | No | `1080` | Viewport height |

## Response

The endpoint returns a base64 encoded string of the JPEG image.

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "image": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsNDw8PBwg... (base64 string)"
  }
}
```

## How to use the output

### Saving to a file (Python)

```python
import requests
import base64

response = requests.post(
    "http://localhost:3000/v1/screenshot",
    json={"url": "https://github.com", "darkMode": True}
)

img_data = response.json()["data"]["image"]
with open("screenshot.jpg", "wb") as f:
    f.write(base64.b64decode(img_data))
```

### Displaying in HTML

You can directly embed the base64 string in an HTML `<img>` tag:

```html
<img src="data:image/jpeg;base64,/9j/4AAQ..." alt="Screenshot">
```

### cURL

```bash
curl -X POST http://localhost:3000/v1/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://apple.com", "fullPage": true}'
```
