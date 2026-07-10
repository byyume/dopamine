"use client";

import { won } from "../lib/format";

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
    <section className="pixel-panel p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold text-royal text-center tracking-widest">
        🏚️ 막장캐피탈 대부 🏚️
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          총 부채:{" "}
          <span className={totalDebt > 0 ? "text-loss font-bold" : "text-gain"}>
            {won(totalDebt)}
          </span>
        </p>
        <button
          onClick={onBorrow}
          className="pixel-btn bg-royal text-black font-bold px-4 py-2 cursor-pointer"
        >
          {won(LOAN_AMOUNT)} 빌리기 (이자 {nextRate}%)
        </button>
      </div>

      {loans.length > 0 && (
        <ul className="pixel-inset divide-y-2 divide-black/60 max-h-40 overflow-y-auto">
          {loans.map((l) => (
            <li key={l.id} className="flex items-center justify-between px-3 py-2">
              <span>
                <span className="text-loss">{won(l.balance)}</span>
                <span className="text-xs opacity-70"> (이자 {l.rate}%)</span>
              </span>
              <button
                onClick={() => onRepay(l.id)}
                disabled={cash < 1}
                className="pixel-btn bg-gold text-black font-bold px-3 py-1 text-sm cursor-pointer"
              >
                상환
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs opacity-60">
        이자는 30초마다 복리로 붙습니다. 대출을 받을 때마다 다음 이자율이 2배가
        됩니다 (1% → 2% → 4% → ...). 상환 버튼은 보유 현금만큼 갚습니다.
      </p>
    </section>
  );
}
