// 분홍 토끼 도트 캐릭터 — 제공받은 픽셀 아트 이미지를 18x16 그리드로 재현
const ROWS = [
  "...OOO......OOO...",
  "..OLLPO....OPLLO..",
  "..OLPPO....OPPLO..",
  "..OPPPOO..OOPPPO..",
  ".OPPPPPOOOOPPPPPO.",
  ".OPPPPPPPPPPPPPPO.",
  "OPLPPPPPPPPPPPPPPO",
  "OPLLPPPPPPPPPPPPPO",
  "OPPPEEPPPPPPEEPPPO",
  "OPPPEEPPPPPPEEPPPO",
  "OPPPPPPPEEPPPPPPPO",
  "OPPPPPPPPPPPPPPPPO",
  ".OPPPPPPPPPPPPPPO.",
  ".OSPPPPPPPPPPPPSO.",
  "..OSPPPPPPPPPPSO..",
  "...OOOOOOOOOOOO...",
];

const COLORS: Record<string, string> = {
  O: "#ec5fa8", // 외곽선(핫핑크)
  P: "#f9bedb", // 얼굴(연분홍)
  L: "#fde3f0", // 하이라이트(귀 안쪽·이마)
  E: "#e0489a", // 눈·코(진분홍)
  S: "#f490c4", // 아래쪽 음영
};

export default function TokiSprite({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 16"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="토끼 캐릭터"
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
