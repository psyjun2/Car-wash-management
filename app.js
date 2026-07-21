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

function goHome(){ showPage('pg-home'); renderHomeQuickGrid(); }
function goMenu(){ showPage('pg-menu'); renderMenuPage(); }

function renderMenuPage(){
  const guestMsg = document.getElementById('menu-guest-msg');
  const main = document.getElementById('menu-main');
  if(!guestMsg || !main) return;

  document.getElementById('menu-admin-link').style.display = isAdmin ? 'none' : '';

  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';

  const adminGroup = document.getElementById('menu-admin-group');
  if(adminGroup){
    adminGroup.style.display = isAdmin ? '' : 'none';
    renderNotifCategoryToggles();
  }
}

const NOTIF_CATEGORIES = ['reservation','subscription','vehicle','inquiry'];
const NOTIF_RES_SEEN_KEY = 'carwash_admin_notif_reservations_seen';
const NOTIF_SUB_SEEN_KEY = 'carwash_admin_notif_subs_seen';
const NOTIF_VEH_SEEN_KEY = 'carwash_admin_notif_vehicles_seen';

function notifCatEnabled(cat){ return localStorage.getItem('carwash_admin_notif_cat_'+cat) !== 'off'; }

function toggleNotifCategory(cat, ev){
  if(ev) ev.stopPropagation();
  localStorage.setItem('carwash_admin_notif_cat_'+cat, notifCatEnabled(cat) ? 'off' : 'on');
  renderNotifCategoryToggles();
  renderHomeQuickGrid();
}

function renderNotifCategoryToggles(){
  NOTIF_CATEGORIES.forEach(cat=>{
    const el = document.getElementById('notif-toggle-'+cat);
    if(el) el.classList.toggle('on', notifCatEnabled(cat));
  });
}

function renderHomeQuickGrid(){
  const map = isAdmin
    ? {1:'일회성 세차신청자', 2:'구독결제 신청자', 3:'고객 차량 확인', 4:'고객 문의'}
    : {1:'일회성 세차신청', 2:'구독결제신청', 3:'내 차량 확인', 4:'자주 묻는 질문'};
  [1,2,3,4].forEach(n=>{
    const hq = document.getElementById(`hq-label-${n}`);
    if(hq) hq.textContent = map[n];
  });
  [1,2,3].forEach(n=>{
    const mi = document.getElementById(`mi-label-${n}`);
    if(mi) mi.textContent = map[n];
  });

  const bellBtn = document.getElementById('home-bell-btn');
  const bellDot = document.getElementById('home-bell-dot');
  bellBtn.style.display = isAdmin ? '' : 'none';
  bellDot.style.display = (isAdmin && hasAdminAlerts()) ? '' : 'none';
}

function hasAdminAlerts(){
  return (notifCatEnabled('reservation') && RESERVATIONS.some(isNewReservation))
    || (notifCatEnabled('subscription') && ALL_SUBSCRIPTIONS.some(isNewSubscription))
    || (notifCatEnabled('vehicle') && VEHICLES.some(isNewVehicle))
    || (notifCatEnabled('inquiry') && INQUIRIES.some(q=>q.status==='pending'));
}

function isNewReservation(r){
  if(r.status==='rejected' || !r.createdAt) return false;
  const lastSeen = localStorage.getItem(NOTIF_RES_SEEN_KEY);
  return !lastSeen || new Date(r.createdAt) > new Date(lastSeen);
}

function isNewSubscription(s){
  const lastSeen = localStorage.getItem(NOTIF_SUB_SEEN_KEY);
  return !lastSeen || new Date(s.created_at) > new Date(lastSeen);
}

function isNewVehicle(v){
  if(v.payment_plan === '일회성') return false;
  const lastSeen = localStorage.getItem(NOTIF_VEH_SEEN_KEY);
  return !lastSeen || new Date(v.created_at) > new Date(lastSeen);
}

async function refreshAdminAlerts(){
  if(!isAdmin || !supabase) return;
  await fetchInquiries();
  await fetchSubscribePlans();
  await fetchAllSubscriptions();
  await fetchVehicles();
  if(document.getElementById('pg-home').classList.contains('on')) renderHomeQuickGrid();
  if(document.getElementById('pg-notifications').classList.contains('on')) renderNotifications();
}

async function goNotifications(){
  if(!isAdmin) return;
  showPage('pg-notifications');
  await refreshAdminAlerts();
  renderNotifications();
  localStorage.setItem(NOTIF_RES_SEEN_KEY, new Date().toISOString());
  localStorage.setItem(NOTIF_SUB_SEEN_KEY, new Date().toISOString());
  localStorage.setItem(NOTIF_VEH_SEEN_KEY, new Date().toISOString());
  renderHomeQuickGrid();
}

