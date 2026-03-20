/* ════════════════════════════════════
   DATA
   schedule: 요일별 세차 예정 여부 (O 표시)
   sun=일(26), mon=월(19), tue=화(19), wed=수(23), thu=목(18)
════════════════════════════════════ */
const DAYS=[
  {key:'sun',name:'일',date:'26'},
  {key:'mon',name:'월',date:'19'},
  {key:'tue',name:'화',date:'19'},
  {key:'wed',name:'수',date:'23'},
  {key:'thu',name:'목',date:'18'},
];

// schedule: 세차 예정 요일 배열 (이미지의 O 표시)
const APTS=[
  /* ─── 중앙하이츠 1~2 ─── */
  {id:'ha12', name:'중앙하이츠 1~2', icon:'🏢',
   memo:'청마루 7813 BMW GT 검정 → 28번기둥(106동밖) | Ray 0745/7974 → 주1회 보일때 세차',
   cars:[
    {num:'8785', car:'벤츠E',      col:'흰색',  loc:'B1',          sched:['mon','wed'],        note:'B1 고정'},
    {num:'6453', car:'렉서스LS',   col:'검정',  loc:'B1',          sched:['sun'],               note:''},
    {num:'8696', car:'그랜저',     col:'—',     loc:'B1',          sched:['mon'],               note:'8시'},
    {num:'2451', car:'벤츠GLC',    col:'남색',  loc:'B2/B1',       sched:['mon'],               note:'7시 (가끔 픽업)'},
    {num:'1710', car:'GV70',       col:'흰색',  loc:'B2/B3/B1',    sched:['tue'],               note:''},
    {num:'1319', car:'벤츠E',      col:'청색',  loc:'W B3',        sched:['sun','wed'],         note:'필요시 문자, 8시 다시 나감'},
    {num:'2763', car:'벤츠S',      col:'검정',  loc:'B4',          sched:['sun','tue'],         note:'부재시 익일'},
    {num:'5225', car:'BMW X6',     col:'흰색',  loc:'B4',          sched:['sun','tue'],         note:'월2회, 풀주 내외부같이'},
    {num:'4590', car:'아우디A6',   col:'흰색',  loc:'B5',          sched:['mon','wed'],         note:'거의고정, 내부요청시 유료'},
    {num:'0894', car:'렉스턴 칸',  col:'빨강',  loc:'B5',          sched:[],                    note:'시간될때'},
  ]},

  /* ─── 중앙하이츠 3~4 ─── */
  {id:'ha34', name:'중앙하이츠 3~4', icon:'🏢',
   memo:'W (월) 1638 690원',
   cars:[
    {num:'9025', car:'그랜저(신형)', col:'검정', loc:'B1',           sched:['sun','tue','thu'],   note:'넷째주 문자하고 내부'},
    {num:'5610', car:'익스플로러',   col:'검정', loc:'B1',           sched:['sun','tue','thu'],   note:'넷째주 문자하고 내부'},
    {num:'2310', car:'렉서스',       col:'금색', loc:'B1',           sched:['sun','wed'],         note:'거의고정'},
    {num:'2647', car:'G80(신형)',    col:'남색', loc:'B1',           sched:['sun','tue'],         note:'가끔 출장'},
    {num:'3290', car:'그랜저(구형)', col:'검정', loc:'W B1',         sched:['sun','tue'],         note:'12시 or 외박'},
    {num:'9177', car:'벤츠GLS',      col:'검정', loc:'B1',           sched:['wed'],               note:'거의고정'},
    {num:'7406', car:'렉스턴',       col:'검정', loc:'W B1',         sched:['tue'],               note:'월2(2,4째주)'},
    {num:'7609', car:'벤츠E',        col:'남희색',loc:'B1/B4',        sched:['tue'],               note:'거의고정, 스류어디스'},
    {num:'9881', car:'G90',          col:'검정', loc:'B1/B4 와이퍼x',sched:['sun','mon','wed'],   note:'12시 or 외박'},
    {num:'0672', car:'벤츠E',        col:'검정', loc:'B1',           sched:['wed'],               note:'내부는 해달라고 할때만'},
    {num:'4631', car:'벤츠C',        col:'검정', loc:'B2/와이피x',   sched:['mon'],               note:'월2회 내부/10시'},
    {num:'5811', car:'벤츠S',        col:'검정', loc:'B3/B4',        sched:['sun','tue'],         note:'월2회 내부/10시'},
    {num:'5242', car:'레인지로버',   col:'검정', loc:'B4',           sched:['sun'],               note:'플랫폼 내부 문열림 확인'},
    {num:'1642', car:'G80',          col:'—',    loc:'B4/B3',        sched:['mon'],               note:'플랫폼 내부 문열림 확인'},
    {num:'0241', car:'BMW 1',        col:'청색', loc:'W B4/B3',      sched:['sun'],               note:'내부후 키→9025,5610 헬끼내부'},
    {num:'5414', car:'벤츠EQE',      col:'검정', loc:'B4/B5',        sched:['sun','tue','thu'],   note:'넷째주 문자하고 내부'},
    {num:'4709', car:'포르쉐',       col:'흰색', loc:'W.P B5',       sched:['sun'],               note:'월2(2,4째주), 이전 K7 1293'},
    {num:'5625', car:'벤츠',         col:'—',    loc:'B5',           sched:['sun','tue','thu'],   note:'첫째주 내부'},
    {num:'7700', car:'—',            col:'검정', loc:'B5',           sched:['sun','tue','thu'],   note:''},
    {num:'8721', car:'G90',          col:'무광', loc:'B5',           sched:['sun','wed'],         note:''},
    {num:'0946', car:'벤츠E',        col:'—',    loc:'W B5',         sched:['mon'],               note:''},
    {num:'9946', car:'CLE',          col:'흰색', loc:'W B5',         sched:['sun'],               note:''},
  ]},

  /* ─── 블루밍 ─── */
  {id:'blooming', name:'블루밍', icon:'🌸', memo:'',
   cars:[
    {num:'9304', car:'렉스턴(신형)', col:'흰색', loc:'W B2/B1 101동', sched:['sun','tue','thu'], note:'12시'},
    {num:'1607', car:'렉스턴(구형)', col:'은색', loc:'W B2',          sched:['mon'],             note:'거의고정'},
    {num:'7488', car:'벨토스',       col:'흰색', loc:'W B2',          sched:['mon','wed'],       note:'여행'},
    {num:'1005', car:'카니발',       col:'흰색', loc:'W B2',          sched:['sun','wed'],       note:'여행'},
    {num:'4836', car:'테슬라',       col:'회색', loc:'B2 보통가운데', sched:['mon'],             note:'부재시 출장'},
    {num:'8254', car:'BMW X6',       col:'청색', loc:'P B2/B1 101동', sched:['mon'],             note:'부재시 출장'},
    {num:'8615', car:'벤츠S',        col:'흰색', loc:'P B2 95기둥',   sched:['mon'],             note:'거의고정, 늦으면 10시30'},
    {num:'9140', car:'카니발',       col:'검정', loc:'W B1 105동',    sched:['tue'],             note:'이전번호 6704'},
    {num:'1732', car:'신형그랜저',   col:'흰색', loc:'P B1/와이피o',  sched:['mon'],             note:'거의고정, 늦으면 10시30'},
    {num:'7034', car:'쏘렌토',       col:'은색', loc:'B1/와이피o',    sched:['wed'],             note:''},
  ]},

  /* ─── 고척푸르지오 ─── */
  {id:'gocheok', name:'고척푸르지오', icon:'🏗️', memo:'1011 GLC → O O',
   cars:[
    {num:'6997', car:'벤츠E(구형)', col:'검정', loc:'위2층 위쪽바깔',  sched:['sun','tue'],   note:'고정, 와이피o'},
    {num:'6171', car:'QM6',         col:'은색', loc:'뒷윗층',          sched:['mon','wed'],   note:'출장'},
    {num:'0175', car:'K9',          col:'검정', loc:'뒷윗층 바깔',     sched:['sun','tue'],   note:'1달1회, 안오면 6997세차'},
    {num:'2920', car:'—',           col:'은색', loc:'위2층/6997근처',  sched:['mon','wed'],   note:'거의고정 12~12시30'},
    {num:'2581', car:'렉서스',      col:'금색', loc:'위2층',           sched:['sun','tue'],   note:'고정'},
    {num:'5910', car:'벤츠S',       col:'검정', loc:'위2층',           sched:['mon','wed'],   note:'거의고정'},
    {num:'8319', car:'G90',         col:'검정', loc:'W 위2층 아래바깔',sched:['sun','tue'],   note:'2477없으면 안들어옴'},
    {num:'2477', car:'벤츠E',       col:'검정', loc:'위2층 아래바깔',  sched:['mon','wed'],   note:'고정, 늦으면 12시'},
  ]},

  /* ─── 고척아이파크MD ─── */
  {id:'ipark', name:'고척아이파크MD', icon:'🏙️', memo:'',
   cars:[
    {num:'8741', car:'벤츠E', col:'청색', loc:'4동 102동1~2', sched:['mon'], note:'23기둥근처, 고정'},
    {num:'6600', car:'G90',   col:'—',    loc:'—',            sched:['mon'], note:'103동 1-28층이상'},
  ]},

  /* ─── 목동파크자이 ─── */
  {id:'mokdong', name:'목동파크자이', icon:'🌲', memo:'',
   cars:[
    {num:'12기당', car:'벤츠S', col:'검정', loc:'B1 107동 3~4', sched:['sun','tue','thu'], note:'타이어광택x'},
    {num:'4689',   car:'G70',   col:'검정', loc:'B1 103동 3~4', sched:['sun','tue','thu'], note:'타이어광택x'},
  ]},

  /* ─── 신구로자이 ─── */
  {id:'guro', name:'신구로자이', icon:'🏠', memo:'목동동로 339 인근',
   cars:[
    {num:'7506', car:'포르쉐', col:'회색', loc:'신구로자이', sched:['tue'], note:'구로구 중앙로 134 위'},
  ]},

  /* ─── 신정롯데캐슬 ─── */
  {id:'lotte', name:'신정롯데캐슬', icon:'🏰', memo:'신록로 24 X5 → 같은날?',
   cars:[
    {num:'1709', car:'레이',     col:'흰색', loc:'신정롯데캐슬', sched:['mon'], note:'신록로 12길 22'},
    {num:'—',    car:'벤츠OLS',  col:'검정', loc:'—',            sched:['mon'], note:''},
    {num:'5246', car:'아우디A3', col:'검정', loc:'—',            sched:['mon'], note:''},
  ]},
];

