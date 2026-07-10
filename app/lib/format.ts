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