function renderNotifications(){
  const el = document.getElementById('notif-list');
  const dayNames=['일','월','화','수','목','금','토'];

  const pendingRes = notifCatEnabled('reservation') ? RESERVATIONS.filter(isNewReservation)
    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)) : [];
  const newSubs = notifCatEnabled('subscription') ? ALL_SUBSCRIPTIONS.filter(isNewSubscription)
    .sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)) : [];
  const newVehs = notifCatEnabled('vehicle') ? VEHICLES.filter(isNewVehicle)
    .sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)) : [];
  const pendingInq = notifCatEnabled('inquiry') ? INQUIRIES.filter(q=>q.status==='pending')
    .sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)) : [];

  if(!pendingRes.length && !newSubs.length && !newVehs.length && !pendingInq.length){
    el.innerHTML = `<div class="resv-empty">🔔 새로운 알림이 없습니다</div>`;
    return;
  }

  let html = '';

  if(pendingRes.length){
    html += `<div class="notif-section-title">🚗 일회성 세차 신청</div>`;
    html += pendingRes.map(r=>{
      const [y,m,d] = r.date.split('-').map(Number);
      const dow = dayNames[new Date(y, m-1, d).getDay()];
      return `
      <div class="resv-item admin" onclick="goResvDetail('${r.id}')">
        <div class="resv-item-body">
          <div class="resv-item-top">
            <span class="resv-time">${m}/${d}(${dow})${r.time?' '+escapeHtml(r.time):''}</span>
            <span class="resv-name">${escapeHtml(r.name)}</span>
            ${r.carNum?`<span class="resv-car">${escapeHtml(r.carNum)}${r.carModel?' · '+escapeHtml(r.carModel):''}</span>`:''}
          </div>
          <div class="resv-status-badge pending">🔔 새 예약 요청</div>
        </div>
      </div>`;
    }).join('');
  }

  if(newSubs.length){
    html += `<div class="notif-section-title">🔄 구독결제 신청</div>`;
    html += newSubs.map(s=>{
      const plan = SUBSCRIPTION_PLANS.find(p=>p.id===s.plan_id);
      return `
      <div class="resv-item admin" onclick="goSubscribe()">
        <div class="resv-item-body">
          <div class="resv-item-top">
            <span class="resv-name">${escapeHtml(plan?plan.name:'구독 플랜')}</span>
          </div>
          <div class="resv-loc">고객 ID: ${escapeHtml(s.user_id.slice(0,8))}</div>
          <div class="resv-status-badge pending">🔔 새 구독 신청</div>
        </div>
      </div>`;
    }).join('');
  }

  if(newVehs.length){
    html += `<div class="notif-section-title">🚙 고객 차량 등록</div>`;
    html += newVehs.map(v=>`
      <div class="resv-item admin" onclick="goVehicleDetail('${v.id}')">
        <div class="resv-item-body">
          <div class="resv-item-top">
            <span class="resv-name">${escapeHtml(v.car_num||'차량번호 미입력')}</span>
            ${v.car_model?`<span class="resv-car">${escapeHtml(v.car_model)}</span>`:''}
          </div>
          <div class="resv-status-badge pending">🔔 새 차량 등록</div>
        </div>
      </div>`).join('');
  }

  if(pendingInq.length){
    html += `<div class="notif-section-title">✉️ 고객 문의</div>`;
    html += pendingInq.map(q=>`
      <div class="resv-item admin" onclick="goInquiryDetail('${q.id}')">
        <div class="resv-item-body">
          <div class="resv-item-top">
            <span class="resv-name">${escapeHtml(q.title)}</span>
          </div>
          <div class="resv-status-badge pending">🔔 새 문의</div>
        </div>
      </div>`).join('');
  }

  el.innerHTML = html;
}

function goStory(){ showPage('pg-story'); }
function goFaq(){ showPage('pg-faq'); }
function goFaqOrInquiries(){
  if(isAdmin) goInquiries(); else goFaq();
}

async function goBooking(){
  showPage('pg-booking');
  if(calViewYear===undefined){
    const n=new Date();
    calViewYear = n.getFullYear();
    calViewMonth = n.getMonth();
    calSelectedDate = todayKey();
  }
  if(!isAdmin) calSelectedDate = null;
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

// OAuth 콜백 리다이렉트에 에러가 담겨 돌아온 경우 화면에 노출 (기존엔 조용히 무시되어 원인 파악 불가)
(function(){
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const errDesc = hashParams.get('error_description') || searchParams.get('error_description')
    || hashParams.get('error') || searchParams.get('error');
  if(errDesc){
    console.error('OAuth callback error:', errDesc);
    alert('카카오 로그인 실패: ' + decodeURIComponent(errDesc));
  }
})();

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

// TODO: 임시 테스트용 고객 로그인 - 실제 서비스 오픈 전 제거할 것
async function testCustomerLogin(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  const {error} = await supabase.auth.signInWithPassword({email:'testcustomer@example.com', password:'test1234!'});
  if(error) showToast('테스트 로그인 실패: '+error.message);
}

function renderLoginBar(){
  const nameLabel = isAdmin ? '관리자' : kakaoNickname(currentUser);
  const html = currentUser
    ? `<div class="resv-user-bar">
        <div class="resv-user-name">안녕하세요, <em>${escapeHtml(nameLabel)}</em>님</div>
        <button class="resv-logout-btn" onclick="kakaoLogout()">로그아웃</button>
      </div>`
    : `<button class="kakao-login-btn" onclick="kakaoLogin()">카카오 1초 로그인</button>
       <button class="kakao-login-btn" style="margin-top:8px;background:var(--bg);color:var(--muted);border:1px solid var(--border);" onclick="testCustomerLogin()">(임시) 테스트 고객으로 입장</button>`;
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
    await refreshAdminAlerts();
    if(document.getElementById('pg-home').classList.contains('on')) renderHomeQuickGrid();
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
    if(document.getElementById('pg-inquiries').classList.contains('on')){
      await fetchInquiries();
      renderInquiries();
    }
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
    done: !!r.done, status: r.status || 'pending',
    syncedVehicleId: r.synced_vehicle_id || null, userId: r.user_id || null,
    createdAt: r.created_at || null
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
      if(document.getElementById('pg-home').classList.contains('on')) renderHomeQuickGrid();
      if(document.getElementById('pg-notifications').classList.contains('on')) renderNotifications();
    })
    .subscribe();

  supabase
    .channel('inquiries-changes')
    .on('postgres_changes', {event:'*', schema:'public', table:'inquiries'}, async ()=>{
      await fetchInquiries();
      if(document.getElementById('pg-inquiries').classList.contains('on')) renderInquiries();
      if(document.getElementById('pg-home').classList.contains('on')) renderHomeQuickGrid();
      if(document.getElementById('pg-notifications').classList.contains('on')) renderNotifications();
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

  document.getElementById('resv-add-btn').style.display = 'none';

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
    const dow = new Date(calViewYear, calViewMonth, d).getDay();
    const isClosed = !isAdmin && (dow===5 || dow===6);
    cells += isClosed
      ? `<div class="resv-day disabled${isToday?' today':''}">
          <div class="rd-num">${d}</div>
        </div>`
      : `<div class="resv-day${isToday?' today':''}${isSelected?' selected':''}" onclick="${isAdmin?`goResvDay('${dateKey}')`:`selectCalDate('${dateKey}')`}">
          <div class="rd-num">${d}</div>
          ${isAdmin && count>0?`<div class="rd-dot">${count>9?'9+':count}</div>`:''}
        </div>`;
  }
  document.getElementById('resv-cal-grid').innerHTML = cells;

  renderSlotPanel();
  renderReservationList();
}

