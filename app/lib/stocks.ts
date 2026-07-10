export const STOCK_TICK_MS = 7_000;
export const HISTORY_LEN = 40;

export interface StockDef {
  id: string;
  name: string;
  emoji: string;
  risk: 1 | 2 | 3 | 4 | 5; // 1: 안전 ~ 5: 초고위험
  basePrice: number;
}

export interface StockState {
  def: StockDef;
  price: number;
  prevPrice: number;
  trend: number; // -1 ~ 1, 서서히 변하는 추세(모멘텀)
  history: number[];
}

export const RISK_LABEL: Record<number, string> = {
  1: "안전",
  2: "보통",
  3: "위험",
  4: "고위험",
  5: "초고위험",
};

export const STOCK_DEFS: StockDef[] = [
  { id: "wmp", name: "위메이드플레이", emoji: "🧩", risk: 1, basePrice: 20_000 },
  { id: "bank", name: "아마종", emoji: "🏦", risk: 1, basePrice: 50_000 },
  { id: "telecom", name: "얜비디아", emoji: "🎮", risk: 1, basePrice: 30_000 },
  { id: "elec", name: "사성전자", emoji: "📱", risk: 2, basePrice: 80_000 },
  { id: "potato", name: "위믹스", emoji: "🥔", risk: 2, basePrice: 5_000 },
  { id: "pharma", name: "셀린디옹", emoji: "💊", risk: 3, basePrice: 120_000 },
  { id: "games", name: "스페이스S", emoji: "🛰️", risk: 3, basePrice: 45_000 },
  { id: "rocket", name: "파인애플", emoji: "🚀", risk: 4, basePrice: 15_000 },
  { id: "ent", name: "로우닉스", emoji: "💾", risk: 4, basePrice: 60_000 },
  { id: "octopus", name: "이더리옴", emoji: "🐙", risk: 5, basePrice: 8_000 },
  { id: "coin", name: "기가코인", emoji: "🪙", risk: 5, basePrice: 1_000 },
];

// 위험도별 파라미터: 변동성, 폭등/폭락 확률, 폭등/폭락 최대 폭
const VOLATILITY: Record<number, number> = { 1: 0.005, 2: 0.01, 3: 0.02, 4: 0.035, 5: 0.055 };
const SPIKE_CHANCE: Record<number, number> = { 1: 0.003, 2: 0.008, 3: 0.018, 4: 0.03, 5: 0.05 };
const SPIKE_POWER: Record<number, number> = { 1: 0.08, 2: 0.12, 3: 0.2, 4: 0.3, 5: 0.45 };
// 고위험일수록 기대 수익도 살짝 높음 (그만큼 잃을 확률도 큼)
const BASE_DRIFT: Record<number, number> = { 1: 0.0004, 2: 0.0008, 3: 0.0015, 4: 0.0025, 5: 0.004 };

function gaussian(): number {
  // Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// warmupTicks만큼 시세를 미리 진행시켜 시작부터 추세(상승/하락)가 보이는 차트를 만든다.
// 주의: 랜덤이 들어가므로 warmup은 클라이언트에서만 사용할 것 (SSR 하이드레이션 불일치 방지)
function initStock(def: StockDef, warmupTicks: number): StockState {
  let s: StockState = {
    def,
    price: def.basePrice,
    prevPrice: def.basePrice,
    trend: warmupTicks > 0 ? (Math.random() - 0.5) * 0.6 : 0,
    history: [def.basePrice],
  };
  for (let i = 0; i < warmupTicks; i++) {
    s = tickStock(s).next;
  }
  return s;
}

export function initStocks(warmupTicks = 0): StockState[] {
  return STOCK_DEFS.map((def) => initStock(def, warmupTicks));
}

// 저장/복원용 직렬화 형태
export interface SavedStock {
  id: string;
  price: number;
  prevPrice?: number; // 등락률 표시용 직전 가격
  trend: number;
  history: number[];
}

export function serializeStocks(stocks: StockState[]): SavedStock[] {
  return stocks.map((s) => ({
    id: s.def.id,
    price: s.price,
    prevPrice: s.prevPrice,
    trend: s.trend,
    history: s.history,
  }));
}

// 저장된 시세를 복원. 저장에 없던 신규 종목은 새로 워밍업해서 채운다.
export function restoreStocks(saved: SavedStock[] | undefined): StockState[] | null {
  if (!saved || saved.length === 0) return null;
  const byId = new Map(saved.map((s) => [s.id, s]));
  return STOCK_DEFS.map((def) => {
    const s = byId.get(def.id);
    if (
      s &&
      typeof s.price === "number" &&
      Array.isArray(s.history) &&
      s.history.length > 0
    ) {
      return {
        def,
        price: s.price,
        // 직전 가격까지 복원해 재접속 직후에도 등락률이 0%로 리셋되지 않게 함
        prevPrice: typeof s.prevPrice === "number" ? s.prevPrice : s.price,
        trend: typeof s.trend === "number" ? s.trend : 0,
        history: s.history.slice(-HISTORY_LEN),
      };
    }
    return initStock(def, 30);
  });
}

export interface TickEvent {
  stockId: string;
  name: string;
  kind: "moon" | "crash";
  changePct: number;
}

export function tickStock(s: StockState): { next: StockState; event: TickEvent | null } {
  const { risk } = s.def;
  // 추세는 서서히 변함 → 서서히 오르거나 서서히 떨어지는 구간이 생김
  const trend = Math.max(-1, Math.min(1, s.trend * 0.85 + gaussian() * 0.35));

  let changeRate =
    BASE_DRIFT[risk] + trend * VOLATILITY[risk] * 1.5 + gaussian() * VOLATILITY[risk];

  let event: TickEvent | null = null;
  if (Math.random() < SPIKE_CHANCE[risk]) {
    // 갑작스러운 폭등 또는 폭락
    const up = Math.random() < 0.5;
    const magnitude = SPIKE_POWER[risk] * (0.5 + Math.random());
    changeRate = up ? magnitude : -magnitude;
    event = {
      stockId: s.def.id,
      name: s.def.name,
      kind: up ? "moon" : "crash",
      changePct: changeRate * 100,
    };
  }

  const price = Math.max(1, Math.round(s.price * (1 + changeRate)));
  const history = [...s.history, price].slice(-HISTORY_LEN);
  return { next: { ...s, price, prevPrice: s.price, trend, history }, event };
}
