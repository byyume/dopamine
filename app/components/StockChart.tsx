"use client";

interface Props {
  history: number[];
  width?: number;
  height?: number;
  gain: boolean;
}

export default function StockChart({ history, width = 320, height = 120, gain }: Props) {
  if (history.length < 2) {
    return (
      <div className="pixel-inset flex items-center justify-center" style={{ height }}>
        <span className="opacity-60 text-sm">데이터 수집 중...</span>
      </div>
    );
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const pad = 8;
  const stepX = (width - pad * 2) / (history.length - 1);

  // 도트게임풍 계단형 라인
  const points: string[] = [];
  history.forEach((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (p - min) / range);
    if (i > 0) points.push(`${x},${points[points.length - 1].split(",")[1]}`);
    points.push(`${x},${y}`);
  });

  const color = gain ? "var(--pixel-green)" : "var(--pixel-red)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pixel-inset w-full"
      style={{ height }}
      shapeRendering="crispEdges"
      role="img"
      aria-label="주가 차트"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={3}
      />
    </svg>
  );
}
