import { TEMPLATES, PLANS } from './templates.js';
import { DESIGN_PACKS, designPackFor } from './design-packs.js';
import { renderPreview } from './preview-renderers.js';

const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
const $$ = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const deep = (value) => JSON.parse(JSON.stringify(value));
const templateFor = (id) => TEMPLATES.find((template) => template.id === id) || TEMPLATES[0];
const STORAGE = 'launch100:mvp:v2';
const LEGACY_STORAGE = 'launch100:mvp:v1';

let state = defaults();
let step = 0;
let filter = 'all';
let search = '';
let previewFrame = 0;
let saveTimer = 0;

function defaults(template = TEMPLATES[0]) {
  const pack = designPackFor(template.id);
  return {
    templateId: template.id,
    ...deep(template.d),
    services: template.d.services.map(([name, description, price]) => ({ name, description, price })),
    primary: template.p[0],
    secondary: template.p[1],
    background: template.p[2],
    ink: template.p[3],
    font: pack.defaultFont,
    imageMood: pack.traits[0],
    plan: 'business',
    customerName: '',
    customerEmail: '',
    gaId: '',
    clarityId: '',
    domain: ''
  };
}

function announce(message) {
  const live = $('#live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

function encode(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decode(value) {
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function safeShareState() {
  const { customerName, customerEmail, gaId, clarityId, lastOrder, ...safe } = state;
  return safe;
}

function normalizeState(candidate) {
  const template = templateFor(candidate?.templateId);
  const base = defaults(template);
  const merged = { ...base, ...(candidate || {}) };
  merged.services = Array.isArray(candidate?.services) && candidate.services.length
    ? candidate.services.slice(0, 6).map((item) => ({
        name: String(item?.name || ''),
        description: String(item?.description || ''),
        price: String(item?.price || '')
      }))
    : base.services;
  if (!DESIGN_PACKS[merged.templateId]) merged.templateId = TEMPLATES[0].id;
  return merged;
}

function load() {
  const params = new URLSearchParams(location.search);
  const shared = decode(params.get('preview') || '');
  if (shared) {
    state = normalizeState(shared);
    document.body.classList.add('shared-mode');
    return;
  }

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE) || localStorage.getItem(LEGACY_STORAGE) || 'null');
  } catch {
    saved = null;
  }
  state = normalizeState(saved);

  const requestedTemplate = params.get('template');
  if (requestedTemplate && DESIGN_PACKS[requestedTemplate]) {
    const preserved = {
      plan: state.plan,
      customerName: state.customerName,
      customerEmail: state.customerEmail,
      gaId: state.gaId,
      clarityId: state.clarityId,
      domain: state.domain
    };
    state = { ...defaults(templateFor(requestedTemplate)), ...preserved };
  }
}

function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* storage is optional */ }
  const status = $('#save-status');
  if (!status) return;
  status.textContent = '이 브라우저에 저장됨';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { status.textContent = '자동 저장 중'; }, 1200);
}

