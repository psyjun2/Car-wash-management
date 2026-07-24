import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { HomeHero, type UpcomingReservation, type SubscriptionUsage } from "@/components/HomeHero";
import { getSessionInfo } from "@/lib/auth/session";
import { listReservations } from "@/lib/data/reservations";
import { getMySubscription, listActivePlans, getSubscriptionUsageCount } from "@/lib/data/subscriptions";
import { listVehicles } from "@/lib/data/vehicles";
import { daysUntil } from "@/lib/dateKey";

const QUICK_LABELS = {
  customer: { booking: "1회 세차신청", subscribe: "월 멤버십 가입", vehicle: "차량 확인" },
  admin: { booking: "1회 세차신청자", subscribe: "월 멤버십 신청자", vehicle: "고객 차량 확인" },
};

export default async function HomePage() {
  const { user, isAdmin } = await getSessionInfo();
  const labels = isAdmin ? QUICK_LABELS.admin : QUICK_LABELS.customer;

  let upcomingReservation: UpcomingReservation | null = null;
  let subscriptionUsage: SubscriptionUsage | null = null;
  let subPriceLabel = "정기구독으로 더 합리적으로";

  if (user && !isAdmin) {
    const [reservations, mySubscription, plans, vehicles] = await Promise.all([
      listReservations({ userId: user.id, isAdmin: false }),
      getMySubscription(user.id),
      listActivePlans(),
      listVehicles({ userId: user.id, isAdmin: false }),
    ]);
    // D-day / usage boxes only make sense once the customer actually has a
    // registered vehicle AND a real reservation or membership behind it —
    // a reservation/subscription row existing on its own isn't enough
    // (e.g. its synced vehicle was since deleted).
    const hasVehicle = vehicles.length > 0;

    const upcoming = hasVehicle
      ? reservations
          .filter((r) => r.user_id === user.id && r.status === "accepted" && daysUntil(r.date) >= 0)
          .sort((a, b) => (a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date)))[0]
      : undefined;
    if (upcoming) {
      upcomingReservation = { date: upcoming.date, time: upcoming.time, car_num: upcoming.car_num, car_model: upcoming.car_model };
    }

    if (mySubscription?.status === "active") {
      subPriceLabel = "구독 중 · 플랜 관리하기";
      if (hasVehicle && !upcoming && mySubscription.synced_vehicle_id) {
        const plan = plans.find((p) => p.id === mySubscription.plan_id);
        const used = await getSubscriptionUsageCount(mySubscription.synced_vehicle_id);
        subscriptionUsage = { used, quota: plan?.visits_per_month ?? 0 };
      }
    } else {
      const cheapestPlan = plans.find((p) => p.price > 0);
      if (cheapestPlan) subPriceLabel = `월 ${cheapestPlan.price.toLocaleString()}원부터`;
    }
  }

  return (
    <div className="page on" id="pg-home">
      <div className="safe-t" />
      <div className="topbar">
        <div className="tb-logo">
          오늘도 <em>출세</em>했다
        </div>
        <div className="tb-right-icons">
          {/* TODO(Phase 8): admin notification bell, once /admin/notifications exists */}
          <Link href="/menu" className="hamburger-btn" aria-label="메뉴">
            <span></span>
            <span></span>
            <span></span>
          </Link>
        </div>
      </div>
      <div className="scroll">
        <div className="home-body">
          <HomeHero
            isAdmin={isAdmin}
            isLoggedIn={!!user}
            upcomingReservation={upcomingReservation}
            subscriptionUsage={subscriptionUsage}
          />

          <div className="home-actions">
            <Link href="/booking" className="action-card action-outline">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="action-text">
                <div className="action-title">{labels.booking}</div>
                <div className="action-sub">필요할 때 바로, 지금 예약하기</div>
              </div>
              <div className="action-arrow">→</div>
            </Link>
            <Link href="/subscribe" className="action-card action-primary">
              <div className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <div className="action-text">
                <div className="action-title">{labels.subscribe}</div>
                <div className="action-sub tnum">{subPriceLabel}</div>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>

          <Link href="/vehicles" className="vehicle-card" id="home-vehicle-card">
            <div className="vc-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 17V10a1 1 0 0 1 1-1h2l2-3h6l2 3h2a1 1 0 0 1 1 1v7" />
                <path d="M2 17h20" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <div className="vc-text">
              <div className="vc-plate">{labels.vehicle}</div>
              <div className="vc-meta tnum">번호판을 등록하면 세차 이력을 관리해드려요</div>
            </div>
            <div className="vc-arrow">→</div>
          </Link>

          <Link href="/gallery" className="home-cta-banner hcb-outline">
            <div className="hcb-row">
              <div>
                <div className="hcb-title">
                  세차 <em>전후 비교</em>로 직접 확인하세요
                </div>
              </div>
              <div className="hcb-arrow">→</div>
            </div>
            <div className="hcb-thumbs">
              <div className="hcb-thumb-slot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/IMG_3592.jpg" alt="세차 완료 차량 1" loading="lazy" />
              </div>
              <div className="hcb-thumb-slot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/IMG_3593.jpg" alt="세차 완료 차량 2" loading="lazy" />
              </div>
              <div className="hcb-thumb-slot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/IMG_3594.jpg" alt="세차 완료 차량 3" loading="lazy" />
              </div>
            </div>
          </Link>

          <div className="home-footer-links">
            <Link href="/faq" className="footer-link">
              FAQ
            </Link>
            <div className="footer-link-divider" />
            <span className="footer-link">이용약관</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