const BOOKING_SLOTS = ['21:00','21:30','22:00','22:30','23:00','23:30','00:00','00:30','01:00','01:30'];

function renderSlotPanel(){
  const panel = document.getElementById('resv-slot-panel');
  if(isAdmin){ panel.style.display = 'none'; return; }
  panel.style.display = '';

  if(!calSelectedDate){
    document.getElementById('resv-slot-title').textContent = '날짜를 선택해주세요';
    document.getElementById('resv-slot-grid').innerHTML = '';
    return;
  }

  const [y,m,d] = calSelectedDate.split('-').map(Number);
  const dayNames=['일','월','화','수','목','금','토'];
  const dow = new Date(y, m-1, d).getDay();
  document.getElementById('resv-slot-title').textContent = `${m}/${d}(${dayNames[dow]}) 예약 가능 시간`;

  const grid = document.getElementById('resv-slot-grid');
  if(dow===5 || dow===6){
    grid.innerHTML = `<div class="resv-slot-btn closed-day">금요일과 토요일은 예약이 불가합니다</div>`;
    return;
  }

  const takenTimes = new Set(
    RESERVATIONS.filter(r=>r.date===calSelectedDate && r.status!=='rejected').map(r=>r.time)
  );

  grid.innerHTML = BOOKING_SLOTS.map(t=>{
    const taken = takenTimes.has(t);
    return taken
      ? `<button class="resv-slot-btn taken" disabled>${t}</button>`
      : `<button class="resv-slot-btn" onclick="selectBookingSlot('${t}')">${t}</button>`;
  }).join('');
}

function selectBookingSlot(time){
  _preselectedTime = time;
  openReservationModal();
}

function goResvDay(dateKey){
  if(!isAdmin) return;
  calSelectedDate = dateKey;
  showPage('pg-resv-day');
  renderResvDay();
}

function renderResvDay(){
  const dayNames=['일','월','화','수','목','금','토'];
  const [y,m,d] = calSelectedDate.split('-').map(Number);
  const dow = dayNames[new Date(y, m-1, d).getDay()];
  document.getElementById('resv-day-title').textContent = `${m}/${d}(${dow}) 예약`;

  const items = RESERVATIONS.filter(r=>r.date===calSelectedDate)
    .sort((a,b)=> (a.time||'').localeCompare(b.time||''));

  const el = document.getElementById('resv-day-list');
  if(!items.length){
    el.innerHTML = `<div class="resv-empty">📅 이 날짜에 예약이 없습니다</div>`;
    return;
  }

  el.innerHTML = items.map(r=>`
    <div class="resv-item admin ${r.status}" onclick="goResvDetail('${r.id}')">
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
    </div>`).join('');
}

function selectCalDate(dateKey){
  calSelectedDate = dateKey;
  renderCalendar();
}

function renderReservationList(){
  const dayNames=['일','월','화','수','목','금','토'];
  const el = document.getElementById('resv-list');

  document.getElementById('resv-list-section').style.display = isAdmin ? 'none' : '';
  if(isAdmin) return;

  document.getElementById('resv-list-title').textContent = '내가 신청한 예약';
  const items = RESERVATIONS.filter(r=>r.userId===currentUser.id)
    .sort((a,b)=> a.date===b.date ? (a.time||'').localeCompare(b.time||'') : a.date.localeCompare(b.date));
  if(!items.length){
    el.innerHTML = `<div class="resv-empty">📅 신청한 예약이 없습니다</div>`;
    return;
  }

  el.innerHTML = items.map(r=>`
    <div class="resv-item" onclick="goResvDetail('${r.id}')" style="cursor:pointer;">
      <div class="resv-item-body">
        <div class="resv-item-top">
          <span class="resv-time">${(()=>{const [ry,rm,rd]=r.date.split('-').map(Number); return `${rm}/${rd}(${dayNames[new Date(ry,rm-1,rd).getDay()]})`;})()}${r.time?' '+escapeHtml(r.time):''}</span>
          <span class="resv-name">${escapeHtml(r.name)}</span>
          ${r.carNum?`<span class="resv-car">${escapeHtml(r.carNum)}${r.carModel?' · '+escapeHtml(r.carModel):''}</span>`:''}
        </div>
        ${r.loc?`<div class="resv-loc">📍 ${escapeHtml(r.loc)}</div>`:''}
        ${r.phone?`<div class="resv-phone">📞 ${escapeHtml(r.phone)}</div>`:''}
        ${r.note?`<div class="resv-note">${escapeHtml(r.note)}</div>`:''}
      </div>
    </div>`).join('');
}

let _resvDetailId = null;
function goResvDetail(id){
  _resvDetailId = id;
  showPage('pg-resv-detail');
  renderResvDetail();
}

