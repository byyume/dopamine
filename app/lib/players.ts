// 멀티플레이 시뮬레이션 — 백엔드가 없으므로 봇 플레이어들의 순자산을
// 랜덤 워크로 움직여 "실시간 접속자 랭킹" 느낌을 만든다.

const NAME_PREFIX = [
  "존버",
  "익절",
  "물타기",
  "풀매수",
  "영끌",
  "한탕",
  "떡상",
  "졸업",
  "슈퍼개미",
  "동학",
  "불나방",
  "달나라",
  "빚투",
  "손절",
  "우량주",
  "잭팟",
  "고래",
  "낙관",
  "패닉",
  "코인",
];

const NAME_SUFFIX = [
  "요정",
  "장인",
  "고수",
  "king",
  "마스터",
  "전설",
  "채굴러",
  "여신",
  "부장",
  "회장",
  "천재",
  "귀신",
  "머신",
  "대감",
  "느님",
  "충전소",
  "공장장",
  "사냥꾼",
  "빌런",
  "요괴",
];

export function randomName(): string {
  const p = NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)];
  const s = NAME_SUFFIX[Math.floor(Math.random() * NAME_SUFFIX.length)];
  const n = Math.floor(Math.random() * 99) + 1;
  return `${p}${s}${n}`;
}

export interface Bot {
  id: number;
  name: string;
  worth: number;
}

// 봇 순자산 초기 분포: 파산 직전부터 대박까지 넓게 흩뿌린다.
function randomWorth(): number {
  const r = Math.random();
  if (r < 0.15) return Math.floor(-800_000 + Math.random() * 700_000); // 빚더미
  if (r < 0.75) return Math.floor(50_000 + Math.random() * 900_000); // 서민층
  return Math.floor(1_000_000 + Math.random() * 12_000_000); // 큰손
}

export function initBots(count = 11): Bot[] {
  const used = new Set<string>();
  const bots: Bot[] = [];
  for (let i = 0; i < count; i++) {
    let name = randomName();
    while (used.has(name)) name = randomName();
    used.add(name);
    bots.push({ id: i + 1, name, worth: randomWorth() });
  }
  return bots;
}

// 한 틱마다 봇 순자산을 랜덤 워크로 갱신. 가끔 슬롯 잭팟/폭락처럼 크게 튄다.
export function tickBots(bots: Bot[]): Bot[] {
  return bots.map((b) => {
    let next = b.worth;
    const base = Math.max(100_000, Math.abs(b.worth));
    // 평소엔 ±8% 수준의 잔파동
    next += (Math.random() - 0.48) * base * 0.16;
    // 5% 확률로 한탕/파산 급변동
    if (Math.random() < 0.05) {
      next += (Math.random() < 0.5 ? 1 : -1) * base * (0.3 + Math.random() * 0.9);
    }
    return { ...b, worth: Math.floor(next) };
  });
}
