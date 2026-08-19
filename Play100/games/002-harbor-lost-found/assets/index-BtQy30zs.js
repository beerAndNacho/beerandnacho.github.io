(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`play100:arcade:v1`,t={none:0,bronze:1,silver:2,gold:3},n=()=>({version:1,games:{},recentGames:[]});function r(){try{let e=window.localStorage,t=`__play100_test__`;return e.setItem(t,t),e.removeItem(t),e}catch{return null}}function i(){let t=r();if(!t)return n();try{let r=JSON.parse(t.getItem(e)??`null`);return!r||r.version!==1||typeof r.games!=`object`?n():{version:1,games:r.games??{},recentGames:Array.isArray(r.recentGames)?r.recentGames.slice(0,12):[]}}catch{return n()}}function a(t){r()?.setItem(e,JSON.stringify(t))}function o(e,t={}){let n=window;if(n.gtag?.(`event`,e,t),n.clarity?.(`event`,e),n.clarity)for(let[e,r]of Object.entries(t))n.clarity(`set`,e,String(r));window.dispatchEvent(new CustomEvent(`play100:analytics`,{detail:{eventName:e,params:t}}))}function s(e){let t=i(),n=t.games[e]??{plays:0,bestScore:0,completedLevels:{},lastPlayedAt:new Date(0).toISOString()},r={...n,plays:n.plays+1,lastPlayedAt:new Date().toISOString()};return t.games[e]=r,t.recentGames=[e,...t.recentGames.filter(t=>t!==e)].slice(0,12),a(t),o(`game_start`,{game_id:e,play_count:r.plays}),r}function c(e,n,r){let s=i(),c=s.games[e]??{plays:0,bestScore:0,completedLevels:{},lastPlayedAt:new Date().toISOString()},l=String(n),u=c.completedLevels[l],d=!u||t[r.medal]>t[u.medal]||r.medal===u.medal&&r.score>u.score,f={...c.completedLevels};d&&(f[l]={...r,completedAt:new Date().toISOString()});let p={...c,bestScore:Math.max(c.bestScore,r.score),completedLevels:f,lastPlayedAt:new Date().toISOString()};return s.games[e]=p,s.recentGames=[e,...s.recentGames.filter(t=>t!==e)].slice(0,12),a(s),o(`level_complete`,{game_id:e,level_id:l,medal:r.medal,score:r.score,rotations:r.rotations}),p}function l(e){return i().games[e]??null}function u(e,t=new Date){if(e<=0)return 0;let n=`${t.getUTCFullYear()}-${t.getUTCMonth()+1}-${t.getUTCDate()}`,r=0;for(let e of n)r=r*31+e.charCodeAt(0)>>>0;return r%e}function d(e,t=.08,n=.025){try{let r=window.AudioContext??window.webkitAudioContext;if(!r)return;let i=new r,a=i.createOscillator(),o=i.createGain();a.type=`sine`,a.frequency.value=e,o.gain.setValueAtTime(n,i.currentTime),o.gain.exponentialRampToValueAtTime(1e-4,i.currentTime+t),a.connect(o),o.connect(i.destination),a.start(),a.stop(i.currentTime+t),a.addEventListener(`ended`,()=>{i.close()})}catch{}}function f(e){return`GAME-${String(e).padStart(3,`0`)}`}function p(){return`
    <symbol id="obj-key" viewBox="-30 -30 60 60">
      <circle cx="-12" cy="0" r="9" fill="none" stroke="currentColor" stroke-width="6"/>
      <path d="M-3 0H22M12 0V9M20 0V7" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    </symbol>
    <symbol id="obj-glove" viewBox="-30 -30 60 60">
      <path d="M-13 22C-21 14-21 5-17-2l2-16c1-5 8-4 8 1v12l2-20c1-5 8-4 8 1v18l3-17c1-5 8-3 7 2L11-3l5-12c2-5 9-2 7 3L18 5c-2 10-8 18-18 21-5 2-9 0-13-4Z" fill="currentColor" stroke="#182326" stroke-width="2"/>
    </symbol>
    <symbol id="obj-sock" viewBox="-30 -30 60 60">
      <path d="M-13-24H8v27c0 7 7 9 14 11l-5 12c-12-2-24-7-29-16-3-5-1-12-1-18Z" fill="currentColor" stroke="#182326" stroke-width="2"/>
      <path d="M-12-13H8M-12-2H8" stroke="#b74f42" stroke-width="4"/>
    </symbol>
    <symbol id="obj-camera" viewBox="-30 -30 60 60">
      <rect x="-24" y="-16" width="48" height="34" rx="5" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <rect x="-13" y="-22" width="18" height="8" rx="2" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <circle cx="3" cy="1" r="11" fill="#b9d2cf" stroke="#172326" stroke-width="4"/>
      <circle cx="3" cy="1" r="5" fill="#294f58"/>
      <circle cx="-16" cy="-7" r="2.5" fill="#e7a936"/>
    </symbol>
    <symbol id="obj-compass" viewBox="-30 -30 60 60">
      <circle cx="0" cy="0" r="23" fill="#efe4c3" stroke="currentColor" stroke-width="5"/>
      <circle cx="0" cy="0" r="15" fill="none" stroke="#584a36" stroke-width="2"/>
      <path d="M0-17 6 3 0 17-6-3Z" fill="#d9533f"/>
      <path d="M0-17-6-3 0 2 6-3Z" fill="#294f58"/>
      <circle r="3" fill="#584a36"/>
    </symbol>
    <symbol id="obj-bottle" viewBox="-30 -30 60 60">
      <path d="M-7-25H7v10l6 7v27c0 5-4 8-9 8H-4c-5 0-9-3-9-8V-8l6-7Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <path d="M-10 4H10" stroke="#d9eee8" stroke-width="4" opacity=".7"/>
    </symbol>
    <symbol id="obj-umbrella" viewBox="-34 -30 68 60">
      <path d="M-28 0C-23-20 20-22 28 0c-7-5-13-5-19 0-6-5-12-5-18 0-6-5-12-5-19 0Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <path d="M0-16V19c0 9 13 9 13 1" fill="none" stroke="#172326" stroke-width="4" stroke-linecap="round"/>
    </symbol>
    <symbol id="obj-starfish" viewBox="-30 -30 60 60">
      <path d="m0-25 7 16 18-5-11 14 13 12-18-1-4 17-8-16-17 6 10-15-13-11 18 1Z" fill="currentColor" stroke="#6b3b32" stroke-width="2"/>
      <circle cx="-5" cy="-5" r="1.5" fill="#f2c2a0"/><circle cx="8" cy="4" r="1.5" fill="#f2c2a0"/><circle cx="-2" cy="12" r="1.5" fill="#f2c2a0"/>
    </symbol>
    <symbol id="obj-hat" viewBox="-34 -30 68 60">
      <path d="M-20 2c2-18 38-18 40 0l5 12H-25Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <path d="M-28 14H28c-4 9-15 13-28 13s-24-4-28-13Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <path d="M-18 7H18" stroke="#2e6575" stroke-width="5"/>
    </symbol>
    <symbol id="obj-paperboat" viewBox="-34 -30 68 60">
      <path d="M-29 10 0-22l29 32-14 16h-30Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <path d="M0-22V10M-29 10H29M-15 26 0 10l15 16" fill="none" stroke="#927f60" stroke-width="2"/>
    </symbol>
    <symbol id="obj-apple" viewBox="-30 -30 60 60">
      <path d="M0-15c15-12 26 2 22 18-4 17-13 25-22 20-9 5-18-3-22-20-4-16 7-30 22-18Z" fill="currentColor" stroke="#26372e" stroke-width="3"/>
      <path d="M0-14c0-8 4-13 9-17" stroke="#5c442d" stroke-width="4" stroke-linecap="round"/>
      <path d="M6-21c7-7 15-5 18 1-8 3-14 2-18-1Z" fill="#5b8b49"/>
    </symbol>
    <symbol id="obj-shell" viewBox="-30 -30 60 60">
      <path d="M-22 15C-20-10-7-24 10-22c18 2 20 20 11 34C12 27-9 28-22 15Z" fill="currentColor" stroke="#6f4e42" stroke-width="3"/>
      <path d="M-11 12C-8-5 0-13 10-12c9 1 10 10 5 17-5 8-17 10-26 7Zm7-3c2-8 6-11 11-10 4 1 4 5 2 8-3 4-8 5-13 2Z" fill="none" stroke="#f0c7a6" stroke-width="3"/>
    </symbol>
    <symbol id="obj-anchor" viewBox="-32 -32 64 64">
      <circle cx="0" cy="-20" r="7" fill="none" stroke="currentColor" stroke-width="5"/>
      <path d="M0-13V22M-18-4H18M-23 10c3 12 11 18 23 18s20-6 23-18M-23 10l-5 4M23 10l5 4" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    </symbol>
    <symbol id="obj-lantern" viewBox="-30 -32 60 64">
      <path d="M-13-21c2-11 24-11 26 0" fill="none" stroke="#172326" stroke-width="4"/>
      <rect x="-18" y="-18" width="36" height="42" rx="5" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <rect x="-11" y="-10" width="22" height="25" rx="4" fill="#ffd87d" opacity=".86"/>
      <path d="M-20 24H20" stroke="#172326" stroke-width="5"/>
    </symbol>
    <symbol id="obj-watch" viewBox="-26 -34 52 68">
      <rect x="-9" y="-32" width="18" height="64" rx="6" fill="currentColor" stroke="#172326" stroke-width="2"/>
      <circle cx="0" cy="0" r="17" fill="#e8e0c7" stroke="#172326" stroke-width="4"/>
      <path d="M0 0V-9M0 0l8 5" stroke="#6b5a44" stroke-width="3" stroke-linecap="round"/>
    </symbol>
    <symbol id="obj-binoculars" viewBox="-34 -28 68 56">
      <path d="M-26-10-18-22H-4l4 13 4-13h14l8 12v25H7L0 7l-7 8h-19Z" fill="currentColor" stroke="#172326" stroke-width="3"/>
      <circle cx="-17" cy="11" r="11" fill="#9fc0c0" stroke="#172326" stroke-width="3"/>
      <circle cx="17" cy="11" r="11" fill="#9fc0c0" stroke="#172326" stroke-width="3"/>
    </symbol>
    <symbol id="obj-crab" viewBox="-34 -28 68 56">
      <ellipse cx="0" cy="5" rx="19" ry="14" fill="currentColor" stroke="#65372f" stroke-width="3"/>
      <path d="M-16 0-28-10M16 0 28-10M-13 15-23 23M-4 18-9 27M13 15 23 23M4 18 9 27" stroke="#65372f" stroke-width="4" stroke-linecap="round"/>
      <path d="M-28-10c-6-8 4-13 10-6M28-10c6-8-4-13-10-6" fill="none" stroke="#65372f" stroke-width="4"/>
      <circle cx="-7" cy="1" r="2.5" fill="#172326"/><circle cx="7" cy="1" r="2.5" fill="#172326"/>
    </symbol>
    <symbol id="obj-postcard" viewBox="-34 -25 68 50">
      <rect x="-30" y="-20" width="60" height="40" rx="2" fill="currentColor" stroke="#6b5b46" stroke-width="3"/>
      <rect x="15" y="-14" width="9" height="10" fill="#d75a45"/>
      <path d="M2-14V14M7 2H24M7 8H21M-23-9h17M-23-3h13M-23 8h18" stroke="#85745b" stroke-width="2"/>
    </symbol>
    <symbol id="obj-bell" viewBox="-28 -30 56 60">
      <path d="M-20 14h40c-6-7-7-13-7-24 0-16-26-16-26 0 0 11-1 17-7 24Z" fill="currentColor" stroke="#5b4630" stroke-width="3"/>
      <circle cx="0" cy="19" r="5" fill="#6d4e2a"/>
      <path d="M-24 14H24" stroke="#5b4630" stroke-width="4"/>
    </symbol>
    <symbol id="obj-seahorse" viewBox="-26 -34 52 68">
      <path d="M7-26c-15-3-23 10-16 22 6 10 17 5 16-3-1-7-10-7-12-2 8-2 12 7 7 15-4 7-3 15 4 18 6 3 12-1 11-8-1-5-7-7-11-4 4 1 6 5 3 8" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M6-26 18-20 8-16" fill="currentColor"/>
      <circle cx="5" cy="-21" r="2" fill="#172326"/>
    </symbol>
  `}function m(e){let t=Array.from({length:10},(e,t)=>{let n=316+t*34,r=t%2*28;return`<path class="wave wave-${t%3}" d="M${-80+r} ${n} Q20 ${n-13} 120 ${n}T320 ${n}T520 ${n}T720 ${n}T920 ${n}T1120 ${n}T1320 ${n}" />`}).join(``);return`<g class="waves" stroke="${e.palette.structureLight}" opacity=".22" fill="none" stroke-width="3">${t}</g>`}function h(e){let t=e.palette;return`
    <rect width="1200" height="720" fill="url(#sky-${e.id})"/>
    <rect y="270" width="1200" height="450" fill="url(#water-${e.id})"/>
    ${m(e)}
    <path d="M0 455H1200V720H0Z" fill="${t.ground}"/>
    <path d="M0 472H1200" stroke="#503b2f" stroke-width="7"/>
    <g opacity=".7">
      <path d="M0 226 140 194 280 223 430 184 600 218 745 172 930 210 1200 162V285H0Z" fill="${t.structure}" opacity=".35"/>
      <rect x="1035" y="82" width="28" height="156" fill="${t.structure}"/>
      <path d="M1011 84h76l-38-52Z" fill="${t.accent}"/>
      <circle cx="1049" cy="101" r="17" fill="#ffe9a6" opacity=".8"/>
    </g>
    <g class="boat-decoration">
      <path d="M760 344h170l-30 44H790Z" fill="#d9d0bb" stroke="${t.ink}" stroke-width="5"/>
      <rect x="810" y="297" width="69" height="49" fill="${t.structureLight}" stroke="${t.ink}" stroke-width="4"/>
      <path d="M845 297v-61" stroke="${t.ink}" stroke-width="5"/>
      <path d="M845 241 907 280h-62Z" fill="${t.accent}" opacity=".75"/>
    </g>
    <g class="market-stalls">
      <rect x="60" y="365" width="250" height="174" fill="${t.structureLight}" stroke="${t.ink}" stroke-width="5"/>
      <path d="M45 365h280l-31-66H79Z" fill="#e4d7b8" stroke="${t.ink}" stroke-width="5"/>
      <path d="M73 307h55v57H73Zm110 0h55v57h-55Z" fill="${t.accent}" opacity=".88"/>
      <rect x="344" y="386" width="260" height="147" fill="#c9b18d" stroke="${t.ink}" stroke-width="5"/>
      <path d="M330 386h288l-37-70H370Z" fill="#3e7580" stroke="${t.ink}" stroke-width="5"/>
      <path d="M379 326h55v58h-55Zm112 0h55v58h-55Z" fill="#eee0bd" opacity=".9"/>
      <rect x="928" y="396" width="218" height="143" fill="#b89c75" stroke="${t.ink}" stroke-width="5"/>
      <path d="M910 396h254l-28-65H941Z" fill="#d26043" stroke="${t.ink}" stroke-width="5"/>
      <path d="M956 339h50v55h-50Zm98 0h50v55h-50Z" fill="#e7d9b8" opacity=".9"/>
    </g>
    <g class="clutter" stroke="${t.ink}" stroke-width="3">
      <rect x="89" y="548" width="126" height="74" fill="#8d6041"/>
      <path d="M89 572h126M130 548v74M174 548v74" opacity=".6"/>
      <rect x="357" y="548" width="118" height="72" fill="#79604b"/>
      <path d="M357 570h118M397 548v72M438 548v72" opacity=".6"/>
      <rect x="805" y="522" width="108" height="72" fill="#9b704c"/>
      <path d="M805 547h108M841 522v72M879 522v72" opacity=".6"/>
      <ellipse cx="558" cy="617" rx="80" ry="34" fill="none" stroke="#d4c3a3" stroke-width="7"/>
      <path d="M509 593c24 26 70 26 98 0M511 640c23-25 67-25 94 0" fill="none" stroke="#d4c3a3" stroke-width="4"/>
      <path d="M680 495c42-49 102-48 145 3M683 502c48 32 98 33 139 0" fill="none" stroke="#6f5b47" stroke-width="7"/>
    </g>
    <g class="gulls" fill="none" stroke="${t.ink}" stroke-width="4" stroke-linecap="round" opacity=".65">
      <path d="M152 144q17-16 34 0 17-16 34 0"/>
      <path d="M586 106q14-13 28 0 14-13 28 0"/>
      <path d="M900 142q12-11 24 0 12-11 24 0"/>
    </g>
  `}function ee(e){let t=e.palette;return`
    <rect width="1200" height="720" fill="${t.structure}"/>
    <rect x="70" y="70" width="1060" height="585" fill="#3c4b4b" stroke="${t.ink}" stroke-width="8"/>
    <path d="M70 180H1130M270 70V655M605 70V655M930 70V655" stroke="${t.structureLight}" stroke-width="6" opacity=".28"/>
    <rect x="792" y="95" width="294" height="174" fill="url(#sky-${e.id})" stroke="${t.ink}" stroke-width="7"/>
    <rect x="792" y="188" width="294" height="81" fill="url(#water-${e.id})"/>
    ${m(e)}
    <path d="M0 650H1200V720H0Z" fill="${t.ground}"/>
    <g class="warehouse-shelves">
      <rect x="105" y="220" width="410" height="28" fill="#252f30"/>
      <rect x="105" y="402" width="410" height="28" fill="#252f30"/>
      <rect x="105" y="576" width="410" height="28" fill="#252f30"/>
      <path d="M122 215V612M498 215V612" stroke="#1b2526" stroke-width="13"/>
      <rect x="135" y="255" width="122" height="122" fill="#8c694b" stroke="${t.ink}" stroke-width="4"/>
      <rect x="275" y="270" width="196" height="107" fill="#79604b" stroke="${t.ink}" stroke-width="4"/>
      <rect x="126" y="439" width="174" height="120" fill="#9b724e" stroke="${t.ink}" stroke-width="4"/>
      <rect x="320" y="449" width="157" height="110" fill="#6f5b49" stroke="${t.ink}" stroke-width="4"/>
    </g>
    <g class="forklift" transform="translate(585 450)">
      <rect x="0" y="50" width="190" height="94" rx="14" fill="${t.accent}" stroke="${t.ink}" stroke-width="6"/>
      <rect x="92" y="-15" width="72" height="72" fill="#d7d4bd" stroke="${t.ink}" stroke-width="6"/>
      <path d="M173-20V150M173 128h82" stroke="${t.ink}" stroke-width="10"/>
      <circle cx="44" cy="151" r="26" fill="#202728"/><circle cx="145" cy="151" r="26" fill="#202728"/>
    </g>
    <g class="floor-clutter">
      <rect x="822" y="488" width="176" height="116" fill="#8c6b4e" stroke="${t.ink}" stroke-width="5"/>
      <rect x="1010" y="516" width="108" height="88" fill="#705d4d" stroke="${t.ink}" stroke-width="5"/>
      <ellipse cx="728" cy="629" rx="76" ry="29" fill="none" stroke="#a69b7b" stroke-width="8"/>
      <path d="M678 610c33 30 74 29 102 0M679 647c29-25 69-25 100 0" fill="none" stroke="#a69b7b" stroke-width="5"/>
      <path d="M559 246h176l-16 116H579Z" fill="#4e5d5b" stroke="${t.ink}" stroke-width="5"/>
      <path d="M585 269h124M592 300h110M598 331h95" stroke="#89938a" stroke-width="4"/>
    </g>
    <g class="fog" opacity=".18" fill="#e4ece5">
      <ellipse cx="920" cy="260" rx="300" ry="95"/>
      <ellipse cx="660" cy="398" rx="290" ry="80"/>
    </g>
  `}function te(e){let t=e.palette;return`
    <rect width="1200" height="720" fill="url(#sky-${e.id})"/>
    <circle cx="970" cy="145" r="68" fill="#ffd284" opacity=".75"/>
    <rect y="278" width="1200" height="442" fill="url(#water-${e.id})"/>
    ${m(e)}
    <g class="ferry" transform="translate(610 230)">
      <path d="M0 130h415l-55 86H58Z" fill="#e6dfcc" stroke="${t.ink}" stroke-width="6"/>
      <rect x="86" y="44" width="244" height="92" rx="5" fill="#d4d1c1" stroke="${t.ink}" stroke-width="6"/>
      <rect x="116" y="66" width="42" height="30" fill="#5b8791"/>
      <rect x="176" y="66" width="42" height="30" fill="#5b8791"/>
      <rect x="236" y="66" width="42" height="30" fill="#5b8791"/>
      <path d="M107 44V0h40v44" fill="${t.accent}" stroke="${t.ink}" stroke-width="6"/>
    </g>
    <path d="M0 490 1200 420V720H0Z" fill="${t.ground}"/>
    <g class="pier-planks" stroke="#513b2d" stroke-width="4" opacity=".65">
      ${Array.from({length:15},(e,t)=>`<path d="M${t*86-40} 480 ${t*92+20} 720"/>`).join(``)}
      <path d="M0 540 1200 470M0 610 1200 540M0 680 1200 610"/>
    </g>
    <g class="ticket-booth">
      <rect x="76" y="298" width="254" height="218" fill="${t.structureLight}" stroke="${t.ink}" stroke-width="6"/>
      <path d="M55 300h300l-42-68H96Z" fill="${t.accent}" stroke="${t.ink}" stroke-width="6"/>
      <rect x="115" y="348" width="100" height="78" fill="#53818c" stroke="${t.ink}" stroke-width="5"/>
      <rect x="239" y="348" width="58" height="168" fill="#6e5c49" stroke="${t.ink}" stroke-width="5"/>
    </g>
    <g class="pier-furniture" stroke="${t.ink}" stroke-width="5">
      <path d="M397 493v104M499 487v103M378 544h143M384 514h130" fill="none"/>
      <path d="M884 505v99M984 499v99M866 553h136M872 523h124" fill="none"/>
      <path d="M1130 397v194M1105 397h50" fill="none" stroke-width="8"/>
      <circle cx="1130" cy="384" r="26" fill="#ffd986" opacity=".82"/>
      <path d="M555 455c25-55 79-56 111 0M557 463c36 24 76 24 108 0" fill="none" stroke="#6d5947" stroke-width="8"/>
    </g>
  `}function ne(e){let t=e.palette;return`
    <rect width="1200" height="720" fill="url(#sky-${e.id})"/>
    <circle cx="972" cy="104" r="45" fill="#dce6d7" opacity=".65"/>
    <rect y="305" width="1200" height="415" fill="url(#water-${e.id})"/>
    ${m(e)}
    <path d="M0 520H1200V720H0Z" fill="${t.ground}"/>
    <g class="containers" stroke="#0d171d" stroke-width="6">
      <rect x="55" y="305" width="250" height="135" fill="#8f3d35"/>
      <path d="M87 305v135M127 305v135M167 305v135M207 305v135M247 305v135" opacity=".55"/>
      <rect x="323" y="342" width="260" height="140" fill="#275b70"/>
      <path d="M359 342v140M399 342v140M439 342v140M479 342v140M519 342v140" opacity=".55"/>
      <rect x="827" y="333" width="310" height="155" fill="#6b5a35"/>
      <path d="M866 333v155M910 333v155M954 333v155M998 333v155M1042 333v155M1086 333v155" opacity=".55"/>
    </g>
    <g class="cranes" fill="none" stroke="#0c171d" stroke-width="12">
      <path d="M675 430V104h268M680 142h197M870 105v208"/>
      <path d="M84 305V130h260M92 167h180M272 132v125"/>
    </g>
    <g class="dock-lights">
      <path d="M632 365v264M1155 354v274" stroke="#1a2427" stroke-width="10"/>
      <circle cx="632" cy="348" r="28" fill="#ffd371"/>
      <circle cx="1155" cy="337" r="28" fill="#ffd371"/>
      <path d="M632 348 525 630h215ZM1155 337 1043 630h157Z" fill="#ffd371" opacity=".08"/>
    </g>
    <g class="night-clutter">
      <rect x="83" y="555" width="165" height="94" fill="#654b3b" stroke="#101b20" stroke-width="5"/>
      <rect x="347" y="570" width="121" height="80" fill="#756146" stroke="#101b20" stroke-width="5"/>
      <rect x="873" y="550" width="158" height="101" fill="#574b3d" stroke="#101b20" stroke-width="5"/>
      <ellipse cx="722" cy="624" rx="88" ry="31" fill="none" stroke="#75868a" stroke-width="8"/>
      <path d="M660 603c36 32 89 32 124 0M661 644c34-27 86-27 121 0" fill="none" stroke="#75868a" stroke-width="5"/>
    </g>
    <g class="rain" stroke="#b8d5d7" stroke-width="3" opacity=".32">
      ${Array.from({length:46},(e,t)=>`<path d="M${t*79%1240-30} ${t*137%670}l-14 34"/>`).join(``)}
    </g>
  `}function re(e){let t=e.palette;return`
    <rect width="1200" height="720" fill="url(#sky-${e.id})"/>
    <rect y="245" width="1200" height="190" fill="url(#water-${e.id})"/>
    ${m(e)}
    <rect y="435" width="1200" height="285" fill="${t.ground}"/>
    <g class="ship-hull" transform="translate(500 205)">
      <path d="M0 150h610l-73 190H88Z" fill="#d9d8c7" stroke="${t.ink}" stroke-width="8"/>
      <path d="M78 205h485" stroke="${t.accent}" stroke-width="24" opacity=".9"/>
      <rect x="172" y="54" width="255" height="103" fill="#e0ddcb" stroke="${t.ink}" stroke-width="7"/>
      <rect x="213" y="84" width="53" height="37" fill="#5b8590"/>
      <rect x="287" y="84" width="53" height="37" fill="#5b8590"/>
      <rect x="361" y="84" width="35" height="37" fill="#5b8590"/>
      <path d="M202 54V0h60v54" fill="${t.accent}" stroke="${t.ink}" stroke-width="7"/>
    </g>
    <g class="yard-crane" fill="none" stroke="${t.ink}" stroke-width="13">
      <path d="M92 470V95h330M100 140h255M354 95v205"/>
      <path d="M354 300v70" stroke-width="7"/>
      <path d="M338 370h32l-7 30h-18Z" fill="${t.accent}" stroke-width="5"/>
    </g>
    <g class="scaffold" stroke="${t.structure}" stroke-width="8" fill="none">
      <path d="M465 360V650M581 341V650M697 326V650M813 311V650M929 296V650M1045 281V650"/>
      <path d="M445 425h626M445 508h626M445 591h626"/>
      <path d="M465 360l116 290M581 341l116 309M697 326l116 324M813 311l116 339M929 296l116 354"/>
    </g>
    <g class="workbenches" stroke="${t.ink}" stroke-width="5">
      <rect x="75" y="535" width="258" height="86" fill="#7a5b43"/>
      <path d="M94 621v70M312 621v70"/>
      <rect x="70" y="502" width="90" height="34" fill="#3b4a49"/>
      <rect x="187" y="492" width="129" height="44" fill="#4c5957"/>
      <rect x="1068" y="555" width="91" height="91" fill="#695647"/>
    </g>
    <g class="yard-clutter">
      <ellipse cx="378" cy="627" rx="75" ry="29" fill="none" stroke="#5c4a3c" stroke-width="8"/>
      <path d="M331 607c26 28 67 27 95 0M330 645c28-24 68-24 96 0" fill="none" stroke="#5c4a3c" stroke-width="5"/>
      <rect x="20" y="640" width="200" height="80" fill="#6d5845"/>
      <path d="M20 666h200M88 640v80M154 640v80" stroke="#44362d" stroke-width="4"/>
    </g>
  `}function ie(e){return e.layout===`market`?h(e):e.layout===`warehouse`?ee(e):e.layout===`pier`?te(e):e.layout===`night`?ne(e):re(e)}function ae(e,t,n){let r=t.has(e.id),i=n.has(e.id);return`
    <g
      class="${[`scene-object`,r?`is-target`:`is-decoy`,i?`is-found`:``].filter(Boolean).join(` `)}"
      data-object-id="${e.id}"
      transform="translate(${e.x} ${e.y}) rotate(${e.rotation}) scale(${e.scale})"
      role="button"
      tabindex="0"
      aria-label="장면 속 물건"
      style="color:${e.color}"
    >
      <circle class="hit-area" cx="0" cy="0" r="36" fill="transparent"/>
      <use href="#obj-${e.kind}" x="-30" y="-30" width="60" height="60"/>
      <circle class="found-ring" cx="0" cy="0" r="31" fill="none"/>
      <path class="found-check" d="M-12 1-3 10 15-11" fill="none"/>
    </g>
  `}function oe(e,t,n){return`
    <svg
      id="hidden-scene"
      class="hidden-scene"
      viewBox="0 0 1200 720"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="${e.name} 숨은그림찾기 장면"
    >
      <defs>
        <linearGradient id="sky-${e.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${e.palette.skyA}"/>
          <stop offset="1" stop-color="${e.palette.skyB}"/>
        </linearGradient>
        <linearGradient id="water-${e.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${e.palette.waterA}"/>
          <stop offset="1" stop-color="${e.palette.waterB}"/>
        </linearGradient>
        <filter id="soft-shadow-${e.id}" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0b171a" flood-opacity=".35"/>
        </filter>
        ${p()}
      </defs>
      <g class="environment">${ie(e)}</g>
      <g class="object-layer" filter="url(#soft-shadow-${e.id})">
        ${e.objects.map(e=>ae(e,t,n)).join(``)}
      </g>
      <g class="feedback-layer" id="feedback-layer"></g>
    </svg>
  `}function g(e,t){return e.objects.find(e=>e.id===t)?.label??`분실물`}var _=[{id:1,name:`새벽 어시장`,callSign:`MORNING CATCH`,subtitle:`경매가 시작되기 전, 주인을 잃은 물건을 찾아주세요.`,briefing:`생선 상자와 그물 사이에 분실물이 섞여 있습니다. 목록에 적힌 물건만 빠르게 회수하세요.`,weather:`맑은 새벽 · 잔물결`,timeLimit:78,layout:`market`,palette:{skyA:`#f6b873`,skyB:`#d7e4dd`,waterA:`#2f7c87`,waterB:`#164b59`,ground:`#b78355`,structure:`#35515a`,structureLight:`#d9c9a8`,accent:`#e65532`,ink:`#172329`},objects:[{id:`s1-key`,label:`황동 열쇠`,kind:`key`,x:155,y:526,scale:.8,rotation:-18,color:`#d7a72f`},{id:`s1-glove`,label:`빨간 장갑`,kind:`glove`,x:478,y:470,scale:.88,rotation:22,color:`#c94435`},{id:`s1-sock`,label:`줄무늬 양말`,kind:`sock`,x:868,y:224,scale:.78,rotation:-13,color:`#e9d9ad`},{id:`s1-camera`,label:`낡은 카메라`,kind:`camera`,x:1042,y:506,scale:.72,rotation:7,color:`#27383d`},{id:`s1-compass`,label:`나침반`,kind:`compass`,x:625,y:575,scale:.72,rotation:0,color:`#d1a23c`},{id:`s1-bottle`,label:`파란 병`,kind:`bottle`,x:342,y:279,scale:.8,rotation:-5,color:`#1f6e8f`},{id:`s1-umbrella`,label:`노란 우산`,kind:`umbrella`,x:768,y:522,scale:.9,rotation:-22,color:`#e5bd43`},{id:`s1-starfish`,label:`불가사리`,kind:`starfish`,x:1140,y:631,scale:.75,rotation:18,color:`#d76b4d`},{id:`s1-hat`,label:`선원 모자`,kind:`hat`,x:544,y:211,scale:.82,rotation:3,color:`#edf0dc`},{id:`s1-paperboat`,label:`종이배`,kind:`paperboat`,x:958,y:646,scale:.72,rotation:-7,color:`#f1e8cf`},{id:`s1-apple`,label:`초록 사과`,kind:`apple`,x:247,y:610,scale:.8,rotation:0,color:`#6c9b42`},{id:`s1-shell`,label:`소라 껍데기`,kind:`shell`,x:706,y:302,scale:.68,rotation:26,color:`#c99878`},{id:`s1-bell`,label:`작은 종`,kind:`bell`,x:1090,y:166,scale:.7,rotation:-8,color:`#b88a2a`},{id:`s1-postcard`,label:`항구 엽서`,kind:`postcard`,x:420,y:620,scale:.74,rotation:-10,color:`#e7d4a9`}]},{id:2,name:`안개 창고`,callSign:`WAREHOUSE 7`,subtitle:`입고 기록과 맞지 않는 물건들이 창고 곳곳에 숨어 있습니다.`,briefing:`상자, 밧줄, 작업 도구가 뒤섞인 창고입니다. 안개가 짙어지기 전에 분실 목록을 정리하세요.`,weather:`짙은 해무 · 가시거리 2 NM`,timeLimit:84,layout:`warehouse`,palette:{skyA:`#8da2a1`,skyB:`#c7d1c9`,waterA:`#4c7880`,waterB:`#284e58`,ground:`#665a4b`,structure:`#303f41`,structureLight:`#9b9a86`,accent:`#d57b36`,ink:`#182022`},objects:[{id:`s2-anchor`,label:`작은 닻`,kind:`anchor`,x:120,y:565,scale:.82,rotation:-10,color:`#37484a`},{id:`s2-watch`,label:`손목시계`,kind:`watch`,x:378,y:354,scale:.74,rotation:34,color:`#c6b47b`},{id:`s2-binoculars`,label:`쌍안경`,kind:`binoculars`,x:1015,y:258,scale:.76,rotation:-12,color:`#293b3d`},{id:`s2-lantern`,label:`주황 랜턴`,kind:`lantern`,x:825,y:528,scale:.82,rotation:3,color:`#d76d2f`},{id:`s2-key`,label:`황동 열쇠`,kind:`key`,x:620,y:204,scale:.72,rotation:21,color:`#c89b34`},{id:`s2-glove`,label:`작업 장갑`,kind:`glove`,x:520,y:585,scale:.88,rotation:-18,color:`#8e543d`},{id:`s2-camera`,label:`낡은 카메라`,kind:`camera`,x:1080,y:596,scale:.72,rotation:-4,color:`#202c2e`},{id:`s2-bottle`,label:`초록 병`,kind:`bottle`,x:252,y:220,scale:.86,rotation:9,color:`#3d725f`},{id:`s2-shell`,label:`소라 껍데기`,kind:`shell`,x:716,y:610,scale:.72,rotation:-25,color:`#b78668`},{id:`s2-hat`,label:`선원 모자`,kind:`hat`,x:905,y:182,scale:.82,rotation:-9,color:`#dfe0c8`},{id:`s2-postcard`,label:`낡은 엽서`,kind:`postcard`,x:432,y:192,scale:.68,rotation:12,color:`#c9b793`},{id:`s2-bell`,label:`부두 종`,kind:`bell`,x:1132,y:390,scale:.76,rotation:4,color:`#ad8530`},{id:`s2-sock`,label:`줄무늬 양말`,kind:`sock`,x:178,y:404,scale:.72,rotation:17,color:`#b8aa8d`},{id:`s2-apple`,label:`초록 사과`,kind:`apple`,x:660,y:468,scale:.78,rotation:0,color:`#668d42`}]},{id:3,name:`노을 여객부두`,callSign:`SUNSET FERRY`,subtitle:`마지막 배가 떠나기 전 승객들의 분실물을 찾아주세요.`,briefing:`벤치, 매표소, 계류줄 사이를 살펴보세요. 노을빛과 비슷한 색의 물건이 특히 잘 숨어 있습니다.`,weather:`노을 · 남서풍 2`,timeLimit:76,layout:`pier`,palette:{skyA:`#f28b63`,skyB:`#f2cf9a`,waterA:`#2b6678`,waterB:`#183d50`,ground:`#8b6548`,structure:`#33464c`,structureLight:`#d6b786`,accent:`#d84a37`,ink:`#172128`},objects:[{id:`s3-umbrella`,label:`파란 우산`,kind:`umbrella`,x:270,y:510,scale:.9,rotation:18,color:`#2f7293`},{id:`s3-camera`,label:`여행 카메라`,kind:`camera`,x:922,y:300,scale:.74,rotation:-7,color:`#253338`},{id:`s3-watch`,label:`손목시계`,kind:`watch`,x:685,y:550,scale:.72,rotation:-30,color:`#c4a458`},{id:`s3-paperboat`,label:`종이배`,kind:`paperboat`,x:1068,y:620,scale:.72,rotation:8,color:`#f2e3c1`},{id:`s3-starfish`,label:`불가사리`,kind:`starfish`,x:144,y:645,scale:.72,rotation:-10,color:`#d5674b`},{id:`s3-compass`,label:`나침반`,kind:`compass`,x:444,y:236,scale:.72,rotation:0,color:`#d0a743`},{id:`s3-hat`,label:`선원 모자`,kind:`hat`,x:786,y:196,scale:.82,rotation:6,color:`#ebe4cb`},{id:`s3-bottle`,label:`보라 병`,kind:`bottle`,x:1160,y:470,scale:.78,rotation:5,color:`#665185`},{id:`s3-key`,label:`황동 열쇠`,kind:`key`,x:540,y:612,scale:.72,rotation:-24,color:`#cf9d31`},{id:`s3-postcard`,label:`여행 엽서`,kind:`postcard`,x:330,y:285,scale:.7,rotation:-9,color:`#e7c995`},{id:`s3-shell`,label:`소라 껍데기`,kind:`shell`,x:864,y:632,scale:.72,rotation:18,color:`#cb9173`},{id:`s3-binoculars`,label:`쌍안경`,kind:`binoculars`,x:1028,y:198,scale:.7,rotation:14,color:`#354348`},{id:`s3-apple`,label:`빨간 사과`,kind:`apple`,x:605,y:340,scale:.78,rotation:0,color:`#c94b3c`},{id:`s3-bell`,label:`작은 종`,kind:`bell`,x:182,y:208,scale:.72,rotation:4,color:`#b88b2d`}]},{id:4,name:`비 내리는 야간항`,callSign:`NIGHT SHIFT`,subtitle:`정전 점검 중 사라진 장비를 등대 불빛 아래서 찾아주세요.`,briefing:`컨테이너와 작업등이 만드는 강한 그림자를 이용하세요. 잘못 누르면 남은 시간이 줄어듭니다.`,weather:`야간 소나기 · 돌풍`,timeLimit:90,layout:`night`,palette:{skyA:`#071827`,skyB:`#153a4a`,waterA:`#113d50`,waterB:`#061e2d`,ground:`#253139`,structure:`#17252c`,structureLight:`#61757a`,accent:`#f0a530`,ink:`#e8eee8`},objects:[{id:`s4-lantern`,label:`주황 랜턴`,kind:`lantern`,x:168,y:500,scale:.82,rotation:-3,color:`#f08b34`},{id:`s4-key`,label:`은색 열쇠`,kind:`key`,x:482,y:614,scale:.72,rotation:15,color:`#aebdc0`},{id:`s4-compass`,label:`나침반`,kind:`compass`,x:720,y:296,scale:.72,rotation:0,color:`#caa44c`},{id:`s4-glove`,label:`방수 장갑`,kind:`glove`,x:1004,y:518,scale:.86,rotation:-24,color:`#3a6c79`},{id:`s4-watch`,label:`손목시계`,kind:`watch`,x:357,y:247,scale:.7,rotation:28,color:`#899b9d`},{id:`s4-binoculars`,label:`쌍안경`,kind:`binoculars`,x:1120,y:245,scale:.72,rotation:-8,color:`#18282e`},{id:`s4-umbrella`,label:`노란 우산`,kind:`umbrella`,x:855,y:606,scale:.88,rotation:20,color:`#d8aa31`},{id:`s4-bell`,label:`비상 종`,kind:`bell`,x:610,y:168,scale:.72,rotation:0,color:`#c59635`},{id:`s4-camera`,label:`검은 카메라`,kind:`camera`,x:248,y:638,scale:.72,rotation:-6,color:`#111c21`},{id:`s4-bottle`,label:`파란 병`,kind:`bottle`,x:941,y:198,scale:.78,rotation:7,color:`#1f6081`},{id:`s4-anchor`,label:`작은 닻`,kind:`anchor`,x:548,y:458,scale:.78,rotation:8,color:`#718287`},{id:`s4-seahorse`,label:`해마 장식`,kind:`seahorse`,x:1065,y:637,scale:.75,rotation:-14,color:`#d1764f`},{id:`s4-postcard`,label:`젖은 엽서`,kind:`postcard`,x:764,y:528,scale:.7,rotation:-18,color:`#9ba89f`},{id:`s4-hat`,label:`선원 모자`,kind:`hat`,x:120,y:217,scale:.8,rotation:11,color:`#cbd2c5`}]},{id:5,name:`수리 조선소`,callSign:`DRY DOCK`,subtitle:`출항 점검표에 없는 물건을 선체와 작업대 사이에서 찾아주세요.`,briefing:`크레인, 공구함, 선체 도장 무늬가 시선을 방해합니다. 확대 기능을 활용해 천천히 살펴보세요.`,weather:`맑음 · 건조한 북서풍`,timeLimit:86,layout:`shipyard`,palette:{skyA:`#86b2bd`,skyB:`#d9e2d7`,waterA:`#296c7a`,waterB:`#164652`,ground:`#8d775d`,structure:`#3e4b4a`,structureLight:`#c7b68f`,accent:`#d75535`,ink:`#182326`},objects:[{id:`s5-camera`,label:`낡은 카메라`,kind:`camera`,x:186,y:620,scale:.72,rotation:10,color:`#2b3636`},{id:`s5-key`,label:`큰 열쇠`,kind:`key`,x:512,y:344,scale:.8,rotation:-18,color:`#b58b30`},{id:`s5-glove`,label:`용접 장갑`,kind:`glove`,x:984,y:582,scale:.88,rotation:16,color:`#8f513f`},{id:`s5-anchor`,label:`작은 닻`,kind:`anchor`,x:724,y:620,scale:.82,rotation:0,color:`#4d5c5d`},{id:`s5-bell`,label:`황동 종`,kind:`bell`,x:1090,y:232,scale:.72,rotation:7,color:`#b88729`},{id:`s5-compass`,label:`나침반`,kind:`compass`,x:342,y:247,scale:.72,rotation:0,color:`#d1a23e`},{id:`s5-bottle`,label:`초록 병`,kind:`bottle`,x:618,y:566,scale:.78,rotation:-5,color:`#47745e`},{id:`s5-watch`,label:`손목시계`,kind:`watch`,x:865,y:306,scale:.72,rotation:-26,color:`#c2ae7a`},{id:`s5-paperboat`,label:`종이배`,kind:`paperboat`,x:1142,y:640,scale:.72,rotation:4,color:`#e9dfc4`},{id:`s5-apple`,label:`초록 사과`,kind:`apple`,x:436,y:600,scale:.78,rotation:0,color:`#6d8f43`},{id:`s5-sock`,label:`줄무늬 양말`,kind:`sock`,x:236,y:413,scale:.72,rotation:-12,color:`#d3c4a1`},{id:`s5-lantern`,label:`작업 랜턴`,kind:`lantern`,x:786,y:190,scale:.8,rotation:0,color:`#d77432`},{id:`s5-shell`,label:`소라 껍데기`,kind:`shell`,x:1042,y:405,scale:.72,rotation:18,color:`#bc8469`},{id:`s5-binoculars`,label:`쌍안경`,kind:`binoculars`,x:568,y:200,scale:.7,rotation:13,color:`#314344`}]}],v=`002-harbor-lost-found`,y=8,b=document.querySelector(`#app`);if(!b)throw Error(`Game root is missing.`);var x={gold:`GOLD`,silver:`SILVER`,bronze:`BRONZE`};b.innerHTML=`
  <div class="game-page">
    <header class="topbar">
      <a class="play100" href="/Play100/games/002-harbor-lost-found/../../">
        <i></i><span>PLAY100</span>
      </a>
      <div class="game-id">${f(2)} · HIDDEN OBJECT</div>
      <a class="exit-link" href="/Play100/games/002-harbor-lost-found/../../">게임 목록</a>
    </header>

    <main class="game-layout">
      <aside class="case-file">
        <span class="section-label">HARBOR LOST & FOUND OFFICE</span>
        <h1>Harbor<br />Lost & Found</h1>
        <p class="intro-copy">
          항구 곳곳에 섞여 있는 분실물을 찾아주세요.
          클릭과 탭 하나로 즐기는 숨은그림찾기입니다.
        </p>

        <div class="rules">
          <div><span>01</span><b>목록 속 물건 찾기</b><small>장면을 눌러 8개의 분실물을 회수합니다.</small></div>
          <div><span>02</span><b>연속 발견</b><small>3.5초 안에 이어 찾으면 콤보 점수가 붙습니다.</small></div>
          <div><span>03</span><b>오답 주의</b><small>잘못 누르면 3초와 75점이 줄어듭니다.</small></div>
        </div>

        <div class="scene-heading">
          <span>CASE FILES</span>
          <b id="progress-count">0 / ${_.length}</b>
        </div>
        <div id="scene-list" class="scene-list"></div>

        <div class="target-heading">
          <span>SEARCH LIST</span>
          <b id="target-count">0 / ${y}</b>
        </div>
        <ol id="target-list" class="target-list"></ol>
      </aside>

      <section class="search-deck">
        <div class="mission-card">
          <div>
            <span>CASE</span>
            <strong id="scene-title">—</strong>
          </div>
          <div>
            <span>WEATHER</span>
            <strong id="scene-weather">—</strong>
          </div>
          <div>
            <span>TIME</span>
            <strong id="time-left">01:18</strong>
          </div>
          <div>
            <span>SCORE</span>
            <strong id="score">0</strong>
          </div>
          <div>
            <span>COMBO</span>
            <strong id="combo">×1</strong>
          </div>
        </div>

        <div class="briefing-strip">
          <div>
            <span id="scene-call-sign">CASE 01</span>
            <strong id="scene-subtitle">—</strong>
          </div>
          <p id="scene-briefing">—</p>
        </div>

        <div class="scene-shell">
          <div class="scene-scroll" id="scene-scroll">
            <div id="scene-root" class="scene-root"></div>
          </div>
          <div id="scene-overlay" class="scene-overlay">
            <span class="section-label">READY TO SEARCH</span>
            <h2 id="overlay-title">분실물 수색 준비</h2>
            <p id="overlay-copy">장면을 살펴본 뒤 시작하세요. 시작 버튼을 누르면 시간이 흐릅니다.</p>
            <button type="button" class="primary" id="start-button">수색 시작 <b>→</b></button>
          </div>
        </div>

        <div id="message-line" class="message-line" aria-live="polite">
          장면을 살펴보고 수색을 시작하세요.
        </div>

        <div class="controls">
          <button type="button" class="primary" id="hint-button">등대 힌트 <span id="hint-count">2</span></button>
          <button type="button" id="zoom-out">− 축소</button>
          <button type="button" id="zoom-in">+ 확대</button>
          <button type="button" id="restart-button">장면 다시</button>
        </div>

        <div class="scene-nav">
          <button type="button" id="previous-scene">← 이전 장면</button>
          <button type="button" id="next-scene">다음 장면 →</button>
        </div>
      </section>
    </main>

    <div class="result-overlay" id="result-overlay" hidden>
      <section class="result-sheet" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span class="section-label">LOST PROPERTY REPORT</span>
        <div class="medal" id="result-medal">GOLD</div>
        <h2 id="result-title">분실물 회수 완료</h2>
        <p id="result-summary"></p>
        <div class="result-stats">
          <div><span>SCORE</span><strong id="result-score">0</strong></div>
          <div><span>TIME</span><strong id="result-time">00:00</strong></div>
          <div><span>MISTAKES</span><strong id="result-mistakes">0</strong></div>
          <div><span>HINTS</span><strong id="result-hints">0</strong></div>
        </div>
        <div class="result-actions">
          <button type="button" class="primary" id="result-next">다음 장면</button>
          <button type="button" id="result-share">결과 공유</button>
          <button type="button" id="result-close">닫기</button>
        </div>
      </section>
    </div>
  </div>
`;function S(e){let t=document.querySelector(e);if(!t)throw Error(`Missing element: ${e}`);return t}var C={sceneList:S(`#scene-list`),progressCount:S(`#progress-count`),targetList:S(`#target-list`),targetCount:S(`#target-count`),sceneTitle:S(`#scene-title`),sceneWeather:S(`#scene-weather`),timeLeft:S(`#time-left`),score:S(`#score`),combo:S(`#combo`),sceneCallSign:S(`#scene-call-sign`),sceneSubtitle:S(`#scene-subtitle`),sceneBriefing:S(`#scene-briefing`),sceneRoot:S(`#scene-root`),sceneScroll:S(`#scene-scroll`),sceneOverlay:S(`#scene-overlay`),overlayTitle:S(`#overlay-title`),overlayCopy:S(`#overlay-copy`),startButton:S(`#start-button`),messageLine:S(`#message-line`),hintButton:S(`#hint-button`),hintCount:S(`#hint-count`),zoomOut:S(`#zoom-out`),zoomIn:S(`#zoom-in`),restartButton:S(`#restart-button`),previousScene:S(`#previous-scene`),nextScene:S(`#next-scene`),resultOverlay:S(`#result-overlay`),resultMedal:S(`#result-medal`),resultSummary:S(`#result-summary`),resultScore:S(`#result-score`),resultTime:S(`#result-time`),resultMistakes:S(`#result-mistakes`),resultHints:S(`#result-hints`),resultNext:S(`#result-next`),resultShare:S(`#result-share`),resultClose:S(`#result-close`)},w=0,T=`ready`,E=new Set,D=new Set,O=0,k=0,A=2,j=0,M=1,N=0,P=0,F=null,I=1,L=null,R=Date.now()>>>0;s(v);function z(){let e=_[w];if(!e)throw Error(`Missing scene ${w}`);return e}function B(){return R=R*1664525+1013904223>>>0,R/4294967296}function se(e){let t=e.objects.map(e=>e.id);for(let e=t.length-1;e>0;--e){let n=Math.floor(B()*(e+1)),r=t[e];t[e]=t[n]??t[e]??``,t[n]=r??``}return new Set(t.filter(Boolean).slice(0,y))}function V(e){let t=Math.max(0,Math.floor(e));return`${String(Math.floor(t/60)).padStart(2,`0`)}:${String(t%60).padStart(2,`0`)}`}function H(){F!==null&&(window.clearInterval(F),F=null)}function U(e,t,n){C.overlayTitle.textContent=e,C.overlayCopy.textContent=t,C.startButton.innerHTML=`${n} <b>→</b>`,C.sceneOverlay.hidden=!1}function ce(){C.sceneOverlay.hidden=!0}function W(e){H(),w=(e+_.length)%_.length;let t=z();R=Date.now()+t.id*7919>>>0,E=se(t),D=new Set,O=0,k=0,A=2,j=0,M=1,N=0,P=t.timeLimit,I=1,T=`ready`,L=null,document.body.dataset.scene=t.layout,C.sceneScroll.scrollTo({left:0,top:0}),U(`${t.name} 수색 준비`,`장면을 먼저 살펴본 뒤 시작하세요. 목록 속 물건 8개를 찾으면 완료됩니다.`,`수색 시작`),de(),o(`hidden_scene_select`,{game_id:v,scene_id:t.id})}function le(){T===`ready`&&(T=`playing`,ce(),C.messageLine.textContent=`수색을 시작했습니다. 목록 속 분실물을 찾아주세요.`,F=window.setInterval(()=>{T===`playing`&&(--P,q(),P<=0&&Z())},1e3),d(520,.08,.025),o(`hidden_round_start`,{game_id:v,scene_id:z().id,target_count:E.size}))}function ue(){let e=z();C.sceneRoot.innerHTML=oe(e,E,D);let t=S(`#hidden-scene`);t.style.width=`${I*100}%`,t.querySelectorAll(`.scene-object`).forEach(e=>{e.addEventListener(`pointerdown`,t=>{t.preventDefault(),t.stopPropagation();let n=e.dataset.objectId;n&&J(n,e)}),e.addEventListener(`keydown`,t=>{if(t.key!==`Enter`&&t.key!==` `)return;t.preventDefault();let n=e.dataset.objectId;n&&J(n,e)})}),t.addEventListener(`pointerdown`,e=>{if(T!==`playing`)return;let n=fe(t,e);Y(n.x,n.y,`목록에 없는 곳입니다.`)})}function G(){let e=l(v),t=Object.keys(e?.completedLevels??{}).length;C.progressCount.textContent=`${t} / ${_.length}`,C.sceneList.innerHTML=_.map((t,n)=>{let r=e?.completedLevels[String(t.id)];return`
        <button
          type="button"
          class="scene-item ${n===w?`is-active`:``}"
          data-scene-index="${n}"
        >
          <span>${String(t.id).padStart(2,`0`)}</span>
          <b>${t.name}</b>
          <small>${r?r.medal.toUpperCase():`—`}</small>
        </button>
      `}).join(``),C.sceneList.querySelectorAll(`[data-scene-index]`).forEach(e=>{e.addEventListener(`click`,()=>{W(Number(e.dataset.sceneIndex))})})}function K(){let e=z(),t=[...E];C.targetCount.textContent=`${D.size} / ${E.size}`,C.targetList.innerHTML=t.map((t,n)=>{let r=D.has(t);return`
        <li class="${r?`is-found`:``}" data-target-id="${t}">
          <span>${String(n+1).padStart(2,`0`)}</span>
          <b>${g(e,t)}</b>
          <i>${r?`찾음`:`·`}</i>
        </li>
      `}).join(``)}function q(){let e=z();C.sceneTitle.textContent=`${String(e.id).padStart(2,`0`)} · ${e.name}`,C.sceneWeather.textContent=e.weather,C.timeLeft.textContent=V(P),C.timeLeft.classList.toggle(`is-low`,P<=15),C.score.textContent=O.toLocaleString(`ko-KR`),C.combo.textContent=`×${M}`,C.sceneCallSign.textContent=e.callSign,C.sceneSubtitle.textContent=e.subtitle,C.sceneBriefing.textContent=e.briefing,C.hintCount.textContent=String(A),C.hintButton.disabled=T!==`playing`||A<=0||D.size>=E.size,C.zoomOut.disabled=I<=1,C.zoomIn.disabled=I>=1.75}function de(){G(),K(),ue(),q()}function J(e,t){if(T!==`playing`||D.has(e))return;let n=z().objects.find(t=>t.id===e);if(!n)return;if(!E.has(e)){Y(n.x,n.y,`${n.label}은(는) 현재 목록에 없습니다.`);return}let r=performance.now();M=r-N<=3500?Math.min(M+1,6):1,N=r,D.add(e);let i=180+M*45+Math.floor(P*1.5);O+=i,t.classList.add(`is-found`),K(),q(),C.messageLine.textContent=`${n.label} 발견! +${i.toLocaleString(`ko-KR`)} · 콤보 ×${M}`,d(620+M*70,.08,.025),X(n.x,n.y,`correct`,`+${i}`),o(`hidden_object_found`,{game_id:v,scene_id:z().id,object_id:e,combo:M}),D.size>=E.size&&he()}function fe(e,t){let n=e.createSVGPoint();n.x=t.clientX,n.y=t.clientY;let r=e.getScreenCTM();if(!r)return{x:600,y:360};let i=n.matrixTransform(r.inverse());return{x:i.x,y:i.y}}function Y(e,t,n){T===`playing`&&(k+=1,M=1,P=Math.max(0,P-3),O=Math.max(0,O-75),C.messageLine.textContent=`${n} · 시간 -3초`,d(165,.12,.03),X(e,t,`wrong`,`×`),q(),P<=0&&Z())}function X(e,t,n,r){let i=document.querySelector(`#feedback-layer`);if(!i)return;let a=`feedback-${Date.now()}-${Math.floor(Math.random()*1e3)}`;i.insertAdjacentHTML(`beforeend`,`<g id="${a}" class="tap-feedback ${n}" transform="translate(${e} ${t})">
      <circle r="29"/>
      <text y="6" text-anchor="middle">${r}</text>
    </g>`),window.setTimeout(()=>document.getElementById(a)?.remove(),760)}function pe(){if(T!==`playing`||A<=0)return;let e=[...E].filter(e=>!D.has(e)),t=e[Math.floor(B()*e.length)];if(!t)return;let n=document.querySelector(`[data-object-id="${t}"]`);n&&(--A,j+=1,M=1,O=Math.max(0,O-220),n.classList.add(`is-hinted`),C.messageLine.textContent=`${g(z(),t)} 주변에 등대 신호를 비췄습니다.`,d(860,.14,.02),q(),window.setTimeout(()=>n.classList.remove(`is-hinted`),1800),o(`hidden_hint_use`,{game_id:v,scene_id:z().id,hints_used:j}))}function me(){return j===0&&k<=1&&P>=20?`gold`:k<=5&&P>0?`silver`:`bronze`}function he(){if(T!==`playing`)return;H(),T=`won`;let e=z();O+=P*20;let t=me();L={scene:e,medal:t,score:O,mistakes:k,hintsUsed:j,timeLeft:P},c(v,e.id,{medal:t,score:O,rotations:k+j*2}),G(),q(),ge(L),d(660,.11,.025),window.setTimeout(()=>d(880,.13,.025),100),window.setTimeout(()=>d(1180,.16,.02),210),o(`hidden_round_complete`,{game_id:v,scene_id:e.id,medal:t,score:O,mistakes:k,hints_used:j,time_left:P})}function Z(){T===`playing`&&(H(),T=`lost`,U(`수색 시간이 끝났습니다`,`${E.size-D.size}개의 분실물이 남았습니다. 같은 장면에서 목록을 새로 섞어 다시 도전할 수 있습니다.`,`다시 수색`),C.messageLine.textContent=`시간 종료. 장면을 다시 살펴보고 재도전하세요.`,d(150,.2,.035),o(`hidden_round_fail`,{game_id:v,scene_id:z().id,found_count:D.size}))}function ge(e){C.resultMedal.textContent=x[e.medal],C.resultMedal.dataset.medal=e.medal,C.resultSummary.textContent=`${e.scene.name}에서 분실물 ${E.size}개를 모두 회수했습니다. 남은 시간 ${V(e.timeLeft)}, 오답 ${e.mistakes}회입니다.`,C.resultScore.textContent=e.score.toLocaleString(`ko-KR`),C.resultTime.textContent=V(e.timeLeft),C.resultMistakes.textContent=String(e.mistakes),C.resultHints.textContent=String(e.hintsUsed),C.resultOverlay.hidden=!1,C.resultNext.focus()}function Q(){C.resultOverlay.hidden=!0}function $(e){I=Math.min(1.75,Math.max(1,Math.round((I+e)*4)/4));let t=document.querySelector(`#hidden-scene`);t&&(t.style.width=`${I*100}%`),q(),C.messageLine.textContent=`장면 확대 ${Math.round(I*100)}%`}C.startButton.addEventListener(`click`,()=>{T===`lost`&&W(w),le()}),C.hintButton.addEventListener(`click`,pe),C.zoomOut.addEventListener(`click`,()=>$(-.25)),C.zoomIn.addEventListener(`click`,()=>$(.25)),C.restartButton.addEventListener(`click`,()=>W(w)),C.previousScene.addEventListener(`click`,()=>W(w-1)),C.nextScene.addEventListener(`click`,()=>W(w+1)),C.resultNext.addEventListener(`click`,()=>{Q(),W(w+1)}),C.resultClose.addEventListener(`click`,Q),C.resultOverlay.addEventListener(`click`,e=>{e.target===C.resultOverlay&&Q()}),C.resultShare.addEventListener(`click`,async()=>{if(!L)return;let e=`Harbor Lost & Found · ${L.scene.name}\n${x[L.medal]} · ${L.score.toLocaleString(`ko-KR`)}점 · 오답 ${L.mistakes}회`;try{navigator.share?(await navigator.share({title:`Harbor Lost & Found — PLAY100`,text:e,url:window.location.href}),o(`game_share`,{game_id:v,method:`web_share`})):(await navigator.clipboard.writeText(`${e}\n${window.location.href}`),C.resultShare.textContent=`복사됨`,o(`game_share`,{game_id:v,method:`clipboard`}))}catch{}}),new URLSearchParams(window.location.search).get(`daily`)===`1`&&(w=u(_.length)),W(w),o(`game_page_view`,{game_id:v});