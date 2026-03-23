/* ════════════════════════════════════
   DATA
   schedule: 요일별 세차 예정 여부 (O 표시)
   sun=일(26), mon=월(19), tue=화(19), wed=수(23), thu=목(18)
════════════════════════════════════ */
/* ════════════════════════════════════
   BAD WORD FILTER
════════════════════════════════════ */
const BAD_WORDS = [
  // 욕설
  '씨발','시발','씨팔','시팔','쌍년','쌍놈','개새끼','개색끼','새끼','쉐끼','놈팡이',
  '미친놈','미친년','병신','벙신','바보새끼','지랄','존나','좆','보지','자지','씹',
  '개년','개놈','개좆','꺼져','닥쳐','찐따','등신','돌대가리','머저리','얼간이',
  '빡대가리','쪽발이','쪽바리','왜놈','짱깨','흑형','깜둥이',
  // 성관련
  '섹스','섹쓰','야동','포르노','porn','sex','fuck','fucking','bitch','bastard',
  '음란','성교','성기','강간','윤간','성폭행','성희롱','몸팔','몸파','원조교제',
  '매춘','매음','창녀','갈보','화냥년','윤락',
  // 법적 문제
  '살인','살해','죽여','죽인다','칼로','폭탄','테러','마약','히로뽕','필로폰',
  '대마초','코카인','헤로인','아편','투약','밀수','사기','협박','공갈','납치',
  '감금','스토킹','해킹','불법','위조','사문서','탈세','뇌물','횡령','배임',
];

function checkBadWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/\s/g, '');
  return BAD_WORDS.some(word => lower.includes(word.toLowerCase()));
}

function validateInputs(...texts) {
  for (const text of texts) {
    if (checkBadWords(text)) return false;
  }
  return true;
}

// 타이핑 입력란 실시간 감지 — 어느 한 박스라도 금지어 입력 즉시 팝업
const WATCH_IDS = [
  'add-num2','add-car2','add-loc2','add-note2',  // 신규등록 페이지
  'add-num','add-car','add-loc','add-note',        // 차량관리 등록
  'memo-textarea',                                  // 메모 편집
];
document.addEventListener('input', e => {
  if (WATCH_IDS.includes(e.target.id)) {
    if (checkBadWords(e.target.value)) {
      showBadwordModal();
      e.target.value = e.target.value.slice(0, -1); // 마지막 입력 글자 제거
    }
  }
});

const DAYS=[
  {key:'mon',name:'월'},
  {key:'tue',name:'화'},
  {key:'wed',name:'수'},
  {key:'thu',name:'목'},
  {key:'fri',name:'금'},
  {key:'sat',name:'토'},
  {key:'sun',name:'일'},
];

const APTS=[];