/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let activeDay = 'sun';
let curApt    = null;

// 완료 상태: "w5_{aptId}_{ci}_{dayKey}" = '1'
const sk      = (a,ci,d) => `w5_${a}_${ci}_${d}`;
const isDone  = (a,ci,d) => localStorage.getItem(sk(a,ci,d)) === '1';
const setDone = (a,ci,d,v) => v ? localStorage.setItem(sk(a,ci,d),'1') : localStorage.removeItem(sk(a,ci,d));

// 요일 순서
const DAY_ORDER = ['sun','mon','tue','wed','thu'];

/*
  ── 이월 규칙 ──────────────────────────────────────────────
  차량이 특정 요일(origDay)에 sched 에 있고 완료(isDone)가 안 됐으면
  → 바로 다음 요일(nextDay)에 이월 차량으로 나타난다.
  nextDay에서도 완료 안 되면 → 그 다음 날로 계속 이월.
  
  즉, dayKey 에 보여야 할 이월 차량 =
    이전 요일들 중 sched 에 있었고 아직 완료 안 된 차량.
    (단, dayKey 자체의 sched 여부는 무관)

  isCarryoverOnDay(apt, ci, dayKey):
    dayKey 에 이 차량이 "이월 상태"로 표시돼야 하는가?
    
    조건:
    1. dayKey 에 아직 완료 안 됐을 것
    2. dayKey 이전 요일 중 sched 에 있었고 완료 안 된 날이 존재할 것
    3. 그 이전 요일과 dayKey 사이에 완료된 날이 없을 것
       (중간에 완료됐으면 이월 해소)

  쉽게 말하면:
  "가장 최근 sched 예정일부터 지금까지 한 번도 완료 안 됐으면" → 이월
──────────────────────────────────────────────────────── */
function isCarryoverOnDay(apt, ci, dayKey) {
  const car = apt.cars[ci];
  const todayIdx = DAY_ORDER.indexOf(dayKey);
  if (todayIdx <= 0) return false; // 첫날(일)은 이월 없음

  // dayKey 에 이미 완료됐으면 이월 표시 불필요
  if (isDone(apt.id, ci, dayKey)) return false;

  // 이전 요일 중 가장 최근 sched 날 찾기
  let lastSchedIdx = -1;
  for (let i = todayIdx - 1; i >= 0; i--) {
    if (car.sched.includes(DAY_ORDER[i])) { lastSchedIdx = i; break; }
  }
  if (lastSchedIdx === -1) return false; // 이전에 예정 자체가 없으면 이월 아님

  // lastSchedIdx 부터 dayKey 바로 전까지 완료된 날이 하나라도 있으면 이월 아님
  for (let i = lastSchedIdx; i < todayIdx; i++) {
    if (isDone(apt.id, ci, DAY_ORDER[i])) return false; // 중간 완료 → 이월 해소
  }

  // lastSchedIdx 의 sched 에 있었고 완료 안 됐으면 → 이월
  return true;
}

