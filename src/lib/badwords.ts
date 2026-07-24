const BAD_WORDS = [
  "씨발", "시발", "씨팔", "시팔", "쌍년", "쌍놈", "개새끼", "개색끼", "새끼", "쉐끼", "놈팡이",
  "미친놈", "미친년", "병신", "벙신", "바보새끼", "지랄", "존나", "좆", "보지", "자지", "씹",
  "개년", "개놈", "개좆", "꺼져", "닥쳐", "찐따", "등신", "돌대가리", "머저리", "얼간이",
  "빡대가리", "쪽발이", "쪽바리", "왜놈", "짱깨", "흑형", "깜둥이",
  "섹스", "섹쓰", "야동", "포르노", "porn", "sex", "fuck", "fucking", "bitch", "bastard",
  "음란", "성교", "성기", "강간", "윤간", "성폭행", "성희롱", "몸팔", "몸파", "원조교제",
  "매춘", "매음", "창녀", "갈보", "화냥년", "윤락",
  "살인", "살해", "죽여", "죽인다", "칼로", "폭탄", "테러", "마약", "히로뽕", "필로폰",
  "대마초", "코카인", "헤로인", "아편", "투약", "밀수", "사기", "협박", "공갈", "납치",
  "감금", "스토킹", "해킹", "불법", "위조", "사문서", "탈세", "뇌물", "횡령", "배임",
];

function checkBadWords(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/\s/g, "");
  return BAD_WORDS.some((word) => lower.includes(word.toLowerCase()));
}

/**
 * The legacy app only checked this client-side (trivially bypassable via a
 * direct API call) — this re-validates server-side, the actual enforcement
 * boundary. Client-side checking can stay too, for instant UX feedback.
 */
export function validateInputs(...texts: Array<string | null | undefined>): boolean {
  return !texts.some((t) => checkBadWords(t));
}