/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let activeDay = 'mon';
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
function goAdd(){
  showPage('pg-add');
  // 아파트 셀렉트 채우기
  const sel=document.getElementById('add-apt2');
  if(sel){
    if(!APTS.length){
      sel.innerHTML='<option value="">먼저 아파트를 등록해주세요</option>';
    } else {
      sel.innerHTML='<option value="">아파트를 선택하세요</option>'
        +APTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
    }
  }
  // 입력값 초기화
  ['add-num2','add-car2','add-loc2','add-note2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  const col=document.getElementById('add-col2'); if(col) col.value='—';
  document.querySelectorAll('#add-days2 .mg-day').forEach(b=>b.classList.remove('on'));
}
function goDetail(aptId){ curApt=aptId; showPage('pg-detail'); renderDetail(); }

// 신규등록 임시 저장
let _pendingAdd = null;

function submitAdd2(){
  const aptId=document.getElementById('add-apt2').value;
  const num  =document.getElementById('add-num2').value.trim();
  const car  =document.getElementById('add-car2').value.trim();
  const loc  =document.getElementById('add-loc2').value.trim();
  const col  =document.getElementById('add-col2').value;
  const note =document.getElementById('add-note2').value.trim();
  const sched=[...document.querySelectorAll('#add-days2 .mg-day.on')].map(b=>b.dataset.day);

  // 필수 항목 통합 체크
  const missing2 = [];
  if(!aptId)        missing2.push('아파트');
  if(!num)          missing2.push('차량 번호');
  if(!car)          missing2.push('차종');
  if(!sched.length) missing2.push('세차 예정 요일');
  if(missing2.length){ showRequiredModal(missing2.join(', ')); return; }

  if(!validateInputs(num, car, loc, note)){
    showBadwordModal(); return;
  }

  const apt=APTS.find(a=>a.id===aptId); if(!apt) return;
  if(apt.cars.find(c=>c.num===num)){ showToast('⚠️ 이미 등록된 차량 번호입니다'); return; }

  // 임시 저장 후 확인 팝업
  _pendingAdd = {apt, num, car, col, loc:loc||'—', sched, note};
  showAddConfirmModal();
}

function showAddConfirmModal(){
  const {apt, num, car, col, loc, sched} = _pendingAdd;
  const dayNames = sched.map(k=>DAYS.find(d=>d.key===k)?.name+'요일').join(', ');

  document.getElementById('acm-apt').textContent   = apt.name;
  document.getElementById('acm-num').textContent   = num;
  document.getElementById('acm-car').textContent   = car;
  document.getElementById('acm-loc').textContent   = loc;
  document.getElementById('acm-col').textContent   = col;
  document.getElementById('acm-sched').textContent = dayNames;
  document.getElementById('add-confirm-modal').classList.add('on');
}

function closeAddConfirmModal(){
  document.getElementById('add-confirm-modal').classList.remove('on');
  _pendingAdd = null;
}

function confirmAddCar(){
  if(!_pendingAdd) return;
  const {apt, num, car, col, loc, sched, note} = _pendingAdd;

  apt.cars.push({num, car, col, loc, sched, note});
  saveApts();

  document.getElementById('add-confirm-modal').classList.remove('on');
  _pendingAdd = null;

  // 입력 초기화
  ['add-num2','add-car2','add-loc2','add-note2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  const colEl=document.getElementById('add-col2'); if(colEl) colEl.value='—';
  const aptEl=document.getElementById('add-apt2'); if(aptEl) aptEl.value='';
  document.querySelectorAll('#add-days2 .mg-day').forEach(b=>b.classList.remove('on'));

  showSuccessModal({aptName:apt.name, num, car, loc, col, sched});
  renderHome();
  renderMycarDayList();
  renderMycarAptList();
}

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
  const today = new Date();
  const todayDay = today.getDay(); // 0=일, 1=월 ... 6=토

  // 이번 주 월요일 기준으로 각 요일 날짜 계산
  const dayKeyMap = {mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0};
  const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  el.innerHTML=DAYS.map(d=>{
    let total=0;
    APTS.forEach(apt=>apt.cars.forEach((_,ci)=>{
      if(shouldShowOnDay(apt,ci,d.key)) total++;
    }));

    // 해당 요일 날짜 계산
    const offset = dayKeyMap[d.key] === 0 ? 6 : dayKeyMap[d.key] - 1;
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + offset);
    const dateStr = `${dayDate.getMonth()+1}/${dayDate.getDate()}`;

    return `
    <div class="dt${d.key===activeDay?' on':''}" data-day="${d.key}">
      <span class="dn">${d.name}요일</span>
      <span class="dc" style="font-size:13px;font-weight:700;">${dateStr}</span>
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
  // 필수 항목 통합 체크
  const missing3 = [];
  if(!aptId)        missing3.push('아파트');
  if(!num)          missing3.push('차량 번호');
  if(!car)          missing3.push('차종');
  if(!sched.length) missing3.push('세차 예정 요일');
  if(missing3.length){ showRequiredModal(missing3.join(', ')); return; }

  if(!validateInputs(num, car, loc, note)){
    showBadwordModal(); return;
  }

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

  // 욕설/성관련/법적 단어 필터
  if(!validateInputs(newNote)){
    showBadwordModal();
    return;
  }

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


/* ════════════════════════════════════
   SIGNUP MODAL
════════════════════════════════════ */
function openSignupModal(){
  document.getElementById('signup-modal').classList.add('on');
  showLoginPanel(); // 항상 로그인 화면으로 시작
}
function closeSignupModal(){
  document.getElementById('signup-modal').classList.remove('on');
}
function showLoginPanel(){
  document.getElementById('panel-login').style.display='';
  document.getElementById('panel-register').style.display='none';
}
function showSignupPanel(){
  document.getElementById('panel-login').style.display='none';
  document.getElementById('panel-register').style.display='';
}
function toggleNormalSignup(){
  const panel = document.getElementById('normal-signup-panel');
  const arrow = document.getElementById('normal-signup-arrow');
  if(!panel||!arrow) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : '';
  arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
}
function submitLogin(){
  const email = document.getElementById('li-email')?.value.trim();
  const pw    = document.getElementById('li-pw')?.value;
  if(!email){ showToast('⚠️ 이메일을 입력하세요'); return; }
  if(!pw)   { showToast('⚠️ 비밀번호를 입력하세요'); return; }
  closeSignupModal();
  showToast('✅ 로그인되었습니다');
}
function socialSignup(provider){
  const names={naver:'네이버',kakao:'카카오',google:'구글'};
  closeSignupModal();
  showToast(`${names[provider]} 소셜 회원가입 준비 중입니다`);
}
function sendVerifyCode(){
  const phone=document.getElementById('su-phone').value.trim();
  if(!phone){ showToast('⚠️ 핸드폰 번호를 입력하세요'); return; }
  document.getElementById('su-code-row').style.display='';
  showToast('📱 인증번호를 발송했습니다');
}
function submitSignup(){
  const email= document.getElementById('su-email')?.value.trim();
  const pw   = document.getElementById('su-pw')?.value;
  const pw2  = document.getElementById('su-pw2')?.value;
  if(!email){ showToast('⚠️ 이메일을 입력하세요'); return; }
  if(!email.includes('@')){ showToast('⚠️ 올바른 이메일 형식을 입력하세요'); return; }
  if(!pw||pw.length<8){ showToast('⚠️ 비밀번호는 8자 이상이어야 합니다'); return; }
  if(pw!==pw2){ showToast('⚠️ 비밀번호가 일치하지 않습니다'); return; }
  closeSignupModal();
  showToast('🎉 회원가입이 완료되었습니다!');
}

/* ════════════════════════════════════
   아파트 검색 모달
════════════════════════════════════ */
function openAptSearchModal(){
  document.getElementById('apt-search-modal').classList.add('on');
  document.getElementById('apt-keyword').value = '';
  document.getElementById('apt-search-result').innerHTML = `
    <div class="apt-result-empty">
      <div class="arei">🏢</div>
      아파트명 또는 지역을 입력하세요
    </div>`;
  setTimeout(()=>document.getElementById('apt-keyword').focus(), 300);
}

function closeAptSearchModal(){
  document.getElementById('apt-search-modal').classList.remove('on');
}

let _aptSearchTimer = null;
function onAptKeywordInput(){
  clearTimeout(_aptSearchTimer);
  _aptSearchTimer = setTimeout(searchApartment, 300);
}

// 전국 아파트 샘플 데이터
const APT_DB = [
  // 한마을아파트
  {name:'한마을아파트', addr:'서울 강남구 개포동'},
  {name:'한마을아파트', addr:'경기 성남시 분당구 야탑동'},
  {name:'한마을아파트', addr:'경기 용인시 수지구 죽전동'},
  {name:'한마을아파트', addr:'경기 수원시 영통구 망포동'},
  {name:'한마을아파트', addr:'인천 부평구 부평동'},
  {name:'한마을아파트', addr:'부산 해운대구 우동'},
  // 서울 강남구
  {name:'타워팰리스', addr:'서울 강남구 도곡동'},
  {name:'은마아파트', addr:'서울 강남구 대치동'},
  {name:'래미안대치팰리스', addr:'서울 강남구 대치동'},
  {name:'아이파크', addr:'서울 강남구 삼성동'},
  {name:'현대아이파크', addr:'서울 강남구 압구정동'},
  // 서울 서초구
  {name:'래미안퍼스티지', addr:'서울 서초구 반포동'},
  {name:'반포자이', addr:'서울 서초구 반포동'},
  {name:'아크로리버파크', addr:'서울 서초구 반포동'},
  {name:'래미안서초에스티지S', addr:'서울 서초구 서초동'},
  // 서울 송파구
  {name:'헬리오시티', addr:'서울 송파구 가락동'},
  {name:'잠실주공', addr:'서울 송파구 잠실동'},
  {name:'롯데캐슬골드', addr:'서울 송파구 신천동'},
  {name:'파크리오', addr:'서울 송파구 신천동'},
  // 서울 마포구
  {name:'마포래미안푸르지오', addr:'서울 마포구 아현동'},
  {name:'공덕자이', addr:'서울 마포구 공덕동'},
  // 서울 양천구
  {name:'목동파크자이', addr:'서울 양천구 목동'},
  {name:'목동신시가지아파트', addr:'서울 양천구 목동'},
  // 서울 강동구
  {name:'고덕래미안힐스테이트', addr:'서울 강동구 고덕동'},
  {name:'올림픽파크포레온', addr:'서울 강동구 둔촌동'},
  // 서울 은평구
  {name:'DMC파크뷰자이', addr:'서울 은평구 수색동'},
  {name:'녹번역e편한세상', addr:'서울 은평구 녹번동'},
  // 서울 구로구
  {name:'신구로자이', addr:'서울 구로구 개봉동'},
  {name:'구로자이', addr:'서울 구로구 구로동'},
  // 서울 영등포구
  {name:'여의도자이', addr:'서울 영등포구 여의도동'},
  {name:'여의도파크원', addr:'서울 영등포구 여의도동'},
  // 경기 성남
  {name:'판교알파돔시티', addr:'경기 성남시 분당구 삼평동'},
  {name:'분당파크뷰', addr:'경기 성남시 분당구 정자동'},
  {name:'중앙하이츠', addr:'경기 성남시 분당구 야탑동'},
  {name:'위례신도시중앙하이츠', addr:'경기 성남시 수정구 위례동'},
  // 경기 수원
  {name:'광교아이파크', addr:'경기 수원시 영통구 이의동'},
  {name:'광교자연앤힐스테이트', addr:'경기 수원시 영통구 하동'},
  {name:'고척아이파크MD', addr:'경기 수원시 권선구 고색동'},
  // 경기 화성
  {name:'동탄역롯데캐슬', addr:'경기 화성시 동탄면'},
  {name:'동탄파크자이', addr:'경기 화성시 반송동'},
  // 경기 고양
  {name:'일산자이', addr:'경기 고양시 일산동구 마두동'},
  {name:'킨텍스꿈에그린', addr:'경기 고양시 일산서구 대화동'},
  // 경기 하남
  {name:'미사강변도시아파트', addr:'경기 하남시 망월동'},
  {name:'미사역파라곤', addr:'경기 하남시 망월동'},
  // 인천
  {name:'송도더샵퍼스트파크', addr:'인천 연수구 송도동'},
  {name:'청라한양수자인레이크블루', addr:'인천 서구 청라동'},
  {name:'검단신도시푸르지오', addr:'인천 서구 불로동'},
  // 부산
  {name:'해운대두산위브더제니스', addr:'부산 해운대구 우동'},
  {name:'마린시티자이', addr:'부산 해운대구 중동'},
  {name:'래미안장전', addr:'부산 금정구 장전동'},
  // 대구
  {name:'수성SK뷰', addr:'대구 수성구 범어동'},
  {name:'대구황금롯데캐슬', addr:'대구 수성구 황금동'},
  // 광주
  {name:'첨단롯데캐슬', addr:'광주 북구 첨단동'},
  {name:'봉선자이', addr:'광주 남구 봉선동'},
  // 대전
  {name:'도안리슈빌', addr:'대전 서구 도안동'},
  {name:'둔산자이', addr:'대전 서구 둔산동'},
  // 세종
  {name:'세종한신더휴', addr:'세종특별자치시 나성동'},
  {name:'세종포레자이', addr:'세종특별자치시 보람동'},
  // 울산
  {name:'문수자이', addr:'울산 남구 문수로'},
  {name:'울산달동푸르지오', addr:'울산 남구 달동'},
  // 등록된 아파트도 포함
  ...APTS.map(a=>({name:a.name, addr:'등록된 아파트'})),
];

function searchApartment(){
  const keyword = document.getElementById('apt-keyword').value.trim();
  const resultEl = document.getElementById('apt-search-result');

  if(!keyword){
    resultEl.innerHTML = `<div class="apt-result-empty"><div class="arei">🏢</div>아파트명 또는 지역을 입력하세요</div>`;
    return;
  }

  const kw = keyword.toLowerCase();
  const filtered = APT_DB.filter(a =>
    a.name.toLowerCase().includes(kw) ||
    a.addr.toLowerCase().includes(kw)
  );

  if(filtered.length === 0){
    resultEl.innerHTML = `<div class="apt-result-empty"><div class="arei">😔</div>"${keyword}" 검색 결과가 없습니다<br><span style="font-size:12px;color:var(--dim);margin-top:6px;display:block;">다른 키워드로 검색해보세요</span></div>`;
    return;
  }

  resultEl.innerHTML = filtered.map(a => `
    <div class="apt-result-card" onclick="selectApartment('${a.name.replace(/'/g,"\\'")}', '${a.addr.replace(/'/g,"\\'")}')">
      <div class="apt-result-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
        </svg>
      </div>
      <div class="apt-result-info">
        <div class="apt-result-name">${a.name}</div>
        <div class="apt-result-addr">${a.addr}</div>
      </div>
      <span class="apt-result-tag">아파트</span>
    </div>`).join('');
}

function selectApartment(name, addr){
  closeAptSearchModal();
  showToast(`🏢 ${name} 선택됨`);
}

function goAptManage(){
  showPage('pg-apt');
  document.getElementById('apt-keyword-hero').value = '';
  document.getElementById('apt-search-result-hero').innerHTML = '';
  renderRegisteredApts();
}

/* 아파트 검색 (로컬 DB) */
let _aptHeroTimer = null;
function onAptKeywordInputHero(){
  clearTimeout(_aptHeroTimer);
  _aptHeroTimer = setTimeout(searchApartmentHero, 300);
}

function searchApartmentHero(){
  const keyword = document.getElementById('apt-keyword-hero').value.trim();
  const resultEl = document.getElementById('apt-search-result-hero');
  if(!keyword){ resultEl.innerHTML = ''; return; }

  const kl = keyword.toLowerCase();
  const filtered = APT_DB.filter(a =>
    a.name.toLowerCase().includes(kl) || a.addr.toLowerCase().includes(kl)
  );

  if(!filtered.length){
    resultEl.innerHTML = `<div style="text-align:center;padding:16px;font-size:13px;color:var(--muted);">"${keyword}" 검색 결과가 없습니다</div>`;
    return;
  }
  renderAptSearchResults(filtered);
}

function renderAptSearchResults(items){
  const resultEl = document.getElementById('apt-search-result-hero');
  resultEl.innerHTML = items.map(a => `
    <div class="apt-result-card">
      <div class="apt-result-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-linecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
      </div>
      <div class="apt-result-info">
        <div class="apt-result-name">${a.name}</div>
        <div class="apt-result-addr">${a.addr || ''}</div>
      </div>
      <button class="apt-add-btn" onclick="addApartment('${(a.name||'').replace(/'/g,"\\'")}','${(a.addr||'').replace(/'/g,"\\'")}')">추가하기</button>
    </div>`).join('');
}

function addApartment(name, addr){
  // 이미 등록된 아파트인지 확인
  const exists = APTS.find(a => a.name === name);
  if(exists){ showToast('이미 등록된 아파트입니다'); return; }
  // 새 아파트 추가
  const id = 'apt_' + Date.now();
  APTS.push({ id, name, addr, cars: [] });
  saveApts();
  // 검색창 초기화
  document.getElementById('apt-keyword-hero').value = '';
  document.getElementById('apt-search-result-hero').innerHTML = '';
  renderRegisteredApts();
  renderMycarAptList();
  showToast(`🏢 ${name} 추가되었습니다`);
}

function renderRegisteredApts(){
  const el = document.getElementById('apt-registered-list');
  if(!el) return;
  if(!APTS.length){
    el.innerHTML = `<div class="apt-empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
      <p>등록된 아파트가 없습니다<br>위에서 검색 후 추가해주세요</p>
    </div>`;
    return;
  }
  el.innerHTML = APTS.map(a => `
    <div class="apt-reg-card">
      <div class="apt-reg-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
      </div>
      <div class="apt-reg-info">
        <div class="apt-reg-name">${a.name}</div>
        <div class="apt-reg-addr">${a.addr || '주소 없음'} · 차량 ${a.cars.length}대</div>
      </div>
      <div class="apt-reg-del" onclick="removeApartment('${a.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    </div>`).join('');
}

