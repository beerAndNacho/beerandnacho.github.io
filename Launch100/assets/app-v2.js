import { TEMPLATES, PLANS } from './templates.js';
import {
  DESIGN_MANIFEST,
  renderPreviewDocument,
  renderTemplateThumbnail
} from './preview-renderers.js';

const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
const $$ = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
const clone = (value) => JSON.parse(JSON.stringify(value));
const templateById = (id) => TEMPLATES.find((template) => template.id === id) || TEMPLATES[0];
const storageKeys = ['launch100:mvp:v2', 'launch100:mvp:v1'];

function defaultState(template = TEMPLATES[0]) {
  const design = DESIGN_MANIFEST[template.id];
  return {
    templateId: template.id,
    ...clone(template.d),
    services: template.d.services.map(([name, description, price]) => ({ name, description, price })),
    primary: template.p[0],
    secondary: template.p[1],
    background: template.p[2],
    ink: template.p[3],
    font: design?.defaultFont || 'sans',
    imageMood: '공간과 분위기',
    plan: 'business',
    customerName: '',
    customerEmail: '',
    gaId: '',
    clarityId: '',
    domain: ''
  };
}

let state = defaultState();
let step = 0;
let filter = 'all';
let search = '';
let currentDevice = 'desktop';
let saveTimer = 0;

