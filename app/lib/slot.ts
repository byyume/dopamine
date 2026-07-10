export const BASE_BET = 100;
export const BET_MULTIPLIERS = [1, 2, 5, 10] as const;

export interface SlotSymbol {
  id: string;
  icon: string; // 이모지 (애니팡은 전용 도트 스프라이트로 렌더링)
  name: string;
  weight: number;
  linePayout: number; // 1배 기준, 한 라인 트리플 당첨금
}

// 가중치가 낮을수록 희귀한 심볼
export const SYMBOLS: SlotSymbol[] = [
  { id: "toki", icon: "", name: "토키", weight: 1, linePayout: 30_000 },
  { id: "seven", icon: "7️⃣", name: "세븐", weight: 2, linePayout: 7_700 },
  { id: "diamond", icon: "💎", name: "다이아", weight: 3, linePayout: 3_000 },
  { id: "star", icon: "⭐", name: "스타", weight: 5, linePayout: 1_200 },
  { id: "bell", icon: "🔔", name: "벨", weight: 7, linePayout: 600 },
  { id: "melon", icon: "🍉", name: "수박", weight: 9, linePayout: 400 },
  { id: "lemon", icon: "🍋", name: "레몬", weight: 11, linePayout: 250 },
  { id: "cherry", icon: "🍒", name: "체리", weight: 12, linePayout: 150 },
];

export const CHERRY_PAIR_PAYOUT = 40;

// 3x3 그리드(행 우선)의 당첨 라인: 가로 3줄 + 대각 2줄
export const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

export function rollSymbol(): SlotSymbol {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r < 0) return s;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

export interface LineWin {
  cells: number[];
  payout: number; // 1배 기준
  label: string;
}

export interface SpinResult {
  grid: SlotSymbol[]; // 9칸, 행 우선
  wins: LineWin[];
  totalPayout: number; // 1배 기준
  isJackpot: boolean;
}

export function spin(): SpinResult {
  const grid = Array.from({ length: 9 }, rollSymbol);
  const wins: LineWin[] = [];
  let isJackpot = false;

  for (const cells of LINES) {
    const [a, b, c] = cells.map((i) => grid[i]);
    if (a.id === b.id && b.id === c.id) {
      wins.push({ cells, payout: a.linePayout, label: `${a.name} 트리플` });
      if (a.id === "toki" || a.id === "seven") isJackpot = true;
    } else if ([a, b, c].filter((s) => s.id === "cherry").length === 2) {
      wins.push({ cells, payout: CHERRY_PAIR_PAYOUT, label: "체리 페어" });
    }
  }

  return {
    grid,
    wins,
    totalPayout: wins.reduce((s, w) => s + w.payout, 0),
    isJackpot,
  };
}
