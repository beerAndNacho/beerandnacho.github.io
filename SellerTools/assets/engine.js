import { TOOL_MAP } from './catalog.js';
import { runOperation } from './operations.js';

const slug = window.SELLER_TOOL_SLUG || location.pathname.split('/').filter(Boolean).pop();
const tool = TOOL_MAP.get(slug);
const e = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

if (!tool) {
  document.body.innerHTML = '<main class="fatal"><strong>도구를 찾지 못했습니다.</strong><a href="/SellerTools/">전체 도구로 돌아가기</a></main>';
  throw new Error(`Unknown SellerTools slug: ${slug}`);
}

document.body.dataset.category = tool.category;
document.title = `${tool.title} | SellerTools`;

const categoryText = {
  '가격·마진':'판매가와 비용이 실제 이익에 미치는 영향을 숫자로 확인합니다.',
  '광고·프로모션':'광고와 행사를 매출이 아니라 손익 기준으로 검토합니다.',
  '상품등록':'상품명·상세페이지·FAQ를 구매 흐름에 맞게 정리합니다.',
  '상품데이터':'옵션·SKU·CSV를 등록과 재고 운영에 맞게 정돈합니다.',
  '이미지·콘텐츠':'이미지는 브라우저에서 처리하고 제작 순서를 문서화합니다.',
  '재고·발주':'판매 속도와 조달기간으로 품절과 과잉재고를 줄입니다.',
  '주문·배송':'포장·피킹·송장·배송 안내를 출고 흐름에 맞게 준비합니다.',
  '교환·CS':'확인된 사실과 다음 조치를 중심으로 고객 응대를 기록합니다.',
  '리뷰·고객':'리뷰와 구매 이력을 재구매·고객 유지 활동으로 연결합니다.',
  '매출·운영':'매출·이익·재고·광고·현금흐름을 함께 봅니다.'
};

function fieldHtml(field) {
  const common = `id="f-${e(field.key)}" data-key="${e(field.key)}"`;
  const help = field.help ? `<small>${e(field.help)}</small>` : '';
  if (field.type === 'textarea') return `<label class="field wide"><span>${e(field.label)}</span><textarea ${common} rows="7" placeholder="${e(field.placeholder || '')}"></textarea>${help}</label>`;
  if (field.type === 'select') return `<label class="field"><span>${e(field.label)}</span><select ${common}>${field.options.map((o) => `<option value="${e(o.value)}">${e(o.label)}</option>`).join('')}</select>${help}</label>`;
  if (field.type === 'checkbox') return `<label class="field check"><input ${common} type="checkbox"><span>${e(field.label)}</span>${help}</label>`;
  if (field.type === 'file') return `<label class="field wide file"><span>${e(field.label)}</span><input ${common} type="file" accept="${e(field.accept || 'image/*')}"><strong>이미지를 선택하세요</strong>${help}</label>`;
  const type = ['number','date','text'].includes(field.type) ? field.type : 'text';
  return `<label class="field"><span>${e(field.label)}</span><div class="input-wrap"><input ${common} type="${type}" ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.step !== undefined ? `step="${field.step}"` : ''} placeholder="${e(field.placeholder || '')}">${field.suffix ? `<i>${e(field.suffix)}</i>` : ''}</div>${help}</label>`;
}

document.body.innerHTML = `<div class="tool-page">
<header class="site-header"><a class="brand" href="/SellerTools/"><i></i>SellerTools</a><nav><a href="/SellerTools/">100개 도구</a><button id="favorite" type="button">즐겨찾기</button></nav></header>
<main class="tool-layout">
<aside class="tool-intro"><div class="tool-number">TOOL-${String(tool.id).padStart(3,'0')}</div><div class="category-label">${e(tool.category)}</div><h1>${e(tool.title)}</h1><p>${e(tool.description)}</p><div class="category-note">${e(categoryText[tool.category] || '')}</div><div class="privacy-note"><strong>LOCAL PROCESSING</strong><span>입력값과 이미지는 서버로 전송하지 않고 현재 브라우저에서 처리합니다.</span></div>${tool.notice ? `<div class="policy-note"><strong>확인 사항</strong><span>${e(tool.notice)}</span></div>` : ''}<div class="tag-list">${(tool.tags || []).map((tag) => `<span>${e(tag)}</span>`).join('')}</div></aside>
<section class="workspace"><div class="workspace-head"><div><span>INPUT</span><h2>계산·생성 조건</h2></div><button id="sample" class="text-button" type="button">예시 입력</button></div><form id="form" class="tool-form">${tool.fields.map(fieldHtml).join('')}<div class="form-actions wide"><button class="primary-button" type="submit">${tool.mode === 'image' ? '이미지 처리' : tool.mode === 'generator' ? '문서 생성' : '결과 계산'}</button><button id="clear" class="secondary-button" type="button">초기화</button></div></form><section id="result" class="result-panel"><div class="result-empty"><strong>결과가 여기에 표시됩니다.</strong><span>예시 입력을 바로 테스트할 수 있습니다.</span></div></section></section>
</main><footer class="site-footer"><span>SellerTools 100 · 브라우저 기반 셀러 운영 도구</span><a href="https://github.com/beerAndNacho/SellerTools">GitHub</a></footer></div>`;

