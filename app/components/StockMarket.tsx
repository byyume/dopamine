"use client";

import { useState } from "react";
import { StockState, StockDef, RISK_LABEL } from "../lib/stocks";
import { won, pct, signedWon, compactWon, compactSignedWon } from "../lib/format";
import StockChart from "./StockChart";
import TokiSprite from "./TokiSprite";

// 위메이드플레이(애니팡 토키 제작사)는 게임 마스코트 도트 스프라이트로 표시
function StockIcon({ def, sprite }: { def: StockDef; sprite: string }) {
  if (def.id === "wmp") return <TokiSprite className={sprite} />;
  return <>{def.emoji}</>;
}

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
  const [view, setView] = useState<"all" | "mine">("all");
  const visibleStocks =
    view === "mine"
      ? stocks.filter((s) => (holdings[s.def.id]?.qty ?? 0) > 0)
      : stocks;

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

  // 포트폴리오 전체 수익 현황
  let totalValue = 0;
  let totalInvested = 0;
  for (const [id, h] of Object.entries(holdings)) {
    const s = stocks.find((x) => x.def.id === id);
    if (!s) continue;
    totalValue += s.price * h.qty;
    totalInvested += h.avgPrice * h.qty;
  }
  const totalProfit = totalValue - totalInvested;
  const totalRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return (
    <section className="pixel-panel p-3 flex-1 min-h-0 flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 gap-2">
        <h2 className="text-lg font-bold text-info tracking-widest whitespace-nowrap">
          📈 도파민 증권거래소 📉
        </h2>
        <p className="text-sm whitespace-nowrap">
          내 주식 <b className="text-info" title={won(totalValue)}>{compactWon(totalValue)}</b> · 수익{" "}
          <b className={totalProfit >= 0 ? "text-gain" : "text-loss"} title={signedWon(totalProfit)}>
            {compactSignedWon(totalProfit)} ({pct(totalRate)})
          </b>
        </p>
      </div>

      <div className="flex-1 min-h-0 flex gap-2">
        {/* 종목 리스트 (내부 스크롤) */}
        <div className="w-80 shrink-0 flex flex-col gap-1 min-h-0">
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setView("all")}
              className={`pixel-btn flex-1 px-2 py-1 text-sm cursor-pointer ${
                view === "all" ? "bg-info text-black font-bold" : "bg-panel-dark"
              }`}
            >
              전체 종목
            </button>
            <button
              onClick={() => setView("mine")}
              className={`pixel-btn flex-1 px-2 py-1 text-sm cursor-pointer ${
                view === "mine" ? "bg-info text-black font-bold" : "bg-panel-dark"
              }`}
            >
              내 보유 주식
            </button>
          </div>
          <ul className="pixel-inset divide-y-2 divide-black/60 overflow-y-auto flex-1 min-h-0">
          {visibleStocks.length === 0 && (
            <li className="px-2 py-3 text-sm opacity-50 text-center">
              보유한 주식이 없습니다
            </li>
          )}
          {visibleStocks.map((s) => {
            const ch =
              s.prevPrice > 0 ? ((s.price - s.prevPrice) / s.prevPrice) * 100 : 0;
            const h = holdings[s.def.id];
            // 보유 종목이면 내 평단 대비 수익률/수익금 표시
            const myRate =
              h && h.qty > 0 && h.avgPrice > 0
                ? ((s.price - h.avgPrice) / h.avgPrice) * 100
                : null;
            const myProfit =
              h && h.qty > 0 ? (s.price - h.avgPrice) * h.qty : 0;
            return (
              <li key={s.def.id}>
                <button
                  onClick={() => onSelect(s.def.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-left cursor-pointer ${
                    s.def.id === selected.def.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-xl shrink-0 w-7 flex items-center justify-center">
                    <StockIcon def={s.def} sprite="w-6 h-5" />
                  </span>
                  <span className="flex-1 min-w-0 text-sm">
                    <span className="block whitespace-nowrap">{s.def.name}</span>
                    <span className={`text-xs ${RISK_COLOR[s.def.risk]}`}>
                      [{RISK_LABEL[s.def.risk]}]
                    </span>
                    {h && h.qty > 0 && (
                      <span className="text-xs opacity-70"> {h.qty}주</span>
                    )}
                  </span>
                  <span className="text-right text-sm shrink-0">
                    <span className="block whitespace-nowrap" title={won(s.price)}>
                      {won(s.price)}
                    </span>
                    <span
                      className={`text-xs ${ch >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {ch >= 0 ? "▲" : "▼"} {pct(ch)}
                    </span>
                    {myRate !== null && (
                      <span
                        className={`block text-xs font-bold whitespace-nowrap ${
                          myRate >= 0 ? "text-gain" : "text-loss"
                        }`}
                        title={`내 수익 ${signedWon(myProfit)}`}
                      >
                        내 수익 {compactSignedWon(myProfit)} ({pct(myRate)})
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          </ul>
        </div>

        {/* 선택 종목 상세 + 거래 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between shrink-0 gap-2">
            <h3 className="text-base font-bold whitespace-nowrap flex items-center gap-1">
              <StockIcon def={selected.def} sprite="w-6 h-5 inline-block" />
              {selected.def.name}
              <span className={`text-xs ${RISK_COLOR[selected.def.risk]}`}>
                [{RISK_LABEL[selected.def.risk]}]
              </span>
            </h3>
            <span
              className={`text-base whitespace-nowrap ${
                changePct >= 0 ? "text-gain" : "text-loss"
              }`}
              title={won(selected.price)}
            >
              {won(selected.price)} ({pct(changePct)})
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <StockChart history={selected.history} gain={isGain} fill />
          </div>

          <p className="text-sm shrink-0 min-h-5">
            {holding && holding.qty > 0 ? (
              <>
                보유 {holding.qty}주 · 평단 {won(holding.avgPrice)} · 손익{" "}
                <span className={profit >= 0 ? "text-gain" : "text-loss"} title={signedWon(profit)}>
                  {signedWon(profit)}
                </span>
              </>
            ) : (
              <span className="opacity-50">보유 없음 · 시세는 7초마다 갱신</span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div>
              <p className="text-sm text-gain mb-1">매수 (최대 {maxBuy}주)</p>
              <div className="flex gap-1.5">
                {[1, 10].map((q) => (
                  <button
                    key={q}
                    onClick={() => onBuy(selected.def.id, q)}
                    disabled={maxBuy < q}
                    className="pixel-btn bg-gain text-black font-bold px-2 py-1.5 text-sm flex-1 cursor-pointer"
                  >
                    {q}주
                  </button>
                ))}
                <button
                  onClick={() => onBuy(selected.def.id, maxBuy)}
                  disabled={maxBuy < 1}
                  className="pixel-btn bg-gain text-black font-bold px-2 py-1.5 text-sm flex-1 cursor-pointer"
                >
                  풀매수
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-loss mb-1">매도 (보유 {holding?.qty ?? 0}주)</p>
              <div className="flex gap-1.5">
                {[1, 10].map((q) => (
                  <button
                    key={q}
                    onClick={() => onSell(selected.def.id, q)}
                    disabled={!holding || holding.qty < q}
                    className="pixel-btn bg-loss text-white font-bold px-2 py-1.5 text-sm flex-1 cursor-pointer"
                  >
                    {q}주
                  </button>
                ))}
                <button
                  onClick={() => onSell(selected.def.id, holding?.qty ?? 0)}
                  disabled={!holding || holding.qty < 1}
                  className="pixel-btn bg-loss text-white font-bold px-2 py-1.5 text-sm flex-1 cursor-pointer"
                >
                  풀매도
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