function ensureDesignPackStyles() {
  if (document.querySelector('link[data-launch100-design-packs]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './assets/design-packs.css';
  link.dataset.launch100DesignPacks = 'true';
  document.head.appendChild(link);
}

function packBadges(pack) {
  return pack.traits.slice(0, 2).map((trait) => `<i>${esc(trait)}</i>`).join('');
}

function galleryCard(template) {
  const pack = designPackFor(template.id);
  return `<article class="template-card" data-template-card="${template.id}" data-design-pack="${pack.id}" style="--card-bg:${template.p[2]};--card-ink:${template.p[3]};--card-accent:${template.p[0]};--card-secondary:${template.p[1]}">
    <div class="template-thumb pack-${pack.thumb}">
      <span>WORLD ${template.n} · ${esc(template.industry)}</span>
      <b>${esc(template.name)}</b>
      <i class="pack-art" aria-hidden="true"></i>
      <em class="pack-label">${esc(pack.label)}</em>
    </div>
    <div class="template-meta">
      <span>${esc(template.mood)}</span>
      <h3>${esc(template.name)}</h3>
      <p>${esc(template.desc)}</p>
      <div class="pack-signature">${packBadges(pack)}</div>
      <button type="button" data-use-template="${template.id}">이 디자인으로 만들기</button>
    </div>
  </article>`;
}

function renderGallery() {
  const gallery = $('#template-gallery');
  if (!gallery) return;
  const query = search.toLowerCase();
  const list = TEMPLATES.filter((template) => {
    const pack = designPackFor(template.id);
    const matchesFilter = filter === 'all' || template.cat === filter;
    const haystack = `${template.name} ${template.industry} ${template.mood} ${pack.KoreanLabel} ${pack.traits.join(' ')}`.toLowerCase();
    return matchesFilter && (!query || haystack.includes(query));
  });
  gallery.innerHTML = list.map(galleryCard).join('') || '<p>조건에 맞는 디자인이 없습니다.</p>';
}

function builderTemplateButton(template) {
  const pack = designPackFor(template.id);
  return `<button type="button" class="builder-template" data-select-template="${template.id}" data-pack="${pack.thumb}" aria-pressed="${state.templateId === template.id}" style="--c1:${template.p[0]};--c2:${template.p[1]}">
    <i aria-hidden="true"></i>
    <span>WORLD ${template.n} · ${esc(template.industry)}</span>
    <b>${esc(template.name)}</b>
    <small>${esc(template.mood)}</small>
    <em class="builder-pack">${esc(pack.KoreanLabel)} · ${esc(pack.sections.slice(0, 2).join(' / '))}</em>
  </button>`;
}

function renderBuilderTemplates() {
  const container = $('#builder-templates');
  if (!container) return;
  const query = search.toLowerCase();
  const list = TEMPLATES.filter((template) => {
    const pack = designPackFor(template.id);
    return !query || `${template.name} ${template.industry} ${template.mood} ${pack.KoreanLabel}`.toLowerCase().includes(query);
  });
  container.innerHTML = list.map(builderTemplateButton).join('');
}

function renderPlans() {
  const grid = $('#plan-grid');
  if (!grid) return;
  grid.innerHTML = PLANS.map((plan) => `<button type="button" class="plan-card" data-plan="${plan.id}" aria-pressed="${state.plan === plan.id}">
    <span>${plan.name.toUpperCase()}</span><strong>${plan.price.toLocaleString()}원</strong><p>${plan.desc}</p><ul>${plan.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
  </button>`).join('');
}

function renderServices() {
  const editor = $('#service-editor');
  if (!editor) return;
  editor.innerHTML = state.services.map((service, index) => `<div class="service-row" data-service="${index}">
    <input data-service-field="name" value="${esc(service.name)}" placeholder="서비스 이름" aria-label="${index + 1}번째 서비스 이름">
    <textarea data-service-field="description" rows="1" placeholder="짧은 설명" aria-label="${index + 1}번째 서비스 설명">${esc(service.description)}</textarea>
    <input data-service-field="price" value="${esc(service.price)}" placeholder="가격·기간" aria-label="${index + 1}번째 서비스 가격">
    <button class="remove-service" type="button" data-remove-service="${index}" aria-label="${index + 1}번째 서비스 삭제">×</button>
  </div>`).join('');
}

function syncFields() {
  $$('[name]').forEach((element) => {
    if (state[element.name] !== undefined) element.value = state[element.name];
  });
  renderServices();
  renderPlans();
  renderBuilderTemplates();
}

function updateTemplateQuery(id) {
  if (document.body.classList.contains('shared-mode')) return;
  const url = new URL(location.href);
  url.searchParams.delete('preview');
  url.searchParams.set('template', id);
  history.replaceState(null, '', `${url.pathname}${url.search}${location.hash || ''}`);
}

function selectTemplate(id, reset = true) {
  const template = templateFor(id);
  const preserved = {
    plan: state.plan,
    customerName: state.customerName,
    customerEmail: state.customerEmail,
    gaId: state.gaId,
    clarityId: state.clarityId,
    domain: state.domain
  };
  state = reset
    ? { ...defaults(template), ...preserved }
    : { ...state, templateId: id, primary: template.p[0], secondary: template.p[1], background: template.p[2], ink: template.p[3], font: designPackFor(id).defaultFont };
  syncFields();
  renderGallery();
  schedulePreview();
  updateTemplateQuery(id);
  save();
  announce(`${template.name}의 ${designPackFor(id).KoreanLabel} 디자인을 선택했습니다.`);
}

function showStep(next, shouldScroll = true) {
  step = Math.max(0, Math.min(4, next));
  $$('.step-panel').forEach((panel, index) => panel.classList.toggle('active', index === step));
  $$('[data-step-go]').forEach((button, index) => {
    button.classList.toggle('active', index === step);
    button.setAttribute('aria-current', index === step ? 'step' : 'false');
  });
  const titles = ['디자인 선택', '사업 정보', '서비스·상품', '브랜드 스타일', '요금제·주문'];
  $('#step-counter').textContent = `STEP ${step + 1} / 5`;
  $('#step-title').textContent = titles[step];
  $('#prev-step').disabled = step === 0;
  $('#next-step').textContent = step === 4 ? '처음으로' : '다음 단계';
  if (shouldScroll) $('#builder')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function previewHTML() {
  return renderPreview(state, templateFor(state.templateId));
}

function updatePreview() {
  const frame = $('#preview-frame');
  if (!frame) return;
  const template = templateFor(state.templateId);
  const pack = designPackFor(template.id);
  frame.srcdoc = previewHTML();
  $('#preview-name').textContent = state.businessName || '브랜드명';
  $('#preview-template').textContent = `${template.name} · ${pack.KoreanLabel}`;
  $('#preview-name').title = `${template.name} / ${pack.signature}`;
  document.body.dataset.activeDesignPack = pack.id;
}

function schedulePreview() {
  cancelAnimationFrame(previewFrame);
  previewFrame = requestAnimationFrame(updatePreview);
}

function orderText() {
  const plan = PLANS.find((item) => item.id === state.plan) || PLANS[1];
  const template = templateFor(state.templateId);
  const pack = designPackFor(template.id);
  const number = `L100-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return {
    no: number,
    text: `Launch100 테스트 주문서\n주문번호: ${number}\n생성일: ${new Date().toLocaleString('ko-KR')}\n\n[선택 디자인]\n${template.name} · ${template.industry}\n디자인 팩: ${pack.KoreanLabel}\n구조: ${pack.sections.join(' → ')}\n특징: ${pack.traits.join(', ')}\n\n[사업 정보]\n상호: ${state.businessName}\n소개: ${state.tagline}\n주소: ${state.address}\n전화: ${state.phone}\n이메일: ${state.email}\n운영: ${state.weekdayHours} / ${state.weekendHours}\n\n[서비스]\n${state.services.map((service, index) => `${index + 1}. ${service.name} · ${service.price}\n   ${service.description}`).join('\n')}\n\n[브랜드]\n강조색: ${state.primary}\n보조색: ${state.secondary}\n글꼴: ${state.font}\n이미지: ${state.imageMood}\n\n[요금제]\n${plan.name} · ${plan.price.toLocaleString()}원\n${plan.items.map((item) => `- ${item}`).join('\n')}\n\n[담당자]\n${state.customerName || '-'}\n${state.customerEmail || '-'}\n희망 도메인: ${state.domain || '-'}\nGA4: ${state.gaId || '-'}\nClarity: ${state.clarityId || '-'}\n\n※ 결제가 발생하지 않은 MVP 테스트 주문입니다.`
  };
}

function download(name, text, type = 'text/plain') {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text], { type }));
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function share() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('preview', encode(safeShareState()));
  url.hash = 'builder';
  $('#share-url').value = url.href;
  $('#share-dialog').showModal();
  return url.href;
}

function bindFilters() {
  $$('.template-filters button').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      $$('.template-filters button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderGallery();
    });
  });
}

function bindDocumentClicks() {
  document.addEventListener('click', (event) => {
    const use = event.target.closest('[data-use-template]');
    if (use) {
      selectTemplate(use.dataset.useTemplate);
      showStep(1);
      return;
    }
    const pick = event.target.closest('[data-select-template]');
    if (pick) {
      selectTemplate(pick.dataset.selectTemplate);
      return;
    }
    const plan = event.target.closest('[data-plan]');
    if (plan) {
      state.plan = plan.dataset.plan;
      renderPlans();
      save();
      return;
    }
    const remove = event.target.closest('[data-remove-service]');
    if (remove && state.services.length > 1) {
      state.services.splice(Number(remove.dataset.removeService), 1);
      renderServices();
      schedulePreview();
      save();
      return;
    }
    const go = event.target.closest('[data-step-go]');
    if (go) {
      showStep(Number(go.dataset.stepGo));
      return;
    }
    const openBuilder = event.target.closest('[data-open-builder]');
    if (openBuilder) {
      showStep(0);
      return;
    }
  });
}

function bindInputs() {
  $('#template-search').addEventListener('input', (event) => {
    search = event.target.value.trim();
    renderBuilderTemplates();
    renderGallery();
  });
  document.addEventListener('input', (event) => {
    const element = event.target;
    if (element.name && state[element.name] !== undefined) {
      state[element.name] = element.value;
      schedulePreview();
      save();
    }
    const row = element.closest?.('[data-service]');
    if (row && element.dataset.serviceField) {
      state.services[Number(row.dataset.service)][element.dataset.serviceField] = element.value;
      schedulePreview();
      save();
    }
  });
}

function bindActions() {
  $('#add-service').addEventListener('click', () => {
    if (state.services.length >= 6) return announce('서비스는 최대 6개까지 추가할 수 있습니다.');
    state.services.push({ name: '새 서비스', description: '서비스 설명을 입력하세요.', price: '가격 문의' });
    renderServices();
    schedulePreview();
    save();
  });

  $('#reset-theme').addEventListener('click', () => {
    const template = templateFor(state.templateId);
    const pack = designPackFor(template.id);
    [state.primary, state.secondary, state.background, state.ink] = template.p;
    state.font = pack.defaultFont;
    state.imageMood = pack.traits[0];
    syncFields();
    schedulePreview();
    save();
  });

  $('#prev-step').addEventListener('click', () => showStep(step - 1));
  $('#next-step').addEventListener('click', () => showStep(step === 4 ? 0 : step + 1));

  $$('[data-device]').forEach((button) => {
    button.addEventListener('click', () => {
      $$('[data-device]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      $('#preview-shell').className = `preview-shell ${button.dataset.device}`;
    });
  });

  $('#open-preview').addEventListener('click', () => {
    const popup = window.open('', '_blank');
    if (!popup) return announce('팝업 차단을 해제한 뒤 다시 시도하세요.');
    popup.document.open();
    popup.document.write(previewHTML());
    popup.document.close();
  });

  $('#create-order').addEventListener('click', () => {
    const order = orderText();
    $('#order-number').textContent = order.no;
    $('#order-summary').textContent = order.text;
    $('#order-result').hidden = false;
    $('#order-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    state.lastOrder = order;
    save();
  });

  $('#copy-order').addEventListener('click', async () => {
    await copyText($('#order-summary').textContent);
    announce('주문 초안을 복사했습니다.');
  });
  $('#download-order').addEventListener('click', () => download('launch100-order.txt', $('#order-summary').textContent));
  $('#download-config').addEventListener('click', () => download('launch100-site-config.json', JSON.stringify(state, null, 2), 'application/json'));
  $('#share-preview').addEventListener('click', share);
  $$('[data-share-preview]').forEach((button) => button.addEventListener('click', share));
  $('#copy-share').addEventListener('click', async () => {
    await copyText($('#share-url').value);
    announce('공유 주소를 복사했습니다.');
  });
  $('#share-dialog').addEventListener('click', (event) => {
    if (event.target === $('#share-dialog')) $('#share-dialog').close();
  });
}

function boot() {
  ensureDesignPackStyles();
  load();
  renderGallery();
  syncFields();
  updatePreview();
  showStep(0, false);

  if (document.body.classList.contains('shared-mode')) {
    $('#preview-shell').className = 'preview-shell desktop';
    return;
  }

  bindFilters();
  bindDocumentClicks();
  bindInputs();
  bindActions();
  save();
}

boot();