// dayKey 에 해당 차량을 "보여줘야 하는가" (원래 sched OR 이월)
function shouldShowOnDay(apt, ci, dayKey) {
  const car = apt.cars[ci];
  return car.sched.includes(dayKey) || isCarryoverOnDay(apt, ci, dayKey);
}

// 이월 원인 요일 텍스트 (예: "일요일")
function carryoverFromDay(apt, ci, dayKey) {
  const car = apt.cars[ci];
  const todayIdx = DAY_ORDER.indexOf(dayKey);
  for (let i = todayIdx - 1; i >= 0; i--) {
    if (car.sched.includes(DAY_ORDER[i]) && !isDone(apt.id, ci, DAY_ORDER[i])) {
      return DAYS.find(d => d.key === DAY_ORDER[i])?.name + '요일';
    }
  }
  return '';
}

/* ════════════════════════════════════
   UTILS
════════════════════════════════════ */
function colCls(c){ return ['검정','흰색','은색','남색','청색','남희색','금색','빨강','회색','무광'].includes(c)?`cc-${c}`:'cc-default'; }

function updateDate(){
  const n=new Date(), names=['일','월','화','수','목','금','토'];
  document.getElementById('home-date').textContent=`${n.getMonth()+1}/${n.getDate()}(${names[n.getDay()]})`;
}

/* ════════════════════════════════════
   PAGE NAV
════════════════════════════════════ */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const page = document.getElementById(id);
  page.classList.add('on');
  // 페이지 전환 시 스크롤 최상단으로
  const scrollEl = page.querySelector('.scroll');
  if(scrollEl) scrollEl.scrollTop = 0;
}
function goHome(){ curApt=null; showPage('pg-home'); renderHome(); }
function goDetail(aptId){ curApt=aptId; showPage('pg-detail'); renderDetail(); }

/* ════════════════════════════════════
   HOME
════════════════════════════════════ */
function renderHome(){
  buildDayTabs();
  buildAptGrid();
  calcHomeSummary();
}

function buildDayTabs(){
  const el=document.getElementById('day-tabs');
  el.innerHTML=DAYS.map(d=>{
    // 해당 요일에 보여야 할 차량 수 (원래 sched + 이월)
    let total=0;
    APTS.forEach(apt=>apt.cars.forEach((_,ci)=>{
      if(shouldShowOnDay(apt,ci,d.key)) total++;
    }));
    return `
    <div class="dt${d.key===activeDay?' on':''}" data-day="${d.key}">
      <span class="dn">${d.name}요일</span>
      <span class="dc">${total}</span>
    </div>`;
  }).join('');
  el.querySelectorAll('.dt').forEach(b=>b.addEventListener('click',()=>{
    activeDay=b.dataset.day;
    renderHome();
    if(curApt) renderDetail();
  }));
}

