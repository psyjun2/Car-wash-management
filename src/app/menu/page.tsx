import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { LoginBar } from "@/components/LoginBar";
import { TopBarBack } from "@/components/TopBarBack";
import { getSessionInfo, kakaoNickname } from "@/lib/auth/session";

const MENU_LABELS = {
  customer: { booking: "1회 세차신청", subscribe: "월 멤버십 가입", vehicle: "내 차량 확인" },
  admin: { booking: "1회 세차신청자", subscribe: "월 멤버십 신청자", vehicle: "고객 차량 확인" },
};

export default async function MenuPage() {
  const { user, isAdmin } = await getSessionInfo();
  const labels = isAdmin ? MENU_LABELS.admin : MENU_LABELS.customer;

  return (
    <div className="page on" id="pg-menu">
      <div className="safe-t" />
      <TopBarBack title="내정보" backHref="/" />
      <div className="scroll">
        <div className="menu-body">
          {!user && (
            <div id="menu-guest-msg" className="veh-guest-msg">
              카카오 로그인해야
              <br />
              이용 가능합니다
            </div>
          )}

          <div className="login-bar-slot">
            <LoginBar nickname={user ? kakaoNickname(user) : null} isAdmin={isAdmin} />
          </div>

          {user && (
            <div id="menu-main">
              <div className="menu-group">
                <div className="menu-group-title">세차 정보</div>
                <Link href="/booking" className="menu-item">
                  <div className="menu-item-icon">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="menu-item-text">
                    <div className="mi-lbl">{labels.booking}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href="/subscribe" className="menu-item">
                  <div className="menu-item-icon">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 1l4 4-4 4" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <path d="M7 23l-4-4 4-4" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </div>
                  <div className="menu-item-text">
                    <div className="mi-lbl">{labels.subscribe}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href="/vehicles" className="menu-item">
                  <div className="menu-item-icon">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 17V10a1 1 0 0 1 1-1h2l2-3h6l2 3h2a1 1 0 0 1 1 1v7" />
                      <path d="M2 17h20" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <div className="menu-item-text">
                    <div className="mi-lbl">{labels.vehicle}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>

              <div className="menu-group">
                <div className="menu-group-title">브랜드</div>
                <Link href="/story" className="menu-item">
                  <div className="menu-item-icon">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <div className="menu-item-text">
                    <div className="mi-lbl">브랜드 스토리</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>

              <div className="menu-group">
                <div className="menu-group-title">고객지원</div>
                <Link href="/faq" className="menu-item">
                  <div className="menu-item-icon">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="menu-item-text">
                    <div className="mi-lbl">자주 묻는 질문</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>

              {isAdmin && (
                <div className="menu-group" id="menu-admin-group">
                  <div className="menu-group-title">관리자 설정</div>
                  <div className="menu-item">
                    <div className="menu-item-text">
                      <div className="mi-lbl">알림 설정 (준비 중)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
