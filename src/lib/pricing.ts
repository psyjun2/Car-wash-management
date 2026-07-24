export type CarSize = "소형" | "중형" | "대형";
export type WashType = "exterior" | "interior" | "both";

export const WASH_PRICES: Record<CarSize, Record<WashType, number>> = {
  소형: { exterior: 20000, interior: 25000, both: 41000 },
  중형: { exterior: 25000, interior: 32000, both: 52000 },
  대형: { exterior: 32000, interior: 42000, both: 67000 },
};

export const WASH_TYPE_LABELS: Record<WashType, string> = {
  exterior: "외부세차",
  interior: "내부세차",
  both: "외부+내부세차",
};

export const ADDON_INTERIOR_PRICE = 20000;

export const BOOKING_SLOTS = [
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00",
];

export type SubFrequency = "weekly" | "twice_weekly" | "biweekly";

// 구독 회당가 = 일회성 가격(WASH_PRICES) × (1 - 방문빈도별 할인율)
export const SUB_FREQ_DISCOUNT: Record<SubFrequency, number> = {
  biweekly: 0.3,
  weekly: 0.42,
  twice_weekly: 0.52,
};

export const SUB_FREQUENCY_LABELS: Record<SubFrequency, string> = {
  weekly: "주 1회",
  twice_weekly: "주 2회",
  biweekly: "격주 1회",
};

// 구독 플랜 카드에 표시되는 이름
export const SUB_PLAN_NAME: Record<SubFrequency, string> = {
  biweekly: "격주 케어",
  weekly: "주 1회 케어",
  twice_weekly: "주 2회 케어",
};

// 구독 플랜 카드 우측에 표시되는 등급 배지
export const SUB_PLAN_TIER: Record<SubFrequency, string> = {
  biweekly: "베이직",
  weekly: "스탠다드",
  twice_weekly: "프리미엄",
};

/** Server-authoritative price — never trust a client-submitted price. */
export function computeReservationPrice({
  isAddon,
  carSize,
  washType,
}: {
  isAddon: boolean;
  carSize: CarSize;
  washType: WashType;
}): number {
  if (isAddon) return ADDON_INTERIOR_PRICE;
  return WASH_PRICES[carSize][washType];
}
