export const moneyFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
export const numberFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

export const n = (values, key) => {
  const value = Number(values[key]);
  return Number.isFinite(value) ? value : 0;
};
export const s = (values, key) => String(values[key] ?? '').trim();
export const money = (value) => `${moneyFormatter.format(Math.round(Number(value) || 0))}원`;
export const number = (value, digits = 2) =>
  Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: digits });
export const percent = (value, digits = 2) => `${number(value, digits)}%`;
export const safeDivide = (a, b) => (Number(b) === 0 ? 0 : Number(a) / Number(b));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lines = (value) =>
  String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
export const unique = (items) => [...new Set(items)];
export const slugify = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
export const roundUp = (value, unit = 1) => Math.ceil(value / Math.max(1, unit)) * Math.max(1, unit);
export const roundNearest = (value, unit = 1) => Math.round(value / Math.max(1, unit)) * Math.max(1, unit);
export const isoDate = (date) => new Date(date).toISOString().slice(0, 10);
export const addDays = (date, days) => {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + Number(days || 0));
  return isoDate(next);
};
export const daysBetween = (a, b) => {
  const start = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  return Math.round((end - start) / 86400000);
};
export const parsePipeRows = (value, minColumns = 1) =>
  lines(value)
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((row) => row.length >= minColumns);

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = String(text ?? '').replace(/\r\n/g, '\n');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.length > 0)) rows.push(row);
  return rows;
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function result({ title, summary = '', metrics = [], rows = [], text = '', warning = '', downloadName = '' }) {
  return { title, summary, metrics, rows, text, warning, downloadName };
}

export function interpolate(template, values) {
  return String(template ?? '').replace(/{{\s*([\w]+)\s*}}/g, (_, key) => String(values[key] ?? '').trim());
}

export function contribution(salePrice, cost, feeRate, fixedCost = 0) {
  const fee = salePrice * feeRate / 100;
  const profit = salePrice - cost - fee - fixedCost;
  return { fee, profit, marginRate: safeDivide(profit, salePrice) * 100 };
}

export function channelRow(name, salePrice, cost, packaging, feeRate, ad, shipping) {
  const fee = salePrice * feeRate / 100;
  const profit = salePrice - cost - packaging - fee - ad - shipping;
  return { name, fee, ad, shipping, profit, marginRate: safeDivide(profit, salePrice) * 100 };
}

export const forbiddenRules = [
  { label: '효과 보장 표현', pattern: /(무조건|반드시|100%|완벽하게|확실히|보장)/gi },
  { label: '최상급·순위 표현', pattern: /(국내\s*1위|세계\s*1위|최고|최초|유일|압도적)/gi },
  { label: '의학·치료 표현', pattern: /(치료|완치|질병|통증 제거|부작용 없음|의사가 추천)/gi },
  { label: '기적·과도한 변화 표현', pattern: /(기적|즉시 효과|단기간에|살 빠지는|인생템)/gi },
  { label: '인증·공식 표현', pattern: /(공식 인증|정부 인증|기관 보증|특허 제품)/gi }
];

export const inquiryRules = [
  ['배송', /(배송|출고|택배|도착|송장|집하)/i],
  ['교환', /(교환|색상 변경|옵션 변경)/i],
  ['반품·환불', /(반품|환불|취소|회수)/i],
  ['상품 불량', /(깨졌|파손|불량|누수|작동 안|고장)/i],
  ['상품 정보', /(사이즈|크기|소재|재고|구성|호환|색상)/i],
  ['결제', /(결제|카드|쿠폰|영수증|현금영수증)/i],
  ['사용법', /(사용법|세척|보관|설치|조립)/i]
];

export const reviewRules = [
  ['배송', /(배송|택배|도착|출고)/i],
  ['포장', /(포장|박스|완충|찌그러)/i],
  ['품질', /(품질|튼튼|불량|파손|내구|마감)/i],
  ['사용성', /(사용|편하|불편|세척|무겁|가볍)/i],
  ['가격', /(가격|비싸|저렴|가성비)/i],
  ['CS', /(문의|답변|상담|응대)/i]
];

export const positiveWords = new Set(['좋다', '좋아요', '만족', '빠르다', '빠르고', '예쁘다', '예쁩니다', '편하다', '편합니다', '꼼꼼', '튼튼']);
export const negativeWords = new Set(['불편', '느리다', '늦다', '비싸다', '깨지다', '파손', '불량', '아쉽다', '무겁다', '누수']);
export const stopWords = new Set(['그리고', '하지만', '정말', '조금', '너무', '제품', '상품', '구매', '사용', '배송은', '보온은', '있어요', '합니다', '했어요']);
