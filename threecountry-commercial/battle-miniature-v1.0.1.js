import { HERO_LORE } from './commercial-character-v4.js';

export const BATTLE_MINIATURE_VERSION = '1.0.1';
const byName = new Map(Object.entries(HERO_LORE).map(([id,p]) => [p.name,id]));
const lastX = new WeakMap();
let queued = false;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe = (v) => String(v).replace(/[^a-z0-9_-]/gi,'-');

function heroId(unit, portrait){ return unit?.dataset.hero || unit?.dataset.commercialHeroId || portrait?.dataset.heroId || byName.get(portrait?.getAttribute('aria-label') || '') || ''; }
function state(unit){
  if(unit.classList.contains('defeated') || unit.classList.contains('dead') || unit.dataset.dead === 'true') return 'retreat';
  if(unit.classList.contains('ccv3-skill-active') || unit.classList.contains('skill-active') || unit.classList.contains('using-skill')) return 'skill';
  if(unit.classList.contains('ccv3-hit') || unit.classList.contains('hit') || unit.classList.contains('damaged')) return 'hit';
  if(unit.classList.contains('ccv3-attacking') || unit.classList.contains('attacking') || unit.classList.contains('attack-active')) return 'attack';
  if(unit.classList.contains('guarding') || unit.classList.contains('defending')) return 'guard';
  if(unit.classList.contains('moving') || unit.classList.contains('ccv3-moving') || unit.dataset.moving === 'true') return 'walk';
  if(unit.classList.contains('victory')) return 'victory';
  return 'idle';
}
function weapon(p){
  const trim=p.colors[2];
  const shapes={
    sword:`<path d="M124 47L96 151M120 43l15 12-17 7M91 134l18 5"/>`,
    dual:`<path d="M44 70l20 86M127 69l-21 87M40 66l13 10M132 64l-14 10"/>`,
    spear:`<path d="M135 22L104 178M134 16l12 19-18-4M130 39q14 8 22 2"/>`,
    guandao:`<path d="M136 10L102 180M135 8q31 10 8 41q-12-13-25-14q15-10 17-27M130 44q17 8 25 1"/>`,
    halberd:`<path d="M135 14L102 180M134 10l14 20-18-2M133 28q25 4 12 21q-7-10-19-9"/>`,
    bow:`<path d="M136 39q-45 54 0 116M135 39v116M123 98h31"/>`,
    fan:`<path d="M99 132q20-50 52-19q-12 31-52 19M106 129l38-15M114 131l26-28M123 132l9-31"/>`,
    scroll:`<path d="M91 125q28-10 50 1v35q-24-10-50 1zM101 136h28M101 145h23M101 153h18"/>`,
    shield:`<path d="M111 104q39 2 32 48q-13 29-32 36q-27-10-32-37q4-43 32-47zM111 116v59M90 146h42"/>`
  };
  return `<g class="bm1-weapon bm1-${esc(p.weaponShape || 'sword')}" stroke="#242322" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">${shapes[p.weaponShape] || shapes.sword}<circle cx="108" cy="120" r="3" fill="${trim}" stroke="none"/></g>`;
}
function beard(p){
  if(!p.beard) return '';
  if(p.beard==='long') return '<path class="bm1-beard" d="M72 70q15 17 30 0q4 48-14 72q-15-17-20-44q-3-18 4-28z" fill="#171413"/>';
  if(p.beard==='wide'||p.beard==='wild') return '<path class="bm1-beard" d="M61 72q12 17 22 8q8 11 17 0q10 10 22-9q0 31-17 42q-12-11-18 7q-7-16-17-5q-13-14-9-43z" fill="#171413"/>';
  return '<path class="bm1-beard" d="M73 76q13 11 25 0q-1 25-13 29q-12-4-12-29z" fill="#171413"/>';
}
function headgear(p){
  const [main,sub,trim]=p.colors;
  if(p.head==='scholar') return `<g class="bm1-headgear"><path d="M61 58q9-35 40-37q19 9 15 36l-13 10H73z" fill="${main}" stroke="${trim}" stroke-width="3"/><path d="M100 24l29-17" stroke="${trim}" stroke-width="4"/></g>`;
  if(p.head==='band'||p.head==='soft') return `<g class="bm1-headgear"><path d="M55 58q31-18 62 0l-5 12q-27-12-52 0z" fill="${sub}" stroke="${trim}" stroke-width="3"/><path d="M111 62q28 8 18 24" stroke="${sub}" stroke-width="7"/></g>`;
  if(p.head==='hood') return `<path class="bm1-headgear" d="M47 76q-3-58 38-67q42 11 39 67l-21-22q-3-23-18-27q-18 4-20 27z" fill="${main}" stroke="${trim}" stroke-width="3"/>`;
  const tall=p.head==='heavy'?7:0;
  return `<g class="bm1-headgear"><path d="M53 ${58-tall}q3-${39+tall} 32-${45+tall}q33 7 35 ${45+tall}l-17 13H70z" fill="${main}" stroke="${trim}" stroke-width="3.5"/><path d="M85 ${14-tall}V2q19-3 25 10" stroke="${sub}" stroke-width="7"/><path d="M57 ${51-tall}h59" stroke="${trim}" stroke-width="3"/></g>`;
}
function draw(id){
  const p=HERO_LORE[id]; if(!p) return '';
  const [main,sub,trim]=p.colors;
  const bodyScale=p.body==='massive'?1.18:p.body==='tall'?1.05:p.body==='slim'?0.87:1;
  const skin=p.redFace?'#a95f51':p.pale?'#d6ae91':'#d2a07e';
  const faceWidth=p.face==='square'?29:p.face==='round'?28:p.face==='long'?24:25;
  const key=safe(id);
  return `<svg class="hero-portrait battle-miniature-v1" viewBox="0 0 160 190" role="img" aria-label="${esc(p.name)}" data-commercial-mini-v1="1" data-hero-id="${esc(id)}" data-state="idle"><defs><linearGradient id="bm1-armor-${key}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${sub}"/><stop offset="1" stop-color="${main}"/></linearGradient><filter id="bm1-shadow-${key}" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="6" stdDeviation="3" flood-color="#000" flood-opacity=".7"/></filter></defs><ellipse class="bm1-ground-shadow" cx="82" cy="177" rx="43" ry="9" fill="#000" opacity=".42"/><g class="bm1-rig" filter="url(#bm1-shadow-${key})"><path class="bm1-cape" d="M54 86q31-23 60 0l17 79q-48 21-94 0z" fill="${main}" opacity=".84"/><g class="bm1-leg bm1-leg-left"><path d="M68 138l-9 35" stroke="#1b2224" stroke-width="13" stroke-linecap="round"/><path d="M58 172l-15 6" stroke="#171b1d" stroke-width="8" stroke-linecap="round"/></g><g class="bm1-leg bm1-leg-right"><path d="M96 138l8 35" stroke="#1b2224" stroke-width="13" stroke-linecap="round"/><path d="M103 173l15 5" stroke="#171b1d" stroke-width="8" stroke-linecap="round"/></g><g class="bm1-torso" transform="translate(82 112) scale(${bodyScale} 1) translate(-82 -112)"><path d="M43 142q3-61 39-73q38 11 41 73l-19 15H61z" fill="url(#bm1-armor-${key})" stroke="#0e1517" stroke-width="4"/><path d="M55 93h55M52 112h61M50 131h65" stroke="${trim}" stroke-width="3" opacity=".65"/><path d="M37 94q12-27 31-25l12 18-24 32zM128 94q-12-27-31-25l-12 18 24 32z" fill="${main}" stroke="${trim}" stroke-width="3"/><circle cx="82" cy="105" r="14" fill="${main}" stroke="${trim}" stroke-width="3"/><text x="82" y="111" text-anchor="middle" font-size="13" font-weight="900" fill="${trim}">${p.emblem}</text></g><g class="bm1-arm bm1-arm-back"><path d="M109 98l23 29" stroke="${sub}" stroke-width="12" stroke-linecap="round"/></g><g class="bm1-arm bm1-arm-front"><path d="M54 99l-15 35" stroke="${sub}" stroke-width="12" stroke-linecap="round"/></g>${weapon(p)}<g class="bm1-head"><ellipse cx="82" cy="60" rx="${faceWidth}" ry="31" fill="${skin}"/><path d="M62 47q20-21 42 0q-8-25-22-26q-14 2-20 26z" fill="#191514"/><path d="M65 58q8-5 15 0M88 58q8-5 15 0" stroke="#2e211e" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="74" cy="58" r="2.2"/><circle cx="96" cy="58" r="2.2"/><path d="M82 62q-4 10 2 12" stroke="#8a5949" stroke-width="2" fill="none"/><path d="M73 79q10 5 20 0" stroke="#6b4037" stroke-width="2.4" fill="none"/>${p.eyepatch?'<rect x="87" y="49" width="18" height="14" rx="5" fill="#171515" stroke="#d1a65d" stroke-width="2"/><path d="M86 48l22-12" stroke="#171515" stroke-width="4"/>':''}${p.scar?'<path d="M64 66l12 14M102 43l-9 18" stroke="#79362f" stroke-width="2" opacity=".8"/>':''}</g>${headgear(p)}${beard(p)}</g><g class="bm1-status"><circle cx="133" cy="28" r="12" fill="${main}" stroke="${trim}" stroke-width="2"/><text x="133" y="33" text-anchor="middle" font-size="11" font-weight="900" fill="${trim}">${p.emblem}</text></g></svg>`;
}
function update(unit){const old=unit.querySelector('svg.hero-portrait');const id=heroId(unit,old);if(!id||!HERO_LORE[id])return;let svg=unit.querySelector('svg[data-commercial-mini-v1]');if(!svg){const t=document.createElement('template');t.innerHTML=draw(id).trim();const next=t.content.firstElementChild;if(!next)return;old?.replaceWith(next);if(!old)unit.prepend(next);svg=next;}const x=Number(unit.dataset.x??getComputedStyle(unit).getPropertyValue('--x'));const prev=lastX.get(unit);if(Number.isFinite(x)){if(Number.isFinite(prev)&&x!==prev)unit.dataset.facing=x>prev?'right':'left';else if(!unit.dataset.facing)unit.dataset.facing=unit.classList.contains('enemy')?'left':'right';lastX.set(unit,x);}svg.dataset.state=state(unit);svg.dataset.facing=unit.dataset.facing||(unit.classList.contains('enemy')?'left':'right');}
function enhance(){queued=false;document.querySelectorAll('.battle-unit').forEach(update);document.documentElement.classList.add('battle-miniature-v1-ready');window.__battleMiniatureV1={ready:true,version:BATTLE_MINIATURE_VERSION,officerCount:Object.keys(HERO_LORE).length,states:['idle','walk','attack','skill','hit','guard','victory','retreat']};}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhance);}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-x','data-y','data-state','data-hp','data-dead']});schedule();
