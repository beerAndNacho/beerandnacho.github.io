import { TEMPLATES } from './templates.js';
import { DESIGN_PACKS, packFor } from './design-packs-v2.js';

const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
const $$ = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const templateFor = (id) => TEMPLATES.find((template) => template.id === id) || TEMPLATES[0];
const services = (state) => (state.services || []).filter((item) => item?.name).slice(0, 6);
const phone = (value) => String(value || '').replace(/[^0-9+]/g, '');
let scheduled = 0;
let internalWrite = false;

function currentTemplateId() {
  const selected = $('[data-select-template][aria-pressed="true"]')?.dataset.selectTemplate;
  if (selected) return selected;
  const query = new URLSearchParams(location.search).get('template');
  if (TEMPLATES.some((template) => template.id === query)) return query;
  try {
    const saved = JSON.parse(localStorage.getItem('launch100:mvp:v2') || localStorage.getItem('launch100:mvp:v1') || 'null');
    if (saved?.templateId) return saved.templateId;
  } catch { /* local storage is optional */ }
  return TEMPLATES[0].id;
}
function value(name, fallback = '') {
  const field = $(`[name="${name}"]`);
  return field ? field.value : fallback;
}
function readState() {
  const template = templateFor(currentTemplateId());
  const pack = packFor(template.id);
  const rows = $$('.service-row').map((row) => ({
    name: $('[data-service-field="name"]', row)?.value || '',
    description: $('[data-service-field="description"]', row)?.value || '',
    price: $('[data-service-field="price"]', row)?.value || ''
  })).filter((item) => item.name);
  return {
    templateId: template.id,
    businessName: value('businessName', template.d.businessName),
    categoryLabel: value('categoryLabel', template.d.categoryLabel),
    tagline: value('tagline', template.d.tagline),
    address: value('address', template.d.address),
    phone: value('phone', template.d.phone),
    email: value('email', template.d.email),
    weekdayHours: value('weekdayHours', template.d.weekdayHours),
    weekendHours: value('weekendHours', template.d.weekendHours),
    cta: value('cta', template.d.cta),
    services: rows.length ? rows : template.d.services.map(([name, description, price]) => ({ name, description, price })),
    primary: value('primary', template.p[0]), secondary: value('secondary', template.p[1]),
    background: value('background', template.p[2]), ink: value('ink', template.p[3]),
    font: value('font', pack.font), imageMood: value('imageMood', pack.imageMood)
  };
}
function contacts(state) {
  return `<dl class="pv-contact"><div><dt>주소</dt><dd>${esc(state.address)}</dd></div><div><dt>전화</dt><dd>${esc(state.phone)}</dd></div><div><dt>이메일</dt><dd>${esc(state.email)}</dd></div><div><dt>평일</dt><dd>${esc(state.weekdayHours)}</dd></div><div><dt>주말</dt><dd>${esc(state.weekendHours)}</dd></div></dl>`;
}
function footer(state, template, text) {
  return `<footer class="pv-footer"><strong>${esc(state.businessName)}</strong><span>${esc(template.name)} · ${esc(text)}</span><a href="#top">TOP ↑</a></footer>`;
}
function rows(state, className) {
  return services(state).map((item, index) => `<article class="${className}"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div><b>${esc(item.price)}</b></article>`).join('');
}
function shell(state, template, pack, content) {
  const font = { sans:'Inter,Pretendard,system-ui,sans-serif', serif:'Georgia,"Noto Serif KR",serif', mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', rounded:'"Arial Rounded MT Bold",Pretendard,system-ui,sans-serif' }[state.font] || 'Inter,system-ui,sans-serif';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="launch100-design-pack" content="${pack.id}"><title>${esc(state.businessName)} · Preview</title><link rel="stylesheet" href="./assets/design-preview-v2.css?v=2.1"><style>:root{--p:${state.primary};--s:${state.secondary};--bg:${state.background};--ink:${state.ink};--font:${font}}</style></head><body class="pv pack-${pack.id}" data-layout="${pack.id}" data-template="${template.id}">${content}</body></html>`;
}

function editorial(state, template, pack) {
  return shell(state, template, pack, `<header class="ed-nav"><a href="#top">${esc(state.businessName)}</a><span>DAILY BAKE · ISSUE ${template.n}</span><a href="#visit">${esc(state.cta)} ↗</a></header><main id="top"><section class="ed-hero"><aside><span>${esc(pack.kicker)}</span><b>${esc(pack.stats[0])}</b></aside><div><p>${esc(state.categoryLabel)}</p><h1>${esc(state.businessName)}</h1><blockquote>${esc(state.tagline)}</blockquote><a href="#menu">오늘의 선반 보기 ↓</a></div><figure><i></i><i></i><i></i><figcaption>${esc(state.imageMood)}</figcaption></figure></section><section id="menu" class="ed-menu"><header><span>01 · TODAY'S SHELF</span><h2>오늘 구운 것</h2><p>${esc(pack.note)}</p></header><div>${rows(state, 'ed-row')}</div></section><section class="ed-story"><div><span>02 · BAKE NOTE</span><h2>${esc(pack.quote)}</h2></div><p>레시피보다 반죽의 상태를 먼저 보고, 가장 좋은 시간에 맞춰 픽업을 준비합니다.</p><aside><b>${esc(pack.stats[0])}</b><span>FERMENTATION</span><b>${esc(pack.stats[1])}</b><span>FIRST OVEN</span></aside></section><section id="visit" class="ed-visit"><div><span>03 · VISIT</span><h2>빵이 가장 좋은 시간에.</h2><a href="tel:${phone(state.phone)}">${esc(state.cta)}</a></div>${contacts(state)}</section></main>${footer(state, template, 'BAKED DAILY')}`);
}
function brutal(state, template, pack) {
  const ticker = Array(7).fill(`${esc(pack.kicker)} · ${esc(state.cta)} · `).join('');
  return shell(state, template, pack, `<div class="br-ticker"><div>${ticker}</div></div><header class="br-nav"><a href="#top">${esc(state.businessName)}</a><nav><a href="#prices">PRICE</a><a href="#style">STYLE</a><a href="#book">BOOK</a></nav><b>${esc(pack.stats[1])}</b></header><main id="top"><section class="br-hero"><div><span>${esc(state.categoryLabel)}</span><h1>${esc(state.businessName)}</h1><p>${esc(state.tagline)}</p></div><figure><b>SHARP<br>AT<br>NOON</b><i>${esc(pack.stats[0])}</i></figure><a href="#book">${esc(state.cta)} →</a></section><section id="prices" class="br-prices"><header><span>01 / PRICE BOARD</span><h2>NO HIDDEN<br>EXTRAS.</h2></header><div>${rows(state, 'br-row')}</div></section><section id="style" class="br-style"><header><span>02 / STYLE REFERENCE</span><p>${esc(pack.note)}</p></header><div><article><b>01</b><span>CLASSIC</span></article><article><b>02</b><span>TEXTURE</span></article><article><b>03</b><span>FADE</span></article><article><b>04</b><span>SHAVE</span></article></div><blockquote>${esc(pack.quote)}</blockquote></section><section id="book" class="br-book"><div><span>03 / CHAIR BOOKING</span><h2>YOUR TIME.<br>YOUR CHAIR.</h2><a href="tel:${phone(state.phone)}">${esc(state.cta)}</a></div>${contacts(state)}</section></main>${footer(state, template, 'WALK-IN WHEN AVAILABLE')}`);
}
function dining(state, template, pack) {
  const course = services(state).map((item, index) => `<article><span>SCENE ${String(index + 1).padStart(2, '0')}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b></article>`).join('');
  return shell(state, template, pack, `<header class="di-nav"><a href="#top">${esc(state.businessName)}</a><span>${esc(state.categoryLabel)}</span><a href="#reserve">RESERVE</a></header><main id="top"><section class="di-hero"><figure><i></i><i></i><i></i></figure><div><span>${esc(pack.kicker)}</span><h1>${esc(state.businessName)}</h1><p>${esc(state.tagline)}</p><a href="#course">ENTER THE COURSE ↓</a></div><aside><b>${esc(pack.stats[0])}</b><span>${esc(pack.stats[1])}</span></aside></section><section id="course" class="di-course"><header><span>01 · THE COURSE</span><h2>계절이 이동하는 순서</h2></header><div>${course}</div></section><section class="di-note"><figure><i></i></figure><div><span>02 · KITCHEN NOTE</span><blockquote>${esc(pack.quote)}</blockquote><p>${esc(pack.note)}</p></div></section><section id="reserve" class="di-reserve"><div><span>03 · RESERVATION</span><h2>한 테이블에<br>남겨둘 자리.</h2><a href="tel:${phone(state.phone)}">${esc(state.cta)}</a></div>${contacts(state)}</section></main>${footer(state, template, 'SEASON CHANGES WEEKLY')}`);
}
function hanok(state, template, pack) {
  const roomCards = services(state).map((item, index) => `<article><figure><i></i><span>ROOM ${String(index + 1).padStart(2, '0')}</span></figure><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b></div></article>`).join('');
  return shell(state, template, pack, `<header class="ha-nav"><a href="#top">${esc(state.businessName)}</a><nav><a href="#rooms">객실</a><a href="#rhythm">머무는 방식</a><a href="#location">위치</a></nav><a href="#location">${esc(state.cta)}</a></header><main id="top"><section class="ha-hero"><figure><div></div></figure><div><span>${esc(pack.kicker)}</span><h1>${esc(state.businessName)}</h1><p>${esc(state.tagline)}</p><blockquote>${esc(pack.quote)}</blockquote><a href="#rooms">객실 천천히 보기 ↓</a></div></section><section id="rooms" class="ha-rooms"><header><span>01 · ROOMS</span><h2>낮은 창과 서로 다른 밤</h2><p>${esc(pack.note)}</p></header><div>${roomCards}</div></section><section id="rhythm" class="ha-rhythm"><div><span>02 · STAY RHYTHM</span><h2>채우지 않아도 되는 하루</h2></div><ol><li><span>15:00</span><b>중정에 들어서기</b></li><li><span>18:30</span><b>툇마루에서 해 지기</b></li><li><span>08:00</span><b>아침 소반 받기</b></li><li><span>11:00</span><b>천천히 나서기</b></li></ol></section><section id="location" class="ha-location"><figure><i></i><b>${esc(pack.stats[1])}</b></figure><div><span>03 · LOCATION & BOOKING</span><h2>${esc(state.address)}</h2>${contacts(state)}<a href="tel:${phone(state.phone)}">${esc(state.cta)}</a></div></section></main>${footer(state, template, 'QUIET HOURS 22:00')}`);
}
function academy(state, template, pack) {
  const modules = services(state).map((item, index) => `<article><div><span>MODULE ${String(index + 1).padStart(2, '0')}</span><b>${esc(item.price)}</b></div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><progress max="100" value="${58 + index * 15}"></progress></article>`).join('');
  return shell(state, template, pack, `<header class="ac-nav"><a href="#top">&gt; ${esc(state.businessName)}_</a><nav><a href="#metrics">OUTCOMES</a><a href="#curriculum">CURRICULUM</a><a href="#apply">APPLY</a></nav><span><i></i> COHORT OPEN</span></header><main id="top"><section class="ac-hero"><div><span>${esc(state.categoryLabel)}</span><h1>${esc(state.tagline)}</h1><p>${esc(pack.note)}</p><a href="#apply">${esc(state.cta)}</a></div><aside><header>compile / cohort-08</header><pre><code>$ init career --track backend
✓ system design
✓ production code
✓ cloud deployment

<span>status: ready_to_ship</span></code></pre></aside></section><section id="metrics" class="ac-metrics"><article><span>01</span><b>48</b><p>live reviews</p></article><article><span>02</span><b>${esc(pack.stats[1])}</b><p>completion</p></article><article><span>03</span><b>3</b><p>releases</p></article><article><span>04</span><b>1:6</b><p>mentor ratio</p></article></section><section id="curriculum" class="ac-curriculum"><header><span>02 · LEARNING SYSTEM</span><h2>배우고, 만들고,<br>운영하며 복기합니다.</h2></header><div>${modules}</div></section><section class="ac-projects"><div><span>03 · SHIP LOG</span><h2>포트폴리오가 아니라 운영 기록.</h2><blockquote>${esc(pack.quote)}</blockquote></div><div><article>API · Library Search</article><article>DATA · Recommendation</article><article>CLOUD · Service Platform</article></div></section><section id="apply" class="ac-apply"><div><span>04 · NEXT COHORT</span><h2>${esc(state.businessName)}</h2></div><a href="mailto:${esc(state.email)}">${esc(state.cta)} →</a></section></main>${footer(state, template, 'BUILD STATUS: PASSING')}`);
}
function law(state, template, pack) {
  return shell(state, template, pack, `<header class="la-nav"><a href="#top"><i>H</i><span>${esc(state.businessName)}</span></a><nav><a href="#practice">전문 분야</a><a href="#process">진행 절차</a><a href="#counsel">담당자</a></nav><a href="#consult">${esc(state.cta)}</a></header><main id="top"><section class="la-hero"><div><span>${esc(pack.kicker)}</span><h1>${esc(state.tagline)}</h1><p>사실관계, 가능한 선택지, 실행 순서를 서로 다른 문서로 분리해 설명합니다.</p></div><aside><header><span>INITIAL REVIEW</span><b>CONFIDENTIAL</b></header><blockquote>${esc(pack.quote)}</blockquote></aside></section><section id="practice" class="la-practice"><header><span>01 · PRACTICE AREAS</span><h2>문제보다 먼저 판단 기준을 세웁니다.</h2></header><div>${rows(state, 'la-row')}</div></section><section id="process" class="la-process"><div><span>02 · PROCEDURE</span><h2>상담 이후의 흐름을 미리 공개합니다.</h2><p>${esc(pack.note)}</p></div><ol><li><b>01</b><span>사실관계 접수</span></li><li><b>02</b><span>쟁점과 자료 분류</span></li><li><b>03</b><span>선택지와 위험 설명</span></li><li><b>04</b><span>대응 계획 확정</span></li></ol></section><section id="counsel" class="la-counsel"><figure><i>H</i></figure><div><span>03 · COUNSEL</span><h2>설명할 수 없는 전략은 권하지 않습니다.</h2></div></section><section id="consult" class="la-consult"><div><span>04 · CONSULTATION</span><h2>상황을 짧게 남겨주세요.</h2></div><a href="mailto:${esc(state.email)}">${esc(state.cta)} →</a></section></main>${footer(state, template, 'ATTORNEY–CLIENT CONFIDENTIALITY')}`);
}
function architecture(state, template, pack) {
  const projects = services(state).map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><figure class="a${index + 1}"><i></i></figure><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b></div></article>`).join('');
  return shell(state, template, pack, `<header class="ar-nav"><a href="#top">${esc(state.businessName)}</a><span>${esc(state.categoryLabel)}</span><nav><a href="#projects">PROJECTS</a><a href="#manifesto">STUDIO</a><a href="#inquiry">CONTACT</a></nav></header><main id="top"><section class="ar-hero"><aside>N 37° · E 126°</aside><h1>${esc(state.businessName)}</h1><figure><i></i><i></i><i></i><b>${esc(pack.stats[0])}</b></figure><p>${esc(state.tagline)}</p></section><section id="projects" class="ar-projects"><header><span>01 · PROJECT INDEX</span><h2>형태보다 먼저 움직임을 그립니다.</h2></header><div>${projects}</div></section><section id="manifesto" class="ar-manifesto"><span>02 · MANIFESTO</span><blockquote>${esc(pack.quote)}</blockquote><p>${esc(pack.note)}</p></section><section class="ar-process"><span>03 · PROCESS</span><ol><li><b>OBSERVE</b><small>생활과 장소 기록</small></li><li><b>DRAW</b><small>동선과 빛의 가설</small></li><li><b>BUILD</b><small>재료와 디테일</small></li><li><b>LIVE</b><small>사용 이후 점검</small></li></ol></section><section id="inquiry" class="ar-inquiry"><h2>NEW PROJECT<br>${esc(pack.stats[1])}</h2><div>${contacts(state)}<a href="mailto:${esc(state.email)}">${esc(state.cta)} →</a></div></section></main>${footer(state, template, 'ARCHIVE OPEN BY APPOINTMENT')}`);
}
function clinic(state, template, pack) {
  const cards = services(state).map((item, index) => `<article><i>${['○','◇','△','＋','□','◎'][index]}</i><span>CARE ${String(index + 1).padStart(2, '0')}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b></article>`).join('');
  return shell(state, template, pack, `<header class="cl-nav"><a href="#top"><i>＋</i>${esc(state.businessName)}</a><nav><a href="#care">진료</a><a href="#journey">진료 과정</a><a href="#doctor">의료진</a></nav><a href="#booking">${esc(state.cta)}</a></header><main id="top"><section class="cl-hero"><div><span>${esc(pack.kicker)}</span><h1>${esc(state.tagline)}</h1><p>현재 상태, 가능한 방법, 예상되는 과정을 이해하기 쉬운 말로 먼저 설명합니다.</p><ul><li><b>${esc(pack.stats[0])}</b><span>방문 만족도</span></li><li><b>${esc(pack.stats[1])}</b><span>초기 상담</span></li></ul></div><aside><div><i></i><i></i><b></b></div><article><b>오늘 예약</b><small>${esc(state.weekdayHours)}</small></article></aside></section><section id="care" class="cl-care"><header><span>01 · CARE MENU</span><h2>필요한 진료를 쉽게 찾도록.</h2></header><div>${cards}</div></section><section id="journey" class="cl-journey"><div><span>02 · CARE JOURNEY</span><h2>처음부터 사후 관리까지 같은 기준으로.</h2><blockquote>${esc(pack.quote)}</blockquote></div><ol><li><b>01</b><span>상태 확인</span></li><li><b>02</b><span>선택 설명</span></li><li><b>03</b><span>관리 계획</span></li></ol></section><section id="doctor" class="cl-doctor"><figure><i></i></figure><div><span>03 · OUR DOCTOR</span><h2>치료보다 먼저 설명을 시작합니다.</h2><p>${esc(pack.note)}</p></div></section><section id="booking" class="cl-booking"><div><span>04 · BOOKING</span><h2>편한 시간부터 골라보세요.</h2><a href="tel:${phone(state.phone)}">${esc(state.cta)} →</a></div>${contacts(state)}</section></main>${footer(state, template, 'CALM CARE · CLEAR CHOICE')}`);
}
function tech(state, template, pack) {
  const plans = services(state).map((item, index) => `<article class="${index === 1 ? 'featured' : ''}"><span>PLAN ${String(index + 1).padStart(2, '0')}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b><a href="mailto:${esc(state.email)}">START →</a></article>`).join('');
  return shell(state, template, pack, `<header class="te-nav"><a href="#top"><i></i>${esc(state.businessName)}</a><nav><a href="#features">PRODUCT</a><a href="#code">DOCS</a><a href="#pricing">PRICING</a></nav><a href="#pricing">${esc(state.cta)}</a></header><main id="top"><section class="te-hero"><div><span>${esc(state.categoryLabel)}</span><h1>${esc(state.tagline)}</h1><p>${esc(pack.note)}</p><ul><li>● ALL SYSTEMS OPERATIONAL</li><li>SOC2 READY</li><li>GLOBAL EDGE</li></ul></div><aside><header>request.ts · LIVE</header><pre><code>const result = await endpoint.run({
  region: "ap-northeast",
  retries: 3,
  stream: true
});

// status: completed</code></pre></aside></section><section class="te-metrics"><article><span>REQUESTS / MO</span><b>1.8B</b></article><article><span>P95 LATENCY</span><b>${esc(pack.stats[1])}</b></article><article><span>UPTIME</span><b>${esc(pack.stats[0])}</b></article><article><span>EDGE REGIONS</span><b>12</b></article></section><section id="features" class="te-features"><header><span>01 · PRODUCT BENTO</span><h2>제품에 필요한 인프라를 작은 API로.</h2></header><div><article class="wide"><h3>Auth & Rate Limit</h3></article><article><h3>Request tracing</h3></article><article><h3>Global regions</h3></article><article class="wide"><h3>Streaming events</h3></article></div></section><section id="code" class="te-code"><div><span>02 · COPY, RUN, SHIP</span><h2>문서에서 바로 실행 가능한 예제.</h2><p>${esc(pack.quote)}</p></div><pre><code>curl -X POST /v1/run
-H "Authorization: Bearer $KEY"
-d '{"input":"hello"}'

200 OK · ${esc(pack.stats[1])}</code></pre></section><section id="pricing" class="te-pricing"><header><span>03 · PRICING</span><h2>사용량에 맞춰 시작하세요.</h2></header><div>${plans}</div></section></main>${footer(state, template, 'STATUS: OPERATIONAL')}`);
}
function portfolio(state, template, pack) {
  const apps = services(state).map((item, index) => `<article><figure class="i${index + 1}"><i></i></figure><span>APP ${String(index + 1).padStart(2, '0')}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><b>${esc(item.price)}</b></article>`).join('');
  return shell(state, template, pack, `<div class="po-bar"><span>● ● ●</span><b>${esc(state.businessName)} / desktop</b><nav><a href="#apps">Apps</a><a href="#experience">Experience</a><a href="#contact">Contact</a></nav><time>09:41</time></div><main id="top" class="po-desktop"><section class="po-hero"><article class="po-window about"><header>about.md · — □ ×</header><div><small>${esc(state.categoryLabel)}</small><h1>${esc(state.businessName)}</h1><p>${esc(state.tagline)}</p><blockquote>${esc(pack.quote)}</blockquote></div></article><article class="po-window terminal"><header>terminal · — □ ×</header><pre><code>$ whoami
${esc(state.businessName)}

$ focus
search · recommendation · backend

$ status
open_to_projects=true</code></pre></article><figure class="po-avatar"><i></i></figure><a class="po-file" href="#apps">projects.app · ${services(state).length} items</a></section><section id="apps" class="po-apps"><header><span>01 · PROJECT APPLICATIONS</span><h2>더블클릭하듯 프로젝트를 엽니다.</h2></header><div>${apps}</div></section><section id="experience" class="po-experience"><article class="po-window"><header>experience.log · — □ ×</header><ol><li><time>2026</time><b>AI SEARCH SYSTEMS</b></li><li><time>2024</time><b>BACKEND PLATFORM</b></li><li><time>2020</time><b>CONVERSATIONAL UX</b></li></ol></article><aside><span>02 · SYSTEM INFO</span><b>${esc(pack.stats[0])}</b><p>production experience</p><b>${esc(pack.stats[1])}</b><p>core stacks</p></aside></section><section id="contact" class="po-contact"><article class="po-window"><header>contact.compose · — □ ×</header><div><span>TO</span><b>${esc(state.email)}</b><span>SUBJECT</span><b>${esc(state.cta)}</b><a href="mailto:${esc(state.email)}">SEND MESSAGE →</a></div></article>${contacts(state)}</section><nav class="po-dock"><a href="#top">⌂</a><a href="#apps">▦</a><a href="#experience">≋</a><a href="#contact">✉</a></nav></main>${footer(state, template, 'SYSTEM READY')}`);
}

const renderers = { editorial, brutal, dining, hanok, academy, law, architecture, clinic, tech, portfolio };
function previewHtml() {
  const template = templateFor(currentTemplateId());
  const pack = packFor(template.id);
  return renderers[pack.id](readState(), template, pack);
}
function thumbnail(template, pack) {
  const name = esc(template.name);
  return ({
    editorial:`<div class="v2-thumb th-ed"><span>DAILY BAKE</span><b>${name}</b><i></i></div>`,
    brutal:`<div class="v2-thumb th-br"><b>CUT<br>NOW</b><span>${name}</span></div>`,
    dining:`<div class="v2-thumb th-di"><i></i><span>SEVEN SCENES</span><b>${name}</b></div>`,
    hanok:`<div class="v2-thumb th-ha"><i></i><b>DAL</b><span>COURTYARD</span></div>`,
    academy:`<div class="v2-thumb th-ac"><header>compile / cohort</header><b>86%</b><span>CURRICULUM</span></div>`,
    law:`<div class="v2-thumb th-la"><span>LEGAL DOSSIER</span><b>${name}</b><i>H</i></div>`,
    architecture:`<div class="v2-thumb th-ar"><b>VOID</b><i></i><span>PROJECT INDEX</span></div>`,
    clinic:`<div class="v2-thumb th-cl"><i>＋</i><b>MINT</b><span>CALM CARE</span></div>`,
    tech:`<div class="v2-thumb th-te"><header>● endpoint / live</header><pre>POST /v1/run
200 OK · 42ms</pre><b>99.99%</b></div>`,
    portfolio:`<div class="v2-thumb th-po"><header>● ● ● desktop</header><i></i><i></i><b>${name}</b></div>`
  })[pack.id];
}
function injectAssets() {
  if (!$('#launch100-v2-shell')) {
    const link = document.createElement('link');
    link.id = 'launch100-v2-shell'; link.rel = 'stylesheet'; link.href = './assets/design-v2.css?v=2.1'; document.head.appendChild(link);
  }
  document.documentElement.dataset.launch100Version = '2.1.0';
}
function injectProof() {
  if ($('.design-proof-v2')) return;
  const templatesSection = $('#templates');
  if (!templatesSection) return;
  const section = document.createElement('section');
  section.className = 'design-proof-v2';
  section.innerHTML = `<div class="proof-lead"><span>DESIGN DIVERSITY</span><strong>같은 틀을<br>재사용하지 않습니다.</strong></div><div><span>DESIGN PACKS</span><b>10</b><small>업종별 시각 언어</small></div><div><span>HERO SYSTEMS</span><b>10</b><small>첫 화면 구조</small></div><div><span>SECTION MODULES</span><b>46</b><small>업종 전용 섹션</small></div><div><span>DEVICE MODES</span><b>3</b><small>PC · Tablet · Mobile</small></div>`;
  templatesSection.insertAdjacentElement('beforebegin', section);
  const hero = $('.hero-copy h1');
  if (hero) hero.innerHTML = '색상이 아니라<br><em>구조부터</em> 다르게.';
  const heroText = $('.hero-copy > p');
  if (heroText) heroText.textContent = '열 개 템플릿마다 히어로, 정보 순서, 카드, 타이포그래피와 인터랙션이 다릅니다. 입력한 사업 정보는 선택한 디자인 시스템 안에서 실시간으로 다시 구성됩니다.';
}
function enhanceGallery() {
  $$('[data-template-card]').forEach((card) => {
    const id = card.dataset.templateCard;
    const template = templateFor(id);
    const pack = packFor(id);
    card.classList.add(`v2-card-${pack.id}`);
    const thumb = $('.template-thumb', card);
    if (thumb && thumb.dataset.v2Ready !== 'true') { thumb.dataset.v2Ready = 'true'; thumb.innerHTML = thumbnail(template, pack); }
    const meta = $('.template-meta', card);
    if (meta && !$('.v2-pack-label', meta)) {
      meta.insertAdjacentHTML('afterbegin', `<div class="v2-pack-label"><span>${esc(pack.label)}</span><b>${esc(pack.hero)}</b></div>`);
      const button = $('button', meta);
      button?.insertAdjacentHTML('beforebegin', `<ul class="v2-module-list">${pack.sections.slice(0, 4).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`);
    }
  });
}
function injectDna(pack) {
  let dna = $('#design-dna-v2');
  if (!dna) {
    dna = document.createElement('div'); dna.id = 'design-dna-v2'; dna.className = 'design-dna-v2';
    const foot = $('.preview-foot'); foot?.insertAdjacentElement('beforebegin', dna);
  }
  if (!dna) return;
  const items = [['PACK', pack.label], ['HERO', pack.hero], ['FLOW', pack.flow], ['TYPE', pack.type], ['SURFACE', pack.surface], ['MOTION', pack.motion]];
  dna.innerHTML = items.map(([key, value]) => `<div><span>${key}</span><b>${esc(value)}</b></div>`).join('') + `<p>${pack.sections.length} MODULES · ${pack.sections.join(' / ')}</p>`;
}
function render() {
  const frame = $('#preview-frame');
  if (!frame) return;
  const template = templateFor(currentTemplateId());
  const pack = packFor(template.id);
  const html = previewHtml();
  if (!frame.srcdoc.includes(`content="${pack.id}"`)) {
    internalWrite = true; frame.srcdoc = html; queueMicrotask(() => { internalWrite = false; });
  } else if (frame.srcdoc !== html) {
    internalWrite = true; frame.srcdoc = html; queueMicrotask(() => { internalWrite = false; });
  }
  const label = $('#preview-template'); if (label) label.textContent = `${template.name} · ${pack.label}`;
  injectDna(pack); enhanceGallery();
}
function scheduleRender() {
  cancelAnimationFrame(scheduled);
  scheduled = requestAnimationFrame(() => requestAnimationFrame(render));
}
function bind() {
  document.addEventListener('input', scheduleRender, { capture: true });
  document.addEventListener('change', scheduleRender, { capture: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-select-template],[data-use-template],[data-remove-service],#add-service,#reset-theme')) scheduleRender();
    if (event.target.closest('#open-preview')) {
      event.preventDefault(); event.stopImmediatePropagation();
      const popup = open('', '_blank'); if (popup) { popup.document.write(previewHtml()); popup.document.close(); }
    }
  }, { capture: true });
  const frame = $('#preview-frame');
  if (frame) new MutationObserver(() => { if (!internalWrite && !frame.srcdoc.includes('launch100-design-pack')) scheduleRender(); }).observe(frame, { attributes: true, attributeFilter: ['srcdoc'] });
  new MutationObserver(() => { enhanceGallery(); scheduleRender(); }).observe(document.body, { childList: true, subtree: true });
}
function boot() {
  if (!document.body) return;
  injectAssets(); injectProof(); enhanceGallery(); bind(); scheduleRender();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(boot), { once: true });
  else requestAnimationFrame(boot);
}
export { DESIGN_PACKS, renderers, previewHtml };
