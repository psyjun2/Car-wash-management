import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { FaqAccordion } from "@/components/FaqAccordion";

const FAQ_ITEMS = [
  {
    q: "방문세차는 어떤 방식으로 진행되나요?",
    a: "예약하신 날짜와 장소로 전문 세차사가 직접 방문하여 세차를 진행합니다. 실내·실외 주차장 모두 가능합니다.",
  },
  {
    q: "세차는 얼마나 걸리나요?",
    a: "차량 상태와 옵션에 따라 다르지만, 평균 40~60분 정도 소요됩니다.",
  },
  {
    q: "예약을 변경하거나 취소할 수 있나요?",
    a: "예약 캘린더에서 언제든지 예약 내용을 수정하거나 삭제할 수 있습니다.",
  },
  {
    q: "비가 오는 날에도 방문하나요?",
    a: "우천 시에는 실내 주차 세차만 진행되며, 실외 세차는 자동으로 일정 조율 안내를 드립니다.",
  },
  {
    q: "결제는 어떻게 하나요?",
    a: "세차 완료 후 현장에서 결제하거나, 예약 시 안내되는 링크로 사전 결제할 수 있습니다.",
  },
  {
    q: "지원하지 않는 지역이 있나요?",
    a: "현재 수도권 전역에서 서비스 중이며, 순차적으로 지역을 확대하고 있습니다.",
  },
];

export default function FaqPage() {
  return (
    <div className="page on" id="pg-faq">
      <div className="safe-t" />
      <TopBarBack title="자주 묻는 질문" backHref="/" />
      <div className="scroll">
        <div className="faq-body">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
