export function won(n: number): string {
  return `${Math.floor(n).toLocaleString("ko-KR")}원`;
}

export function signedWon(n: number): string {
  const v = Math.floor(n);
  return v >= 0 ? `+${v.toLocaleString("ko-KR")}원` : `${v.toLocaleString("ko-KR")}원`;
}

export function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

// 큰 금액은 K/M/B/T 단위로 축약해 상단바를 벗어나지 않게 함.
// 1,000,000원 → "1,000K원", 1,072,139원 → "1,072K원" (원본 금액은 title 툴팁으로 표시)
export function compactWon(n: number): string {
  const v = Math.floor(n);
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a < 1_000_000) return `${v.toLocaleString("ko-KR")}원`;
  if (a < 1_000_000_000)
    return `${sign}${Math.round(a / 1_000).toLocaleString("ko-KR")}K원`;
  if (a < 1_000_000_000_000)
    return `${sign}${Math.round(a / 1_000_000).toLocaleString("ko-KR")}M원`;
  if (a < 1_000_000_000_000_000)
    return `${sign}${Math.round(a / 1_000_000_000).toLocaleString("ko-KR")}B원`;
  return `${sign}${Math.round(a / 1_000_000_000_000).toLocaleString("ko-KR")}T원`;
}

// signedWon의 축약 버전 (수익/손익 표시용)
export function compactSignedWon(n: number): string {
  const v = Math.floor(n);
  const body = compactWon(Math.abs(v));
  return v >= 0 ? `+${body}` : `-${body}`;
}
