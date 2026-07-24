import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";

const IconBefore = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={0.75}>
    <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
    <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z" />
    <line x1="3" y1="9" x2="21" y2="9" strokeDasharray="1 2" />
  </svg>
);

const IconAfter = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2z" />
    <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" />
  </svg>
);

const IconBeforeBox = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={0.75}>
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <line x1="3" y1="11" x2="21" y2="11" />
  </svg>
);

const IconAfterBox = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M3 11l4 3 5-4 5 3 4-2" />
  </svg>
);

type GalleryItem = {
  title: string;
  sub: string;
  before: { icon?: React.ReactNode; photo?: string; alt?: string };
  after: { icon?: React.ReactNode; photo?: string; alt?: string };
};

const ITEMS: GalleryItem[] = [
  {
    title: "외부+내부 프리미엄 세차",
    sub: "세단 · 지하주차장 방문 시공",
    before: { icon: <IconBefore /> },
    after: { icon: <IconAfter /> },
  },
  {
    title: "휠 & 타이어 케어",
    sub: "SUV · 브레이크 분진 제거 디테일링",
    before: { photo: "/images/wheel_before.jpg", alt: "휠 세차 전" },
    after: { photo: "/images/wheel_after.jpg", alt: "휠 세차 후" },
  },
  {
    title: "생활 스크래치",
    sub: "컴파운드로 깨끗하게",
    before: { photo: "/images/scratch_before.jpg", alt: "생활 스크래치 전" },
    after: { photo: "/images/scratch_after.jpg", alt: "생활 스크래치 후" },
  },
  {
    title: "왁스 코팅 마무리",
    sub: "외제차 · 광택 & 발수 코팅",
    before: { icon: <IconBeforeBox /> },
    after: { icon: <IconAfterBox /> },
  },
];

export default function GalleryPage() {
  return (
    <div className="page on" id="pg-gallery">
      <div className="safe-t" />
      <TopBarBack title="Before & After" backHref="/" />
      <div className="scroll">
        <div className="gallery-body">
          <div className="gallery-hero">
            <div className="gallery-hero-title">직접 보면 다릅니다</div>
            <div className="gallery-hero-sub">출세했다가 다녀간 차량들의 세차 전후 비교입니다</div>
          </div>

          <div className="gallery-list">
            {ITEMS.map((item) => (
              <div className="gallery-item" key={item.title}>
                <div className="gallery-compare">
                  <div className="gallery-before">
                    <span className="gallery-tag">BEFORE</span>
                    {item.before.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="gallery-photo" src={item.before.photo} alt={item.before.alt} loading="lazy" />
                    ) : (
                      item.before.icon
                    )}
                  </div>
                  <div className="gallery-after">
                    <span className="gallery-tag">AFTER</span>
                    {item.after.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="gallery-photo" src={item.after.photo} alt={item.after.alt} loading="lazy" />
                    ) : (
                      item.after.icon
                    )}
                  </div>
                </div>
                <div className="gallery-caption">
                  <div className="gallery-title">{item.title}</div>
                  <div className="gallery-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/subscribe" className="home-cta-banner">
            <div className="hcb-row" style={{ marginBottom: 0 }}>
              <div>
                <div className="hcb-title">
                  내 차도 <em>이렇게</em> 만들고 싶다면
                </div>
                <div className="hcb-sub">월 멤버십으로 꾸준히 관리받아보세요</div>
              </div>
              <div className="hcb-arrow">→</div>
            </div>
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
