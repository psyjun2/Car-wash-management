import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { listGalleryItems } from "@/lib/data/gallery";

export const revalidate = 300;

export default async function GalleryPage() {
  const items = await listGalleryItems();

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
            {items.map((item) => (
              <div className="gallery-item" key={item.id}>
                <div className="gallery-compare">
                  <div className="gallery-before">
                    <span className="gallery-tag">BEFORE</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="gallery-photo" src={item.before_photo_url} alt={item.before_alt ?? ""} loading="lazy" />
                  </div>
                  <div className="gallery-after">
                    <span className="gallery-tag">AFTER</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="gallery-photo" src={item.after_photo_url} alt={item.after_alt ?? ""} loading="lazy" />
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
