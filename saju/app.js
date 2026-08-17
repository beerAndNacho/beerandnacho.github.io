const ELEMENTS=['목','화','토','금','수'];
const ELEMENT_MAP={木:'목',火:'화',土:'토',金:'금',水:'수'};
const GAN={甲:['갑','목','양'],乙:['을','목','음'],丙:['병','화','양'],丁:['정','화','음'],戊:['무','토','양'],己:['기','토','음'],庚:['경','금','양'],辛:['신','금','음'],壬:['임','수','양'],癸:['계','수','음']};
const ZODIAC={鼠:'쥐',牛:'소',虎:'호랑이',兔:'토끼',龙:'용',龍:'용',蛇:'뱀',马:'말',馬:'말',羊:'양',猴:'원숭이',鸡:'닭',雞:'닭',狗:'개',猪:'돼지',豬:'돼지'};
const ELEMENT_DESC={목:'성장 · 기획 · 확장 · 새로운 시작',화:'표현 · 추진력 · 열정 · 존재감',토:'안정 · 현실성 · 중재 · 지속성',금:'판단 · 결단 · 원칙 · 정리',수:'사고 · 유연함 · 학습 · 정보'};
const TIPS={목:['새로운 기술이나 취미를 배우며 성장 자극 만들기','계획을 작은 실행 단위로 쪼개 시작 횟수 늘리기','새로운 사람·환경과 연결되는 시간 확보하기'],화:['생각을 말·글·콘텐츠로 밖에 표현하기','짧고 선명한 목표로 추진력 끌어올리기','몸을 움직이는 활동으로 에너지 순환 만들기'],토:['수면·식사·업무 시간을 일정하게 유지하기','반복 가능한 작은 루틴을 우선하기','돈과 일정을 숫자로 정리하기'],금:['해야 할 일과 하지 않을 일을 구분하기','정리·삭제·마감처럼 끝을 만드는 행동 늘리기','감정과 사실을 분리해 판단 기준 적기'],수:['혼자 생각하고 정리하는 시간을 일정에 넣기','읽기·기록·대화로 새로운 정보 받아들이기','대안을 두세 개 준비해 유연성 높이기']};
const GENERATES={목:'화',화:'토',토:'금',금:'수',수:'목'};
const CONTROLS={목:'토',토:'수',수:'화',화:'금',금:'목'};
const RELATION_LABEL={romance:'연애',marriage:'결혼',friend:'친구',work:'직장·동료'};
const WEIGHTS={romance:{distribution:30,complement:25,dayMaster:30,yinYang:15},marriage:{distribution:30,complement:30,dayMaster:25,yinYang:15},friend:{distribution:35,complement:30,dayMaster:25,yinYang:10},work:{distribution:30,complement:35,dayMaster:25,yinYang:10}};

const $=id=>document.getElementById(id);
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));

function profileFrom(prefix,{name=false}={}){
  return {
    name:name?$(prefix+'Name').value.trim():'',
    gender:$(prefix+'Gender').value,
    calendarType:$(prefix+'Cal').value,
    birthDate:$(prefix+'Date').value,
    birthTime:$(prefix+'Time').value||'12:00',
    timeKnown:!$(prefix+'Unknown').checked,
    leapMonth:$(prefix+'Cal').value==='lunar'&&$(prefix+'Leap').checked
  };
}

function setProfile(prefix,profile,{name=false}={}){
  if(name&&$(prefix+'Name')) $(prefix+'Name').value=profile.name||'';
  $(prefix+'Gender').value=profile.gender||'male';
  $(prefix+'Cal').value=profile.calendarType||'solar';
  $(prefix+'Date').value=profile.birthDate||'1990-01-01';
  $(prefix+'Time').value=profile.birthTime||'12:00';
  $(prefix+'Unknown').checked=!profile.timeKnown;
  $(prefix+'Leap').checked=!!profile.leapMonth;
  syncProfileUI(prefix);
}

