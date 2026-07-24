import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";

const MISSIONS = [
  {
    title: "숙련된 전문가만",
    desc: "교육을 마친 전문 세차사가 직접 방문합니다",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    ),
  },
  {
    title: "내 차처럼 관리",
    desc: "매 방문마다 동일한 기준으로 꼼꼼하게 관리합니다",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "필요할 때 바로",
    desc: "원하는 날짜와 시간에 맞춰 예약할 수 있습니다",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "합리적인 가격",
    desc: "불필요한 옵션 없이 투명한 가격으로 안내합니다",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
];

export default function StoryPage() {
  return (
    <div className="page on" id="pg-story">
      <div className="safe-t" />
      <TopBarBack title="브랜드 스토리" backHref="/" />
      <div className="scroll">
        <div className="story-body">
          <div className="story-hero">
            <div className="story-logo">
              <em>출세</em>했다
            </div>
            <div className="story-hero-title">
              세차는 기술이 아니라
              <br />
              관리에서 완성됩니다
            </div>
          </div>

          <div className="story-section">
            <p className="story-quote">
              고객은 결과보다
              <br />
              <strong>관리받고 있다는 경험</strong>에
              <br />
              다시 찾아옵니다
            </p>
          </div>

          <div className="story-section">
            <div className="story-section-title">출세했다의 약속</div>
            <div className="story-mission-grid">
              {MISSIONS.map((m) => (
                <div className="story-mission-card" key={m.title}>
                  <div className="smc-icon">{m.icon}</div>
                  <div>
                    <div className="smc-title">{m.title}</div>
                    <div className="smc-desc">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