function removeApartment(id){
  const idx = APTS.findIndex(a => a.id === id);
  if(idx < 0) return;
  const name = APTS[idx].name;
  APTS.splice(idx, 1);
  saveApts();
  renderRegisteredApts();
  showToast(`${name} 삭제되었습니다`);
}


function openSideMenu(){
  document.getElementById('side-menu').classList.add('on');
}
function closeSideMenu(){
  document.getElementById('side-menu').classList.remove('on');
}
function openServiceModal(){
  document.getElementById('service-modal').classList.add('on');
  const scroll = document.querySelector('#service-modal .svc-scroll');
  if(scroll) scroll.scrollTop = 0;
}
function closeServiceModal(){
  document.getElementById('service-modal').classList.remove('on');
}
function toggleMycarMenu(){
  const sub   = document.getElementById('mycar-submenu');
  const arrow = document.getElementById('mycar-arrow');
  const isOpen = sub.style.display !== 'none';
  sub.style.display   = isOpen ? 'none' : '';
  arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}

function openMycarMenu(){
  showPage('pg-mycar');
  renderMycarDayList();
  renderMycarAptList();
}

function renderMycarAptList(){
  const el = document.getElementById('mycar-apt-list');
  if(!el) return;

  if(!APTS.length){
    el.innerHTML = `<div class="mycar-apt-empty">등록된 아파트가 없습니다<br>아파트 관리에서 추가해주세요</div>`;
    return;
  }

  const dayNames = {mon:'월',tue:'화',wed:'수',thu:'목',fri:'금',sat:'토',sun:'일'};

  el.innerHTML = APTS.map(apt => {
    const carCount = apt.cars.length;
    const colMap = {
      '흰색':'#f5f5f5','검정':'#222','은색':'#c0c0c0','회색':'#808080',
      '파랑':'#3a7ac0','빨강':'#c04040','남색':'#1a3060','청색':'#4080c0',
      '갈색':'#7a5030','기타':'#888'
    };
    const cars = apt.cars.map((car, ci) => {
      const col = localStorage.getItem(`color_${apt.id}_${ci}`) || colMap[car.col] || '#888';
      const note = localStorage.getItem(`note_${apt.id}_${ci}`) || car.note || '';
      const schedStr = (car.sched || []).map(d => dayNames[d] || d).join('·');
      return `
        <div class="mc-car-card">
          <div class="mc-car-top">
            <div class="mc-col-dot" style="background:${col};"></div>
            <div class="mc-car-info">
              <div class="mc-car-num">${car.num}</div>
              <div class="mc-car-model">${car.car || '—'}</div>
              ${car.loc ? `<div class="mc-car-loc">${car.loc}</div>` : ''}
            </div>
            ${schedStr ? `<div class="mc-car-sched">${schedStr}</div>` : ''}
          </div>
          ${note ? `<div class="mc-car-bottom">${note}</div>` : ''}
        </div>`;
    }).join('');

    const emptyMsg = carCount === 0
      ? `<div style="padding:16px;text-align:center;font-size:12px;color:var(--muted);">등록된 차량이 없습니다</div>`
      : '';

    return `
      <div class="mycar-apt-card">
        <div class="mycar-apt-header" onclick="toggleMycarApt('${apt.id}')">
          <div class="mycar-apt-header-left">
            <div class="mycar-apt-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
            </div>
            <div>
              <div class="mycar-apt-name">${apt.name}</div>
              ${apt.addr ? `<div class="mycar-apt-addr">${apt.addr}</div>` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${carCount > 0 ? `<div class="mycar-apt-badge">${carCount}</div>` : ''}
            <div class="mycar-apt-arrow" id="arrow-${apt.id}">›</div>
          </div>
        </div>
        <div class="mycar-apt-cars" id="cars-${apt.id}">
          ${cars || emptyMsg}
        </div>
      </div>`;
  }).join('');
}

