// 토키(분홍 토끼) 도트 캐릭터 — 제공받은 이미지를 14x11 픽셀 아트로 재해석
const ROWS = [
  "..OOO....OOO..",
  ".OPDPO..OPDPO.",
  ".OPPPPOOPPPPO.",
  "OPPPPPPPPPPPPO",
  "OPPPPPPPPPPPPO",
  "OPPPBPWWPBPPPO",
  "OCPPPWNNWPPPCO",
  "OPPPPWBBWPPPPO",
  ".OPPPPPPPPPPO.",
  "..OPPPPPPPPO..",
  "...OOOOOOOO...",
];

const COLORS: Record<string, string> = {
  O: "#a85578", // 외곽선(진분홍)
  P: "#f9c1d8", // 얼굴(연분홍)
  D: "#f3a0c4", // 귀 안쪽
  W: "#ffffff", // 주둥이
  B: "#4a3038", // 눈/입
  N: "#e87aa4", // 코
  C: "#f78fb5", // 볼터치
};

export default function TokiSprite({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 11"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="토키 캐릭터"
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
