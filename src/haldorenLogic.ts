export type ViewMode = 'hero' | 'case';

export interface PoseResult {
  s: number;
  x: number;
  y: number;
}

export interface HeroFit {
  wmLeft: number;
  wmWidth: number;
  badgeLeft: number;
  badgeTop: number;
  scriptLeft: number;
}

export function computePose(
  mode: ViewMode,
  W: number,
  H: number,
  ticketHeight = 140,
  descHeight = 90
): PoseResult {
  const mob = W <= 820;
  if (!mob) {
    const cover = Math.max(W / 1440, H / 810);
    const u = Math.min(W / 1440, H / 900);
    if (mode === 'hero') {
      return {
        s: cover,
        x: (W - 1440 * cover) / 2,
        y: 0,
      };
    }
    const top = 66 * u;
    const fit = (H - top - 28 * u) / (762 - 79);
    if (fit >= cover) {
      return {
        s: cover,
        x: (W - 1440 * cover) / 2,
        y: Math.min(0, Math.max(H - 810 * cover, top - 79 * cover)),
      };
    }
    return {
      s: fit,
      x: (W - 1440 * fit) / 2,
      y: top - 79 * fit,
    };
  }

  if (mode === 'hero') {
    const s = Math.min(W / 650, (0.62 * H) / 810);
    return {
      s,
      x: W / 2 - 805 * s,
      y: H - 790 * s,
    };
  }

  const navH = 0.022 * H + 42 + 22;
  const uiBottom = 62 + ticketHeight + 18 + Math.max(60, descHeight) + 14;
  const s = Math.min(
    (W - 28) / 905,
    Math.max(0.2, (H - navH - uiBottom) / (762 - 95))
  );
  return {
    s,
    x: W / 2 - 720 * s,
    y: H - navH - 762 * s,
  };
}

export function computeHeroFit(p: PoseResult, W: number, H: number): HeroFit {
  const vl = Math.max(0, -p.x / p.s);
  const vr = Math.min(1440, (W - p.x) / p.s);
  const pad = 18 / p.s;
  const vb = Math.min(810, (H - p.y) / p.s);
  return {
    wmLeft: vl + 0.6 * pad,
    wmWidth: vr - vl - 1.2 * pad,
    badgeLeft: Math.min(986, vr - pad - 417),
    badgeTop: Math.min(-165, vb - 56 / p.s - 935),
    scriptLeft: vl + pad + 70,
  };
}

export function computeDivePlaybackRate(progress: number): number {
  const clamped = Math.max(0, Math.min(progress, 1));
  return Math.max(1.2, 1.8 + 2.4 * Math.sin(Math.PI * Math.min(clamped * 1.08, 1)));
}

export function nextCaseIndex(cur: number, total: number): number {
  return (cur + 1) % total;
}

export function prevCaseAction(cur: number): { action: 'toHero' | 'swap'; index: number } {
  if (cur <= 0) return { action: 'toHero', index: 0 };
  return { action: 'swap', index: cur - 1 };
}
