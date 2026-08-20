import { TOOLS } from './catalog.js';

const BASE_PATH = '/Officetools/';
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const categories = ['전체', ...new Set(TOOLS.map((tool) => tool.category))];
let activeCategory = '전체';
let query = '';

function getRecent() {
  try { return JSON.parse(localStorage.getItem('officetools:recent') || '[]'); }
  catch { return []; }
}
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('officetools:favorites') || '[]'); }
  catch { return []; }
}
function saveFavorites(items) {
  try { localStorage.setItem('officetools:favorites', JSON.stringify(items)); }
  catch {}
}

const recentSlugs = getRecent();
const favorites = new Set(getFavorites());
const featuredIds = [56, 17, 21, 31, 49, 71, 82, 97];

function toolUrl(tool) { return `${BASE_PATH}tools/${tool.slug}/`; }
function card(tool, label) {
  return `<a class="desk-card" href="${toolUrl(tool)}"><small>${escapeHtml(label)} · TOOL-${String(tool.id).padStart(3,'0')}</small><strong>${escapeHtml(tool.title)}</strong><span>${escapeHtml(tool.description)}</span></a>`;
}

function renderPage() {
  const recentTools = recentSlugs.map((slug) => TOOLS.find((tool) => tool.slug === slug)).filter(Boolean).slice(0, 4);
  const deskTools = recentTools.length >= 2 ? recentTools : featuredIds.slice(0,4).map((id) => TOOLS.find((tool) => tool.id === id));
  document.body.innerHTML = `<div class="shell"><header class="topbar"><a class="brand" href="${BASE_PATH}">OFFICETOOLS</a><nav class="topnav"><a href="#directory">100개 도구</a><a href="#privacy">로컬 처리</a><span>NO SIGN-UP</span></nav></header><section class="hero"><div class="hero-copy"><div class="eyebrow">BROWSER OFFICE UTILITY INDEX · 2026</div><h1>반복 업무를<br><em>한 화면에서</em><br>끝냅니다.</h1><p>텍스트 정리, 회의 문서, 프로젝트 계획, 시간 계산, 재무 지표, CSV 변환, 인사 문서, 개발 유틸리티까지. 입력값은 외부 서버로 전송하지 않고 브라우저에서 처리합니다.</p><div class="hero-count"><b>100</b>INDEPENDENT OFFICE TOOLS</div></div><aside class="desk"><h2>${recentTools.length ? '최근 사용한 업무 도구' : '먼저 써볼 업무 도구'}</h2><div class="desk-grid">${deskTools.map((tool,index) => card(tool, recentTools.length ? 'RECENT' : ['CALCULATE','DOCUMENT','REPORT','PLAN'][index])).join('')}</div><div class="privacy-note" id="privacy"><strong>개인정보·업무 내용 로컬 처리</strong><br>모든 계산과 문서 생성은 현재 브라우저에서 실행됩니다. 로그인과 외부 API가 필요하지 않습니다.</div></aside></section><main class="directory" id="directory"><div class="directory-head"><h2>업무 도구<br><span>100개 색인</span></h2><div class="search-box"><label for="search">SEARCH BY TASK, TITLE OR CATEGORY</label><input class="search" id="search" type="search" placeholder="예: 회의록, 백분율, CSV, 장애 회고"></div></div><div class="tabs" id="tabs"></div><div class="index-head"><span>NO.</span><span>도구</span><span>업무 영역</span><span>무엇을 처리하나</span><span></span></div><div id="tool-list"></div><div class="summary-grid" id="summary"></div></main><footer class="footer"><span>OFFICETOOLS · 100 browser-based office utilities</span><span>입력값은 현재 브라우저 안에서 처리됩니다.</span></footer></div>`;
}

function renderTabs() {
  $('#tabs').innerHTML = categories.map((category) => `<button type="button" class="tab ${category === activeCategory ? 'on' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    renderTabs();
    renderList();
  }));
}

function renderList() {
  const normalized = query.trim().toLowerCase();
  const filtered = TOOLS.filter((tool) => {
    const categoryMatch = activeCategory === '전체' || tool.category === activeCategory;
    const text = `${tool.title} ${tool.description} ${tool.category} ${tool.slug}`.toLowerCase();
    return categoryMatch && (!normalized || text.includes(normalized));
  });
  $('#tool-list').innerHTML = filtered.length ? filtered.map((tool) => `<a class="tool-row" href="${toolUrl(tool)}"><span class="tool-no">TOOL-${String(tool.id).padStart(3,'0')}</span><h3>${escapeHtml(tool.title)}${favorites.has(tool.slug) ? ' ★' : ''}</h3><span class="tool-cat">${escapeHtml(tool.category)}</span><p>${escapeHtml(tool.description)}</p><span class="tool-open">열기 →</span></a>`).join('') : '<div class="empty">검색 조건에 맞는 업무 도구가 없습니다.</div>';
}

function renderSummary() {
  const counts = categories.filter((category) => category !== '전체').map((category) => [category, TOOLS.filter((tool) => tool.category === category).length]);
  $('#summary').innerHTML = counts.map(([category,count]) => `<div class="summary"><b>${count}</b><span>${escapeHtml(category)}</span></div>`).join('');
}

renderPage();
renderTabs();
renderList();
renderSummary();
$('#search').addEventListener('input', (event) => { query = event.target.value; renderList(); });
