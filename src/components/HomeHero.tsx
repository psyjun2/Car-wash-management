import { HeroGuestCta } from "@/components/HeroGuestCta";
import { daysUntil } from "@/lib/dateKey";

const MONTHLY_LIMIT = 50;

export type UpcomingReservation = {
  date: string;
  time: string | null;
  car_num: string | null;
  car_model: string | null;
};

export type SubscriptionUsage = {
  used: number;
  quota: number;
};

type Props = {
  isAdmin: boolean;
  isLoggedIn: boolean;
  upcomingReservation: UpcomingReservation | null;
  subscriptionUsage: SubscriptionUsage | null;
};

export function HomeHero({ isAdmin, isLoggedIn, upcomingReservation, subscriptionUsage }: Props) {
  if (isAdmin) {
    return (
      <div className="home-hero hero-status">
        <div className="hero-status-label">관리자로 로그인됨</div>
        <div className="hero-status-grid">
          <div className="hero-status-row">예약 · 구독 · 차량 현황은 우측 상단 알림에서 확인하세요</div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="home-hero hero-guest">
        <div className="hero-tag">★ 예약제 진행</div>
        <div className="hero-guest-title">
          프리미엄 출장세차,
          <br />월 {MONTHLY_LIMIT}대만 관리합니다.
        </div>
        <div className="hero-guest-sub">카카오 1초 로그인하고 바로 예약하세요</div>
        <HeroGuestCta />
      </div>
    );
  }

  if (upcomingReservation) {
    const dday = daysUntil(upcomingReservation.date);
    return (
      <div className="home-hero hero-status hero-next">
        <div className="hero-status-label">다음 세차 예약</div>
        <div className="hero-dday-row">
          <span className="hero-dday tnum">{dday === 0 ? "D-DAY" : `D-${dday}`}</span>
          {upcomingReservation.time && <span className="hero-dday-time tnum">{upcomingReservation.time}</span>}
        </div>
        <div className="hero-status-grid">
          <div className="hero-status-row">
            담당 <strong>출세했다 전담팀</strong>
          </div>
          {upcomingReservation.car_num && (
            <div className="hero-status-row">
              차량{" "}
              <strong>
                {upcomingReservation.car_num}
                {upcomingReservation.car_model ? ` · ${upcomingReservation.car_model}` : ""}
              </strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subscriptionUsage) {
    const used = Math.min(subscriptionUsage.used, subscriptionUsage.quota);
    const pct = subscriptionUsage.quota ? Math.round((used / subscriptionUsage.quota) * 100) : 0;
    return (
      <div className="home-hero hero-status">
        <div className="hero-sub-label">이번 달 구독 이용 현황</div>
        <div className="hero-gauge-row">
          <span className="hero-gauge-count tnum">
            이번 달 진행 <em>{used}/{subscriptionUsage.quota}회</em>
          </span>
          <span className="hero-gauge-remain tnum">잔여 {subscriptionUsage.quota - used}회</span>
        </div>
        <div className="hero-gauge-track">
          <div className="hero-gauge-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="home-hero hero-guest">
      <div className="hero-tag">★ 예약제 진행</div>
      <div className="hero-guest-title">
        프리미엄 출장세차,
        <br />월 {MONTHLY_LIMIT}대만 관리합니다.
      </div>
      <div className="hero-guest-sub">지금 예약하면 바로 배정됩니다</div>
      <div className="hero-guest-cta hero-guest-cta-blue" aria-disabled="true">
        지금 예약하기
      </div>
    </div>
  );
}
