import config from '../site.config.js';
import { initSearch } from './search.js';

const article = document.getElementById('article');
const loading = document.getElementById('loading');
const sidebarNav = document.getElementById('sidebar-nav');
const readingProgress = document.getElementById('reading-progress');
const content = document.getElementById('content');
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const themeToggle = document.getElementById('theme-toggle');
const searchTrigger = document.getElementById('search-trigger');
const searchModal = document.getElementById('search-modal');
const searchBackdrop = document.getElementById('search-backdrop');

function buildSidebar() {
  sidebarNav.innerHTML = '';
  config.nav.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'nav-group';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'nav-group-label';
    labelEl.textContent = group.title;
    groupEl.appendChild(labelEl);
    
    const ulEl = document.createElement('ul');
    group.items.forEach(item => {
      const liEl = document.createElement('li');
      const aEl = document.createElement('a');
      aEl.className = 'nav-item';
      aEl.href = item.external ? item.path : `/#/${item.path}`;
      if (item.external) aEl.target = '_blank';
      aEl.dataset.path = item.path;
      
      let html = item.title;
      if (item.badge) {
        html += ` <span class="badge-${item.badge.toLowerCase()}">${item.badge}</span>`;
      }
      aEl.innerHTML = html;
      
      liEl.appendChild(aEl);
      ulEl.appendChild(liEl);
    });
    
    groupEl.appendChild(ulEl);
    sidebarNav.appendChild(groupEl);
  });
}

function updateActiveNav(path) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.path === path) {
      el.classList.add('active');
    }
  });
}

function addHeadingAnchors() {
  const headings = article.querySelectorAll('h1, h2, h3, h4');
  headings.forEach(h => {
    if (!h.id) {
      h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const anchor = document.createElement('a');
    anchor.className = 'anchor';
    anchor.href = `#${h.id}`;
    anchor.textContent = '#';
    h.insertBefore(anchor, h.firstChild);
  });
}

async function loadPage(path) {
  article.style.opacity = '0';
  loading.classList.remove('hidden');
  
  try {
    const res = await fetch(`content/${path}.md`);
    if (!res.ok) throw new Error('Page not found');
    const md = await res.text();
    
    article.innerHTML = marked.parse(md);
    
    hljs.highlightAll();
    addHeadingAnchors();
    updateActiveNav(path);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      hamburger.classList.remove('open');
      overlay.style.display = 'none';
    }
    
    content.scrollTop = 0;
  } catch (err) {
    article.innerHTML = `<h1>Page not found</h1><p>Sorry, we couldn't find the page you were looking for.</p>`;
  } finally {
    loading.classList.add('hidden');
    article.style.animation = 'none';
    article.offsetHeight; // trigger reflow
    article.style.animation = 'fadeIn 0.4s ease forwards';
    article.style.opacity = '1';
  }
}

function setupReadingProgress() {
  content.addEventListener('scroll', () => {
    const scrollHeight = content.scrollHeight - content.clientHeight;
    const progress = scrollHeight > 0 ? (content.scrollTop / scrollHeight) * 100 : 0;
    readingProgress.style.width = `${progress}%`;
  });
}

function setupTheme() {
  const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', saved);
  
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

function setupMobileNav() {
  const toggle = () => {
    sidebar.classList.toggle('open');
    hamburger.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      overlay.style.display = 'block';
      setTimeout(() => overlay.style.opacity = '1', 10);
    } else {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 300);
    }
  };
  
  hamburger.addEventListener('click', toggle);
  overlay.addEventListener('click', toggle);
}

function handleHashChange() {
  let hash = location.hash.replace('#/', '') || 'introduction';
  if (hash.includes('?')) hash = hash.split('?')[0];
  if (hash.includes('#')) hash = hash.split('#')[0]; // internal anchor
  loadPage(hash);
}

document.addEventListener('DOMContentLoaded', () => {
  marked.setOptions({ gfm: true, breaks: true });
  
  buildSidebar();
  setupTheme();
  setupMobileNav();
  setupReadingProgress();
  initSearch();
  
  window.addEventListener('hashchange', handleHashChange);
  
  if (!location.hash || location.hash === '#') {
    location.hash = '#/introduction';
  } else {
    handleHashChange();
  }
});
