(function(){
'use strict';
if(window.__CARWASH_APP_INIT__) return; // 스크립트가 다시 실행돼도 전역 변수 중복 선언 에러 없이 안전하게 무시
window.__CARWASH_APP_INIT__ = true;

/* ════════════════════════════════════
   금지어 필터
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

// 예약 폼 실시간 감지 — 금지어 입력 즉시 팝업
const WATCH_IDS = ['rv-name','rv-phone','rv-car-num','rv-car-model','rv-loc','rv-note'];
document.addEventListener('input', e => {
  if (WATCH_IDS.includes(e.target.id)) {
    if (checkBadWords(e.target.value)) {
      showBadwordModal();
      e.target.value = e.target.value.slice(0, -1);
    }
  }
});

/* ════════════════════════════════════
   페이지 전환
════════════════════════════════════ */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const page = document.getElementById(id);
  page.classList.add('on');
  const scrollEl = page.querySelector('.scroll');
  if(scrollEl) scrollEl.scrollTop = 0;
}

function goHome(){ showPage('pg-home'); }
function goMenu(){ showPage('pg-menu'); renderMenuPage(); }

function renderMenuPage(){
  const guestMsg = document.getElementById('menu-guest-msg');
  const main = document.getElementById('menu-main');
  if(!guestMsg || !main) return;
  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';
}
function goStory(){ showPage('pg-story'); }
function goFaq(){ showPage('pg-faq'); }

async function goBooking(){
  showPage('pg-booking');
  if(calViewYear===undefined){
    const n=new Date();
    calViewYear = n.getFullYear();
    calViewMonth = n.getMonth();
    calSelectedDate = todayKey();
  }
  await fetchReservations();
  renderCalendar();
}

async function goVehicles(){
  showPage('pg-vehicles');
  await fetchVehicles();
  renderVehicles();
}

/* ════════════════════════════════════
   FAQ 아코디언
════════════════════════════════════ */
function toggleFaqItem(el){
  el.classList.toggle('open');
}

/* ════════════════════════════════════
   유틸
════════════════════════════════════ */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let _tt;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('on');
  clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('on'),1800);
}

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

/* ════════════════════════════════════
   Supabase 연동
════════════════════════════════════ */
const SUPABASE_URL = 'https://zuvednmxhpwdojihvtom.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dmVkbm14aHB3ZG9qaWh2dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTg0ODAsImV4cCI6MjA5MjM3NDQ4MH0.BekJltTTonSlx2UMi_ELzh38eXrCDkePhXRhEACfKcY';
let supabase = null;
try {
  if(!window.supabase) throw new Error('Supabase SDK가 로드되지 않았습니다');
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e){
  console.error(e);
  alert('데이터 연결 초기화에 실패했습니다: '+e.message+'\n인터넷 연결 또는 광고 차단 확장 프로그램을 확인한 뒤 새로고침 해주세요.');
}

/* ════════════════════════════════════
   카카오 로그인 (고객용)
════════════════════════════════════ */
let currentUser = null;

function kakaoNickname(user){
  if(!user) return '고객';
  const m = user.user_metadata || {};
  return m.name || m.nickname || m.full_name || m.preferred_username || user.email || '고객';
}

const KAKAO_RETURN_PAGE_KEY = 'carwash_kakao_return_page';

function currentPageKey(){
  if(document.getElementById('pg-booking').classList.contains('on')) return 'booking';
  if(document.getElementById('pg-vehicles').classList.contains('on')) return 'vehicles';
  if(document.getElementById('pg-subscribe').classList.contains('on')) return 'subscribe';
  if(document.getElementById('pg-menu').classList.contains('on')) return 'menu';
  return '';
}

async function kakaoLogin(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  const returnPage = currentPageKey();
  if(returnPage) localStorage.setItem(KAKAO_RETURN_PAGE_KEY, returnPage);
  else localStorage.removeItem(KAKAO_RETURN_PAGE_KEY);
  const {error} = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if(error) showToast('로그인 실패: '+error.message);
}

async function kakaoLogout(){
  if(!supabase) return;
  await supabase.auth.signOut();
  showToast('로그아웃 되었습니다');
}

function renderLoginBar(){
  const nameLabel = isAdmin ? '관리자' : kakaoNickname(currentUser);
  const html = currentUser
    ? `<div class="resv-user-bar">
        <div class="resv-user-name">안녕하세요, <em>${escapeHtml(nameLabel)}</em>님</div>
        <button class="resv-logout-btn" onclick="kakaoLogout()">로그아웃</button>
      </div>`
    : `<button class="kakao-login-btn" onclick="kakaoLogin()">카카오 1초 로그인</button>`;
  document.querySelectorAll('.login-bar-slot').forEach(el=>{ el.innerHTML = html; });
}

/* ════════════════════════════════════
   관리자 로그인
════════════════════════════════════ */
let isAdmin = false;

async function refreshAdminStatus(){
  if(!supabase || !currentUser){ isAdmin = false; return; }
  const {data} = await supabase.from('admins').select('user_id').eq('user_id', currentUser.id).maybeSingle();
  isAdmin = !!data;
}

function openAdminLoginModal(){
  document.getElementById('admin-login-modal').classList.add('on');
}
function closeAdminLoginModal(){
  document.getElementById('admin-login-modal').classList.remove('on');
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-password').value = '';
}
async function adminLogin(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  if(!email || !password){ showToast('이메일/비밀번호를 입력해주세요'); return; }
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if(error){ showToast('로그인 실패: '+error.message); return; }
  closeAdminLoginModal();
  showToast('관리자로 로그인되었습니다');
}

