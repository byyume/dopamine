"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import SlotMachine from "./SlotMachine";
import StockMarket, { Holding } from "./StockMarket";
import LoanPanel, { Loan, LOAN_AMOUNT, INTEREST_TICK_MS } from "./LoanPanel";
import {
  initStocks,
  tickStock,
  StockState,
  STOCK_TICK_MS,
  STOCK_DEFS,
} from "../lib/stocks";
import { won, signedWon } from "../lib/format";
import { sfx, setMuted } from "../lib/sound";

const START_CASH = 10_000;
const SAVE_KEY = "dopamine-save-v1";

// 16:9 기준 논리 해상도 — iframe 크기에 맞춰 통째로 scale 됨
const STAGE_W = 1280;
const STAGE_H = 720;

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const getScale = () =>
  Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
const getServerScale = () => 1;

interface LogEntry {
  id: number;
  text: string;
  tone: "gain" | "loss" | "info";
}

interface SaveData {
  cash: number;
  holdings: Record<string, Holding>;
  loans: Loan[];
  loanSeq: number;
}

export default function Game() {
  const [cash, setCash] = useState(START_CASH);
  const [stocks, setStocks] = useState<StockState[]>(initStocks);
  const [holdings, setHoldings] = useState<Record<string, Holding>>({});
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanSeq, setLoanSeq] = useState(0); // 지금까지 받은 대출 횟수
  const [selectedId, setSelectedId] = useState(STOCK_DEFS[0].id);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [muted, setMutedState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const logId = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSyncExternalStore(subscribeResize, getScale, getServerScale);

  const addLog = useCallback((text: string, tone: LogEntry["tone"]) => {
    setLog((prev) => [{ id: ++logId.current, text, tone }, ...prev].slice(0, 8));
  }, []);

  // 저장 데이터 불러오기 — localStorage는 클라이언트 마운트 후에만 접근 가능
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save: SaveData = JSON.parse(raw);
        setCash(save.cash);
        setHoldings(save.holdings ?? {});
        setLoans(save.loans ?? []);
        setLoanSeq(save.loanSeq ?? 0);
      }
    } catch {
      // 저장 데이터가 깨졌으면 새 게임
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 자동 저장
  useEffect(() => {
    if (!loaded) return;
    const save: SaveData = { cash, holdings, loans, loanSeq };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // 저장 실패는 무시
    }
  }, [cash, holdings, loans, loanSeq, loaded]);

  // 주가 갱신 (10초) — updater 밖에서 틱을 계산해 사이드이펙트(로그/사운드)를 분리
  const stocksRef = useRef(stocks);
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);
  useEffect(() => {
    const iv = setInterval(() => {
      const results = stocksRef.current.map(tickStock);
      results.forEach(({ event }) => {
        if (!event) return;
        if (event.kind === "moon") {
          addLog(`🚀 ${event.name} 폭등! ${event.changePct.toFixed(1)}%`, "gain");
          sfx.moon();
        } else {
          addLog(`💥 ${event.name} 폭락! ${event.changePct.toFixed(1)}%`, "loss");
          sfx.crash();
        }
      });
      setStocks(results.map((r) => r.next));
    }, STOCK_TICK_MS);
    return () => clearInterval(iv);
  }, [addLog]);

  // 대출 이자 (30초 복리)
  useEffect(() => {
    if (loans.length === 0) return;
    const iv = setInterval(() => {
      setLoans((prev) =>
        prev.map((l) => ({
          ...l,
          balance: Math.ceil(l.balance * (1 + l.rate / 100)),
        }))
      );
      addLog("🏚️ 대출 이자가 붙었습니다...", "loss");
    }, INTEREST_TICK_MS);
    return () => clearInterval(iv);
  }, [loans.length > 0, addLog]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSlotNet = useCallback((delta: number) => {
    setCash((c) => Math.max(0, c + delta));
  }, []);

  function buy(id: string, qty: number) {
    const stock = stocks.find((s) => s.def.id === id);
    if (!stock || qty < 1) return;
    const cost = stock.price * qty;
    if (cost > cash) return;
    setCash((c) => c - cost);
    setHoldings((prev) => {
      const h = prev[id] ?? { qty: 0, avgPrice: 0 };
      const newQty = h.qty + qty;
      return {
        ...prev,
        [id]: {
          qty: newQty,
          avgPrice: Math.round((h.avgPrice * h.qty + cost) / newQty),
        },
      };
    });
    addLog(`🟢 ${stock.def.name} ${qty}주 매수 (${won(cost)})`, "info");
    sfx.buy();
  }

  function sell(id: string, qty: number) {
    const stock = stocks.find((s) => s.def.id === id);
    const h = holdings[id];
    if (!stock || !h || qty < 1 || h.qty < qty) return;
    const proceeds = stock.price * qty;
    const profit = (stock.price - h.avgPrice) * qty;
    setCash((c) => c + proceeds);
    setHoldings((prev) => {
      const rest = h.qty - qty;
      const next = { ...prev };
      if (rest === 0) delete next[id];
      else next[id] = { ...h, qty: rest };
      return next;
    });
    addLog(
      `🔴 ${stock.def.name} ${qty}주 매도 (손익 ${signedWon(profit)})`,
      profit >= 0 ? "gain" : "loss"
    );
    sfx.sell();
  }

  function borrow() {
    const rate = Math.pow(2, loanSeq); // 1% → 2% → 4% → ...
    setLoans((prev) => [
      ...prev,
      { id: Date.now() + loanSeq, balance: LOAN_AMOUNT, rate },
    ]);
    setLoanSeq((n) => n + 1);
    setCash((c) => c + LOAN_AMOUNT);
    addLog(`🏚️ ${won(LOAN_AMOUNT)} 대출 실행! (이자 ${rate}%)`, "loss");
    sfx.loan();
  }

  function repay(loanId: number) {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || cash < 1) return;
    const pay = Math.min(cash, loan.balance);
    setCash((c) => c - pay);
    setLoans((prev) =>
      prev
        .map((l) => (l.id === loanId ? { ...l, balance: l.balance - pay } : l))
        .filter((l) => l.balance > 0)
    );
    addLog(
      pay === loan.balance
        ? `✨ 대출 ${won(loan.balance)} 전액 상환!`
        : `💸 대출 ${won(pay)} 부분 상환`,
      "gain"
    );
    sfx.sell();
  }

  // 팝업(confirm) 금지 규격 대응: 두 번 클릭으로 확정하는 인라인 리셋
  function handleReset() {
    if (!resetArmed) {
      setResetArmed(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setResetArmed(false), 3000);
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setResetArmed(false);
    setCash(START_CASH);
    setStocks(initStocks());
    setHoldings({});
    setLoans([]);
    setLoanSeq(0);
    setLog([]);
    addLog("🔄 새 인생 시작! 이번엔 부자가 되어보자", "info");
  }

  function toggleMute() {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  }

  const stockValue = Object.entries(holdings).reduce((sum, [id, h]) => {
    const s = stocks.find((x) => x.def.id === id);
    return sum + (s ? s.price * h.qty : 0);
  }, 0);
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0);
  const netWorth = cash + stockValue - totalDebt;
  const nextRate = Math.pow(2, loanSeq);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="flex flex-col gap-2 p-3 shrink-0"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
        }}
      >
        {/* 상단 바 */}
        <header className="pixel-panel px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <h1 className="text-xl font-bold text-gold tracking-widest whitespace-nowrap">
            💊 도파민 뿜뿜 카지노
          </h1>
          <div className="flex gap-x-5 text-sm whitespace-nowrap">
            <span>
              💰 현금: <b className="text-gold">{won(cash)}</b>
            </span>
            <span>
              📊 주식: <b className="text-info">{won(stockValue)}</b>
            </span>
            <span>
              🏚️ 부채:{" "}
              <b className={totalDebt > 0 ? "text-loss" : "text-gain"}>
                {won(totalDebt)}
              </b>
            </span>
            <span>
              👑 순자산:{" "}
              <b className={netWorth >= 0 ? "text-gain" : "text-loss"}>
                {won(netWorth)}
              </b>
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="pixel-btn bg-panel-dark px-3 py-1 cursor-pointer"
              aria-label={muted ? "소리 켜기" : "소리 끄기"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={handleReset}
              className={`pixel-btn px-3 py-1 cursor-pointer ${
                resetArmed ? "bg-loss text-white font-bold" : "bg-panel-dark"
              }`}
            >
              {resetArmed ? "정말로?!" : "파산 리셋"}
            </button>
          </div>
        </header>

        {/* 본문: 슬롯(좌) / 주식(우) */}
        <div className="flex-1 min-h-0 grid grid-cols-[460px_1fr] gap-2">
          <div className="flex flex-col gap-2 min-h-0">
            <SlotMachine cash={cash} onNet={handleSlotNet} />
            <LoanPanel
              loans={loans}
              nextRate={nextRate}
              cash={cash}
              onBorrow={borrow}
              onRepay={repay}
            />
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <StockMarket
              stocks={stocks}
              holdings={holdings}
              cash={cash}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onBuy={buy}
              onSell={sell}
            />
            <section className="pixel-panel px-3 py-2 h-24 shrink-0 flex flex-col">
              <h2 className="text-sm font-bold tracking-widest shrink-0">📰 속보</h2>
              <ul className="flex-1 min-h-0 overflow-hidden text-xs flex flex-col gap-0.5">
                {log.length === 0 && (
                  <li className="opacity-50">아직 소식이 없습니다...</li>
                )}
                {log.slice(0, 3).map((e) => (
                  <li
                    key={e.id}
                    className={
                      e.tone === "gain"
                        ? "text-gain"
                        : e.tone === "loss"
                          ? "text-loss"
                          : "text-info"
                    }
                  >
                    {e.text}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] opacity-40 shrink-0">
                본 게임은 가상 화폐로만 진행되며 실제 도박·투자와 무관합니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
