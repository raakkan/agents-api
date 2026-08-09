import config from '../site.config.js';

let searchIndex = [];
let indexBuilt = false;

const modal = document.getElementById('search-modal');
const trigger = document.getElementById('search-trigger');
const close = document.getElementById('search-close');
const backdrop = document.getElementById('search-backdrop');
const input = document.getElementById('search-input');
const resultsEl = document.getElementById('search-results');

async function buildIndex() {
  if (indexBuilt) return;
  const paths = [];
  config.nav.forEach(group => {
    group.items.forEach(item => {
      if (!item.external) paths.push(item);
    });
  });
  
  searchIndex = await Promise.all(paths.map(async item => {
    try {
      const res = await fetch(`content/${item.path}.md`);
      if (!res.ok) return null;
      const text = await res.text();
      return { path: item.path, title: item.title, text: text.toLowerCase() };
    } catch {
      return null;
    }
  }));
  searchIndex = searchIndex.filter(Boolean);
  indexBuilt = true;
}

function openSearch() {
  modal.classList.add('open');
  input.focus();
  buildIndex();
}

function closeSearch() {
  modal.classList.remove('open');
  input.value = '';
  resultsEl.innerHTML = '';
}

function performSearch(query) {
  if (!query.trim()) {
    resultsEl.innerHTML = '';
    return;
  }
  
  const q = query.toLowerCase();
  const results = [];
  
  for (const item of searchIndex) {
    const titleMatch = item.title.toLowerCase().includes(q);
    const textMatch = item.text.indexOf(q);
    
    if (titleMatch || textMatch !== -1) {
      let excerpt = '';
      if (textMatch !== -1) {
        const start = Math.max(0, textMatch - 40);
        const end = Math.min(item.text.length, textMatch + 80);
        excerpt = '...' + item.text.substring(start, end).replace(/[\n\r]+/g, ' ') + '...';
      } else {
        excerpt = 'Matches title';
      }
      
      results.push({
        path: item.path,
        title: item.title,
        excerpt
      });
    }
  }
  
  renderResults(results.slice(0, 5));
}

function renderResults(results) {
  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="search-result-empty">No results found</div>';
    return;
  }
  
  resultsEl.innerHTML = results.map((res, i) => `
    <a href="#/${res.path}" class="search-result-item ${i === 0 ? 'selected' : ''}" onclick="document.getElementById('search-modal').classList.remove('open')">
      <div class="search-result-title">${res.title}</div>
      <div class="search-result-excerpt">${res.excerpt}</div>
    </a>
  `).join('');
}

export function initSearch() {
  trigger.addEventListener('click', openSearch);
  close.addEventListener('click', closeSearch);
  backdrop.addEventListener('click', closeSearch);
  
  window.addEventListener('keydown', e => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      modal.classList.contains('open') ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeSearch();
    }
  });
  
  let timeout;
  input.addEventListener('input', e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => performSearch(e.target.value), 200);
  });
}