if(supabase){
  supabase.auth.onAuthStateChange(async (_event, session)=>{
    currentUser = session ? session.user : null;
    await refreshAdminStatus();
    renderLoginBar();
    await fetchReservations();
    if(document.getElementById('pg-booking').classList.contains('on')) renderCalendar();
    await fetchVehicles();
    if(document.getElementById('pg-vehicles').classList.contains('on')) renderVehicles();
    if(vdetailVehicleId && document.getElementById('pg-vehicle-detail').classList.contains('on')){
      await fetchWashRecords();
      renderVdetailCalendar();
    }
    if(document.getElementById('pg-subscribe').classList.contains('on')){
      await fetchMySubscription();
      renderSubscribePage();
    }
    if(document.getElementById('pg-menu').classList.contains('on')) renderMenuPage();
  });
}

/* ════════════════════════════════════
   세차 예약 (예약 캘린더)
════════════════════════════════════ */
const RESV_KEY = 'carwash_reservations_v1';
const RESV_MIGRATED_KEY = 'carwash_supabase_migrated_v1';

function rowToLocal(r){
  return {
    id: r.id, date: r.date, time: r.time ? r.time.slice(0,5) : '',
    name: r.name, phone: r.phone || '', carNum: r.car_num || '',
    carModel: r.car_model || '', loc: r.loc || '', note: r.note || '',
    done: !!r.done
  };
}

async function migrateLocalReservations(){
  if(!supabase || localStorage.getItem(RESV_MIGRATED_KEY)) return;
  let local = [];
  try { local = JSON.parse(localStorage.getItem(RESV_KEY)) || []; } catch(e){}
  if(local.length){
    const rows = local.map(r=>({
      date: r.date, time: r.time || null, name: r.name, phone: r.phone || null,
      car_num: r.carNum || null, car_model: r.carModel || null,
      loc: r.loc || null, note: r.note || null, done: !!r.done
    }));
    const {error} = await supabase.from('reservations').insert(rows);
    if(error) console.error('예약 마이그레이션 실패', error);
  }
  localStorage.setItem(RESV_MIGRATED_KEY, '1');
  localStorage.removeItem(RESV_KEY);
}

let RESERVATIONS = [];

async function fetchReservations(){
  if(!supabase) return;
  const {data, error} = await supabase
    .from('reservations')
    .select('*')
    .order('date', {ascending:true})
    .order('time', {ascending:true});
  if(error){ showToast('예약 불러오기 실패: '+error.message); return; }
  RESERVATIONS = (data||[]).map(rowToLocal);
}

if(supabase){
  supabase
    .channel('reservations-changes')
    .on('postgres_changes', {event:'*', schema:'public', table:'reservations'}, async ()=>{
      await fetchReservations();
      if(document.getElementById('pg-booking').classList.contains('on')) renderCalendar();
    })
    .subscribe();

  migrateLocalReservations().then(fetchReservations);
}

let calViewYear, calViewMonth, calSelectedDate;

