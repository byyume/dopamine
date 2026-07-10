// 애니팡풍 도트 캐릭터 (직접 그린 픽셀 아트, 12x10)
const ROWS = [
  "..X......X..",
  ".XAX....XAX.",
  ".XAAXXXXAAX.",
  "XAAAAAAAAAAX",
  "XAAAAAAAAAAX",
  "XABAAAAAABAX",
  "XCAAANNAAACX",
  "XAAAAMMAAAAX",
  ".XAAAAAAAAX.",
  "..XXXXXXXX..",
];

const COLORS: Record<string, string> = {
  X: "#20120b", // 외곽선
  A: "#f6b73c", // 몸통(주황)
  B: "#241f1c", // 눈
  N: "#e2574c", // 코
  C: "#ff9d9d", // 볼터치
  M: "#a34a1f", // 입
};

export default function AnipangSprite({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 10"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="애니팡 캐릭터"
    >
      {ROWS.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch]} />
          )
        )
      )}
    </svg>
  );
}