const form = document.querySelector('#form');
const resultPanel = document.querySelector('#result');
const favoriteButton = document.querySelector('#favorite');
let currentText = '';
let currentFilename = `${tool.slug}.txt`;

function storageList(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function setStorageList(key, values) {
  try { localStorage.setItem(key, JSON.stringify(values)); } catch {}
}
function rememberRecent() {
  const old = storageList('sellertools:recent');
  setStorageList('sellertools:recent', [tool.slug, ...old.filter((x) => x !== tool.slug)].slice(0, 10));
}
function updateFavorite() {
  const active = storageList('sellertools:favorites').includes(tool.slug);
  favoriteButton.classList.toggle('active', active);
  favoriteButton.textContent = active ? '즐겨찾기 해제' : '즐겨찾기';
}
favoriteButton.onclick = () => {
  const old = storageList('sellertools:favorites');
  setStorageList('sellertools:favorites', old.includes(tool.slug) ? old.filter((x) => x !== tool.slug) : [...old, tool.slug]);
  updateFavorite();
};

function setSamples() {
  for (const field of tool.fields) {
    if (field.type === 'file') continue;
    const input = document.querySelector(`[data-key="${CSS.escape(field.key)}"]`);
    if (!input) continue;
    if (field.type === 'checkbox') input.checked = Boolean(field.sample);
    else input.value = field.sample ?? '';
  }
}
function clearForm() {
  form.reset();
  for (const field of tool.fields) {
    if (field.type === 'select') {
      const input = document.querySelector(`[data-key="${CSS.escape(field.key)}"]`);
      if (input) input.selectedIndex = 0;
    }
  }
  resultPanel.innerHTML = '<div class="result-empty"><strong>입력값을 초기화했습니다.</strong><span>예시 입력으로 다시 시작할 수 있습니다.</span></div>';
  currentText = '';
}
function valuesFromForm() {
  return Object.fromEntries(tool.fields.map((field) => {
    const input = document.querySelector(`[data-key="${CSS.escape(field.key)}"]`);
    if (field.type === 'checkbox') return [field.key, input.checked];
    if (field.type === 'file') return [field.key, input.files?.[0] || null];
    return [field.key, input.value];
  }));
}

function tableHtml(rows) {
  if (!rows?.length) return '';
  return `<div class="table-wrap"><table><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<${index === 0 ? 'th' : 'td'}>${e(cell)}</${index === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderOutput(output) {
  currentText = output.text || [output.title, output.summary, ...(output.metrics || []).map((x) => x.join(': ')), ...(output.rows || []).map((x) => x.join(' | '))].filter(Boolean).join('\n');
  currentFilename = output.downloadName || `${tool.slug}.txt`;
  resultPanel.innerHTML = `<div class="result-head"><div><span>OUTPUT</span><h2>${e(output.title)}</h2></div><div class="result-actions"><button id="copy-result" type="button">복사</button><button id="download-result" type="button">저장</button></div></div>${output.summary ? `<p class="result-summary">${e(output.summary)}</p>` : ''}${output.warning ? `<div class="result-warning">${e(output.warning)}</div>` : ''}${output.metrics?.length ? `<div class="metric-grid">${output.metrics.map(([label,value]) => `<div><span>${e(label)}</span><strong>${e(value)}</strong></div>`).join('')}</div>` : ''}${tableHtml(output.rows)}${output.text ? `<pre>${e(output.text)}</pre>` : ''}`;
  document.querySelector('#copy-result').onclick = async () => {
    await navigator.clipboard.writeText(currentText);
    document.querySelector('#copy-result').textContent = '복사됨';
  };
  document.querySelector('#download-result').onclick = () => downloadBlob(new Blob([currentText], {type:'text/plain;charset=utf-8'}), currentFilename);
  resultPanel.scrollIntoView({behavior:'smooth', block:'start'});
}
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('처리할 이미지를 선택하세요.'));
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({image, url});
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽지 못했습니다.')); };
    image.src = url;
  });
}
function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('이미지 파일을 만들지 못했습니다.')), type, quality));
}
function drawImage(ctx, image, width, height, mode='contain', padding=0) {
  const aw = Math.max(1, width - padding * 2), ah = Math.max(1, height - padding * 2);
  if (mode === 'stretch') return ctx.drawImage(image, padding, padding, aw, ah);
  const ratio = mode === 'cover' ? Math.max(aw/image.width, ah/image.height) : Math.min(aw/image.width, ah/image.height);
  const dw = image.width * ratio, dh = image.height * ratio;
  ctx.drawImage(image, (width-dw)/2, (height-dh)/2, dw, dh);
}
async function processImage(values) {
  const {image, url} = await loadImage(values.image);
  let width=image.width, height=image.height, type=values.format || 'image/webp', quality=.9, mode='contain', padding=0, background='#ffffff';
  if (tool.operation === 'imageResize') { width=Math.max(1,Number(values.width)||image.width); height=Math.max(1,Number(values.height)||image.height); mode=values.fit || 'contain'; }
  if (tool.operation === 'imageSquare') { width=height=Math.max(1,Number(values.size)||1000); padding=Math.max(0,Number(values.padding)||0); background=values.background || '#ffffff'; }
  if (tool.operation === 'imageCompress') { const ratio=Math.min(1,(Number(values.maxWidth)||image.width)/image.width); width=Math.round(image.width*ratio); height=Math.round(image.height*ratio); quality=Math.max(.1,Math.min(1,Number(values.quality)/100||.78)); }
  if (tool.operation === 'imageConvert') quality=Math.max(.1,Math.min(1,Number(values.quality)/100||.9));
  if (type === 'image/jpeg') background='#ffffff';
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d'); ctx.fillStyle=background; ctx.fillRect(0,0,width,height); drawImage(ctx,image,width,height,mode,padding);
  const blob=await canvasBlob(canvas,type,quality); URL.revokeObjectURL(url);
  const ext=type==='image/png'?'png':type==='image/jpeg'?'jpg':'webp';
  const objectUrl=URL.createObjectURL(blob); const filename=`${tool.slug}-${width}x${height}.${ext}`;
  resultPanel.innerHTML=`<div class="result-head"><div><span>OUTPUT</span><h2>이미지 처리 완료</h2></div><button id="image-download" type="button">이미지 저장</button></div><div class="metric-grid"><div><span>원본 크기</span><strong>${image.width} × ${image.height}px</strong></div><div><span>출력 크기</span><strong>${width} × ${height}px</strong></div><div><span>원본 용량</span><strong>${formatBytes(values.image.size)}</strong></div><div><span>출력 용량</span><strong>${formatBytes(blob.size)}</strong></div></div><div class="image-preview"><img src="${objectUrl}" alt="처리된 이미지"></div>`;
  document.querySelector('#image-download').onclick=()=>downloadBlob(blob,filename);
  setTimeout(()=>URL.revokeObjectURL(objectUrl),1200000);
  resultPanel.scrollIntoView({behavior:'smooth',block:'start'});
}
function formatBytes(bytes) { return bytes<1024?`${bytes}B`:bytes<1048576?`${(bytes/1024).toFixed(1)}KB`:`${(bytes/1048576).toFixed(2)}MB`; }

form.onsubmit = async (event) => {
  event.preventDefault();
  const button=form.querySelector('.primary-button'); button.disabled=true; button.textContent='처리 중…';
  try {
    const values=valuesFromForm();
    if (tool.mode === 'image') await processImage(values); else renderOutput(runOperation(tool,values));
    rememberRecent();
  } catch (error) {
    resultPanel.innerHTML=`<div class="result-error"><strong>처리하지 못했습니다.</strong><span>${e(error instanceof Error ? error.message : String(error))}</span></div>`;
  } finally {
    button.disabled=false; button.textContent=tool.mode==='image'?'이미지 처리':tool.mode==='generator'?'문서 생성':'결과 계산';
  }
};
document.querySelector('#sample').onclick=setSamples;
document.querySelector('#clear').onclick=clearForm;
for (const fileField of document.querySelectorAll('.file')) {
  const input=fileField.querySelector('input');
  input.onchange=()=>{ fileField.querySelector('strong').textContent=input.files?.[0]?.name || '이미지를 선택하세요'; };
}
setSamples(); updateFavorite(); rememberRecent();