function toggleMycarApt(aptId){
  const cars = document.getElementById(`cars-${aptId}`);
  const arrow = document.getElementById(`arrow-${aptId}`);
  if(!cars) return;
  const isOpen = cars.classList.contains('open');
  cars.classList.toggle('open', !isOpen);
  if(arrow) arrow.classList.toggle('open', !isOpen);
}

function renderMycarDayList(){
  const el = document.getElementById('mycar-day-list');
  if(!el) return;

  const dayNames = {mon:'월요일',tue:'화요일',wed:'수요일',thu:'목요일',fri:'금요일',sat:'토요일',sun:'일요일'};
  const dayKeys  = ['mon','tue','wed','thu','fri','sat','sun'];

  // 요일별 차량 집계
  const dayMap = {};
  dayKeys.forEach(k => dayMap[k] = []);
  APTS.forEach(apt => {
    apt.cars.forEach(car => {
      (car.sched || []).forEach(d => {
        if(dayMap[d]) dayMap[d].push({ num: car.num, model: car.car, apt: apt.name });
      });
    });
  });

  el.innerHTML = dayKeys.map(k => {
    const cars = dayMap[k];
    return `
      <div class="mycar-day-row">
        <div class="mycar-day-label">${dayNames[k].replace('요일','')}</div>
        <div class="mycar-day-count-num">${cars.length > 0 ? cars.length : '·'}</div>
      </div>`;
  }).join('');
}

/* ════════════════════════════════════
   BADWORD MODAL
════════════════════════════════════ */
function showBadwordModal(){
  document.getElementById('badword-modal').classList.add('on');
}
function closeBadwordModal(){
  document.getElementById('badword-modal').classList.remove('on');
}

function showRequiredModal(missing){
  document.getElementById('required-missing').textContent = missing + ' 항목을 입력해주세요';
  document.getElementById('required-modal').classList.add('on');
}
function closeRequiredModal(){
  document.getElementById('required-modal').classList.remove('on');
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

/* 광고 자동 슬라이드 */
(function initAdSlider(){
  let cur = 0;
  const slides = document.querySelectorAll('.home-ad-slide');
  const dots   = document.querySelectorAll('.ad-dot');
  const inner  = document.querySelector('.home-ad-inner');
  if(!slides.length) return;
  function goSlide(n){
    cur = n % slides.length;
    inner.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d,i) => d.classList.toggle('active', i === cur));
  }
  setInterval(() => goSlide(cur + 1), 3500);
  dots.forEach((d, i) => d.addEventListener('click', () => goSlide(i)));
})();
