"use client";

import { StockState, RISK_LABEL } from "../lib/stocks";
import { won, pct, signedWon } from "../lib/format";
import StockChart from "./StockChart";

export interface Holding {
  qty: number;
  avgPrice: number;
}

interface Props {
  stocks: StockState[];
  holdings: Record<string, Holding>;
  cash: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onBuy: (id: string, qty: number) => void;
  onSell: (id: string, qty: number) => void;
}

const RISK_COLOR: Record<number, string> = {
  1: "text-info",
  2: "text-gain",
  3: "text-gold",
  4: "text-royal",
  5: "text-loss",
};

export default function StockMarket({
  stocks,
  holdings,
  cash,
  selectedId,
  onSelect,
  onBuy,
  onSell,
}: Props) {
  const selected = stocks.find((s) => s.def.id === selectedId) ?? stocks[0];
  const holding = holdings[selected.def.id];
  const changePct =
    selected.prevPrice > 0
      ? ((selected.price - selected.prevPrice) / selected.prevPrice) * 100
      : 0;
  const isGain =
    selected.history.length < 2 ||
    selected.price >= selected.history[Math.max(0, selected.history.length - 10)];
  const maxBuy = Math.floor(cash / selected.price);
  const profit = holding ? (selected.price - holding.avgPrice) * holding.qty : 0;

  return (
    <section className="pixel-panel p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold text-info text-center tracking-widest">
        📈 도파민 증권거래소 📉
      </h2>

      <ul className="pixel-inset divide-y-2 divide-black/60 max-h-64 overflow-y-auto">
        {stocks.map((s) => {
          const ch =
            s.prevPrice > 0 ? ((s.price - s.prevPrice) / s.prevPrice) * 100 : 0;
          const h = holdings[s.def.id];
          return (
            <li key={s.def.id}>
              <button
                onClick={() => onSelect(s.def.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer ${
                  s.def.id === selected.def.id ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="text-xl">{s.def.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{s.def.name}</span>
                  <span className={`text-xs ${RISK_COLOR[s.def.risk]}`}>
                    [{RISK_LABEL[s.def.risk]}]
                  </span>
                  {h && h.qty > 0 && (
                    <span className="text-xs opacity-70"> 보유 {h.qty}주</span>
                  )}
                </span>
                <span className="text-right">
                  <span className="block">{won(s.price)}</span>
                  <span
                    className={`text-xs ${ch >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {ch >= 0 ? "▲" : "▼"} {pct(ch)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold">
          {selected.def.emoji} {selected.def.name}
          <span className={`ml-2 text-xs ${RISK_COLOR[selected.def.risk]}`}>
            [{RISK_LABEL[selected.def.risk]}]
          </span>
        </h3>
        <span className={changePct >= 0 ? "text-gain" : "text-loss"}>
          {won(selected.price)} ({pct(changePct)})
        </span>
      </div>

      <StockChart history={selected.history} gain={isGain} />

      {holding && holding.qty > 0 && (
        <p className="text-sm">
          보유 {holding.qty}주 · 평단 {won(holding.avgPrice)} · 평가손익{" "}
          <span className={profit >= 0 ? "text-gain" : "text-loss"}>
            {signedWon(profit)}
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gain">매수 (최대 {maxBuy}주)</p>
          <div className="flex gap-2">
            {[1, 10].map((q) => (
              <button
                key={q}
                onClick={() => onBuy(selected.def.id, q)}
                disabled={maxBuy < q}
                className="pixel-btn bg-gain text-black font-bold px-3 py-2 flex-1 cursor-pointer"
              >
                {q}주
              </button>
            ))}
            <button
              onClick={() => onBuy(selected.def.id, maxBuy)}
              disabled={maxBuy < 1}
              className="pixel-btn bg-gain text-black font-bold px-3 py-2 flex-1 cursor-pointer"
            >
              풀매수
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-loss">매도 (보유 {holding?.qty ?? 0}주)</p>
          <div className="flex gap-2">
            {[1, 10].map((q) => (
              <button
                key={q}
                onClick={() => onSell(selected.def.id, q)}
                disabled={!holding || holding.qty < q}
                className="pixel-btn bg-loss text-white font-bold px-3 py-2 flex-1 cursor-pointer"
              >
                {q}주
              </button>
            ))}
            <button
              onClick={() => onSell(selected.def.id, holding?.qty ?? 0)}
              disabled={!holding || holding.qty < 1}
              className="pixel-btn bg-loss text-white font-bold px-3 py-2 flex-1 cursor-pointer"
            >
              전량
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs opacity-60 text-center">시세는 10초마다 갱신됩니다</p>
    </section>
  );
}
