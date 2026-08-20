import { TOOLS } from './catalog.js';

const BASE_PATH = '/Officetools/';
const slug = window.OFFICE_TOOL_SLUG || location.pathname.split('/').filter(Boolean).pop();
const tool = TOOLS.find((item) => item.slug === slug) || TOOLS[0];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, digits = 2) => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: digits });
const money = (value) => `${Math.round(Number(value) || 0).toLocaleString('ko-KR')}원`;
const percent = (value, digits = 2) => `${round(value, digits)}%`;
const lines = (value) => String(value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const pipeRows = (value) => lines(value).map((line) => line.split('|').map((cell) => cell.trim()));
const bullet = (value) => lines(value).map((line) => `- ${line}`).join('\n') || '- 없음';
const numbered = (value) => lines(value).map((line, index) => `${index + 1}. ${line}`).join('\n') || '1. 없음';
const checklist = (value) => lines(value).map((line) => `- [ ] ${line}`).join('\n') || '- [ ] 없음';
const inline = (value) => lines(value).join(', ') || String(value ?? '').trim();
const tableRows = (value, columns, transform) => pipeRows(value).map((row, index) => {
  const padded = [...row, ...Array(Math.max(0, columns - row.length)).fill('')].slice(0, columns);
  const cells = transform ? transform(padded, index) : padded;
  return `| ${cells.join(' | ')} |`;
}).join('\n') || `| ${Array(columns).fill('-').join(' | ')} |`;
const parseDelimiter = (value) => value === 'tab' ? '\t' : (value || ',');

function trackRecent(slugValue) {
  try {
    const current = JSON.parse(localStorage.getItem('officetools:recent') || '[]');
    const next = [slugValue, ...current.filter((item) => item !== slugValue)].slice(0, 8);
    localStorage.setItem('officetools:recent', JSON.stringify(next));
  } catch {}
}
trackRecent(tool.slug);

function selectLabel(field, value) {
  if (field.type !== 'select') return String(value ?? '');
  const option = (field.options || []).find(([key]) => String(key) === String(value));
  return option ? option[1] : String(value ?? '');
}

function renderField(field) {
  const value = field.default ?? '';
  const attrs = [
    field.required ? 'required' : '',
    field.min !== undefined ? `min="${escapeHtml(field.min)}"` : '',
    field.max !== undefined ? `max="${escapeHtml(field.max)}"` : '',
    field.step !== undefined ? `step="${escapeHtml(field.step)}"` : ''
  ].filter(Boolean).join(' ');
  if (field.type === 'textarea') {
    return `<div class="field"><label for="field-${escapeHtml(field.key)}"><span>${escapeHtml(field.label)}</span><small>${escapeHtml(field.placeholder || '')}</small></label><textarea id="field-${escapeHtml(field.key)}" name="${escapeHtml(field.key)}" rows="${field.rows || 6}" placeholder="${escapeHtml(field.placeholder || '')}" ${attrs}>${escapeHtml(value)}</textarea></div>`;
  }
  if (field.type === 'select') {
    return `<div class="field"><label for="field-${escapeHtml(field.key)}"><span>${escapeHtml(field.label)}</span></label><select id="field-${escapeHtml(field.key)}" name="${escapeHtml(field.key)}" ${attrs}>${(field.options || []).map(([key, label]) => `<option value="${escapeHtml(key)}" ${String(key) === String(value) ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div>`;
  }
  return `<div class="field"><label for="field-${escapeHtml(field.key)}"><span>${escapeHtml(field.label)}</span><small>${escapeHtml(field.placeholder || '')}</small></label><input id="field-${escapeHtml(field.key)}" name="${escapeHtml(field.key)}" type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" ${attrs}></div>`;
}

function recentMarkup() {
  try {
    const slugs = JSON.parse(localStorage.getItem('officetools:recent') || '[]').filter((item) => item !== tool.slug).slice(0, 5);
    return slugs.map((item) => {
      const found = TOOLS.find((entry) => entry.slug === item);
      return found ? `<a href="${BASE_PATH}tools/${found.slug}/">${escapeHtml(found.title)}</a>` : '';
    }).join('');
  } catch { return ''; }
}

function renderPage() {
  document.documentElement.style.setProperty('--accent', ['#256b5b','#315f87','#754f78','#9b5b3b'][tool.id % 4]);
  document.title = `${tool.title} | OfficeTools`;
  document.body.innerHTML = `<div class="tool-shell"><header class="topbar"><a class="brand" href="${BASE_PATH}">OFFICETOOLS</a><nav class="topnav"><span>TOOL-${String(tool.id).padStart(3,'0')}</span><span>${escapeHtml(tool.category)}</span><a href="${BASE_PATH}">100개 전체</a></nav></header><main class="tool-layout"><aside class="tool-brief"><div class="eyebrow">OFFICE UTILITY · ${String(tool.id).padStart(3,'0')}</div><h1 class="tool-title">${escapeHtml(tool.title)}</h1><p class="tool-desc">${escapeHtml(tool.description)}</p><div class="tool-badges"><span class="badge">${escapeHtml(tool.category)}</span><span class="badge">${escapeHtml(tool.mode)}</span><span class="badge">브라우저 처리</span></div><div class="local-box"><strong>입력값은 서버로 전송하지 않습니다.</strong><br>복사와 텍스트 저장을 제외한 계산·변환·문서 생성은 현재 브라우저 안에서 처리됩니다.</div><div class="recent-links"><h3>RECENT TOOLS</h3>${recentMarkup() || '<span class="tool-desc">다른 도구를 사용하면 여기에 표시됩니다.</span>'}</div></aside><section class="workspace"><div class="workspace-head"><h2>업무 입력과 결과</h2><span>${tool.fields.length}개 입력 항목 · 외부 API 없음</span></div><div class="work-grid"><section class="input-panel"><div class="panel-title"><span>INPUT</span><span>STEP 01</span></div><form id="tool-form"><div class="fields">${tool.fields.map(renderField).join('')}</div><div class="buttons"><button class="button primary" type="submit">실행</button><button class="button secondary" type="button" id="sample">예시 입력</button><button class="button" type="reset">초기화</button></div></form></section><section class="output-panel"><div class="panel-title"><span>RESULT</span><span>STEP 02</span></div><pre class="output empty-output" id="result">입력값을 확인한 뒤 실행 버튼을 누르세요.</pre><div class="buttons"><button class="button primary" type="button" id="copy">결과 복사</button><button class="button" type="button" id="download">TXT 저장</button></div><div class="notice" id="notice"></div></section></div></section></main></div><a class="quick-nav" href="${BASE_PATH}">전체 도구</a>`;
}
renderPage();

const form = $('#tool-form');
const resultElement = $('#result');
const noticeElement = $('#notice');
let lastResult = '';
let timerState = null;

function getValues() {
  const values = {};
  for (const field of tool.fields) {
    const element = form.elements[field.key];
    values[field.key] = field.type === 'number' ? toNumber(element.value) : element.value;
  }
  return values;
}

function fillSample() {
  for (const field of tool.fields) {
    const element = form.elements[field.key];
    const value = tool.sample?.[field.key] ?? field.default ?? '';
    element.value = value;
  }
  noticeElement.textContent = '예시 입력값을 채웠습니다.';
}

function showResult(text) {
  lastResult = String(text ?? '');
  resultElement.textContent = lastResult || '결과가 없습니다.';
  resultElement.classList.remove('empty-output');
  resultElement.classList.remove('danger');
  noticeElement.textContent = '결과를 생성했습니다.';
}

function showError(error) {
  lastResult = '';
  resultElement.textContent = `입력값을 확인하세요.\n\n${error instanceof Error ? error.message : String(error)}`;
  resultElement.classList.remove('empty-output');
  resultElement.classList.add('danger');
  noticeElement.textContent = '실행 중 확인할 항목이 있습니다.';
}

function parseCSV(text, delimiter) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  row.push(cell.replace(/\r$/, ''));
  if (row.some((value) => value !== '') || rows.length === 0) rows.push(row);
  return rows;
}

function csvEscape(value, delimiter) {
  const text = String(value ?? '');
  return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replaceAll('"','""')}"` : text;
}
function toCSV(rows, delimiter) { return rows.map((row) => row.map((value) => csvEscape(value, delimiter)).join(delimiter)).join('\n'); }
function csvObjects(text, delimiter) {
  const rows = parseCSV(text.trim(), delimiter);
  if (rows.length < 1) return { headers: [], objects: [] };
  const headers = rows[0];
  const objects = rows.slice(1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  return { headers, objects };
}

function transform(values, operation) {
  const text = String(values.text ?? '');
  switch (operation) {
    case 'text-stats': {
      const chars = text.length, charsNoSpaces = text.replace(/\s/g,'').length;
      const words = (text.trim().match(/\S+/g) || []).length;
      const linesCount = text ? text.split(/\r?\n/).length : 0;
      const sentences = (text.match(/[.!?。！？]+(?=\s|$)/g) || []).length || (text.trim() ? 1 : 0);
      const readMinutes = words / 250;
      return `문자 수: ${chars.toLocaleString()}\n공백 제외 문자 수: ${charsNoSpaces.toLocaleString()}\n단어 수: ${words.toLocaleString()}\n줄 수: ${linesCount.toLocaleString()}\n문장 수: ${sentences.toLocaleString()}\n예상 읽기 시간: ${readMinutes < 1 ? '1분 미만' : `${round(readMinutes,1)}분`}`;
    }
    case 'case-converter': {
      if (values.style === 'upper') return text.toUpperCase();
      if (values.style === 'lower') return text.toLowerCase();
      if (values.style === 'sentence') return text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase());
      return text.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }
    case 'whitespace-cleaner': {
      let output = text.replace(/[ \t]+$/gm,'').replace(/^[ \t]+/gm,'');
      output = output.replace(/[ \t]{2,}/g,' ');
      if (values.blankLines === 'one') output = output.replace(/\n{3,}/g,'\n\n');
      if (values.blankLines === 'none') output = output.replace(/\n{2,}/g,'\n');
      return output.trim();
    }
    case 'line-sorter': {
      const data = lines(text);
      if (values.style === 'numeric') return data.sort((a,b) => toNumber(a)-toNumber(b)).join('\n');
      if (values.style === 'length') return data.sort((a,b) => a.length-b.length || a.localeCompare(b,'ko')).join('\n');
      const factor = values.style === 'desc' ? -1 : 1;
      return data.sort((a,b) => a.localeCompare(b,'ko')*factor).join('\n');
    }
    case 'dedupe-lines': {
      const seen = new Set();
      return text.split(/\r?\n/).filter((line) => {
        const key = values.caseSensitive === 'yes' ? line.trim() : line.trim().toLowerCase();
        if (!key || seen.has(key)) return false; seen.add(key); return true;
      }).join('\n');
    }
    case 'find-replace': {
      if (!values.find) throw new Error('찾을 내용을 입력하세요.');
      if (values.regex === 'yes') return text.replace(new RegExp(values.find, values.caseSensitive === 'yes' ? 'g' : 'gi'), values.replace ?? '');
      if (values.caseSensitive === 'yes') return text.split(values.find).join(values.replace ?? '');
      return text.replace(new RegExp(values.find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), values.replace ?? '');
    }
    case 'extract-emails': return [...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])].join('\n') || '이메일 주소를 찾지 못했습니다.';
    case 'extract-urls': return [...new Set(text.match(/https?:\/\/[^\s<>'"]+/gi) || [])].join('\n') || 'URL을 찾지 못했습니다.';
    case 'slug-generator': {
      const base = text.normalize('NFKD').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, values.separator || '-').replace(new RegExp(`^${values.separator || '-'}+|${values.separator || '-'}+$`,'g'),'');
      return values.ascii === 'yes' ? base.replace(/[^a-z0-9_-]/g,'') : base;
    }
    case 'list-converter': {
      const data = lines(text).map((line) => line.replace(/^[-*+•]\s*|^\d+[.)]\s*/,'').trim());
      if (values.style === 'number') return data.map((line,index) => `${index+1}. ${line}`).join('\n');
      if (values.style === 'check') return data.map((line) => `- [ ] ${line}`).join('\n');
      if (values.style === 'comma') return data.join(', ');
      return data.map((line) => `- ${line}`).join('\n');
    }
    case 'markdown-table': {
      const delimiter = parseDelimiter(values.delimiter);
      const rows = parseCSV(text, delimiter);
      if (!rows.length) return '';
      const width = Math.max(...rows.map((row) => row.length));
      const normalized = rows.map((row) => [...row, ...Array(width-row.length).fill('')]);
      return `| ${normalized[0].join(' | ')} |\n| ${Array(width).fill('---').join(' | ')} |\n${normalized.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
    }
    case 'text-diff': {
      const left = String(values.before || '').split(/\r?\n/), right = String(values.after || '').split(/\r?\n/);
      const max = Math.max(left.length,right.length), out=[];
      for(let i=0;i<max;i++){ if(left[i]===right[i]) out.push(`  ${left[i]??''}`); else { if(left[i]!==undefined) out.push(`- ${left[i]}`); if(right[i]!==undefined) out.push(`+ ${right[i]}`); } }
      return out.join('\n');
    }
    case 'extract-actions': {
      const candidates = text.split(/(?<=[.!?。！？])\s+|\r?\n/).map((item)=>item.trim()).filter(Boolean);
      const keywords = /(해야|필요|담당|기한|까지|요청|확인|작성|진행|완료|조치|follow|action|todo)/i;
      const found = candidates.filter((item)=>keywords.test(item));
      return found.length ? found.map((item,index)=>`${index+1}. ${item}`).join('\n') : '명확한 액션 문장을 찾지 못했습니다.';
    }
    case 'naming-converter': {
      const words = text.trim().replace(/([a-z0-9])([A-Z])/g,'$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((word)=>word.toLowerCase());
      if(values.style==='camel') return words.map((word,index)=>index?word[0].toUpperCase()+word.slice(1):word).join('');
      if(values.style==='pascal') return words.map((word)=>word[0]?.toUpperCase()+word.slice(1)).join('');
      if(values.style==='snake') return words.join('_');
      if(values.style==='constant') return words.join('_').toUpperCase();
      return words.join('-');
    }
    case 'csv-to-json': { const {objects}=csvObjects(text,parseDelimiter(values.delimiter)); return JSON.stringify(objects,null,2); }
    case 'json-to-csv': { const data=JSON.parse(text); if(!Array.isArray(data)) throw new Error('객체 배열 JSON을 입력하세요.'); const headers=[...new Set(data.flatMap(Object.keys))]; return toCSV([headers,...data.map((item)=>headers.map((header)=>item[header]??''))],parseDelimiter(values.delimiter)); }
    case 'json-formatter': { const data=JSON.parse(text); return values.style==='minify'?JSON.stringify(data):JSON.stringify(data,null,2); }
    case 'csv-column-extractor': { const delimiter=parseDelimiter(values.delimiter), {headers,objects}=csvObjects(text,delimiter), cols=String(values.columns||'').split(',').map((v)=>v.trim()).filter(Boolean); if(cols.some((c)=>!headers.includes(c))) throw new Error('존재하지 않는 열이 포함되어 있습니다.'); return toCSV([cols,...objects.map((item)=>cols.map((col)=>item[col]))],delimiter); }
    case 'csv-dedupe': { const delimiter=parseDelimiter(values.delimiter), {headers,objects}=csvObjects(text,delimiter), seen=new Set(), key=String(values.key||'').trim(); const filtered=objects.filter((item)=>{const signature=key?item[key]:JSON.stringify(item); if(seen.has(signature))return false;seen.add(signature);return true}); return toCSV([headers,...filtered.map((item)=>headers.map((h)=>item[h]))],delimiter); }
    case 'csv-sort': { const delimiter=parseDelimiter(values.delimiter), {headers,objects}=csvObjects(text,delimiter), column=values.column; if(!headers.includes(column)) throw new Error('정렬 열을 찾지 못했습니다.'); const factor=values.direction==='desc'?-1:1; objects.sort((a,b)=>values.type==='number'?(toNumber(a[column])-toNumber(b[column]))*factor:String(a[column]).localeCompare(String(b[column]),'ko')*factor); return toCSV([headers,...objects.map((item)=>headers.map((h)=>item[h]))],delimiter); }
    case 'column-stats': { const delimiter=parseDelimiter(values.delimiter), {headers,objects}=csvObjects(text,delimiter); if(!headers.includes(values.column))throw new Error('숫자 열을 찾지 못했습니다.'); const nums=objects.map((item)=>Number(item[values.column])).filter(Number.isFinite); if(!nums.length)throw new Error('계산 가능한 숫자가 없습니다.'); const sum=nums.reduce((a,b)=>a+b,0); return `열: ${values.column}\n개수: ${nums.length}\n합계: ${round(sum)}\n평균: ${round(sum/nums.length)}\n최솟값: ${round(Math.min(...nums))}\n최댓값: ${round(Math.max(...nums))}`; }
    case 'group-count': { const delimiter=parseDelimiter(values.delimiter), {headers,objects}=csvObjects(text,delimiter); if(!headers.includes(values.column))throw new Error('그룹 열을 찾지 못했습니다.'); const map=new Map(); for(const item of objects)map.set(item[values.column],(map.get(item[values.column])||0)+1); return [...map.entries()].sort((a,b)=>b[1]-a[1]).map(([key,count])=>`${key || '(빈 값)'}\t${count}건\t${percent(count/objects.length*100,1)}`).join('\n'); }
    case 'base64': return values.mode==='decode'?new TextDecoder().decode(Uint8Array.from(atob(text.trim()),(c)=>c.charCodeAt(0))):btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    case 'url-codec': return values.mode==='decode'?decodeURIComponent(text):encodeURIComponent(text);
    case 'jwt-decode': { const parts=text.trim().split('.'); if(parts.length<2)throw new Error('JWT 형식이 아닙니다.'); const decode=(part)=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=')),(c)=>c.charCodeAt(0)))); return `HEADER\n${JSON.stringify(decode(parts[0]),null,2)}\n\nPAYLOAD\n${JSON.stringify(decode(parts[1]),null,2)}\n\n※ 서명 유효성은 검증하지 않았습니다.`; }
    default: throw new Error(`지원하지 않는 변환: ${operation}`);
  }
}

function calculator(values, operation) {
  const duration = (start,end) => { const [sh,sm]=String(start).split(':').map(Number),[eh,em]=String(end).split(':').map(Number); let mins=(eh*60+em)-(sh*60+sm); if(mins<0)mins+=1440; return mins; };
  switch(operation){
    case 'project-health': { const schedule=toNumber(values.schedule),scope=toNumber(values.scope),quality=toNumber(values.quality),risk=toNumber(values.risk),team=toNumber(values.team); const score=(schedule+scope+quality+(6-risk)+team)/5*20; return `프로젝트 건강도: ${round(score,1)} / 100\n\n일정 ${schedule}/5 · 범위 ${scope}/5 · 품질 ${quality}/5 · 위험 ${risk}/5 · 팀 상태 ${team}/5\n\n판정: ${score>=80?'안정':score>=60?'주의 항목 확인':'즉시 복구 계획 필요'}`; }
    case 'date-diff': { const a=new Date(values.start),b=new Date(values.end); if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))throw new Error('시작일과 종료일을 입력하세요.'); const days=Math.round((b-a)/86400000); return `날짜 차이: ${days.toLocaleString()}일\n포함 일수: ${(Math.abs(days)+1).toLocaleString()}일\n주 단위: ${round(days/7,2)}주`; }
    case 'business-days': { let start=new Date(values.start),end=new Date(values.end); if(start>end)[start,end]=[end,start]; const holidays=new Set(lines(values.holidays)); let count=0,total=0; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){total++;const iso=d.toISOString().slice(0,10),day=d.getDay();if(day!==0&&day!==6&&!holidays.has(iso))count++;} return `전체 기간: ${total}일\n영업일: ${count}일\n주말·휴일 제외: ${total-count}일`; }
    case 'working-hours': { const work=Math.max(0,duration(values.start,values.end)-toNumber(values.break)); return `출퇴근 구간: ${Math.floor((work+toNumber(values.break))/60)}시간 ${(work+toNumber(values.break))%60}분\n휴게시간: ${toNumber(values.break)}분\n실근무: ${Math.floor(work/60)}시간 ${work%60}분\n소수 시간: ${round(work/60,2)}시간`; }
    case 'decimal-hours': { if(values.mode==='toDecimal'){const match=String(values.time||'').trim().match(/^(\d+):([0-5]?\d)$/);if(!match)throw new Error('시:분 형식으로 입력하세요. 예: 7:30');const value=toNumber(match[1])+toNumber(match[2])/60;return `${match[1]}시간 ${match[2]}분 = ${round(value,4)}시간`;} const value=toNumber(values.decimal),hours=Math.floor(value),minutes=Math.round((value-hours)*60);return `${round(value,4)}시간 = ${hours}시간 ${minutes}분`; }
    case 'meeting-cost': { const people=toNumber(values.participants),minutes=toNumber(values.minutes),hourly=toNumber(values.annualSalary)/Math.max(toNumber(values.workingHours),1); const cost=people*minutes/60*hourly; return `회의 인원: ${people}명\n회의 시간: ${minutes}분\n1인 시간당 비용: ${money(hourly)}\n총 인건비 추정: ${money(cost)}\n회의 1분당 비용: ${money(cost/Math.max(minutes,1))}`; }
    case 'pert': { const o=toNumber(values.optimistic),m=toNumber(values.likely),p=toNumber(values.pessimistic),expected=(o+4*m+p)/6,sd=(p-o)/6; return `PERT 기대 기간: ${round(expected,2)}${values.unit}\n표준편차: ${round(sd,2)}${values.unit}\n약 95% 범위: ${round(Math.max(0,expected-2*sd),2)}~${round(expected+2*sd,2)}${values.unit}`; }
    case 'priority-score': { const score=(toNumber(values.impact)*2+toNumber(values.urgency)*2+toNumber(values.confidence)+toNumber(values.risk)*1.5)/Math.max(toNumber(values.effort),1); return `우선순위 점수: ${round(score,2)}\n판정: ${score>=12?'즉시 착수 후보':score>=8?'이번 주 우선':score>=5?'일정 배치':'보류·범위 축소 검토'}`; }
    case 'percentage': { if(values.mode==='percentOf')return `${percent(values.percent)} of ${round(values.whole)} = ${round(values.whole*values.percent/100)}`; if(values.mode==='wholeFromPart')return `전체 값 = ${round(values.part/(values.percent/100))}`; if(!values.whole)throw new Error('전체 값은 0일 수 없습니다.'); return `${round(values.part)}은 ${round(values.whole)}의 ${percent(values.part/values.whole*100)}`; }
    case 'percent-change': { const before=toNumber(values.before),after=toNumber(values.after),diff=after-before;if(before===0)throw new Error('이전 값이 0이면 증감률을 계산할 수 없습니다.');return `증감액: ${round(diff)}\n증감률: ${percent(diff/before*100)}\n방향: ${diff>0?'증가':diff<0?'감소':'변화 없음'}`; }
    case 'discount': { const price=toNumber(values.price),after=price*(1-toNumber(values.discount)/100)-toNumber(values.coupon);return `최종 가격: ${money(Math.max(0,after))}\n총 절약액: ${money(price-Math.max(0,after))}\n실질 할인율: ${percent((price-Math.max(0,after))/Math.max(price,1)*100)}`; }
    case 'vat': { const amount=toNumber(values.amount),rate=toNumber(values.rate)/100; if(values.mode==='inclusive'){const supply=amount/(1+rate);return `공급가액: ${money(supply)}\n부가세: ${money(amount-supply)}\n합계: ${money(amount)}`;}return `공급가액: ${money(amount)}\n부가세: ${money(amount*rate)}\n합계: ${money(amount*(1+rate))}`; }
    case 'margin': { const price=toNumber(values.price),cost=toNumber(values.cost),profit=price-cost;if(!price)throw new Error('판매가는 0일 수 없습니다.');return `이익: ${money(profit)}\n마진율(판매가 기준): ${percent(profit/price*100)}\n원가율: ${percent(cost/price*100)}`; }
    case 'markup': { const price=toNumber(values.price),cost=toNumber(values.cost),profit=price-cost;if(!cost)throw new Error('원가는 0일 수 없습니다.');return `이익: ${money(profit)}\n마크업률(원가 기준): ${percent(profit/cost*100)}\n판매가: ${money(price)}`; }
    case 'break-even': { const fixed=toNumber(values.fixed),price=toNumber(values.price),variable=toNumber(values.variable),contribution=price-variable;if(contribution<=0)throw new Error('단가는 단위당 변동비보다 커야 합니다.');const units=Math.ceil(fixed/contribution);return `단위당 공헌이익: ${money(contribution)}\n손익분기 판매량: ${units.toLocaleString()}개\n손익분기 매출: ${money(units*price)}`; }
    case 'roi': { const investment=toNumber(values.investment),returned=toNumber(values.return);if(!investment)throw new Error('투자비용은 0일 수 없습니다.');return `순이익: ${money(returned-investment)}\nROI: ${percent((returned-investment)/investment*100)}\n회수배수: ${round(returned/investment,2)}배`; }
    case 'cagr': { const start=toNumber(values.start),end=toNumber(values.end),years=toNumber(values.years);if(start<=0||end<0||years<=0)throw new Error('시작값과 기간은 0보다 커야 합니다.');return `CAGR: ${percent((Math.pow(end/start,1/years)-1)*100,3)}\n전체 성장률: ${percent((end/start-1)*100)}\n기간: ${years}년`; }
    case 'commission': { const sales=toNumber(values.sales),base=sales*toNumber(values.rate)/100,bonus=Math.max(0,sales-toNumber(values.threshold))*toNumber(values.bonusRate)/100;return `기본 수수료: ${money(base)}\n초과분 보너스: ${money(bonus)}\n총 수수료: ${money(base+bonus)}`; }
    case 'forecast': { let current=toNumber(values.current),growth=toNumber(values.growth)/100;const rows=[];for(let i=1;i<=toNumber(values.months);i++){current*=1+growth;rows.push(`${i}개월 후\t${money(current)}`);}return rows.join('\n'); }
    case 'funnel': { const v=toNumber(values.visitors),l=toNumber(values.leads),o=toNumber(values.opportunities),c=toNumber(values.customers);return `방문 → 리드: ${percent(l/Math.max(v,1)*100)}\n리드 → 기회: ${percent(o/Math.max(l,1)*100)}\n기회 → 고객: ${percent(c/Math.max(o,1)*100)}\n전체 전환율: ${percent(c/Math.max(v,1)*100)}\n총 이탈: ${(v-c).toLocaleString()}명`; }
    case 'cac': { const total=toNumber(values.marketing)+toNumber(values.sales);return `총 획득 비용: ${money(total)}\n신규 고객: ${toNumber(values.customers).toLocaleString()}명\nCAC: ${money(total/Math.max(toNumber(values.customers),1))}`; }
    case 'ltv': { const revenue=toNumber(values.orderValue)*toNumber(values.frequency)*toNumber(values.years),ltv=revenue*toNumber(values.margin)/100;return `고객 생애 매출: ${money(revenue)}\n매출총이익 기준 LTV: ${money(ltv)}\n연간 기여이익: ${money(ltv/Math.max(toNumber(values.years),1))}`; }
    case 'roas': { const spend=toNumber(values.adSpend),revenue=toNumber(values.revenue);if(!spend)throw new Error('광고비는 0일 수 없습니다.');return `ROAS: ${percent(revenue/spend*100)}\n광고 매출 - 광고비: ${money(revenue-spend)}\n매출 배수: ${round(revenue/spend,2)}배`; }
    case 'weighted-score': { const rows=pipeRows(values.items);let weighted=0,totalWeight=0;const detail=rows.map(([name,score,weight])=>{const s=toNumber(score),w=toNumber(weight);weighted+=s*w;totalWeight+=w;return `${name}\t점수 ${s}\t가중치 ${w}`});return `${detail.join('\n')}\n\n가중 평균: ${round(weighted/Math.max(totalWeight,1),2)}`; }
    case 'allocation': { const total=toNumber(values.total),rows=pipeRows(values.items),weight=rows.reduce((sum,row)=>sum+toNumber(row[1]),0);return rows.map(([name,w])=>`${name}\t${money(total*toNumber(w)/Math.max(weight,1))}\t${percent(toNumber(w)/Math.max(weight,1)*100,1)}`).join('\n'); }
    case 'candidate-score': { const weights=pipeRows(values.weights).map(([name,w])=>({name,weight:toNumber(w)})),totalWeight=weights.reduce((sum,item)=>sum+item.weight,0),candidates=pipeRows(values.candidates);if(!weights.length||!candidates.length)throw new Error('가중치와 후보자 점수를 입력하세요.');const results=candidates.map(([name,scoresText])=>{const scores=String(scoresText||'').split(',').map(Number);const weighted=weights.reduce((sum,item,index)=>sum+(Number.isFinite(scores[index])?scores[index]:0)*item.weight,0)/Math.max(totalWeight,1);return {name,weighted,scores};}).sort((a,b)=>b.weighted-a.weighted);return results.map((item,index)=>`${index+1}위 ${item.name}\n종합 점수: ${round(item.weighted,2)} / 5\n세부: ${weights.map((weight,i)=>`${weight.name} ${item.scores[i]??0}`).join(' · ')}`).join('\n\n'); }
    case 'leave-balance': { const remaining=toNumber(values.granted)-toNumber(values.used)-toNumber(values.planned);return `부여 연차: ${round(values.granted,1)}일\n사용: ${round(values.used,1)}일\n예정: ${round(values.planned,1)}일\n예정 반영 잔여: ${round(remaining,1)}일\n월평균 소진 목표: ${round(Math.max(remaining,0)/Math.max(toNumber(values.monthsLeft),1),1)}일`; }
    case 'timestamp': { if(values.mode==='toTimestamp'){const ms=new Date(values.datetime).getTime();if(Number.isNaN(ms))throw new Error('날짜·시간을 입력하세요.');return `Unix 초: ${Math.floor(ms/1000)}\nUnix 밀리초: ${ms}\nISO: ${new Date(ms).toISOString()}`;}const raw=toNumber(values.timestamp),ms=values.unit==='milliseconds'?raw:raw*1000,date=new Date(ms);if(Number.isNaN(date.getTime()))throw new Error('올바른 타임스탬프가 아닙니다.');return `로컬: ${date.toLocaleString('ko-KR')}\nUTC: ${date.toUTCString()}\nISO: ${date.toISOString()}`; }
    case 'uptime': { const days=toNumber(values.days),minutes=days*24*60;if(values.mode==='actual'){const uptime=(1-toNumber(values.downtime)/minutes)*100;return `실제 가동률: ${percent(uptime,5)}\n관측 시간: ${round(minutes/60,2)}시간\n장애시간: ${round(values.downtime,2)}분`;}const allowed=minutes*(1-toNumber(values.target)/100);return `목표 가동률: ${percent(values.target,5)}\n관측 기간: ${days}일\n허용 장애시간: ${Math.floor(allowed/60)}시간 ${round(allowed%60,2)}분\n초 단위: ${Math.round(allowed*60).toLocaleString()}초`; }
    default: throw new Error(`지원하지 않는 계산: ${operation}`);
  }
}

function gherkin(value, label) {
  const rows = pipeRows(value);
  return rows.map(([given,when,then],index)=>`### ${label} ${index+1}\nGiven ${given || '-'}\nWhen ${when || '-'}\nThen ${then || '-'}`).join('\n\n') || `### ${label}\nGiven -\nWhen -\nThen -`;
}
function daysBefore(dateString, offset) { const date=new Date(`${dateString}T12:00:00`); date.setDate(date.getDate()-offset); return date.toISOString().slice(0,10); }

function generator(values) {
  if (tool.operation === 'filename-builder') {
    const safe=(v)=>String(v||'').trim().replace(/[\\/:*?"<>|\s]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return [values.date,safe(values.project),safe(values.docType),safe(values.version)].filter(Boolean).join('_') + (values.extension ? `.${String(values.extension).replace(/^\./,'')}` : '');
  }
  const context = { ...values };
  for (const field of tool.fields) {
    const value = values[field.key];
    context[`${field.key}_inline`] = inline(value);
    context[`${field.key}_list`] = bullet(value);
    context[`${field.key}_numbered`] = numbered(value);
    context[`${field.key}_checklist`] = checklist(value);
    context[`${field.key}_label`] = selectLabel(field,value);
  }
  context.agenda_items = (()=>{const topics=lines(values.topics),minutes=Math.max(toNumber(values.minutes),topics.length*5+10),usable=Math.max(0,minutes-10),each=topics.length?Math.floor(usable/topics.length):0;return ['1. 시작·목적 확인 — 5분',...topics.map((topic,index)=>`${index+2}. ${topic} — ${index===topics.length-1?usable-each*(topics.length-1):each}분`),`${topics.length+2}. 결정·담당자·기한 확인 — 5분`].join('\n');})();
  context.discussion_list=bullet(values.discussion); context.decisions_list=bullet(values.decisions);
  context.actions_table=tableRows(values.actions,3); context.action_rows=tableRows(values.items,4);
  context.metrics_table=tableRows(values.metrics,3);
  context.session_rows=tableRows(values.sessions,3);
  context.task_rows=tableRows(values.tasks,3);
  context.raci_rows=tableRows(values.rows,5);
  context.risk_rows=tableRows(values.risks,6,(row)=>[row[0],row[1],row[2],toNumber(row[1])*toNumber(row[2]),row[3],row[4]]);
  context.milestone_rows=tableRows(values.milestones,4); context.dependency_rows=tableRows(values.dependencies,4);
  context.normal_gherkin=gherkin(values.normal,'정상 흐름'); context.edge_gherkin=gherkin(values.edge,'경계 조건'); context.error_gherkin=gherkin(values.error,'오류 흐름');
  context.focus_blocks=(()=>{const tasks=pipeRows(values.tasks).map(([name,mins,importance])=>({name,mins:toNumber(mins,25),importance:toNumber(importance,1)})).sort((a,b)=>b.importance-a.importance),available=toNumber(values.available,180);let used=0,index=1;const out=[];for(const task of tasks){if(used>=available)break;const block=Math.min(task.mins,values.energy==='low'?35:values.energy==='high'?75:50,available-used);out.push(`${index}. ${task.name} — ${block}분 집중`);used+=block;index++;if(used+10<=available){out.push(`   휴식·정리 — 10분`);used+=10;}}if(used<available)out.push(`${index}. 남은 시간 — ${available-used}분 · 메일·정리`);return out.join('\n');})();
  context.backplan_rows=(()=>{let offset=0;const stages=[['최종 검토',toNumber(values.reviewDays)],['수정 완료',toNumber(values.revisionDays)],['초안 완료',toNumber(values.draftDays)],['자료 수집 시작',toNumber(values.researchDays)]];return stages.map(([name,days])=>{offset+=days;return `| ${name} | ${daysBefore(values.deadline,offset)} | ${days}일 |`;}).join('\n');})();
  context.competency_rows=tableRows(values.competencies,3);
  context.interview_questions=lines(values.competencies).map((competency,index)=>`### ${index+1}. ${competency}\n- 최근 ${competency} 역량을 사용한 사례를 상황·행동·결과 순서로 설명해 주세요.\n- 선택하지 않은 대안은 무엇이었고 왜 제외했나요?\n- ${values.scenario || '예상하지 못한 문제가 발생한 상황'}에서 첫 30분에 무엇을 확인하겠습니까?`).join('\n\n');
  context.goal_result_table=tableRows(values.goals,3); context.module_rows=tableRows(values.modules,3); context.timeline_table=tableRows(values.timeline,2);
  context.level_label=selectLabel(tool.fields.find((field)=>field.key==='level')||{},values.level); context.type_label=selectLabel(tool.fields.find((field)=>field.key==='type')||{},values.type); context.energy_label=selectLabel(tool.fields.find((field)=>field.key==='energy')||{},values.energy);
  return String(tool.template || '').replace(/\{\{([^}]+)\}\}/g,(_,key)=>context[key] ?? '');
}

function utility(values, operation) {
  if(operation==='uuid'){const count=Math.max(1,Math.min(100,toNumber(values.count,1)));return Array.from({length:count},()=>crypto.randomUUID()).map((id)=>values.uppercase==='yes'?id.toUpperCase():id).join('\n');}
  if(operation==='password-generator'){const pools=[];if(values.lower==='yes')pools.push('abcdefghijkmnopqrstuvwxyz');if(values.upper==='yes')pools.push('ABCDEFGHJKLMNPQRSTUVWXYZ');if(values.numbers==='yes')pools.push('23456789');if(values.symbols==='yes')pools.push('!@#$%^&*_-+=');if(!pools.length)throw new Error('최소 한 가지 문자 구성을 포함하세요.');const all=pools.join(''),length=Math.max(8,Math.min(128,toNumber(values.length,20))),count=Math.max(1,Math.min(50,toNumber(values.count,5)));const rand=(max)=>crypto.getRandomValues(new Uint32Array(1))[0]%max;return Array.from({length:count},()=>{const chars=pools.map((pool)=>pool[rand(pool.length)]);while(chars.length<length)chars.push(all[rand(all.length)]);for(let i=chars.length-1;i>0;i--){const j=rand(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}return chars.join('');}).join('\n');}
  throw new Error(`지원하지 않는 유틸리티: ${operation}`);
}

function validator(values, operation) {
  if(operation==='password-strength'){const value=String(values.password||'');let score=0;const notes=[];if(value.length>=12)score+=2;else notes.push('12자 이상 권장');if(value.length>=20)score++;if(/[a-z]/.test(value))score++;else notes.push('소문자 없음');if(/[A-Z]/.test(value))score++;else notes.push('대문자 없음');if(/\d/.test(value))score++;else notes.push('숫자 없음');if(/[^A-Za-z0-9]/.test(value))score++;else notes.push('기호 없음');if(/(.)\1{2,}/.test(value)){score-=2;notes.push('같은 문자 3회 이상 반복');}if(/1234|abcd|qwer|password|admin/i.test(value)){score-=3;notes.push('흔한 연속·사전 패턴 포함');}score=Math.max(0,Math.min(8,score));const label=score>=7?'강함':score>=5?'보통':score>=3?'약함':'매우 약함';return `강도: ${label}\n점수: ${score} / 8\n길이: ${value.length}자\n\n점검 항목\n${notes.length?notes.map((note)=>`- ${note}`).join('\n'):'- 뚜렷한 취약 패턴을 찾지 못했습니다.'}\n\n※ 실제 안전성은 고유성·유출 여부·2단계 인증에도 좌우됩니다.`;}
  if(operation==='regex'){let regex;try{regex=new RegExp(values.pattern,values.flags);}catch(error){throw new Error(`정규식 문법 오류: ${error.message}`);}const matches=[];if(regex.global){let match;while((match=regex.exec(values.text))!==null){matches.push({value:match[0],index:match.index,groups:match.slice(1)});if(match[0]==='')regex.lastIndex++;}}else{const match=regex.exec(values.text);if(match)matches.push({value:match[0],index:match.index,groups:match.slice(1)});}return matches.length?matches.map((match,index)=>`${index+1}. ${match.value}\n   위치: ${match.index}\n   캡처: ${match.groups.length?match.groups.join(' | '):'없음'}`).join('\n\n'):'일치 항목이 없습니다.';}
  throw new Error(`지원하지 않는 검사: ${operation}`);
}

function renderTimer(values) {
  clearInterval(timerState?.interval);
  const focus=Math.max(1,toNumber(values.focus,25)),breakMinutes=Math.max(1,toNumber(values.break,5));
  resultElement.classList.remove('empty-output','danger');
  resultElement.innerHTML='';
  const wrapper=document.createElement('div');wrapper.className='timer-card';wrapper.innerHTML=`<div class="timer-clock" id="timer-clock">${String(focus).padStart(2,'0')}:00</div><div class="timer-status" id="timer-status">집중 세션 준비</div><div class="buttons" style="justify-content:center"><button class="button primary" id="timer-start">시작</button><button class="button" id="timer-pause">일시정지</button><button class="button" id="timer-reset">초기화</button></div>`;resultElement.appendChild(wrapper);
  timerState={remaining:focus*60,total:focus*60,running:false,mode:'focus',interval:null,focus,breakMinutes};
  const draw=()=>{const mins=Math.floor(timerState.remaining/60),secs=timerState.remaining%60;$('#timer-clock').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;$('#timer-status').textContent=timerState.mode==='focus'?'집중 세션':'휴식 세션';};
  const start=()=>{if(timerState.running)return;timerState.running=true;timerState.interval=setInterval(()=>{timerState.remaining--;draw();if(timerState.remaining<=0){clearInterval(timerState.interval);timerState.running=false;timerState.mode=timerState.mode==='focus'?'break':'focus';timerState.remaining=(timerState.mode==='focus'?focus:breakMinutes)*60;draw();noticeElement.textContent=timerState.mode==='break'?'집중 세션 완료. 휴식을 시작하세요.':'휴식 완료. 다음 집중 세션을 시작하세요.';}},1000);};
  $('#timer-start').onclick=start;$('#timer-pause').onclick=()=>{clearInterval(timerState.interval);timerState.running=false;};$('#timer-reset').onclick=()=>{clearInterval(timerState.interval);timerState.running=false;timerState.mode='focus';timerState.remaining=focus*60;draw();};draw();lastResult=`포모도로 설정\n집중 ${focus}분\n휴식 ${breakMinutes}분`;noticeElement.textContent='타이머를 준비했습니다.';
}

function execute(values) {
  if(tool.mode==='transform')return transform(values,tool.operation);
  if(tool.mode==='calculator')return calculator(values,tool.operation);
  if(tool.mode==='generator')return generator(values);
  if(tool.mode==='utility')return utility(values,tool.operation);
  if(tool.mode==='validator')return validator(values,tool.operation);
  if(tool.mode==='timer')return renderTimer(values);
  throw new Error('지원하지 않는 도구 유형입니다.');
}

form.addEventListener('submit',(event)=>{event.preventDefault();try{const output=execute(getValues());if(tool.mode!=='timer')showResult(output);}catch(error){showError(error);}});
$('#sample').addEventListener('click',fillSample);
form.addEventListener('reset',()=>{setTimeout(()=>{lastResult='';resultElement.textContent='입력값을 확인한 뒤 실행 버튼을 누르세요.';resultElement.className='output empty-output';noticeElement.textContent='초기화했습니다.';clearInterval(timerState?.interval);},0);});
$('#copy').addEventListener('click',async()=>{if(!lastResult){noticeElement.textContent='먼저 결과를 생성하세요.';return;}try{await navigator.clipboard.writeText(lastResult);noticeElement.textContent='결과를 클립보드에 복사했습니다.';}catch{noticeElement.textContent='브라우저에서 자동 복사를 허용하지 않았습니다.';}});
$('#download').addEventListener('click',()=>{if(!lastResult){noticeElement.textContent='먼저 결과를 생성하세요.';return;}const blob=new Blob([lastResult],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=`${tool.slug}-${new Date().toISOString().slice(0,10)}.txt`;anchor.click();URL.revokeObjectURL(url);noticeElement.textContent='TXT 파일을 저장했습니다.';});