function calcHomeSummary(){
  let total=0, done=0, carryoverCount=0;
  APTS.forEach(apt=>apt.cars.forEach((_,ci)=>{
    if(!shouldShowOnDay(apt,ci,activeDay)) return;
    total++;
    if(isDone(apt.id,ci,activeDay)) done++;
    else if(isCarryoverOnDay(apt,ci,activeDay)) carryoverCount++;
  }));
  const left=total-done;
  const pct=total?Math.round(done/total*100):0;
  const dayName=DAYS.find(d=>d.key===activeDay)?.name;

  document.getElementById('sb-daytitle').textContent=`${dayName}요일 세차 현황`;
  document.getElementById('sb-total').textContent=total;
  document.getElementById('sb-done').textContent=done;
  document.getElementById('sb-left').textContent=left;
  document.getElementById('sb-pct').textContent=pct+'%';
  document.getElementById('sb-bar').style.width=pct+'%';

  const badge=document.getElementById('sb-carryover');
  if(carryoverCount>0){
    badge.style.display='inline-flex';
    badge.textContent=`↩ 이월 ${carryoverCount}대`;
  } else {
    badge.style.display='none';
  }
}

function buildAptGrid(){
  const el=document.getElementById('apt-grid');
  el.innerHTML=APTS.map(apt=>{
    // 해당 요일에 보여야 할 차량 (sched + 이월)
    const visible=apt.cars.map((_,ci)=>ci).filter(ci=>shouldShowOnDay(apt,ci,activeDay));
    const total=visible.length;
    const done=visible.filter(ci=>isDone(apt.id,ci,activeDay)).length;
    const carryovers=visible.filter(ci=>isCarryoverOnDay(apt,ci,activeDay)).length;
    const pct=total?Math.round(done/total*100):0;
    const hasSchedule=total>0;
    let badgeCls='b-none', badgeText='없음';
    if(total>0){
      if(done===total){ badgeCls='b-all'; badgeText=''; }
      else { badgeCls='b-some'; badgeText=`${done}/${total}`; }
    }
    const isAllDone = total>0 && done===total;
    const carryoverHtml=carryovers>0
      ?`<div style="font-size:11px;font-weight:700;color:#ea580c;margin-top:2px;">↩ 이월 ${carryovers}대</div>`:'';
    return `
    <div class="apt-btn${hasSchedule?' has-schedule':' no-schedule'}${isAllDone?' all-done':''}" onclick="${hasSchedule?`goDetail('${apt.id}')`:''}" style="${!hasSchedule?'cursor:default':''}">
      <div class="ab-name">${apt.name}</div>
      <div class="ab-info">${hasSchedule?`${total}대 예정`:'이날 없음'}</div>
      ${carryoverHtml}
      ${hasSchedule?`<div class="ab-prog"><div class="ab-prog-fill" style="width:${pct}%"></div></div>`:''}
      <div class="ab-badge ${badgeCls}">${badgeText}</div>
      ${hasSchedule?`<div class="ab-arrow">›</div>`:''}
    </div>`;
  }).join('');
}

/* ════════════════════════════════════
   DETAIL
════════════════════════════════════ */
function buildHeroHtml(apt){
  const visible=apt.cars.map((_,ci)=>ci).filter(ci=>shouldShowOnDay(apt,ci,activeDay));
  const total=visible.length;
  const done=visible.filter(ci=>isDone(apt.id,ci,activeDay)).length;
  const left=total-done;
  const carryovers=visible.filter(ci=>isCarryoverOnDay(apt,ci,activeDay)).length;
  const pct=total?Math.round(done/total*100):0;
  const dayName=DAYS.find(d=>d.key===activeDay)?.name;
  return `
    <div class="ah-row">
      <div style="flex:1;min-width:0;">
        <div class="ah-name">${apt.name}</div>
        <div class="ah-sub">${dayName}요일 · 예정 ${total}대${carryovers>0?` · <span style="color:#ea580c">↩ 이월 ${carryovers}대</span>`:''}</div>
      </div>
    </div>
    <div class="ah-stat-row">
      <div class="ahs at"><div class="av">${total}</div><div class="al">예정</div></div>
      <div class="ahs ad"><div class="av">${done}</div><div class="al">완료</div></div>
      <div class="ahs ar"><div class="av">${left}</div><div class="al">남은</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:10px;">
      <div style="flex:1;height:6px;background:var(--bg);border:1px solid var(--border);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--blue),var(--green));border-radius:3px;transition:width .4s;"></div>
      </div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--green);flex-shrink:0;">${pct}%</span>
    </div>`;
}