function renderResvDetail(){
  const panel = document.getElementById('resv-detail-panel');
  const r = RESERVATIONS.find(x=>x.id===_resvDetailId);
  if(!r){ panel.innerHTML = `<div class="resv-empty">예약을 찾을 수 없습니다</div>`; return; }

  const dayNames=['일','월','화','수','목','금','토'];
  const [y,m,d] = r.date.split('-').map(Number);
  const dow = dayNames[new Date(y, m-1, d).getDay()];

  panel.innerHTML = `
    <div class="veh-record-card">
      <div class="veh-card-num">${escapeHtml(r.name)}</div>
      <div class="veh-card-model">${m}/${d}(${dow})${r.time?' · '+escapeHtml(r.time):''}</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
        ${r.carNum?`<div class="veh-card-note">🚗 ${escapeHtml(r.carNum)}${r.carModel?' · '+escapeHtml(r.carModel):''}</div>`:''}
        ${r.phone?`<div class="veh-card-note">📞 ${escapeHtml(r.phone)}</div>`:''}
        ${r.loc?`<div class="veh-card-note">📍 ${escapeHtml(r.loc)}</div>`:''}
        ${r.note?`<div class="veh-card-note">📝 ${escapeHtml(r.note)}</div>`:''}
      </div>
      ${isAdmin ? `
      <div class="resv-status-badge accepted" style="margin-top:14px;">💳 결제완료</div>` : `
      <div class="resv-detail-actions">
        <button class="resv-accept-btn" onclick="openReservationModal('${r.id}')">예약 수정하기</button>
        <button class="resv-reject-btn active" onclick="cancelMyReservation('${r.id}')">결제 취소하기</button>
      </div>`}
    </div>`;
}

async function cancelMyReservation(id){
  if(!supabase || !currentUser) return;
  const r = RESERVATIONS.find(x=>x.id===id);
  if(!r) return;

  if(r.syncedVehicleId) await supabase.from('vehicles').delete().eq('id', r.syncedVehicleId);
  const {error} = await supabase.from('reservations').delete().eq('id', id);
  if(error){ showToast('취소 실패: '+error.message); return; }

  await fetchReservations();
  showToast('🗑️ 예약이 취소되었습니다');
  goBooking();
}


let _resvEditId = null;
let _preselectedTime = null;

