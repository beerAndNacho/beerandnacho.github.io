import { TOOLS, CATEGORIES } from './catalog.js';

const e = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const $ = (selector) => document.querySelector(selector);
const featuredIds = [1,2,4,11,26,32,41,51,63,73,84,99,100];
let category = '전체';
let query = '';

function storageList(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function remember(slug) {
  const old = storageList('sellertools:recent');
  try { localStorage.setItem('sellertools:recent', JSON.stringify([slug, ...old.filter((x) => x !== slug)].slice(0, 10))); } catch {}
}
function findTools(slugs) { return slugs.map((slug) => TOOLS.find((tool) => tool.slug === slug)).filter(Boolean); }

const categoryCopy = {
  '가격·마진':'판매가·원가·수수료·배송비를 실제 순이익으로 연결합니다.',
  '광고·프로모션':'ROAS·CPC·쿠폰·라이브커머스를 손익 기준으로 비교합니다.',
  '상품등록':'상품명·상세페이지·FAQ의 정보 누락과 구매 흐름을 정리합니다.',
  '상품데이터':'옵션·SKU·CSV·바코드 데이터를 반복 작업에 맞게 정돈합니다.',
  '이미지·콘텐츠':'상품 이미지와 콘텐츠 제작 지시를 브라우저에서 처리합니다.',
  '재고·발주':'안전재고·품절일·발주량·공급처를 판매 속도와 연결합니다.',
  '주문·배송':'포장 원가·박스·송장·피킹·배송 안내를 출고 흐름에 맞춥니다.',
  '교환·CS':'교환·반품·오배송·문의 응대를 사실과 다음 조치 중심으로 기록합니다.',
  '리뷰·고객':'리뷰·재구매·휴면·등급·LTV를 고객 유지 활동으로 연결합니다.',
  '매출·운영':'매출·광고·재고·현금흐름을 함께 보고 다음 행동을 선택합니다.'
};

document.body.innerHTML = `<div class="portal">
<header class="site-header"><a class="brand" href="/SellerTools/"><i></i>SellerTools</a><nav><a href="#featured">추천 도구</a><a href="#catalog">100개 도구</a><a href="https://github.com/beerAndNacho/SellerTools">GitHub</a></nav></header>
<section class="portal-hero"><div class="hero-copy"><div class="eyebrow">SELLER OPERATIONS INDEX · 001—100</div><h1>판매를<br><em>숫자와</em><br>문서로.</h1><p>판매 전 가격 계산부터 상품등록, 광고, 재고, 배송, 고객응대, 주간 보고까지. 입력 데이터는 외부 서버가 아니라 현재 브라우저에서 처리합니다.</p><div class="hero-stats"><div><b>100</b><span>독립 도구</span></div><div><b>10</b><span>판매 업무 영역</span></div><div><b>0</b><span>필수 로그인</span></div></div></div><div class="hero-guide"><div class="guide-label">어디서부터 시작할까?</div><h2>지금 해결할 업무를 선택하세요.</h2><div class="category-cards">${CATEGORIES.map((name) => `<button type="button" data-guide="${e(name)}"><strong>${e(name)}</strong><span>${e(categoryCopy[name])}</span></button>`).join('')}</div></div></section>
<section class="recent-section" id="recent"><div><span>RECENT</span><h2>최근 사용</h2></div><div id="recentList" class="recent-list"></div></section>
<section class="featured" id="featured"><div class="section-head"><div><span>START HERE</span><h2>먼저 써볼 핵심 도구</h2></div><p>매출보다 실제 이익과 운영 행동으로 이어지는 도구를 먼저 배치했습니다.</p></div><div id="featuredList" class="featured-list"></div></section>
<main class="catalog" id="catalog"><div class="catalog-head"><div><span>MASTER INDEX</span><h2>셀러 업무 도구 100</h2></div><label class="search"><span>SEARCH</span><input id="search" type="search" placeholder="예: 마진, 상세페이지, 재고, 반품"></label></div><div id="tabs" class="tabs"></div><div class="index-head"><span>NO.</span><span>도구</span><span>업무</span><span>무엇을 처리하나</span><span></span></div><div id="toolList"></div></main>
<footer class="site-footer"><span>SellerTools 100 · 입력 데이터는 현재 브라우저에서 처리됩니다.</span><a href="/SellerTools/sitemap.xml">Sitemap</a></footer>
</div>`;

function link(tool, source) {
  return `/SellerTools/tools/${tool.slug}/?from=${source}`;
}
function featuredCard(tool) {
  return `<a class="featured-card" href="${link(tool,'featured')}" data-slug="${e(tool.slug)}"><span>TOOL-${String(tool.id).padStart(3,'0')} · ${e(tool.category)}</span><h3>${e(tool.title)}</h3><p>${e(tool.description)}</p><b>도구 열기 →</b></a>`;
}
function renderFeatured() {
  const tools = featuredIds.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean).slice(0, 8);
  $('#featuredList').innerHTML = tools.map(featuredCard).join('');
  bindLinks('#featuredList a');
}
function renderRecent() {
  const tools = findTools(storageList('sellertools:recent'));
  const section = $('#recent');
  section.classList.toggle('visible', tools.length > 0);
  $('#recentList').innerHTML = tools.map((tool) => `<a href="${link(tool,'recent')}" data-slug="${e(tool.slug)}">${e(tool.title)}</a>`).join('');
  bindLinks('#recentList a');
}
function renderTabs() {
  const names = ['전체', ...CATEGORIES];
  $('#tabs').innerHTML = names.map((name) => `<button type="button" class="${name === category ? 'active' : ''}" data-category="${e(name)}">${e(name)}</button>`).join('');
  document.querySelectorAll('[data-category]').forEach((button) => {
    button.onclick = () => { category = button.dataset.category; renderTabs(); renderList(); };
  });
}
function renderList() {
  const needle = query.trim().toLowerCase();
  const tools = TOOLS.filter((tool) => (category === '전체' || tool.category === category) && (!needle || `${tool.title} ${tool.description} ${tool.category} ${(tool.tags || []).join(' ')}`.toLowerCase().includes(needle)));
  $('#toolList').innerHTML = tools.length ? tools.map((tool) => `<a class="tool-row" href="${link(tool,'catalog')}" data-slug="${e(tool.slug)}"><span class="tool-no">${String(tool.id).padStart(3,'0')}</span><h3>${e(tool.title)}</h3><span class="tool-category">${e(tool.category)}</span><p>${e(tool.description)}</p><span class="tool-go">OPEN →</span></a>`).join('') : '<div class="empty-state">조건에 맞는 도구가 없습니다.</div>';
  bindLinks('#toolList a');
}
function bindLinks(selector) {
  document.querySelectorAll(selector).forEach((anchor) => anchor.onclick = () => remember(anchor.dataset.slug));
}

document.querySelectorAll('[data-guide]').forEach((button) => {
  button.onclick = () => {
    category = button.dataset.guide;
    renderTabs(); renderList();
    $('#catalog').scrollIntoView({behavior:'smooth'});
  };
});
$('#search').oninput = (event) => { query = event.target.value; renderList(); };

renderFeatured();
renderRecent();
renderTabs();
renderList();