function renderDetail(){
  if(!curApt) return;
  const apt=APTS.find(a=>a.id===curApt);
  if(!apt) return;

  document.getElementById('detail-title').textContent=apt.name;
  document.getElementById('apt-hero').innerHTML=buildHeroHtml(apt);

  // 해당 요일에 보여야 할 차량 (sched 원래 + 이월)
  const visible=apt.cars
    .map((car,ci)=>({car,ci}))
    .filter(({ci})=>shouldShowOnDay(apt,ci,activeDay));

  const el=document.getElementById('car-list');
  if(visible.length===0){
    const dayName=DAYS.find(d=>d.key===activeDay)?.name;
    el.innerHTML=`<div class="empty-msg"><div class="ei">🚗</div>${dayName}요일 예정 차량이 없습니다</div>`;
    return;
  }

  // 정렬: 이월 미완료 → 일반 미완료 → 완료
  const sorted=[...visible].sort((a,b)=>{
    const aDone=isDone(apt.id,a.ci,activeDay);
    const bDone=isDone(apt.id,b.ci,activeDay);
    const aCo=isCarryoverOnDay(apt,a.ci,activeDay);
    const bCo=isCarryoverOnDay(apt,b.ci,activeDay);
    if(aDone&&!bDone) return 1;
    if(!aDone&&bDone) return -1;
    if(aCo&&!bCo) return -1;
    if(!aCo&&bCo) return 1;
    return 0;
  });

  el.innerHTML=sorted.map(({car,ci})=>{
    const done_=isDone(apt.id,ci,activeDay);
    const co_=isCarryoverOnDay(apt,ci,activeDay);
    let cardClass='car-card';
    if(done_) cardClass+=' done-card';
    else if(co_) cardClass+=' carryover-card';
    const coFrom=co_?carryoverFromDay(apt,ci,activeDay):'';

    // 메모: localStorage에서 최신 메모 우선, 없으면 원본 note
    const noteKey=`note_${apt.id}_${ci}`;
    const dateKey=`note_date_${apt.id}_${ci}`;
    const savedNote=localStorage.getItem(noteKey);
    const currentNote=savedNote!==null?savedNote:car.note;
    const noteDate=localStorage.getItem(dateKey)||'';
    const noteEmpty=!currentNote||currentNote.trim()==='';

    return `
    <div class="${cardClass}" id="card-${apt.id}-${ci}">
      <div class="cc-top">
        <div class="cc-num">${car.num}</div>
        <div class="cc-info">
          <div class="cc-name">${car.car}</div>
          <div class="cc-loc">${car.loc}</div>
        </div>
        ${co_?`<span class="carryover-tag">↩ ${coFrom}이월</span>`
             :`<span class="color-chip ${colCls(car.col)}" style="cursor:pointer;" onclick="openColorModal('${apt.id}',${ci},'${car.num}','${car.car.replace(/'/g,"\\'")}',event)" id="chip-${apt.id}-${ci}">${getCurrentCol(apt.id,ci,car.col)}</span>`}
      </div>
      <div class="cc-note" onclick="openMemoModal('${apt.id}',${ci},'${car.num}','${car.car.replace(/'/g,"\\'")}')">
        <div class="cc-note-content">
          <div class="cc-note-text${noteEmpty?' empty':''}">${noteEmpty?'메모 없음 — 탭하여 추가':currentNote}</div>
          ${noteDate?`<div class="cc-note-meta"><span class="cc-note-date">수정 ${noteDate}</span></div>`:''}
        </div>
        <div class="cc-note-edit-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </div>
      <div class="cc-check-row">
        <div class="cc-check-left">
          <div class="cc-check-status ${done_?'s-done':co_?'s-carry':'s-wait'}" id="status-${apt.id}-${ci}">
            ${done_?'✅ 세차 완료':co_?'↩ 이월된 차량':'⏳ 세차 대기'}
          </div>
          <div class="cc-check-hint">${done_?'탭하여 취소':'탭하면 완료 처리'}</div>
        </div>
        <div class="chk-btn${done_?' done':''}" id="chk-${apt.id}-${ci}"
          data-apt="${apt.id}" data-ci="${ci}"
          onclick="toggleCar(this)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
    </div>`;
  }).join('');

  if(apt.memo){
    el.innerHTML+=`<div style="border-radius:var(--r);padding:14px 18px;background:rgba(37,99,235,.04);border:1px solid rgba(37,99,235,.15);font-size:12px;color:var(--muted);line-height:1.7;">📌 ${apt.memo}</div>`;
  }
}

function toggleCar(btn){
  const {apt,ci}=btn.dataset;
  const now=isDone(apt,+ci,activeDay);
  const next=!now;
  setDone(apt,+ci,activeDay,next);

  btn.className=`chk-btn${next?' done':''} pop`;
  setTimeout(()=>btn.classList.remove('pop'),300);

  // 완료 처리 시 이전 미완료 sched 날도 함께 완료 (이월 해소)
  if(next){
    const aptObj=APTS.find(a=>a.id===apt);
    const car=aptObj?.cars[+ci];
    if(car){
      const todayIdx=DAY_ORDER.indexOf(activeDay);
      for(let i=0;i<todayIdx;i++){
        const pd=DAY_ORDER[i];
        if(car.sched.includes(pd)&&!isDone(apt,+ci,pd)){
          setDone(apt,+ci,pd,true);
        }
      }
    }
  }

  // 카드 상태 즉시 업데이트
  const aptObj=APTS.find(a=>a.id===apt);
  const co_=!next&&aptObj?isCarryoverOnDay(aptObj,+ci,activeDay):false;
  const statusEl=document.getElementById(`status-${apt}-${ci}`);
  if(statusEl){
    statusEl.className=`cc-check-status ${next?'s-done':co_?'s-carry':'s-wait'}`;
    statusEl.textContent=next?'✅ 세차 완료':co_?'↩ 이월된 차량':'⏳ 세차 대기';
  }
  const cardEl=document.getElementById(`card-${apt}-${ci}`);
  if(cardEl){
    cardEl.classList.toggle('done-card',next);
    cardEl.classList.toggle('carryover-card',!next&&co_);
  }
  const hintEl=cardEl?.querySelector('.cc-check-hint');
  if(hintEl) hintEl.textContent=next?'탭하여 취소':'탭하면 완료 처리';

  if(aptObj) document.getElementById('apt-hero').innerHTML=buildHeroHtml(aptObj);

  showToast(next?'✅ 완료 처리':'↩ 대기로 변경');
  calcHomeSummary();
  refreshAptBadge(apt);
}

function refreshAptBadge(aptId){
  const apt=APTS.find(a=>a.id===aptId); if(!apt) return;
  const visible=apt.cars.map((_,ci)=>ci).filter(ci=>shouldShowOnDay(apt,ci,activeDay));
  const total=visible.length;
  const done=visible.filter(ci=>isDone(apt.id,ci,activeDay)).length;
  const carryovers=visible.filter(ci=>isCarryoverOnDay(apt,ci,activeDay)).length;
  const pct=total?Math.round(done/total*100):0;
  const isAllDone=total>0&&done===total;
  const btnEl=document.querySelector(`[onclick="goDetail('${aptId}')"]`); if(!btnEl) return;
  const badge=btnEl.querySelector('.ab-badge');
  const bar=btnEl.querySelector('.ab-prog-fill');
  const coEl=btnEl.querySelector('[style*="ea580c"]');
  if(badge){
    if(isAllDone){
      badge.className='ab-badge b-all';
      badge.textContent='';
    } else {
      badge.className='ab-badge b-some';
      badge.textContent=`${done}/${total}`;
    }
  }
  // 전체 완료 → 빨간 테두리
  btnEl.classList.toggle('all-done', isAllDone);
  if(bar) bar.style.width=pct+'%';
  if(coEl) coEl.textContent=carryovers>0?`↩ 이월 ${carryovers}대`:'';
}

/* ════════════════════════════════════
   RESET
════════════════════════════════════ */
function doReset(){
  const dayName = DAYS.find(d=>d.key===activeDay)?.name;
  const scope   = curApt ? APTS.find(a=>a.id===curApt)?.name : '전체';

  // 초기화 대상 차량 수 계산
  let count = 0;
  if(curApt){
    const apt = APTS.find(a=>a.id===curApt);
    apt?.cars.forEach((_,ci)=>{ if(isDone(apt.id,ci,activeDay)) count++; });
  } else {
    APTS.forEach(apt=>apt.cars.forEach((_,ci)=>{ if(isDone(apt.id,ci,activeDay)) count++; }));
  }

  // 모달 내용 세팅
  document.getElementById('rm-scope').textContent = scope;
  document.getElementById('rm-day').textContent   = `${dayName}요일`;
  document.getElementById('rm-area').textContent  = scope;
  document.getElementById('rm-count').textContent = `${count}대`;
  document.getElementById('reset-modal').classList.add('on');
}

function closeResetModal(){
  document.getElementById('reset-modal').classList.remove('on');
}

function confirmReset(){
  closeResetModal();
  if(curApt){
    const apt = APTS.find(a=>a.id===curApt);
    apt?.cars.forEach((_,ci)=>setDone(apt.id,ci,activeDay,false));
    renderDetail();
  } else {
    APTS.forEach(apt=>apt.cars.forEach((_,ci)=>setDone(apt.id,ci,activeDay,false)));
    renderHome();
  }
  showToast('🔄 초기화 완료');
}

/* ════════════════════════════════════
   MANAGE PAGE
════════════════════════════════════ */
// APTS를 localStorage에 저장/불러오기 (커스텀 차량 관리)
const STORAGE_KEY = 'carwash_apts_v1';

function saveApts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(APTS.map(a=>({
    id:a.id, name:a.name, icon:a.icon, memo:a.memo,
    cars:a.cars.map(c=>({num:c.num,car:c.car,col:c.col,loc:c.loc,sched:c.sched,note:c.note}))
  }))));
}

function loadApts(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(!saved) return;
    const data = JSON.parse(saved);
    data.forEach(saved=>{
      const apt = APTS.find(a=>a.id===saved.id);
      if(apt) apt.cars = saved.cars;
    });
  } catch(e){}
}

function goManage(){
  showPage('pg-manage');
  initManagePage();
}

function initManagePage(){
  // 아파트 셀렉트 채우기 (등록용)
  const addSel = document.getElementById('add-apt');
  addSel.innerHTML = '<option value="">아파트를 선택하세요</option>'
    + APTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');

  // 아파트 셀렉트 채우기 (삭제용)
  const delSel = document.getElementById('del-apt');
  delSel.innerHTML = '<option value="all">전체 아파트</option>'
    + APTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');

  switchTab('add');
  renderDeleteList();
}

function switchTab(tab){
  document.getElementById('tab-add').classList.toggle('on', tab==='add');
  document.getElementById('tab-del').classList.toggle('on', tab==='del');
  document.getElementById('panel-add').style.display = tab==='add'?'':'none';
  document.getElementById('panel-del').style.display = tab==='del'?'':'none';
  if(tab==='del') renderDeleteList();
}

// 요일 버튼 토글
document.addEventListener('click', e=>{
  if(e.target.classList.contains('mg-day')){
    e.target.classList.toggle('on');
  }
});

function submitAdd(){
  const aptId = document.getElementById('add-apt').value;
  const num   = document.getElementById('add-num').value.trim();
  const car   = document.getElementById('add-car').value.trim();
  const loc   = document.getElementById('add-loc').value.trim();
  const col   = document.getElementById('add-col').value;
  const note  = document.getElementById('add-note').value.trim();
  const sched = [...document.querySelectorAll('.mg-day.on')].map(b=>b.dataset.day);

  // 유효성
  if(!aptId){ showToast('⚠️ 아파트를 선택하세요'); return; }
  if(!num)  { showToast('⚠️ 차량 번호를 입력하세요'); return; }
  if(!car)  { showToast('⚠️ 차종을 입력하세요'); return; }
  if(!sched.length){ showToast('⚠️ 세차 요일을 선택하세요'); return; }

  const apt = APTS.find(a=>a.id===aptId);
  if(!apt) return;

  // 중복 체크
  if(apt.cars.find(c=>c.num===num)){
    showToast('⚠️ 이미 등록된 차량 번호입니다'); return;
  }

  apt.cars.push({num, car, col, loc: loc||'—', sched, note});
  saveApts();

  // 입력 초기화
  document.getElementById('add-num').value='';
  document.getElementById('add-car').value='';
  document.getElementById('add-loc').value='';
  document.getElementById('add-note').value='';
  document.getElementById('add-col').value='—';
  document.querySelectorAll('.mg-day.on').forEach(b=>b.classList.remove('on'));
  document.getElementById('add-apt').value='';

  showSuccessModal({aptName: apt.name, num, car, loc: loc||'—', col, sched});
  renderHome();
}

function renderDeleteList(){
  const aptFilter = document.getElementById('del-apt')?.value || 'all';
  const query     = (document.getElementById('del-search')?.value || '').toLowerCase().trim();
  const el        = document.getElementById('del-list');
  if(!el) return;

  let items = [];
  APTS.forEach(apt=>{
    if(aptFilter!=='all' && apt.id!==aptFilter) return;
    apt.cars.forEach((car,ci)=>{
      if(query && !car.num.toLowerCase().includes(query) && !car.car.toLowerCase().includes(query)) return;
      items.push({apt, car, ci});
    });
  });

  if(!items.length){
    el.innerHTML=`<div class="del-empty"><div class="dei">🔍</div>차량이 없습니다</div>`;
    return;
  }

  el.innerHTML=items.map(({apt,car,ci})=>`
    <div class="del-card">
      <div class="del-card-body">
        <span class="del-apt-tag">${apt.name}</span>
        <div class="del-car-info">
          <div class="del-car-num">${car.num}</div>
          <div class="del-car-name">${car.car}</div>
          <div class="del-car-sub">${car.loc} · ${car.col}</div>
          <div class="del-sched">
            ${car.sched.map(dk=>`<span class="del-sched-day">${DAYS.find(d=>d.key===dk)?.name}요일</span>`).join('')}
          </div>
        </div>
        <div class="del-btn" onclick="deleteCar('${apt.id}',${ci})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
      </div>
    </div>`).join('');
}

// 삭제 대상 임시 저장
let _pendingDelete = null;

function deleteCar(aptId, ci){
  const apt = APTS.find(a=>a.id===aptId);
  if(!apt) return;
  const car = apt.cars[ci];
  if(!car) return;

  // 확인 모달 열기
  _pendingDelete = {aptId, ci};
  document.getElementById('dm-num').textContent = car.num;
  document.getElementById('dm-car').textContent = car.car;
  document.getElementById('dm-apt').textContent = `${apt.name} · ${car.loc}`;
  document.getElementById('delete-modal').classList.add('on');
}

function closeDeleteModal(){
  document.getElementById('delete-modal').classList.remove('on');
  _pendingDelete = null;
}

function confirmDelete(){
  if(!_pendingDelete) return;
  const {aptId, ci} = _pendingDelete;
  const apt = APTS.find(a=>a.id===aptId);
  if(!apt) return;
  const car = apt.cars[ci];
  if(!car) return;

  // 삭제 실행
  DAY_ORDER.forEach(d=>localStorage.removeItem(sk(aptId,ci,d)));
  apt.cars.splice(ci,1);
  saveApts();

  // 확인 모달 닫기
  document.getElementById('delete-modal').classList.remove('on');
  _pendingDelete = null;

  // 완료 모달 열기
  document.getElementById('ddm-apt-name').textContent = apt.name;
  document.getElementById('ddm-num').textContent = car.num;
  document.getElementById('ddm-car').textContent = car.car;
  document.getElementById('ddm-loc').textContent = car.loc;
  document.getElementById('delete-done-modal').classList.add('on');

  renderDeleteList();
  renderHome();
}

function closeDeleteDoneModal(){
  document.getElementById('delete-done-modal').classList.remove('on');
}

/* ════════════════════════════════════
   COLOR MODAL
════════════════════════════════════ */
const COLORS=[
  {name:'검정',swatch:'#1e1e1e'},
  {name:'흰색',swatch:'#f0f0f0'},
  {name:'은색',swatch:'#c8d0dc'},
  {name:'남색',swatch:'#1e3a70'},
  {name:'청색',swatch:'#1860a8'},
  {name:'금색',swatch:'#9a7a20'},
  {name:'빨강',swatch:'#8a1818'},
  {name:'회색',swatch:'#888888'},
  {name:'무광',swatch:'#3a3a3a'},
  {name:'남희색',swatch:'#243a5e'},
];
const colKey=(a,ci)=>`color_${a}_${ci}`;
function getSavedCol(a,ci){return localStorage.getItem(colKey(a,ci));}
function saveCol(a,ci,col){localStorage.setItem(colKey(a,ci),col);}
function getCurrentCol(aptId,ci,def){return getSavedCol(aptId,ci)||def;}

let _colorTarget=null;

function openColorModal(aptId,ci,num,carName,e){
  e.stopPropagation();
  _colorTarget={aptId,ci};
  const apt=APTS.find(a=>a.id===aptId);
  const curCol=getCurrentCol(aptId,ci,apt?.cars[ci]?.col||'—');
  document.getElementById('color-car-info').textContent=`${num}  ${carName}`;
  const grid=document.getElementById('color-grid');
  grid.innerHTML=COLORS.map(c=>`
    <div class="color-option${curCol===c.name?' selected':''}" onclick="selectColor('${c.name}')">
      <div class="co-check">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="co-swatch" style="background:${c.swatch}"></div>
      <div class="co-label">${c.name}</div>
    </div>`).join('');
  document.getElementById('color-modal').classList.add('on');
}

function closeColorModal(){
  document.getElementById('color-modal').classList.remove('on');
  _colorTarget=null;
}

function selectColor(colorName){
  if(!_colorTarget) return;
  const {aptId,ci}=_colorTarget;
  saveCol(aptId,ci,colorName);
  const chipEl=document.getElementById(`chip-${aptId}-${ci}`);
  if(chipEl){chipEl.className=`color-chip ${colCls(colorName)}`;chipEl.textContent=colorName;}
  closeColorModal();
  showToast(`🎨 ${colorName}(으)로 변경했습니다`);
}

/* ════════════════════════════════════
   MEMO MODAL
════════════════════════════════════ */
let _memoTarget = null; // {aptId, ci, num, carName}

function openMemoModal(aptId, ci, num, carName){
  _memoTarget = {aptId, ci};

  // 현재 메모 불러오기
  const noteKey  = `note_${aptId}_${ci}`;
  const dateKey  = `note_date_${aptId}_${ci}`;
  const apt      = APTS.find(a=>a.id===aptId);
  const car      = apt?.cars[ci];
  const saved    = localStorage.getItem(noteKey);
  const current  = saved!==null ? saved : (car?.note||'');
  const lastDate = localStorage.getItem(dateKey)||'';

  // 모달 내용 세팅
  document.getElementById('memo-car-info').textContent = `${num}  ${carName}`;
  const ta = document.getElementById('memo-textarea');
  ta.value = current;
  document.getElementById('memo-char-count').textContent = current.length;

  // 마지막 수정일 표시
  const lastRow = document.getElementById('memo-last-edit-row');
  if(lastDate){
    lastRow.style.display='flex';
    document.getElementById('memo-last-edit-date').textContent = lastDate;
  } else {
    lastRow.style.display='none';
  }

  document.getElementById('memo-modal').classList.add('on');

  // 키보드 올라올 때 textarea 포커스 (약간 딜레이)
  setTimeout(()=>{ ta.focus(); ta.selectionStart=ta.selectionEnd=ta.value.length; }, 300);
}

function closeMemoModal(){
  document.getElementById('memo-modal').classList.remove('on');
  _memoTarget = null;
}

function saveMemo(){
  if(!_memoTarget) return;
  const {aptId, ci} = _memoTarget;
  const newNote = document.getElementById('memo-textarea').value.trim();

  // 날짜 포맷: M/D(요일) HH:MM
  const now   = new Date();
  const names = ['일','월','화','수','목','금','토'];
  const dateStr = `${now.getMonth()+1}/${now.getDate()}(${names[now.getDay()]}) `
    + `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  localStorage.setItem(`note_${aptId}_${ci}`, newNote);
  localStorage.setItem(`note_date_${aptId}_${ci}`, dateStr);

  closeMemoModal();

  // 카드 메모 영역 즉시 업데이트 (전체 리렌더 없이)
  const card = document.getElementById(`card-${aptId}-${ci}`);
  if(card){
    const noteTextEl = card.querySelector('.cc-note-text');
    const noteMetaEl = card.querySelector('.cc-note-meta');
    const noteEmpty  = !newNote;
    if(noteTextEl){
      noteTextEl.className = `cc-note-text${noteEmpty?' empty':''}`;
      noteTextEl.textContent = noteEmpty ? '메모 없음 — 탭하여 추가' : newNote;
    }
    if(noteMetaEl){
      noteMetaEl.innerHTML = `<span class="cc-note-date">수정 ${dateStr}</span>`;
    } else {
      const contentEl = card.querySelector('.cc-note-content');
      if(contentEl){
        const meta = document.createElement('div');
        meta.className='cc-note-meta';
        meta.innerHTML=`<span class="cc-note-date">수정 ${dateStr}</span>`;
        contentEl.appendChild(meta);
      }
    }
  }

  showToast('✅ 메모 저장 완료');
}

// textarea 글자 수 카운트
document.addEventListener('input', e=>{
  if(e.target.id==='memo-textarea'){
    document.getElementById('memo-char-count').textContent = e.target.value.length;
  }
});


function showSuccessModal({aptName, num, car, loc, col, sched}){
  document.getElementById('sm-apt-name').textContent = aptName;
  document.getElementById('sm-num').textContent = num;
  document.getElementById('sm-car').textContent = car;
  document.getElementById('sm-loc').textContent = loc;
  document.getElementById('sm-col').textContent = col;
  document.getElementById('sm-sched').innerHTML =
    sched.map(dk=>`<span class="sm-sched-day">${DAYS.find(d=>d.key===dk)?.name}요일</span>`).join('');
  document.getElementById('success-modal').classList.add('on');
}
function closeSuccessModal(){
  document.getElementById('success-modal').classList.remove('on');
}


let _tt;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('on');
  clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('on'),1800);
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
loadApts();
updateDate();
renderHome();
