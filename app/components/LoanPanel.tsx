"use client";

import { won, compactWon } from "../lib/format";

export interface Loan {
  id: number;
  balance: number;
  rate: number; // % (30초마다 복리)
}

interface Props {
  loans: Loan[];
  nextRate: number;
  cash: number;
  onBorrow: () => void;
  onRepay: (loanId: number) => void;
}

export const LOAN_AMOUNT = 1_000_000;
export const INTEREST_TICK_MS = 30_000;

export default function LoanPanel({ loans, nextRate, cash, onBorrow, onRepay }: Props) {
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0);

  return (
    <section className="pixel-panel p-3 shrink-0 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-royal tracking-widest whitespace-nowrap">
          🏚️ 막장캐피탈
        </h2>
        <p className="text-sm whitespace-nowrap">
          부채:{" "}
          <span className={totalDebt > 0 ? "text-loss font-bold" : "text-gain"} title={won(totalDebt)}>
            {compactWon(totalDebt)}
          </span>
        </p>
        <button
          onClick={onBorrow}
          className="pixel-btn bg-royal text-black font-bold px-3 py-1.5 text-sm cursor-pointer whitespace-nowrap"
        >
          100만원 빌리기 (이자 {nextRate}%)
        </button>
      </div>

      {loans.length > 0 && (
        <ul className="pixel-inset divide-y-2 divide-black/60 max-h-16 overflow-y-auto">
          {loans.map((l) => (
            <li key={l.id} className="flex items-center justify-between px-2 py-1">
              <span className="text-sm">
                <span className="text-loss" title={won(l.balance)}>{compactWon(l.balance)}</span>
                <span className="text-xs opacity-70"> (이자 {l.rate}%)</span>
              </span>
              <button
                onClick={() => onRepay(l.id)}
                disabled={cash < 1}
                className="pixel-btn bg-gold text-black font-bold px-2 py-1 text-sm cursor-pointer"
              >
                상환
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs opacity-60 leading-4">
        이자는 30초마다 복리. 대출마다 다음 이자율 2배 (1%→2%→4%...). 상환은 보유
        현금만큼 갚습니다.
      </p>
    </section>
  );
}
