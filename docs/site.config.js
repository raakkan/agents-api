export default {
  name: 'agent-api',
  tagline: 'Open-source web scraper, crawler & screenshot API',
  version: '1.0.0',
  api: { local: 'http://localhost:3000' },
  nav: [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', path: 'introduction' },
        { title: 'Docker Setup', path: 'docker' },
      ]
    },
    {
      title: 'API Reference',
      items: [
        { title: 'Scrape', path: 'scrape' },
        { title: 'Screenshot', path: 'screenshot', badge: 'New' },
        { title: 'Crawl', path: 'crawl' },
        { title: 'Map', path: 'map' },
        { title: 'Search', path: 'search' },
      ]
    },
    {
      title: 'Resources',
      items: [
        { title: 'OpenAPI Spec', path: 'openapi.json', external: true },
        { title: 'Health Check', path: 'health', external: true },
      ]
    }
  ]
};