function openReservationModal(id){
  _resvEditId = id || null;
  const r = id ? RESERVATIONS.find(x=>x.id===id) : null;

  document.getElementById('resv-modal-title').textContent = id ? '예약 수정' : '예약 추가';
  const date = r ? r.date : calSelectedDate;
  const time = r ? (r.time||'') : (_preselectedTime||'');
  document.getElementById('rv-date').value      = date;
  document.getElementById('rv-time').value      = time;
  document.getElementById('rv-name').value      = r ? r.name : (currentUser ? kakaoNickname(currentUser) : '');
  document.getElementById('rv-phone').value     = r ? (r.phone||'') : '';
  document.getElementById('rv-car-num').value   = r ? (r.carNum||'') : '';
  document.getElementById('rv-car-model').value = r ? (r.carModel||'') : '';
  document.getElementById('rv-loc').value       = r ? (r.loc||'') : '';
  document.getElementById('rv-note').value      = r ? (r.note||'') : '';
  _preselectedTime = null;

  document.getElementById('rv-save-btn').textContent = (!id && !isAdmin) ? '결제하기' : '저장';

  const fieldsEl = document.getElementById('rv-datetime-fields');
  const summaryEl = document.getElementById('rv-datetime-summary');
  if(isAdmin){
    fieldsEl.style.display = '';
    summaryEl.style.display = 'none';
  } else {
    fieldsEl.style.display = 'none';
    summaryEl.style.display = '';
    const dayNames=['일','월','화','수','목','금','토'];
    const [y,m,d] = date.split('-').map(Number);
    const dow = dayNames[new Date(y, m-1, d).getDay()];
    document.getElementById('rv-datetime-readonly-text').textContent = time
      ? `${m}월 ${d}일(${dow}) ${time}`
      : `${m}월 ${d}일(${dow})`;
  }

  showPage('pg-resv-form');
}
function closeReservationModal(){
  showPage('pg-booking');
  _resvEditId = null;
  _preselectedTime = null;
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

  // 신규 고객 예약(=결제하기)인 경우: 토스페이먼츠 연동 지점
  // 추후 연동 시 이 위치에서 결제(requestPayment 등)를 먼저 진행하고,
  // 결제 성공 콜백 안에서 아래 예약 저장 로직(payload 구성 ~ insert)을 실행하도록 옮기면 됩니다.
  // 결제 실패/취소 시에는 아래 저장 로직을 실행하지 않고 return 하면 됩니다.
  // 지금은 결제 연동 전이라 결제 없이 바로 예약을 저장합니다.
  if(!_resvEditId && !isAdmin){
    // TODO: await requestReservationPayment({date, time, name, phone, carNum, carModel, loc, note});
  }

  const payload = {
    date, time: time || null, name, phone: phone || null,
    car_num: carNum || null, car_model: carModel || null,
    loc: loc || null, note: note || null
  };
  const isNewCustomerBooking = !_resvEditId && !isAdmin;
  if(!_resvEditId){
    payload.user_id = currentUser ? currentUser.id : null;
    if(isNewCustomerBooking) payload.status = 'accepted';
  }

  let error, newReservation;
  if(_resvEditId){
    ({error} = await supabase.from('reservations').update(payload).eq('id', _resvEditId));
  } else {
    const {data, error: insErr} = await supabase.from('reservations').insert(payload).select().single();
    error = insErr;
    newReservation = data;
  }
  if(error){ showToast('저장 실패: '+error.message); return; }

  // 결제 완료된 신규 예약은 관리자 "고객차량 관리" 캘린더에 일회성 항목으로 자동 연동됩니다.
  if(isNewCustomerBooking && newReservation){
    const eventDate = new Date(date+'T12:00:00.000Z').toISOString();
    const {data: newVeh, error: vErr} = await supabase.from('vehicles').insert({
      user_id: currentUser.id, car_num: carNum || null, car_model: carModel || null,
      parking_loc: loc || null, payment_plan: '일회성', note: note || null, created_at: eventDate
    }).select().single();
    if(!vErr && newVeh){
      await supabase.from('reservations').update({synced_vehicle_id: newVeh.id}).eq('id', newReservation.id);
    }
    await fetchVehicles();
  }

  await fetchReservations();
  closeReservationModal();
  calSelectedDate = date;
  renderCalendar();
  showToast(_resvEditId?'✏️ 예약이 수정되었습니다':'✅ 예약이 등록되었습니다');
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

let vehCalViewYear, vehCalViewMonth, vehCalSelectedDate;

function vehDateKey(v){
  const d = new Date(v.created_at);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function vehCalShiftMonth(delta){
  vehCalViewMonth += delta;
  if(vehCalViewMonth<0){ vehCalViewMonth=11; vehCalViewYear--; }
  if(vehCalViewMonth>11){ vehCalViewMonth=0; vehCalViewYear++; }
  renderVehicles();
}

function goVehDay(dateKey){
  vehCalSelectedDate = dateKey;
  showPage('pg-veh-day');
  renderVehDayList();
}

function vehCardHtml(v){
  return `
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
    </div>`;
}

function renderVehDayList(){
  const [y,m,d] = vehCalSelectedDate.split('-').map(Number);
  const dayNames=['일','월','화','수','목','금','토'];
  const dow = dayNames[new Date(y, m-1, d).getDay()];
  document.getElementById('veh-day-title').textContent = `${m}/${d}(${dow}) 등록 차량`;

  const list = VEHICLES.filter(v=>vehDateKey(v)===vehCalSelectedDate);
  const el = document.getElementById('veh-day-list');
  el.innerHTML = list.length
    ? list.map(vehCardHtml).join('')
    : `<div class="resv-empty">🚗 이 날짜에 등록된 차량이 없습니다</div>`;
}

function renderVehicles(){
  const guestMsg = document.getElementById('veh-guest-msg');
  const main = document.getElementById('veh-main');
  const addBtn = document.getElementById('veh-add-btn');
  const searchEl = document.getElementById('veh-search');
  const staticHeader = document.getElementById('veh-static-list-header');
  if(!guestMsg || !main) return;

  document.getElementById('veh-page-title').textContent = isAdmin ? '고객차량 관리' : '내 차량 확인';

  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';

  addBtn.style.display = isAdmin ? 'none' : '';
  searchEl.style.display = isAdmin ? '' : 'none';
  staticHeader.style.display = isAdmin ? 'none' : '';

  document.querySelectorAll('.veh-cal-only').forEach(el=>{ el.style.display = isAdmin ? '' : 'none'; });

  if(isAdmin){
    if(vehCalViewYear===undefined){
      const n = new Date();
      vehCalViewYear = n.getFullYear();
      vehCalViewMonth = n.getMonth();
      vehCalSelectedDate = todayKey();
    }

    document.getElementById('veh-cal-title').textContent = `${vehCalViewYear}년 ${vehCalViewMonth+1}월`;
    const firstDay = new Date(vehCalViewYear, vehCalViewMonth, 1).getDay();
    const daysInMonth = new Date(vehCalViewYear, vehCalViewMonth+1, 0).getDate();
    const tKey = todayKey();
    const countMap = {};
    VEHICLES.forEach(v=>{ const k=vehDateKey(v); countMap[k]=(countMap[k]||0)+1; });

    let cells = '';
    for(let i=0;i<firstDay;i++) cells += `<div class="resv-day empty"></div>`;
    for(let d=1; d<=daysInMonth; d++){
      const dateKey = toDateKey(vehCalViewYear, vehCalViewMonth, d);
      const count = countMap[dateKey] || 0;
      const isToday = dateKey===tKey;
      cells += `
        <div class="resv-day${isToday?' today':''}" onclick="goVehDay('${dateKey}')">
          <div class="rd-num">${d}</div>
          ${count>0?`<div class="rd-dot">${count>9?'9+':count}</div>`:''}
        </div>`;
    }
    document.getElementById('veh-cal-grid').innerHTML = cells;
  }

  const el = document.getElementById('veh-list');
  const q = isAdmin ? (searchEl.value||'').trim().toLowerCase() : '';

  if(isAdmin && !q){
    el.innerHTML = '';
    return;
  }

  let list = VEHICLES;
  if(!isAdmin) list = list.filter(v => !v.payment_plan); // 관리자 자동 연동 항목은 고객 목록에서 숨김
  if(q) list = list.filter(v => (v.car_num||'').toLowerCase().includes(q));

  if(!list.length){
    const emptyMsg = isAdmin ? '검색된 차량이 없습니다' : '등록된 차량이 없습니다';
    el.innerHTML = `<div class="resv-empty">🚗 ${emptyMsg}</div>`;
    return;
  }

  el.innerHTML = list.map(vehCardHtml).join('');
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

let APARTMENT_COMPLEXES = [];

async function fetchApartmentComplexes(){
  if(!supabase){ APARTMENT_COMPLEXES = []; return; }
  const {data, error} = await supabase.from('apartment_complexes').select('*').order('name');
  if(error){ APARTMENT_COMPLEXES = []; return; }
  APARTMENT_COMPLEXES = data || [];
}

function renderAptOptions(){
  const sel = document.getElementById('veh-parking-loc');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">선택하세요</option>' +
    APARTMENT_COMPLEXES.map(a=>`<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('');
  sel.value = current;
}

function openAptModal(){
  document.getElementById('apt-name').value = '';
  document.getElementById('apt-modal').classList.add('on');
}
function closeAptModal(){
  document.getElementById('apt-modal').classList.remove('on');
}
async function saveApartmentComplex(){
  if(!supabase || !isAdmin) return;
  const name = document.getElementById('apt-name').value.trim();
  if(!name){ showRequiredModal('단지명'); return; }
  if(!validateInputs(name)){ showBadwordModal(); return; }

  const {error} = await supabase.from('apartment_complexes').insert({name});
  if(error){ showToast('저장 실패: '+error.message); return; }

  await fetchApartmentComplexes();
  renderAptOptions();
  closeAptModal();
  showToast('✅ 아파트 단지가 등록되었습니다');
}

let _vehEditId = null;
async function openVehicleModal(id){
  _vehEditId = id || null;
  const v = id ? VEHICLES.find(x=>x.id===id) : null;

  document.getElementById('veh-modal-title').textContent = id ? '차량 정보 수정' : '차량 등록';
  document.getElementById('veh-car-num').value = v ? (v.car_num||'') : '';
  document.getElementById('veh-form-delete-wrap').style.display = id ? '' : 'none';

  document.querySelectorAll('.veh-admin-only').forEach(el=>{ el.style.display = isAdmin ? '' : 'none'; });
  if(isAdmin) await fetchApartmentComplexes();
  renderAptOptions();
  document.getElementById('veh-parking-loc').value = v ? (v.parking_loc||'') : '';
  document.getElementById('veh-payment-plan').value = v ? (v.payment_plan||'') : '';
  document.getElementById('veh-note').value = v ? (v.note||'') : '';

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
  _confirmingSubscriptionId = null;
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

  const parkingLoc = document.getElementById('veh-parking-loc').value.trim();
  const paymentPlan = document.getElementById('veh-payment-plan').value;
  const note = document.getElementById('veh-note').value.trim();

  if(!carNum){ showRequiredModal('차량 번호'); return; }
  if(!validateInputs(carNum, carModel, parkingLoc, note)){ showBadwordModal(); return; }

  const payload = { car_num: carNum, car_model: carModel || null };
  if(isAdmin){
    payload.parking_loc = parkingLoc || null;
    payload.payment_plan = paymentPlan || null;
    payload.note = note || null;
  }

  let error, insertedId;
  if(_vehEditId){
    ({error} = await supabase.from('vehicles').update(payload).eq('id', _vehEditId));
  } else {
    const {data, error: insErr} = await supabase.from('vehicles').insert({...payload, user_id: currentUser.id}).select().single();
    error = insErr;
    insertedId = data ? data.id : null;
  }
  if(error){ showToast('저장 실패: '+error.message); return; }

  await fetchVehicles();
  closeVehicleModal();
  showToast(_vehEditId?'✏️ 차량 정보가 수정되었습니다':'✅ 차량이 등록되었습니다');

  if(insertedId && _confirmingSubscriptionId){
    const subId = _confirmingSubscriptionId;
    _confirmingSubscriptionId = null;
    const {error: sErr} = await supabase.from('subscriptions').update({synced_vehicle_id: insertedId}).eq('id', subId);
    if(!sErr){
      await fetchAllSubscriptions();
      if(document.getElementById('pg-subscribe').classList.contains('on')) renderSubscribePage();
      showToast('✅ 캘린더에 연동되었습니다');
    }
  }
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

  const infoPanel = document.getElementById('vdetail-info-panel');
  if(v && isAdmin && (v.car_model || v.parking_loc || v.payment_plan || v.note)){
    infoPanel.innerHTML = `
      <div class="veh-record-card">
        ${v.car_model?`<div class="veh-card-note">🚘 ${escapeHtml(v.car_model)}</div>`:''}
        ${v.parking_loc?`<div class="veh-card-note">📍 ${escapeHtml(v.parking_loc)}</div>`:''}
        ${v.payment_plan?`<div class="veh-card-note">💳 ${escapeHtml(v.payment_plan)}</div>`:''}
        ${v.note?`<div class="veh-card-note">📝 ${escapeHtml(v.note)}</div>`:''}
      </div>`;
  } else {
    infoPanel.innerHTML = '';
  }

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

let ALL_SUBSCRIPTIONS = [];

async function goSubscribe(){
  showPage('pg-subscribe');
  document.getElementById('sub-page-title').textContent = isAdmin ? '구독결제 신청자' : '구독결제신청';
  await fetchSubscribePlans();
  if(isAdmin){
    await fetchAllSubscriptions();
  } else {
    await fetchMySubscription();
  }
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

async function fetchAllSubscriptions(){
  ALL_SUBSCRIPTIONS = [];
  if(!supabase) return;
  const {data, error} = await supabase.from('subscriptions_public')
    .select('*').order('created_at', {ascending:false});
  if(error){ showToast('구독 목록 불러오기 실패: '+error.message); return; }
  ALL_SUBSCRIPTIONS = data || [];
}

let _confirmingSubscriptionId = null;

async function confirmSubscription(id){
  if(!supabase || !isAdmin) return;
  const sub = ALL_SUBSCRIPTIONS.find(s=>s.id===id);
  if(!sub) return;

  const custVehicles = VEHICLES.filter(v=>v.user_id===sub.user_id);
  if(custVehicles.length === 1){
    await syncVehicleForSubscription(sub, custVehicles[0]);
    return;
  }

  _confirmingSubscriptionId = id;
  await openVehicleModal();
  const plan = SUBSCRIPTION_PLANS.find(p=>p.id===sub.plan_id);
  document.getElementById('veh-payment-plan').value = plan ? plan.name : '';
  showToast(custVehicles.length ? '등록된 차량이 여러 대라 직접 선택해주세요' : '등록된 차량이 없어 직접 입력해주세요');
}

async function syncVehicleForSubscription(sub, v){
  const plan = SUBSCRIPTION_PLANS.find(p=>p.id===sub.plan_id);
  const {data: newVeh, error} = await supabase.from('vehicles').insert({
    user_id: currentUser.id, car_num: v.car_num || null, car_model: v.car_model || null,
    parking_loc: v.parking_loc || null, payment_plan: plan ? plan.name : null, note: v.note || null
  }).select().single();
  if(error){ showToast('처리 실패: '+error.message); return; }

  const {error: sErr} = await supabase.from('subscriptions').update({synced_vehicle_id: newVeh.id}).eq('id', sub.id);
  if(sErr){ showToast('연동 실패: '+sErr.message); return; }

  await fetchAllSubscriptions();
  await fetchVehicles();
  renderSubscribePage();
  showToast('✅ 캘린더에 연동되었습니다');
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
  const planListEl = document.getElementById('sub-plan-list');
  const applyBtn = document.getElementById('sub-apply-btn');
  const adminListEl = document.getElementById('sub-admin-list');

  if(isAdmin){
    statusEl.innerHTML = '';
    planListEl.style.display = 'none';
    applyBtn.style.display = 'none';
    adminListEl.style.display = '';

    if(!ALL_SUBSCRIPTIONS.length){
      adminListEl.innerHTML = `<div class="resv-empty">📭 구독 신청 내역이 없습니다</div>`;
      return;
    }
    const statusLabels = {active:'활성', pending:'대기', past_due:'연체', canceled:'해지'};
    adminListEl.innerHTML = ALL_SUBSCRIPTIONS.map(s=>{
      const plan = SUBSCRIPTION_PLANS.find(p=>p.id===s.plan_id);
      return `
      <div class="veh-card">
        <div class="veh-card-top">
          <div class="veh-card-info">
            <div class="veh-card-num">${escapeHtml(plan?plan.name:'플랜 정보 없음')}</div>
            <div class="veh-card-model">고객 ID: ${s.user_id.slice(0,8)}</div>
          </div>
          <div class="veh-status-badge${s.status==='active'?' done':''}">${statusLabels[s.status]||s.status}</div>
        </div>
        ${s.next_billing_date?`<div class="veh-card-note">다음 결제일: ${s.next_billing_date}</div>`:''}
        ${s.status==='active' ? `
        <div class="veh-record-actions" style="justify-content:space-between;align-items:center;">
          <div class="veh-card-note">💳 결제완료</div>
          ${s.synced_vehicle_id
            ? `<div class="resv-status-badge accepted">✅ 캘린더 연동됨</div>`
            : `<button class="resv-save-btn" onclick="confirmSubscription('${s.id}')">확인</button>`}
        </div>` : ''}
      </div>`;
    }).join('');
    return;
  }

  planListEl.style.display = '';
  adminListEl.style.display = 'none';

  if(CURRENT_SUBSCRIPTION && CURRENT_SUBSCRIPTION.status === 'active'){
    const plan = SUBSCRIPTION_PLANS.find(p=>p.id===CURRENT_SUBSCRIPTION.plan_id);
    statusEl.innerHTML = `<div class="sub-status-active">✅ 현재 구독 중: ${plan?escapeHtml(plan.name):'구독 플랜'}${CURRENT_SUBSCRIPTION.next_billing_date?` (다음 결제일 ${CURRENT_SUBSCRIPTION.next_billing_date})`:''}</div>`;
    applyBtn.style.display = 'none';
  } else {
    statusEl.innerHTML = '';
    applyBtn.style.display = '';
  }

  if(!_selectedPlanId && SUBSCRIPTION_PLANS.length) _selectedPlanId = SUBSCRIPTION_PLANS[0].id;

  planListEl.innerHTML = SUBSCRIPTION_PLANS.map(p=>`
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

/* ════════════════════════════════════
   고객 문의
════════════════════════════════════ */
let INQUIRIES = [];
let _inqDetailId = null;

async function goInquiries(){
  showPage('pg-inquiries');
  document.getElementById('inq-page-title').textContent = isAdmin ? '고객 문의' : '문의하기';
  await fetchInquiries();
  renderInquiries();
}

async function fetchInquiries(){
  INQUIRIES = [];
  if(!supabase || !currentUser) return;
  const {data, error} = await supabase.from('inquiries').select('*').order('created_at', {ascending:false});
  if(error){ showToast('문의 목록 불러오기 실패: '+error.message); return; }
  INQUIRIES = data || [];
  if(isAdmin){
    INQUIRIES.sort((a,b)=> (a.status==='pending'?0:1) - (b.status==='pending'?0:1));
  }
}

function renderInquiries(){
  const guestMsg = document.getElementById('inq-guest-msg');
  const main = document.getElementById('inq-main');
  const addBtn = document.getElementById('inq-add-btn');
  const listTitle = document.getElementById('inq-list-title');
  if(!guestMsg || !main) return;

  if(!currentUser){
    guestMsg.style.display = '';
    main.style.display = 'none';
    return;
  }
  guestMsg.style.display = 'none';
  main.style.display = '';

  addBtn.style.display = isAdmin ? 'none' : '';
  listTitle.textContent = isAdmin ? '전체 문의' : '내 문의 내역';

  const el = document.getElementById('inq-list');
  if(!INQUIRIES.length){
    el.innerHTML = `<div class="resv-empty">✉️ ${isAdmin?'접수된 문의가 없습니다':'작성한 문의가 없습니다'}</div>`;
    return;
  }

  el.innerHTML = INQUIRIES.map(q=>`
    <div class="veh-card veh-card-clickable" onclick="goInquiryDetail('${q.id}')">
      <div class="veh-card-top">
        <div class="veh-card-info">
          <div class="veh-card-num">${escapeHtml(q.title)}</div>
          <div class="veh-card-model">${new Date(q.created_at).toLocaleDateString('ko-KR')}${isAdmin?` · 고객 ${q.user_id.slice(0,8)}`:''}</div>
        </div>
        <div class="veh-status-badge${q.status==='answered'?' done':''}">${q.status==='answered'?'답변완료':'미답변'}</div>
      </div>
    </div>`).join('');
}

function goInquiryForm(){
  document.getElementById('inq-title').value = '';
  document.getElementById('inq-content').value = '';
  showPage('pg-inquiry-form');
}

async function saveInquiry(){
  if(!supabase){ showToast('연결 오류: 새로고침 후 다시 시도해주세요'); return; }
  if(!currentUser){ showToast('로그인이 필요합니다'); return; }

  const title = document.getElementById('inq-title').value.trim();
  const content = document.getElementById('inq-content').value.trim();
  if(!title || !content){ showRequiredModal('제목/내용'); return; }
  if(!validateInputs(title, content)){ showBadwordModal(); return; }

  const {error} = await supabase.from('inquiries').insert({user_id: currentUser.id, title, content});
  if(error){ showToast('등록 실패: '+error.message); return; }

  await fetchInquiries();
  showPage('pg-inquiries');
  renderInquiries();
  showToast('✅ 문의가 등록되었습니다');
}

async function goInquiryDetail(id){
  _inqDetailId = id;
  showPage('pg-inquiry-detail');
  renderInquiryDetail();
}

function renderInquiryDetail(){
  const el = document.getElementById('inq-detail-panel');
  const q = INQUIRIES.find(x=>x.id===_inqDetailId);
  if(!q){ el.innerHTML = `<div class="resv-empty">문의를 찾을 수 없습니다</div>`; return; }

  const dateLabel = new Date(q.created_at).toLocaleDateString('ko-KR');

  if(isAdmin){
    el.innerHTML = `
      <div class="veh-record-card">
        <div class="veh-card-num">${escapeHtml(q.title)}</div>
        <div class="veh-card-model" style="margin-bottom:10px;">${dateLabel} · 고객 ${q.user_id.slice(0,8)}</div>
        <div class="veh-card-note">${escapeHtml(q.content)}</div>
        <label class="mg-label" style="margin-top:16px;">답변</label>
        <textarea class="mg-input veh-record-note" id="inq-reply" placeholder="답변을 입력하세요">${q.admin_reply?escapeHtml(q.admin_reply):''}</textarea>
        <div class="veh-record-actions">
          <button class="resv-save-btn" onclick="saveInquiryReply()">${q.status==='answered'?'답변 수정':'답변 등록'}</button>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="veh-record-card">
        <div class="veh-card-num">${escapeHtml(q.title)}</div>
        <div class="veh-card-model" style="margin-bottom:10px;">${dateLabel} · ${q.status==='answered'?'답변완료':'미답변'}</div>
        <div class="veh-card-note">${escapeHtml(q.content)}</div>
        ${q.admin_reply?`
        <label class="mg-label" style="margin-top:16px;">답변</label>
        <div class="veh-card-note">${escapeHtml(q.admin_reply)}</div>
        `:`<div class="resv-empty" style="margin-top:16px;">아직 답변이 등록되지 않았습니다</div>`}
      </div>`;
  }
}

async function saveInquiryReply(){
  if(!supabase || !isAdmin || !_inqDetailId) return;
  const reply = document.getElementById('inq-reply').value.trim();
  if(!reply){ showRequiredModal('답변 내용'); return; }
  if(!validateInputs(reply)){ showBadwordModal(); return; }

  const {error} = await supabase.from('inquiries')
    .update({admin_reply: reply, status:'answered', replied_at: new Date().toISOString()})
    .eq('id', _inqDetailId);
  if(error){ showToast('저장 실패: '+error.message); return; }

  await fetchInquiries();
  renderInquiryDetail();
  showToast('✅ 답변이 등록되었습니다');
}

// 인라인 onclick="..." 핸들러(HTML)에서 접근할 수 있도록 전역(window)에 노출
Object.assign(window, {
  adminLogin, applySubscription, askVehicleDelete, calShiftMonth, cancelMyReservation,
  closeAdminLoginModal, closeAptModal, closeBadwordModal, closeRequiredModal, closeReservationModal,
  closeVehicleDeleteModal, closeVehicleModal, confirmSubscription,
  confirmVehicleDelete, deleteVehicleFromForm, deleteWashRecord, deleteWashRecordPhoto,
  goBooking, goFaq, goFaqOrInquiries, goHome, goInquiries, goInquiryDetail, goInquiryForm,
  goMenu, goNotifications, goResvDay, goResvDetail, goStory, goSubscribe, goVehDay, goVehicleDetail, goVehicles, handleWashRecordPhotoInput,
  kakaoLogin, kakaoLogout, onVehBrandChange, onVehModelChange, openAdminLoginModal, openAptModal,
  openReservationModal, openVehicleModal, saveApartmentComplex, saveInquiry, saveInquiryReply, saveReservation,
  saveVehicle, saveWashRecord, selectBookingSlot, selectCalDate, selectSubscribePlan, showToast, testCustomerLogin, toggleFaqItem,
  toggleNotifCategory, updateVehBrandOptions, updateVehModelOptions, vdetailSelectDate, vdetailShiftMonth,
  vehCalShiftMonth
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