function syncProfileUI(prefix){
  const unknown=$(prefix+'Unknown').checked;
  const lunar=$(prefix+'Cal').value==='lunar';
  $(prefix+'Time').disabled=unknown;
  const leapWrap=$(prefix+'LeapWrap');
  if(leapWrap) leapWrap.hidden=!lunar;
  if(!lunar) $(prefix+'Leap').checked=false;
}

function validateProfile(p){
  if(!p.gender) return '성별을 선택해 주세요.';
  if(!p.birthDate) return '생년월일을 입력해 주세요.';
  const [y,m,d]=p.birthDate.split('-').map(Number);
  if(!y||!m||!d||m<1||m>12||d<1||d>31) return '생년월일을 확인해 주세요.';
  if(p.timeKnown){
    const [h,min]=p.birthTime.split(':').map(Number);
    if(Number.isNaN(h)||Number.isNaN(min)||h<0||h>23||min<0||min>59) return '출생시간을 확인해 주세요.';
  }
  return null;
}

function calculateSaju(p){
  const problem=validateProfile(p); if(problem) throw new Error(problem);
  if(typeof Solar==='undefined'||typeof Lunar==='undefined') throw new Error('달력 라이브러리를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
  const [y,m,d]=p.birthDate.split('-').map(Number);
  let [h,min]=p.birthTime.split(':').map(Number);
  if(!p.timeKnown){h=12;min=0;}
  const lunar=p.calendarType==='lunar'?Lunar.fromYmdHms(y,p.leapMonth?-m:m,d,h,min,0):Solar.fromYmdHms(y,m,d,h,min,0).getLunar();
  const ec=lunar.getEightChar();
  const all=[['년주',ec.getYear(),ec.getYearWuXing()],['월주',ec.getMonth(),ec.getMonthWuXing()],['일주',ec.getDay(),ec.getDayWuXing()],['시주',ec.getTime(),ec.getTimeWuXing()]];
  const pillars=p.timeKnown?all:all.slice(0,3);
  const total=p.timeKnown?8:6;
  const counts={목:0,화:0,토:0,금:0,수:0};
  pillars.forEach(x=>[...x[2]].forEach(ch=>{if(ELEMENT_MAP[ch])counts[ELEMENT_MAP[ch]]++;}));
  const frequencies=Object.fromEntries(ELEMENTS.map(e=>[e,counts[e]/total]));
  const strongest=[...ELEMENTS].sort((a,b)=>counts[b]-counts[a])[0];
  const weakest=[...ELEMENTS].sort((a,b)=>counts[a]-counts[b])[0];
  const dayGan=ec.getDay().slice(0,1);
  const info=GAN[dayGan]||[dayGan,strongest,''];
  const animal=lunar.getYearShengXiao();
  return {profile:p,pillars,total,counts,frequencies,strongest,weakest,dayGan,dayName:info[0],dayMasterElement:info[1],yinYang:info[2],zodiac:ZODIAC[animal]||animal,solarDate:lunar.getSolar().toYmd(),lunarDate:lunar.toString()};
}

function distributionScore(a,b){
  const d=ELEMENTS.reduce((sum,e)=>sum+Math.abs(a.frequencies[e]-b.frequencies[e]),0);
  return clamp(100*(1-d/2));
}
function complementScore(a,b){
  const aNeed=1-a.frequencies[a.weakest],bNeed=1-b.frequencies[b.weakest];
  return clamp(45+((b.frequencies[a.weakest]*aNeed+a.frequencies[b.weakest]*bNeed)/2)*90);
}
function dayMasterScore(a,b){
  const ae=a.dayMasterElement,be=b.dayMasterElement;
  if(ae===be)return 82;
  if(GENERATES[ae]===be||GENERATES[be]===ae)return 92;
  if(CONTROLS[ae]===be||CONTROLS[be]===ae)return 64;
  return 76;
}
function yinYangScore(a,b){return a.yinYang&&b.yinYang?(a.yinYang===b.yinYang?76:90):75;}
function level(score){return score>=90?'매우 높은 조화':score>=80?'강한 조화':score>=70?'편안한 조화':score>=60?'조율하면 좋은 관계':'차이를 이해하면 좋은 관계';}
function relationTip(type){return type==='romance'?'감정 표현 속도와 애정 확인 방식을 말로 확인해 보세요.':type==='marriage'?'생활 리듬·돈·역할 분담 같은 현실 기준을 미리 맞춰 보세요.':type==='friend'?'함께 즐기는 방식과 혼자 쉬는 방식의 차이를 인정해 보세요.':'업무 속도·의사결정 기준·피드백 방식을 먼저 합의해 보세요.';}
function compatibility(a,b,type){
  const breakdown={distribution:distributionScore(a,b),complement:complementScore(a,b),dayMaster:dayMasterScore(a,b),yinYang:yinYangScore(a,b)};
  const w=WEIGHTS[type];
  const score=clamp((breakdown.distribution*w.distribution+breakdown.complement*w.complement+breakdown.dayMaster*w.dayMaster+breakdown.yinYang*w.yinYang)/100);
  const an=a.profile.name||'A',bn=b.profile.name||'B';
  const mutual=b.strongest===a.weakest||a.strongest===b.weakest;
  const same=a.strongest===b.strongest;
  const generated=GENERATES[a.dayMasterElement]===b.dayMasterElement||GENERATES[b.dayMasterElement]===a.dayMasterElement;
  const good=mutual?`${an}와 ${bn}는 한쪽의 약한 오행을 다른 쪽의 강한 오행이 채워 주는 상호 보완 포인트가 보입니다.`:same?`두 사람 모두 ${a.strongest} 기운이 강해 중요하게 여기는 속도와 방식에 공통점이 생기기 쉽습니다.`:`두 사람의 강한 오행이 달라 같은 상황을 다른 방식으로 해결하는 장점이 있습니다.`;
  const care=a.weakest===b.weakest?`두 사람 모두 ${a.weakest} 기운이 약해 이 영역에서는 서로가 자동으로 보완해 줄 것이라 기대하지 않는 편이 좋습니다.`:`차이가 큰 영역에서는 누가 맞는지를 정하기보다 역할을 나누는 편이 좋습니다. ${relationTip(type)}`;
  const relation=generated?'일간 오행은 서로 이어 주는 생(生)의 흐름이 보여 상대의 방식에서 자극과 확장을 얻기 쉽습니다.':breakdown.dayMaster<70?'일간 오행은 긴장감이 생길 수 있어 판단 속도와 표현 방식의 차이를 먼저 이해하는 것이 중요합니다.':'일간 오행은 한쪽으로 크게 치우치지 않아 서로의 차이를 조율해 나가는 관계에 가깝습니다.';
  return {score,breakdown,headline:`${RELATION_LABEL[type]} 관계 · ${score}점 · ${level(score)}`,summary:`${an}(${a.profile.gender==='male'?'남성':'여성'})와 ${bn}(${b.profile.gender==='male'?'남성':'여성'})의 오행 조화, 상호 보완, 일간 관계, 음양 리듬을 비교했습니다. ${relation}`,good,care,core:`${an}는 ${a.dayGan}(${a.dayName}) · ${a.strongest} 강 / ${a.weakest} 보완, ${bn}는 ${b.dayGan}(${b.dayName}) · ${b.strongest} 강 / ${b.weakest} 보완입니다.`};
}

function renderSaju(c){
  $('sajuDateText').textContent=`양력 ${c.solarDate} · 음력 ${c.lunarDate} · ${c.profile.gender==='male'?'남성':'여성'} · ${c.total}글자 기준`;
  $('master').textContent=`${c.dayGan}(${c.dayName})`;$('masterMeta').textContent=`${c.yinYang}${c.dayMasterElement}`;
  $('zodiac').textContent=c.zodiac+'띠';
  $('strong').textContent=c.strongest;$('strongMeta').textContent=ELEMENT_DESC[c.strongest];
  $('weak').textContent=c.weakest;$('weakMeta').textContent=ELEMENT_DESC[c.weakest];
  $('pillars').innerHTML=c.pillars.map(p=>`<article class="pillar"><small>${p[0]}</small><b>${p[1]}</b><span>${p[2]}</span></article>`).join('');
  const max=Math.max(...Object.values(c.counts),1);
  $('elements').innerHTML=ELEMENTS.map(e=>`<div class="row"><b>${e}</b><div class="bar"><i style="width:${c.counts[e]/max*100}%"></i></div><span>${c.counts[e]}</span></div>`).join('');
  $('headline').textContent=`${c.strongest}의 힘을 살리고, ${c.weakest}를 보완하세요.`;
  $('summary').textContent=`${c.yinYang}${c.dayMasterElement} 성향의 ${c.dayName} 일간을 중심으로, 원국에서는 ${c.strongest} 기운이 가장 두드러집니다. ${c.weakest} 기운은 상대적으로 적어 의식적인 보완 포인트를 만드는 방식으로 활용해 볼 수 있습니다.`;
  $('tips').innerHTML=TIPS[c.weakest].map(t=>`<div class="tip">✓ ${t}</div>`).join('');
  $('sajuResults').style.display='block';
  $('sajuResults').scrollIntoView({behavior:'smooth',block:'start'});
}

function metric(label,value){return `<article class="metric"><small>${label}</small><b>${value}</b><div class="miniBar"><i style="width:${value}%"></i></div></article>`;}
function renderCompatibility(r,type){
  $('scoreCircle').style.setProperty('--score',`${r.score*3.6}deg`);$('scoreText').textContent=r.score;
  $('compatHeadline').textContent=r.headline;$('compatSummary').textContent=r.summary;
  $('breakdowns').innerHTML=metric('오행 조화',r.breakdown.distribution)+metric('상호 보완',r.breakdown.complement)+metric('일간 관계',r.breakdown.dayMaster)+metric('음양 리듬',r.breakdown.yinYang);
  $('compatGood').textContent=r.good;$('compatCare').textContent=r.care;$('compatCore').textContent=r.core;
  $('compatTypeLabel').textContent=RELATION_LABEL[type]+' 궁합';
  $('compatResult').style.display='block';$('compatResult').scrollIntoView({behavior:'smooth',block:'start'});
}

['m','a','b'].forEach(prefix=>{
  $(prefix+'Unknown').addEventListener('change',()=>syncProfileUI(prefix));
  $(prefix+'Cal').addEventListener('change',()=>syncProfileUI(prefix));
  syncProfileUI(prefix);
});

$('sajuForm').addEventListener('submit',e=>{
  e.preventDefault();$('sajuError').textContent='';
  try{renderSaju(calculateSaju(profileFrom('m')));}catch(err){$('sajuError').textContent=err.message||'입력값을 확인해 주세요.';}
});

$('editAgain').addEventListener('click',()=>{$('sajuInput').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('mDate').focus(),350);});
$('copyMine').addEventListener('click',()=>{const p=profileFrom('m');p.name=p.name||'나';setProfile('a',p,{name:true});$('compatibility').scrollIntoView({behavior:'smooth',block:'start'});});

$('compatForm').addEventListener('submit',e=>{
  e.preventDefault();$('compatError').textContent='';
  try{const a=calculateSaju(profileFrom('a',{name:true})),b=calculateSaju(profileFrom('b',{name:true})),type=$('relationshipType').value;renderCompatibility(compatibility(a,b,type),type);}catch(err){$('compatError').textContent=err.message||'두 사람의 입력값을 확인해 주세요.';}
});

$('editCompat').addEventListener('click',()=>{$('compatInput').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('aDate').focus(),350);});