function announce(message) {
  const live = $('#live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

function encodeState(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeState(value) {
  try {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
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

function saveState() {
  try {
    localStorage.setItem(storageKeys[0], JSON.stringify(state));
  } catch {
    // Storage is optional in private browsing and embedded views.
  }
  const status = $('#save-status');
  if (!status) return;
  status.textContent = '이 브라우저에 저장됨';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { status.textContent = '자동 저장 중'; }, 1200);
}

function loadState() {
  const params = new URLSearchParams(location.search);
  const shared = decodeState(params.get('preview') || '');
  if (shared?.templateId) {
    state = { ...defaultState(templateById(shared.templateId)), ...shared };
    document.body.classList.add('shared-mode');
    return;
  }

  const requestedTemplate = params.get('template');
  if (requestedTemplate && DESIGN_MANIFEST[requestedTemplate]) {
    state = defaultState(templateById(requestedTemplate));
  }

  for (const key of storageKeys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.templateId) {
        state = { ...defaultState(templateById(saved.templateId)), ...saved };
        return;
      }
    } catch {
      // Try the next storage version.
    }
  }
}

function templateMatches(template) {
  const categoryMatches = filter === 'all' || template.cat === filter;
  const text = `${template.name} ${template.industry} ${template.mood} ${template.desc} ${DESIGN_MANIFEST[template.id]?.name || ''}`.toLowerCase();
  return categoryMatches && (!search || text.includes(search.toLowerCase()));
}

function renderGallery() {
  const gallery = $('#template-gallery');
  if (!gallery) return;
  const templates = TEMPLATES.filter(templateMatches);
  gallery.innerHTML = templates.map((template) => {
    const design = DESIGN_MANIFEST[template.id];
    return `<article class="template-card-v2" style="--card-accent:${template.p[0]}">
      ${renderTemplateThumbnail(template)}
      <div class="template-meta">
        <span>${escapeHtml(template.mood)}</span>
        <h3>${escapeHtml(template.name)}</h3>
        <p>${escapeHtml(template.desc)}</p>
        <i class="design-system-badge">${escapeHtml(design.name)} · ${design.sectionOrder.length} STRUCTURES</i>
        <button type="button" data-use-template="${template.id}">이 디자인으로 만들기</button>
      </div>
    </article>`;
  }).join('') || '<p>조건에 맞는 디자인이 없습니다.</p>';
}

function renderBuilderTemplates() {
  const container = $('#builder-templates');
  if (!container) return;
  const templates = TEMPLATES.filter((template) => {
    if (!search) return true;
    return `${template.name} ${template.industry} ${template.mood} ${DESIGN_MANIFEST[template.id]?.name || ''}`.toLowerCase().includes(search.toLowerCase());
  });
  container.innerHTML = templates.map((template) => {
    const design = DESIGN_MANIFEST[template.id];
    return `<button type="button" class="builder-template-v2" data-select-template="${template.id}" aria-pressed="${state.templateId === template.id}">
      ${renderTemplateThumbnail(template, true)}
      <div><span>WORLD ${template.n} · ${escapeHtml(template.industry)}</span><b>${escapeHtml(template.name)}</b><small>${escapeHtml(design.name)} · ${escapeHtml(design.hero)}</small></div>
    </button>`;
  }).join('');
}

function renderPlans() {
  const container = $('#plan-grid');
  if (!container) return;
  container.innerHTML = PLANS.map((plan) => `<button type="button" class="plan-card" data-plan="${plan.id}" aria-pressed="${state.plan === plan.id}">
    <span>${plan.name.toUpperCase()}</span>
    <strong>${plan.price.toLocaleString()}원</strong>
    <p>${escapeHtml(plan.desc)}</p>
    <ul>${plan.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  </button>`).join('');
}

function renderServices() {
  const container = $('#service-editor');
  if (!container) return;
  container.innerHTML = state.services.map((service, index) => `<div class="service-row" data-service="${index}">
    <input data-service-field="name" value="${escapeHtml(service.name)}" placeholder="서비스 이름" aria-label="${index + 1}번째 서비스 이름">
    <textarea data-service-field="description" rows="1" placeholder="짧은 설명" aria-label="${index + 1}번째 서비스 설명">${escapeHtml(service.description)}</textarea>
    <input data-service-field="price" value="${escapeHtml(service.price)}" placeholder="가격·기간" aria-label="${index + 1}번째 서비스 가격">
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

function selectTemplate(id, reset = true) {
  const template = templateById(id);
  const design = DESIGN_MANIFEST[template.id];
  const preserved = {
    customerName: state.customerName,
    customerEmail: state.customerEmail,
    gaId: state.gaId,
    clarityId: state.clarityId,
    domain: state.domain,
    plan: state.plan
  };
  if (reset) {
    state = defaultState(template);
    Object.assign(state, preserved);
  } else {
    state.templateId = template.id;
    [state.primary, state.secondary, state.background, state.ink] = template.p;
    state.font = design.defaultFont;
  }
  syncFields();
  updatePreview();
  saveState();
  announce(`${template.name}의 ${design.name} 디자인을 선택했습니다.`);
}

function showStep(next) {
  step = Math.max(0, Math.min(4, next));
  $$('.step-panel').forEach((panel, index) => panel.classList.toggle('active', index === step));
  $$('[data-step-go]').forEach((button, index) => button.classList.toggle('active', index === step));
  const titles = ['디자인 선택', '사업 정보', '서비스·상품', '브랜드 스타일', '요금제·주문'];
  $('#step-counter').textContent = `STEP ${step + 1} / 5`;
  $('#step-title').textContent = titles[step];
  $('#prev-step').disabled = step === 0;
  $('#next-step').textContent = step === 4 ? '처음으로' : '다음 단계';
  $('#builder')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function previewDocument() {
  return renderPreviewDocument(state, templateById(state.templateId));
}

function updatePreview() {
  const template = templateById(state.templateId);
  const design = DESIGN_MANIFEST[template.id];
  const frame = $('#preview-frame');
  if (frame) frame.srcdoc = previewDocument();
  const previewName = $('#preview-name');
  if (previewName) {
    previewName.textContent = state.businessName || '브랜드명';
    previewName.title = `${template.name} · ${design.name}`;
  }
  const previewTemplate = $('#preview-template');
  if (previewTemplate) previewTemplate.textContent = `${template.name} · ${design.name} · ${design.signature}`;
  const shell = $('#preview-shell');
  if (shell) {
    shell.dataset.design = template.id;
    shell.dataset.signature = design.signature;
  }
}

function orderText() {
  const plan = PLANS.find((item) => item.id === state.plan) || PLANS[1];
  const template = templateById(state.templateId);
  const design = DESIGN_MANIFEST[template.id];
  const orderNumber = `L100-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const text = `Launch100 테스트 주문서
주문번호: ${orderNumber}
생성일: ${new Date().toLocaleString('ko-KR')}

[선택 디자인]
${template.name} · ${template.industry} · ${template.mood}
디자인 시스템: ${design.name}
레이아웃 지문: ${design.signature}
섹션 순서: ${design.sectionOrder.join(' → ')}

[사업 정보]
상호: ${state.businessName}
소개: ${state.tagline}
주소: ${state.address}
전화: ${state.phone}
이메일: ${state.email}
운영: ${state.weekdayHours} / ${state.weekendHours}

[서비스]
${state.services.map((service, index) => `${index + 1}. ${service.name} · ${service.price}\n   ${service.description}`).join('\n')}

[브랜드]
강조색: ${state.primary}
보조색: ${state.secondary}
글꼴: ${state.font}
이미지: ${state.imageMood}

[요금제]
${plan.name} · ${plan.price.toLocaleString()}원
${plan.items.map((item) => `- ${item}`).join('\n')}

[담당자]
${state.customerName || '-'}
${state.customerEmail || '-'}
희망 도메인: ${state.domain || '-'}
GA4: ${state.gaId || '-'}
Clarity: ${state.clarityId || '-'}

※ 결제가 발생하지 않은 MVP 테스트 주문입니다.`;
  return { orderNumber, text };
}

function download(filename, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(content) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function sharePreview() {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('preview', encodeState(safeShareState()));
  $('#share-url').value = url.href;
  $('#share-dialog').showModal();
  return url.href;
}

function setDevice(device) {
  currentDevice = ['desktop', 'tablet', 'mobile'].includes(device) ? device : 'desktop';
  $$('[data-device]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.device === currentDevice)));
  const shell = $('#preview-shell');
  if (shell) shell.className = `preview-shell ${currentDevice}`;
}

function bindStaticEvents() {
  $$('.template-filters button').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      $$('.template-filters button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderGallery();
    });
  });

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
      saveState();
      return;
    }

    const remove = event.target.closest('[data-remove-service]');
    if (remove) {
      if (state.services.length <= 1) {
        announce('서비스는 최소 1개가 필요합니다.');
        return;
      }
      state.services.splice(Number(remove.dataset.removeService), 1);
      renderServices();
      updatePreview();
      saveState();
      return;
    }

    const stepButton = event.target.closest('[data-step-go]');
    if (stepButton) {
      showStep(Number(stepButton.dataset.stepGo));
      return;
    }

    const openBuilder = event.target.closest('[data-open-builder]');
    if (openBuilder) {
      showStep(0);
      return;
    }

    const device = event.target.closest('[data-device]');
    if (device) setDevice(device.dataset.device);
  });

  $('#template-search').addEventListener('input', (event) => {
    search = event.target.value.trim();
    renderBuilderTemplates();
  });

  document.addEventListener('input', (event) => {
    const element = event.target;
    if (element.name && state[element.name] !== undefined) {
      state[element.name] = element.value;
      updatePreview();
      saveState();
    }
    const row = element.closest('[data-service]');
    if (row && element.dataset.serviceField) {
      const index = Number(row.dataset.service);
      state.services[index][element.dataset.serviceField] = element.value;
      updatePreview();
      saveState();
    }
  });

  $('#add-service').addEventListener('click', () => {
    if (state.services.length >= 6) {
      announce('서비스는 최대 6개까지 추가할 수 있습니다.');
      return;
    }
    state.services.push({ name: '새 서비스', description: '서비스 설명을 입력하세요.', price: '가격 문의' });
    renderServices();
    updatePreview();
    saveState();
  });

  $('#reset-theme').addEventListener('click', () => {
    const template = templateById(state.templateId);
    [state.primary, state.secondary, state.background, state.ink] = template.p;
    state.font = DESIGN_MANIFEST[template.id].defaultFont;
    syncFields();
    updatePreview();
    saveState();
  });

  $('#prev-step').addEventListener('click', () => showStep(step - 1));
  $('#next-step').addEventListener('click', () => showStep(step === 4 ? 0 : step + 1));

  $('#open-preview').addEventListener('click', () => {
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      announce('팝업 차단을 해제하면 새 창 미리보기를 열 수 있습니다.');
      return;
    }
    popup.document.open();
    popup.document.write(previewDocument());
    popup.document.close();
  });

  $('#create-order').addEventListener('click', () => {
    const order = orderText();
    state.lastOrder = order;
    $('#order-number').textContent = order.orderNumber;
    $('#order-summary').textContent = order.text;
    $('#order-result').hidden = false;
    $('#order-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    saveState();
  });

  $('#copy-order').addEventListener('click', async () => {
    await copyText($('#order-summary').textContent);
    announce('주문 초안을 복사했습니다.');
  });
  $('#download-order').addEventListener('click', () => download('launch100-order.txt', $('#order-summary').textContent));
  $('#download-config').addEventListener('click', () => download('launch100-site-config.json', JSON.stringify(state, null, 2), 'application/json;charset=utf-8'));
  $('#share-preview').addEventListener('click', sharePreview);
  $$('[data-share-preview]').forEach((button) => button.addEventListener('click', sharePreview));
  $('#copy-share').addEventListener('click', async () => {
    await copyText($('#share-url').value);
    announce('공유 주소를 복사했습니다.');
  });
  $('#share-dialog').addEventListener('click', (event) => {
    if (event.target === $('#share-dialog')) $('#share-dialog').close();
  });
}

function boot() {
  loadState();
  renderGallery();
  syncFields();
  updatePreview();
  setDevice('desktop');

  if (document.body.classList.contains('shared-mode')) {
    const shell = $('#preview-shell');
    if (shell) shell.className = 'preview-shell desktop';
    return;
  }

  bindStaticEvents();
  const params = new URLSearchParams(location.search);
  if (params.get('template') && location.hash === '#builder') showStep(0);
}

boot();
