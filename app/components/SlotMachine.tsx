"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASE_BET,
  BET_MULTIPLIERS,
  CHERRY_PAIR_PAYOUT,
  SYMBOLS,
  SlotSymbol,
  SpinResult,
  rollSymbol,
  spin,
} from "../lib/slot";
import { won, signedWon } from "../lib/format";
import { sfx } from "../lib/sound";
import TokiSprite from "./TokiSprite";

interface Props {
  cash: number;
  onNet: (delta: number) => void;
}

interface Floater {
  id: number;
  text: string;
  gain: boolean;
}

const COL_STOP_BASE_MS = 600;
const COL_STOP_GAP_MS = 450;

function SymbolFace({ sym, size }: { sym: SlotSymbol; size: "cell" | "small" }) {
  if (sym.id === "toki") {
    return (
      <TokiSprite
        className={size === "cell" ? "w-11 h-9" : "w-4 h-3 inline-block"}
      />
    );
  }
  return (
    <span className={size === "cell" ? "text-3xl" : "text-[10px]"}>{sym.icon}</span>
  );
}

export default function SlotMachine({ cash, onNet }: Props) {
  const [grid, setGrid] = useState<SlotSymbol[]>(() => Array(9).fill(SYMBOLS[7]));
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false]);
  const [mult, setMult] = useState<number>(1);
  const [winCells, setWinCells] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string>("레버를 당겨라!");
  const [jackpot, setJackpot] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const floaterId = useRef(0);

  const busy = spinningCols.some(Boolean);
  const cost = BASE_BET * mult;

  // interval 콜백에서 최신 spinning 상태를 참조하기 위한 ref
  const spinningRef = useRef(spinningCols);
  useEffect(() => {
    spinningRef.current = spinningCols;
  }, [spinningCols]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!busy) return;
    const iv = setInterval(() => {
      setGrid((prev) =>
        prev.map((s, i) => (spinningRef.current[i % 3] ? rollSymbol() : s))
      );
      if (Math.random() < 0.5) sfx.spinTick();
    }, 80);
    return () => clearInterval(iv);
  }, [busy]);

  function addFloater(text: string, gain: boolean) {
    const id = ++floaterId.current;
    setFloaters((f) => [...f, { id, text, gain }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1300);
  }

  function handleSpin() {
    if (busy || cash < cost) return;
    onNet(-cost);
    setJackpot(false);
    setWinCells(new Set());
    setMessage("돌아간다...!");
    setSpinningCols([true, true, true]);

    const result: SpinResult = spin();

    for (let col = 0; col < 3; col++) {
      const t = setTimeout(() => {
        setSpinningCols((prev) => {
          const next = [...prev];
          next[col] = false;
          return next;
        });
        setGrid((prev) => {
          const next = [...prev];
          for (let row = 0; row < 3; row++) {
            next[row * 3 + col] = result.grid[row * 3 + col];
          }
          return next;
        });
        sfx.reelStop();
        if (col === 2) settle(result);
      }, COL_STOP_BASE_MS + col * COL_STOP_GAP_MS);
      timers.current.push(t);
    }
  }

  function settle(result: SpinResult) {
    const t = setTimeout(() => {
      const payout = result.totalPayout * mult;
      if (payout > 0) {
        onNet(payout);
        setWinCells(new Set(result.wins.flatMap((w) => w.cells)));
        const first = result.wins[0].label;
        const extra = result.wins.length > 1 ? ` 외 ${result.wins.length - 1}라인` : "";
        setMessage(`${first}${extra}! ${won(payout)} 획득!`);
        addFloater(signedWon(payout), true);
        if (result.isJackpot) {
          setJackpot(true);
          sfx.jackpot();
        } else {
          sfx.win();
        }
      } else {
        setMessage("꽝! 다시 도전!");
        addFloater(`-${cost}원`, false);
        setShaking(true);
        setTimeout(() => setShaking(false), 700);
        sfx.lose();
      }
    }, 120);
    timers.current.push(t);
  }

  return (
    <section
      className={`pixel-panel p-3 flex-1 min-h-0 flex flex-col gap-2 ${
        shaking ? "shake" : ""
      }`}
    >
      <h2 className="text-base font-bold text-gold text-center tracking-widest shrink-0">
        🎰 토키 도파민 슬롯 🎰
      </h2>

      <div className="relative shrink-0">
        <div className="pixel-inset grid grid-cols-3 gap-1.5 p-2 w-fit mx-auto">
          {grid.map((sym, i) => (
            <div
              key={i}
              className={`w-16 h-16 flex items-center justify-center bg-black/40 pixel-inset overflow-hidden ${
                !busy && winCells.has(i) ? "win-cell" : ""
              }`}
              aria-label={spinningCols[i % 3] ? "회전 중" : sym.name}
            >
              <span
                className={spinningCols[i % 3] ? "reel-spinning inline-flex" : "inline-flex"}
              >
                <SymbolFace sym={sym} size="cell" />
              </span>
            </div>
          ))}
        </div>
        {floaters.map((f) => (
          <span
            key={f.id}
            className={`float-up absolute left-1/2 -translate-x-1/2 top-2 text-xl font-bold ${
              f.gain ? "text-gain" : "text-loss"
            }`}
          >
            {f.text}
          </span>
        ))}
      </div>

      <p
        className={`text-center min-h-6 text-sm shrink-0 ${
          jackpot ? "jackpot-blink text-lg font-bold" : "text-info"
        }`}
      >
        {message}
      </p>

      <div className="flex justify-center gap-2 shrink-0">
        {BET_MULTIPLIERS.map((m) => (
          <button
            key={m}
            onClick={() => setMult(m)}
            disabled={busy}
            className={`pixel-btn font-bold px-3 py-1 text-sm cursor-pointer ${
              mult === m ? "bg-gold text-black" : "bg-panel-dark"
            }`}
          >
            {m}배
          </button>
        ))}
      </div>

      <button
        onClick={handleSpin}
        disabled={busy || cash < cost}
        className="pixel-btn bg-loss text-white font-bold text-lg py-2 px-6 mx-auto w-64 shrink-0 cursor-pointer"
      >
        {busy ? "두근두근..." : `스핀! (${won(cost)})`}
      </button>

      <div className="flex-1 min-h-0 overflow-hidden text-[11px] opacity-80">
        <p className="text-gold">배당표 (라인: 가로 3 + 대각 2 · {mult}배 적용)</p>
        <ul className="grid grid-cols-3 gap-x-3 leading-4">
          {SYMBOLS.map((s) => (
            <li key={s.id} className="flex justify-between items-center gap-1">
              <span className="flex items-center">
                <SymbolFace sym={s} size="small" />
                <span>x3</span>
              </span>
              <span className="text-gain">{won(s.linePayout * mult)}</span>
            </li>
          ))}
          <li className="flex justify-between items-center gap-1">
            <span>🍒x2</span>
            <span className="text-gain">{won(CHERRY_PAIR_PAYOUT * mult)}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
