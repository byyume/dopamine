"use client";

import { useEffect, useState } from "react";
import { Bot, initBots, tickBots } from "../lib/players";
import { compactWon } from "../lib/format";

interface Props {
  myNetWorth: number;
  playerName: string;
  onRename: (name: string) => void;
}

const RANK_TICK_MS = 2_500; // 접속자 순자산 실시간 갱신 주기

interface Row {
  id: string;
  name: string;
  worth: number;
  isMe: boolean;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function RankingPanel({ myNetWorth, playerName, onRename }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(playerName);

  // 봇은 랜덤이라 클라이언트 마운트 후 생성 (SSR 하이드레이션 불일치 방지)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBots(initBots());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 실시간 갱신
  useEffect(() => {
    if (bots.length === 0) return;
    const iv = setInterval(() => setBots((prev) => tickBots(prev)), RANK_TICK_MS);
    return () => clearInterval(iv);
  }, [bots.length]);

  const rows: Row[] = [
    ...bots.map((b) => ({ id: `bot-${b.id}`, name: b.name, worth: b.worth, isMe: false })),
    { id: "me", name: playerName, worth: myNetWorth, isMe: true },
  ].sort((a, b) => b.worth - a.worth);

  const myRank = rows.findIndex((r) => r.isMe) + 1;

  function startEdit() {
    setDraft(playerName);
    setEditing(true);
  }
  function commit() {
    const name = draft.trim().slice(0, 12);
    if (name) onRename(name);
    setEditing(false);
  }

  return (
    <section className="pixel-panel p-4 flex-1 min-h-0 flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-gold tracking-widest">🏆 실시간 랭킹</h2>
        <span className="text-sm text-info">
          접속 {rows.length}명 · 내 순위 <b className="text-gold">{myRank}위</b>
        </span>
      </div>

      {/* 내 이름 / 이름 변경 */}
      <div className="pixel-inset px-3 py-2 flex items-center gap-2 shrink-0">
        <span className="text-sm opacity-70 shrink-0">닉네임</span>
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              maxLength={12}
              className="flex-1 min-w-0 bg-black/40 border-2 border-black px-2 py-1 text-sm text-gold outline-none"
            />
            <button
              onClick={commit}
              className="pixel-btn bg-gain text-black font-bold px-3 py-1 text-sm cursor-pointer shrink-0"
            >
              확인
            </button>
          </>
        ) : (
          <>
            <b className="flex-1 min-w-0 truncate text-base text-gold">{playerName}</b>
            <button
              onClick={startEdit}
              className="pixel-btn bg-panel-dark px-3 py-1 text-sm cursor-pointer shrink-0"
            >
              ✏️ 이름 변경
            </button>
          </>
        )}
      </div>

      <ul className="pixel-inset divide-y-2 divide-black/60 overflow-y-auto flex-1 min-h-0">
        {rows.length <= 1 && (
          <li className="px-3 py-4 text-sm opacity-50 text-center">
            접속자를 불러오는 중...
          </li>
        )}
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={`flex items-center gap-2 px-3 py-2 ${
              r.isMe ? "bg-gold/20" : i % 2 ? "bg-white/[0.02]" : ""
            }`}
          >
            <span className="w-8 text-center text-base shrink-0">
              {i < 3 ? MEDAL[i] : <span className="opacity-70">{i + 1}</span>}
            </span>
            <span
              className={`flex-1 min-w-0 truncate text-sm ${
                r.isMe ? "text-gold font-bold" : ""
              }`}
            >
              {r.name}
              {r.isMe && <span className="text-info"> (나)</span>}
            </span>
            <span
              className={`text-sm font-bold whitespace-nowrap ${
                r.worth >= 0 ? "text-gain" : "text-loss"
              }`}
              title={`${Math.floor(r.worth).toLocaleString("ko-KR")}원`}
            >
              {compactWon(r.worth)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