function pad2(n){ return String(n).padStart(2,'0'); }
function toDateKey(y,m,d){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
function todayKey(){
  const n=new Date();
  return toDateKey(n.getFullYear(), n.getMonth(), n.getDate());
}

function calShiftMonth(delta){
  calViewMonth += delta;
  if(calViewMonth<0){ calViewMonth=11; calViewYear--; }
  if(calViewMonth>11){ calViewMonth=0; calViewYear++; }
  renderCalendar();
}

function renderCalendar(){
  const guestMsg = document.getElementById('resv-guest-msg');
  const main = document.getElementById('resv-main');
  if(guestMsg && main){
    if(!currentUser){
      guestMsg.style.display = '';
      main.style.display = 'none';
      return;
    }
    guestMsg.style.display = 'none';
    main.style.display = '';
  }

  document.getElementById('resv-cal-title').textContent = `${calViewYear}년 ${calViewMonth+1}월`;

  const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
  const daysInMonth = new Date(calViewYear, calViewMonth+1, 0).getDate();
  const tKey = todayKey();

  const countMap = {};
  RESERVATIONS.forEach(r=>{ countMap[r.date] = (countMap[r.date]||0)+1; });

  let cells = '';
  for(let i=0;i<firstDay;i++) cells += `<div class="resv-day empty"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateKey = toDateKey(calViewYear, calViewMonth, d);
    const count = countMap[dateKey] || 0;
    const isToday = dateKey===tKey;
    const isSelected = dateKey===calSelectedDate;
    cells += `
      <div class="resv-day${isToday?' today':''}${isSelected?' selected':''}" onclick="selectCalDate('${dateKey}')">
        <div class="rd-num">${d}</div>
        ${count>0?`<div class="rd-dot">${count>9?'9+':count}</div>`:''}
      </div>`;
  }
  document.getElementById('resv-cal-grid').innerHTML = cells;

  renderReservationList();
}

function selectCalDate(dateKey){
  calSelectedDate = dateKey;
  renderCalendar();
}

function renderReservationList(){
  const [y,m,d] = calSelectedDate.split('-').map(Number);
  const dayNames=['일','월','화','수','목','금','토'];
  const dow = new Date(y, m-1, d).getDay();
  document.getElementById('resv-list-title').textContent = `${m}/${d}(${dayNames[dow]}) 예약`;

  const items = RESERVATIONS.filter(r=>r.date===calSelectedDate)
    .sort((a,b)=> (a.time||'').localeCompare(b.time||''));

  const el = document.getElementById('resv-list');
  if(!items.length){
    el.innerHTML = `<div class="resv-empty">📅 이 날짜에 예약이 없습니다</div>`;
    return;
  }

  el.innerHTML = items.map(r=>`
    <div class="resv-item${r.done?' done':''}">
      <div class="resv-chk${r.done?' done':''}" onclick="toggleResvDone('${r.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="resv-item-body">
        <div class="resv-item-top">
          ${r.time?`<span class="resv-time">${escapeHtml(r.time)}</span>`:''}
          <span class="resv-name">${escapeHtml(r.name)}</span>
          ${r.carNum?`<span class="resv-car">${escapeHtml(r.carNum)}${r.carModel?' · '+escapeHtml(r.carModel):''}</span>`:''}
        </div>
        ${r.loc?`<div class="resv-loc">📍 ${escapeHtml(r.loc)}</div>`:''}
        ${r.phone?`<div class="resv-phone">📞 ${escapeHtml(r.phone)}</div>`:''}
        ${r.note?`<div class="resv-note">${escapeHtml(r.note)}</div>`:''}
      </div>
      <div class="resv-item-actions">
        <div class="resv-edit-btn" onclick="openReservationModal('${r.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="resv-del-btn" onclick="askResvDelete('${r.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </div>
      </div>
    </div>`).join('');
}

async function toggleResvDone(id){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  const r = RESERVATIONS.find(x=>x.id===id);
  if(!r) return;
  const newDone = !r.done;
  const {error} = await supabase.from('reservations').update({done:newDone}).eq('id', id);
  if(error){ showToast('업데이트 실패: '+error.message); return; }
  r.done = newDone;
  renderCalendar();
  showToast(newDone?'✅ 완료 처리':'↩ 대기로 변경');
}

let _resvEditId = null;
function openReservationModal(id){
  _resvEditId = id || null;
  const r = id ? RESERVATIONS.find(x=>x.id===id) : null;

  document.getElementById('resv-modal-title').textContent = id ? '예약 수정' : '예약 추가';
  document.getElementById('rv-date').value      = r ? r.date : calSelectedDate;
  document.getElementById('rv-time').value      = r ? (r.time||'') : '';
  document.getElementById('rv-name').value      = r ? r.name : (currentUser ? kakaoNickname(currentUser) : '');
  document.getElementById('rv-phone').value     = r ? (r.phone||'') : '';
  document.getElementById('rv-car-num').value   = r ? (r.carNum||'') : '';
  document.getElementById('rv-car-model').value = r ? (r.carModel||'') : '';
  document.getElementById('rv-loc').value       = r ? (r.loc||'') : '';
  document.getElementById('rv-note').value      = r ? (r.note||'') : '';

  document.getElementById('reservation-modal').classList.add('on');
}
function closeReservationModal(){
  document.getElementById('reservation-modal').classList.remove('on');
  _resvEditId = null;
}

async function saveReservation(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  const date      = document.getElementById('rv-date').value;
  const time      = document.getElementById('rv-time').value;
  const name      = document.getElementById('rv-name').value.trim();
  const phone     = document.getElementById('rv-phone').value.trim();
  const carNum    = document.getElementById('rv-car-num').value.trim();
  const carModel  = document.getElementById('rv-car-model').value.trim();
  const loc       = document.getElementById('rv-loc').value.trim();
  const note      = document.getElementById('rv-note').value.trim();

  const missing=[];
  if(!date) missing.push('예약 날짜');
  if(!name) missing.push('고객명');
  if(missing.length){ showRequiredModal(missing.join(', ')); return; }

  if(!validateInputs(name, phone, carNum, carModel, loc, note)){
    showBadwordModal(); return;
  }

  const payload = {
    date, time: time || null, name, phone: phone || null,
    car_num: carNum || null, car_model: carModel || null,
    loc: loc || null, note: note || null
  };
  if(!_resvEditId) payload.user_id = currentUser ? currentUser.id : null;

  let error;
  if(_resvEditId){
    ({error} = await supabase.from('reservations').update(payload).eq('id', _resvEditId));
  } else {
    ({error} = await supabase.from('reservations').insert(payload));
  }
  if(error){ showToast('저장 실패: '+error.message); return; }

  await fetchReservations();
  closeReservationModal();
  calSelectedDate = date;
  renderCalendar();
  showToast(_resvEditId?'✏️ 예약이 수정되었습니다':'✅ 예약이 등록되었습니다');
}

let _resvDeleteId = null;
function askResvDelete(id){
  const r = RESERVATIONS.find(x=>x.id===id);
  if(!r) return;
  _resvDeleteId = id;
  document.getElementById('rdm-name').textContent = r.name;
  document.getElementById('rdm-date').textContent = `${r.date}${r.time?' '+r.time:''}`;
  document.getElementById('rdm-car').textContent  = [r.carNum,r.carModel].filter(Boolean).join(' · ') || '차량정보 없음';
  document.getElementById('resv-delete-modal').classList.add('on');
}
function closeResvDeleteModal(){
  document.getElementById('resv-delete-modal').classList.remove('on');
  _resvDeleteId = null;
}
async function confirmResvDelete(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  if(!_resvDeleteId) return;
  const {error} = await supabase.from('reservations').delete().eq('id', _resvDeleteId);
  if(error){ showToast('삭제 실패: '+error.message); return; }
  RESERVATIONS = RESERVATIONS.filter(x=>x.id!==_resvDeleteId);
  closeResvDeleteModal();
  renderCalendar();
  showToast('🗑️ 예약이 삭제되었습니다');
}

/* ════════════════════════════════════
   내 차량 확인 — 차량 등록(고객)
════════════════════════════════════ */
let VEHICLES = [];

async function fetchVehicles(){
  if(!supabase || !currentUser){ VEHICLES = []; return; }
  const {data, error} = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', {ascending:true});
  if(error){ showToast('차량 목록 불러오기 실패: '+error.message); return; }
  VEHICLES = data || [];
}

function renderVehicles(){
  const guestMsg = document.getElementById('veh-guest-msg');
  const main = document.getElementById('veh-main');
  const addBtn = document.getElementById('veh-add-btn');
  const adminAddBtn = document.getElementById('veh-admin-add-btn');
  const searchEl = document.getElementById('veh-search');
  const listTitle = document.getElementById('veh-list-title');
  if(!guestMsg || !main) return;

  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';

  addBtn.style.display = isAdmin ? 'none' : '';
  adminAddBtn.style.display = isAdmin ? '' : 'none';
  searchEl.style.display = isAdmin ? '' : 'none';
  listTitle.textContent = isAdmin ? '전체 고객 차량' : '등록한 차량';

  let list = VEHICLES;
  if(isAdmin){
    const q = (searchEl.value||'').trim().toLowerCase();
    if(q) list = list.filter(v => (v.car_num||'').toLowerCase().includes(q));
  }

  const el = document.getElementById('veh-list');
  if(!list.length){
    el.innerHTML = `<div class="resv-empty">🚗 ${isAdmin?'검색된 차량이 없습니다':'등록된 차량이 없습니다'}</div>`;
    return;
  }

  el.innerHTML = list.map(v=>`
    <div class="veh-card veh-card-clickable" onclick="goVehicleDetail('${v.id}')">
      <div class="veh-card-top">
        <div class="veh-card-info">
          <div class="veh-card-num">${escapeHtml(v.car_num||'차량번호 미입력')}</div>
          ${v.car_model?`<div class="veh-card-model">${escapeHtml(v.car_model)}</div>`:''}
        </div>
        ${isAdmin ? `
        <div class="veh-card-actions" onclick="event.stopPropagation()">
          <div class="resv-edit-btn" onclick="openVehicleModal('${v.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        ` : `
        <div class="veh-card-actions" onclick="event.stopPropagation()">
          <div class="resv-edit-btn" onclick="openVehicleModal('${v.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div class="resv-del-btn" onclick="askVehicleDelete('${v.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </div>
        </div>`}
      </div>
    </div>`).join('');
}

const CAR_BRANDS = {
  '국산차': {
    '현대': ['아반떼','쏘나타','그랜저','싼타페','투싼','팰리세이드','캐스퍼','아이오닉5','아이오닉6','스타리아','베뉴','코나'],
    '기아': ['모닝','레이','K3','K5','K8','K9','스포티지','쏘렌토','카니발','셀토스','니로','EV6','EV9'],
    '제네시스': ['G70','G80','G90','GV60','GV70','GV80'],
    '쉐보레': ['스파크','트레일블레이저','트랙스','말리부','타호'],
    'KG모빌리티(쌍용)': ['티볼리','코란도','토레스','렉스턴'],
    '르노코리아': ['SM6','QM6','XM3','아르카나'],
  },
  '수입차': {
    '벤츠': ['A클래스','C클래스','E클래스','S클래스','GLA','GLC','GLE','GLS'],
    'BMW': ['3시리즈','5시리즈','7시리즈','X3','X5','X7','미니'],
    '아우디': ['A4','A6','A8','Q3','Q5','Q7'],
    '폭스바겐': ['골프','제타','티구안','파사트'],
    '볼보': ['S60','S90','XC40','XC60','XC90'],
    '테슬라': ['모델3','모델Y','모델S','모델X'],
    '토요타': ['캠리','코롤라','라브4','프리우스'],
    '렉서스': ['ES','RX','NX','LS'],
    '혼다': ['어코드','CR-V','시빅'],
    '포드': ['익스플로러','머스탱','레인저'],
    '지프': ['랭글러','그랜드체로키','컴패스'],
    '포르쉐': ['911','카이엔','마칸','파나메라'],
    '랜드로버': ['레인지로버','디스커버리','디펜더'],
  }
};

function updateVehBrandOptions(){
  const category = document.getElementById('veh-brand-category').value;
  const brandEl = document.getElementById('veh-brand');
  const brands = category ? Object.keys(CAR_BRANDS[category]) : [];
  brandEl.innerHTML = (brands.length
    ? '<option value="">선택하세요</option>' + brands.map(b=>`<option value="${b}">${b}</option>`).join('')
    : '<option value="">차량 구분을 먼저 선택하세요</option>')
    + (brands.length ? '<option value="__custom__">기타 (직접 입력)</option>' : '');
  document.getElementById('veh-brand-custom').value = '';
  document.getElementById('veh-brand-custom-wrap').style.display = 'none';
  document.getElementById('veh-model-field').style.display = '';
  updateVehModelOptions();
}

function updateVehModelOptions(){
  const category = document.getElementById('veh-brand-category').value;
  const brand = document.getElementById('veh-brand').value;
  const modelEl = document.getElementById('veh-model');
  if(!category || !brand || brand === '__custom__'){
    modelEl.innerHTML = '<option value="">브랜드를 먼저 선택하세요</option>';
  } else {
    const models = (CAR_BRANDS[category] && CAR_BRANDS[category][brand]) || [];
    modelEl.innerHTML = '<option value="">선택하세요</option>'
      + models.map(m=>`<option value="${m}">${m}</option>`).join('')
      + '<option value="__custom__">기타 (직접 입력)</option>';
  }
  document.getElementById('veh-model-custom').value = '';
  document.getElementById('veh-model-custom-wrap').style.display = 'none';
}

function onVehBrandChange(){
  const brand = document.getElementById('veh-brand').value;
  const brandCustomWrap = document.getElementById('veh-brand-custom-wrap');
  const modelField = document.getElementById('veh-model-field');
  if(brand === '__custom__'){
    brandCustomWrap.style.display = '';
    modelField.style.display = 'none';
    document.getElementById('veh-model-custom-wrap').style.display = 'none';
  } else {
    brandCustomWrap.style.display = 'none';
    modelField.style.display = '';
    updateVehModelOptions();
  }
}

function onVehModelChange(){
  const model = document.getElementById('veh-model').value;
  document.getElementById('veh-model-custom-wrap').style.display = model === '__custom__' ? '' : 'none';
}

let _vehEditId = null;
function openVehicleModal(id){
  _vehEditId = id || null;
  const v = id ? VEHICLES.find(x=>x.id===id) : null;

  document.getElementById('veh-modal-title').textContent = id ? '차량 정보 수정' : '차량 등록';
  document.getElementById('veh-car-num').value = v ? (v.car_num||'') : '';
  document.getElementById('veh-form-delete-wrap').style.display = id ? '' : 'none';

  const catEl = document.getElementById('veh-brand-category');
  const brandEl = document.getElementById('veh-brand');
  const modelEl = document.getElementById('veh-model');
  catEl.value = '';
  updateVehBrandOptions();

  if(v && v.car_model){
    let matched = false;
    for(const category of Object.keys(CAR_BRANDS)){
      if(matched) break;
      for(const brand of Object.keys(CAR_BRANDS[category])){
        if(v.car_model.startsWith(brand+' ') || v.car_model === brand){
          catEl.value = category;
          updateVehBrandOptions();
          brandEl.value = brand;
          onVehBrandChange();
          const rest = v.car_model === brand ? '' : v.car_model.slice(brand.length+1);
          if(rest){
            const hasOption = [...modelEl.options].some(o=>o.value===rest);
            modelEl.value = hasOption ? rest : '__custom__';
            onVehModelChange();
            if(!hasOption) document.getElementById('veh-model-custom').value = rest;
          }
          matched = true;
          break;
        }
      }
    }
    if(!matched){
      brandEl.value = '__custom__';
      onVehBrandChange();
      document.getElementById('veh-brand-custom').value = v.car_model;
    }
  }

  showPage('pg-vehicle-form');
}
function closeVehicleModal(){
  _vehEditId = null;
  showPage('pg-vehicles');
  renderVehicles();
}

async function saveVehicle(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  if(!currentUser){ showToast('로그인이 필요합니다'); return; }

  const carNum = document.getElementById('veh-car-num').value.trim();
  const brand  = document.getElementById('veh-brand').value;
  const model  = document.getElementById('veh-model').value;
  let carModel = '';
  if(brand === '__custom__'){
    carModel = document.getElementById('veh-brand-custom').value.trim();
  } else if(brand){
    const modelName = model === '__custom__' ? document.getElementById('veh-model-custom').value.trim() : model;
    carModel = modelName ? `${brand} ${modelName}` : brand;
  }

  if(!carNum){ showRequiredModal('차량 번호'); return; }
  if(!validateInputs(carNum, carModel)){ showBadwordModal(); return; }

  const payload = { car_num: carNum, car_model: carModel || null };

  let error;
  if(_vehEditId){
    ({error} = await supabase.from('vehicles').update(payload).eq('id', _vehEditId));
  } else {
    ({error} = await supabase.from('vehicles').insert({...payload, user_id: currentUser.id}));
  }
  if(error){ showToast('저장 실패: '+error.message); return; }

  await fetchVehicles();
  closeVehicleModal();
  showToast(_vehEditId?'✏️ 차량 정보가 수정되었습니다':'✅ 차량이 등록되었습니다');
}

function deleteVehicleFromForm(){
  if(_vehEditId) askVehicleDelete(_vehEditId);
}

let _vehDeleteId = null;
function askVehicleDelete(id){
  const v = VEHICLES.find(x=>x.id===id);
  if(!v) return;
  _vehDeleteId = id;
  document.getElementById('vdm-num').textContent = v.car_num || '차량번호 없음';
  document.getElementById('vdm-model').textContent = v.car_model || '';
  document.getElementById('vehicle-delete-modal').classList.add('on');
}
function closeVehicleDeleteModal(){
  document.getElementById('vehicle-delete-modal').classList.remove('on');
  _vehDeleteId = null;
}
async function confirmVehicleDelete(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  if(!_vehDeleteId) return;
  const {data: photos} = await supabase
    .from('wash_record_photos')
    .select('storage_path, wash_records!inner(vehicle_id)')
    .eq('wash_records.vehicle_id', _vehDeleteId);
  const paths = (photos||[]).map(p=>p.storage_path);
  if(paths.length) await supabase.storage.from('vehicle-photos').remove(paths);
  const {error} = await supabase.from('vehicles').delete().eq('id', _vehDeleteId);
  if(error){ showToast('삭제 실패: '+error.message); return; }
  VEHICLES = VEHICLES.filter(x=>x.id!==_vehDeleteId);
  closeVehicleDeleteModal();
  _vehEditId = null;
  showPage('pg-vehicles');
  renderVehicles();
  showToast('🗑️ 차량이 삭제되었습니다');
}

/* ════════════════════════════════════
   차량 상세 — 세차 기록 캘린더 (고객: 조회 / 관리자: 작성)
════════════════════════════════════ */
let vdetailVehicleId = null;
let vdetailYear, vdetailMonth, vdetailSelectedDate;
let WASH_RECORDS = [];

async function goVehicleDetail(id){
  vdetailVehicleId = id;
  const v = VEHICLES.find(x=>x.id===id);
  document.getElementById('vdetail-title').textContent = v ? (v.car_num || '차량 상세') : '차량 상세';
  showPage('pg-vehicle-detail');
  const n = new Date();
  vdetailYear = n.getFullYear();
  vdetailMonth = n.getMonth();
  vdetailSelectedDate = todayKey();
  await fetchWashRecords();
  renderVdetailCalendar();
}

async function fetchWashRecords(){
  if(!supabase || !vdetailVehicleId){ WASH_RECORDS = []; return; }
  const {data, error} = await supabase
    .from('wash_records')
    .select('*, wash_record_photos(*)')
    .eq('vehicle_id', vdetailVehicleId)
    .order('wash_date', {ascending:true});
  if(error){ showToast('세차 기록 불러오기 실패: '+error.message); return; }
  WASH_RECORDS = data || [];
}

function vdetailShiftMonth(delta){
  vdetailMonth += delta;
  if(vdetailMonth<0){ vdetailMonth=11; vdetailYear--; }
  if(vdetailMonth>11){ vdetailMonth=0; vdetailYear++; }
  renderVdetailCalendar();
}

function vdetailSelectDate(dateKey){
  vdetailSelectedDate = dateKey;
  renderVdetailCalendar();
}

function renderVdetailCalendar(){
  document.getElementById('vdetail-cal-title').textContent = `${vdetailYear}년 ${vdetailMonth+1}월`;

  const firstDay = new Date(vdetailYear, vdetailMonth, 1).getDay();
  const daysInMonth = new Date(vdetailYear, vdetailMonth+1, 0).getDate();
  const tKey = todayKey();

  const recordMap = {};
  WASH_RECORDS.forEach(r=>{ recordMap[r.wash_date] = r; });

  let cells = '';
  for(let i=0;i<firstDay;i++) cells += `<div class="resv-day empty"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateKey = toDateKey(vdetailYear, vdetailMonth, d);
    const has = !!recordMap[dateKey];
    const isToday = dateKey===tKey;
    const isSelected = dateKey===vdetailSelectedDate;
    cells += `
      <div class="resv-day${isToday?' today':''}${isSelected?' selected':''}" onclick="vdetailSelectDate('${dateKey}')">
        <div class="rd-num">${d}</div>
        ${has?`<div class="rd-dot">✓</div>`:''}
      </div>`;
  }
  document.getElementById('vdetail-cal-grid').innerHTML = cells;

  renderVdetailRecordPanel();
}

function renderVdetailRecordPanel(){
  const el = document.getElementById('vdetail-record-panel');
  if(!el) return;
  const record = WASH_RECORDS.find(r=>r.wash_date === vdetailSelectedDate);
  const [y,m,d] = vdetailSelectedDate.split('-').map(Number);
  const dateLabel = `${m}/${d}`;

  if(isAdmin){
    el.innerHTML = `
      <div class="resv-list-section">
        <div class="resv-list-header"><div class="resv-list-title">${dateLabel} 세차 기록</div></div>
        <div class="veh-record-card">
          <label class="mg-label">특이사항</label>
          <textarea class="mg-input veh-record-note" id="vdetail-note" placeholder="특이사항을 입력하세요">${record?escapeHtml(record.note||''):''}</textarea>
          <label class="mg-label" style="margin-top:14px;">사진</label>
          <div id="vdetail-photo-section"></div>
          <div class="veh-record-actions">
            ${record?`<button class="resv-cancel-btn" onclick="deleteWashRecord('${record.id}')">기록 삭제</button>`:''}
            <button class="resv-save-btn" onclick="saveWashRecord()">${record?'수정 저장':'완료 등록'}</button>
          </div>
        </div>
      </div>`;
    renderVdetailPhotoSection(record);
  } else {
    if(!record){
      el.innerHTML = `<div class="resv-empty">📅 ${dateLabel}에는 세차 기록이 없습니다</div>`;
      return;
    }
    const photos = record.wash_record_photos || [];
    el.innerHTML = `
      <div class="resv-list-section">
        <div class="resv-list-header"><div class="resv-list-title">${dateLabel} 세차 완료</div></div>
        <div class="veh-record-card">
          <div class="veh-card-note">${record.note?escapeHtml(record.note):'등록된 특이사항이 없습니다'}</div>
          ${photos.length?`<div class="veh-photo-scroll" style="margin-top:10px;">${photos.map(p=>`<img src="${p.photo_url}" class="veh-photo-thumb">`).join('')}</div>`:''}
        </div>
      </div>`;
  }
}

function renderVdetailPhotoSection(record){
  const el = document.getElementById('vdetail-photo-section');
  if(!el) return;
  const photos = record ? (record.wash_record_photos||[]) : [];
  el.innerHTML = `
    <div class="veh-photo-grid">
      ${photos.map(p=>`
        <div class="veh-photo-item">
          <img src="${p.photo_url}">
          <div class="veh-photo-remove" onclick="deleteWashRecordPhoto('${p.id}','${p.storage_path}')">✕</div>
        </div>`).join('')}
      <label class="veh-photo-add">
        +
        <input type="file" accept="image/*" multiple style="display:none;" onchange="handleWashRecordPhotoInput(this)">
      </label>
    </div>`;
}

async function ensureWashRecord(){
  let record = WASH_RECORDS.find(r=>r.wash_date === vdetailSelectedDate);
  if(record) return record;
  const {data, error} = await supabase.from('wash_records')
    .insert({vehicle_id: vdetailVehicleId, wash_date: vdetailSelectedDate})
    .select().single();
  if(error){ showToast('기록 생성 실패: '+error.message); return null; }
  await fetchWashRecords();
  return WASH_RECORDS.find(r=>r.id===data.id);
}

async function saveWashRecord(){
  if(!supabase || !isAdmin) return;
  const note = document.getElementById('vdetail-note').value.trim();
  if(!validateInputs(note)){ showBadwordModal(); return; }
  const existing = WASH_RECORDS.find(r=>r.wash_date === vdetailSelectedDate);
  let error;
  if(existing){
    ({error} = await supabase.from('wash_records').update({note: note||null}).eq('id', existing.id));
  } else {
    ({error} = await supabase.from('wash_records')
      .insert({vehicle_id: vdetailVehicleId, wash_date: vdetailSelectedDate, note: note||null}));
  }
  if(error){ showToast('저장 실패: '+error.message); return; }
  await fetchWashRecords();
  renderVdetailCalendar();
  showToast(existing?'✏️ 기록이 수정되었습니다':'✅ 세차 완료로 등록되었습니다');
}

async function deleteWashRecord(id){
  if(!supabase || !isAdmin) return;
  const record = WASH_RECORDS.find(r=>r.id===id);
  const paths = (record && record.wash_record_photos || []).map(p=>p.storage_path);
  if(paths.length) await supabase.storage.from('vehicle-photos').remove(paths);
  const {error} = await supabase.from('wash_records').delete().eq('id', id);
  if(error){ showToast('삭제 실패: '+error.message); return; }
  await fetchWashRecords();
  renderVdetailCalendar();
  showToast('🗑️ 기록이 삭제되었습니다');
}

async function handleWashRecordPhotoInput(input){
  if(!supabase || !isAdmin || !input.files.length) return;
  const files = Array.from(input.files);
  input.value = '';
  const record = await ensureWashRecord();
  if(!record) return;
  showToast('사진 업로드 중...');
  for(const file of files){
    const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
    const path = `${vdetailVehicleId}/${record.id}/${crypto.randomUUID()}.${ext}`;
    const {error: upErr} = await supabase.storage.from('vehicle-photos').upload(path, file);
    if(upErr){ showToast('업로드 실패: '+upErr.message); continue; }
    const {data: pub} = supabase.storage.from('vehicle-photos').getPublicUrl(path);
    const {error: insErr} = await supabase.from('wash_record_photos').insert({
      wash_record_id: record.id, photo_url: pub.publicUrl, storage_path: path
    });
    if(insErr) showToast('사진 등록 실패: '+insErr.message);
  }
  await fetchWashRecords();
  renderVdetailCalendar();
  showToast('📷 사진이 등록되었습니다');
}

async function deleteWashRecordPhoto(photoId, storagePath){
  if(!supabase || !isAdmin) return;
  await supabase.storage.from('vehicle-photos').remove([storagePath]);
  const {error} = await supabase.from('wash_record_photos').delete().eq('id', photoId);
  if(error){ showToast('사진 삭제 실패: '+error.message); return; }
  await fetchWashRecords();
  renderVdetailCalendar();
}

/* ════════════════════════════════════
   구독결제신청 (토스페이먼츠 정기결제)
════════════════════════════════════ */
// 토스페이먼츠 클라이언트 키를 발급받으면 여기에 넣으세요 (시크릿 키는 절대 여기에 넣지 마세요)
const TOSS_CLIENT_KEY = '';
const TOSS_PENDING_PLAN_KEY = 'carwash_pending_plan';

let SUBSCRIPTION_PLANS = [];
let CURRENT_SUBSCRIPTION = null;
let _selectedPlanId = null;

async function goSubscribe(){
  showPage('pg-subscribe');
  await fetchSubscribePlans();
  await fetchMySubscription();
  renderSubscribePage();
}

async function fetchSubscribePlans(){
  if(!supabase) return;
  const {data, error} = await supabase.from('subscription_plans').select('*').eq('active', true).order('price');
  if(error){ showToast('플랜 불러오기 실패: '+error.message); return; }
  SUBSCRIPTION_PLANS = data || [];
}

async function fetchMySubscription(){
  CURRENT_SUBSCRIPTION = null;
  if(!supabase || !currentUser) return;
  const {data, error} = await supabase.from('subscriptions_public')
    .select('*').eq('user_id', currentUser.id)
    .order('created_at', {ascending:false}).limit(1).maybeSingle();
  if(!error) CURRENT_SUBSCRIPTION = data || null;
}

function renderSubscribePage(){
  const guestMsg = document.getElementById('sub-guest-msg');
  const main = document.getElementById('sub-main');
  if(!guestMsg || !main) return;

  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';

  const statusEl = document.getElementById('sub-status');
  const applyBtn = document.getElementById('sub-apply-btn');
  if(CURRENT_SUBSCRIPTION && CURRENT_SUBSCRIPTION.status === 'active'){
    const plan = SUBSCRIPTION_PLANS.find(p=>p.id===CURRENT_SUBSCRIPTION.plan_id);
    statusEl.innerHTML = `<div class="sub-status-active">✅ 현재 구독 중: ${plan?escapeHtml(plan.name):'구독 플랜'}${CURRENT_SUBSCRIPTION.next_billing_date?` (다음 결제일 ${CURRENT_SUBSCRIPTION.next_billing_date})`:''}</div>`;
    applyBtn.style.display = 'none';
  } else {
    statusEl.innerHTML = '';
    applyBtn.style.display = '';
  }

  if(!_selectedPlanId && SUBSCRIPTION_PLANS.length) _selectedPlanId = SUBSCRIPTION_PLANS[0].id;

  document.getElementById('sub-plan-list').innerHTML = SUBSCRIPTION_PLANS.map(p=>`
    <div class="sub-plan-card${p.id===_selectedPlanId?' selected':''}" onclick="selectSubscribePlan('${p.id}')">
      <div class="sub-plan-name">${escapeHtml(p.name)}</div>
      <div class="sub-plan-price">${p.price>0? p.price.toLocaleString()+'원 / 월' : '가격 안내 예정'}</div>
    </div>`).join('');
}

function selectSubscribePlan(id){
  _selectedPlanId = id;
  renderSubscribePage();
}

async function applySubscription(){
  if(!supabase || !currentUser){ showToast('로그인이 필요합니다'); return; }
  if(!_selectedPlanId){ showToast('플랜을 선택해주세요'); return; }
  if(!TOSS_CLIENT_KEY){
    showToast('결제 연동이 아직 설정되지 않았습니다. 관리자에게 문의해주세요');
    return;
  }
  if(typeof PaymentWidget === 'undefined'){
    showToast('결제 모듈을 불러오지 못했습니다'); return;
  }
  localStorage.setItem(TOSS_PENDING_PLAN_KEY, _selectedPlanId);
  const widget = PaymentWidget(TOSS_CLIENT_KEY, currentUser.id);
  try {
    await widget.requestBillingAuth('카드', {
      customerKey: currentUser.id,
      successUrl: window.location.origin + window.location.pathname + '#billing-success',
      failUrl: window.location.origin + window.location.pathname + '#billing-fail'
    });
  } catch(e){
    showToast('결제 카드 등록에 실패했습니다');
  }
}

async function handleBillingRedirect(){
  const params = new URLSearchParams(window.location.search);
  const authKey = params.get('authKey');
  const customerKey = params.get('customerKey');
  const planId = localStorage.getItem(TOSS_PENDING_PLAN_KEY);
  if(!authKey || !customerKey || !planId || !supabase) return;

  showToast('결제 처리 중...');
  const {error} = await supabase.functions.invoke('issue-billing-key', {
    body: { authKey, customerKey, planId }
  });
  localStorage.removeItem(TOSS_PENDING_PLAN_KEY);
  history.replaceState({}, '', window.location.pathname);
  if(error){ showToast('결제 처리 실패: '+error.message); return; }
  showToast('✅ 구독이 시작되었습니다');
  goSubscribe();
}

// 인라인 onclick="..." 핸들러(HTML)에서 접근할 수 있도록 전역(window)에 노출
Object.assign(window, {
  adminLogin, applySubscription, askResvDelete, askVehicleDelete, calShiftMonth,
  closeAdminLoginModal, closeBadwordModal, closeRequiredModal, closeReservationModal,
  closeResvDeleteModal, closeVehicleDeleteModal, closeVehicleModal, confirmResvDelete,
  confirmVehicleDelete, deleteVehicleFromForm, deleteWashRecord, deleteWashRecordPhoto, goBooking, goFaq, goHome,
  goMenu, goStory, goSubscribe, goVehicleDetail, goVehicles, handleWashRecordPhotoInput,
  kakaoLogin, kakaoLogout, onVehBrandChange, onVehModelChange, openAdminLoginModal,
  openReservationModal, openVehicleModal, saveReservation, saveVehicle, saveWashRecord,
  selectCalDate, selectSubscribePlan, showToast, toggleFaqItem, toggleResvDone,
  updateVehBrandOptions, updateVehModelOptions, vdetailSelectDate, vdetailShiftMonth
});

renderLoginBar();
handleBillingRedirect();

const kakaoReturnPage = localStorage.getItem(KAKAO_RETURN_PAGE_KEY);
if(kakaoReturnPage){
  localStorage.removeItem(KAKAO_RETURN_PAGE_KEY);
  if(kakaoReturnPage === 'booking') goBooking();
  else if(kakaoReturnPage === 'vehicles') goVehicles();
  else if(kakaoReturnPage === 'subscribe') goSubscribe();
  else if(kakaoReturnPage === 'menu') goMenu();
} else if(location.hash === '#booking'){
  goBooking();
}

})();
