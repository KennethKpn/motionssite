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
      x: W / 2 - 725 * s,
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

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface DiveChoreography {
  progress: number;
  uiOut: number;
  framePoseBlend: number;
  charGesture: number;
  headTurnDeg: number;
  headShiftX: number;
  torsoLeanDeg: number;
  armLiftDeg: number;
  armShiftX: number;
  armShiftY: number;
  charOpacity: number;
  studioScale: number;
  studioBgOpacity: number;
  heldLaptopOpacity: number;
  laptop3dOpacity: number;
  laptopX: number;
  laptopY: number;
  laptopScale: number;
  laptopYawDeg: number;
  laptopPitchDeg: number;
  laptopRollDeg: number;
  specularPhase: number;
  shadowAlpha: number;
  casePlateOpacity: number;
  screenOpacity: number;
  caseUiOpacity: number;
  isCaseActive: boolean;
}

export function computeDiveChoreography(rawProgress: number): DiveChoreography {
  const p = clamp01(rawProgress);

  const uiOut = smoothstep(0.0, 0.16, p);
  const framePoseBlend = easeInOutCubic(smoothstep(0.08, 0.90, p));

  // Character reaction: looks toward laptop, leans slightly, extends left forearm to present it
  const charGesture = smoothstep(0.02, 0.28, p);
  const headTurnDeg = lerp(0, 6.5, charGesture);
  const headShiftX = lerp(0, 4.5, charGesture);
  const torsoLeanDeg = lerp(0, 1.8, smoothstep(0.04, 0.30, p));
  const armLiftDeg = lerp(0, -14, smoothstep(0.02, 0.26, p));
  const armShiftX = lerp(0, 16, smoothstep(0.02, 0.26, p));
  const armShiftY = lerp(0, -22, smoothstep(0.02, 0.26, p));

  const charOpacity = 1 - smoothstep(0.22, 0.38, p);
  const studioScale = lerp(1.0, 1.38, easeInOutCubic(smoothstep(0.04, 0.46, p)));
  const studioBgOpacity = 1 - smoothstep(0.24, 0.50, p);

  // Clean handoff from held photographic laptop cutout to 3D Canvas aluminum laptop
  const heldLaptopOpacity = 1 - smoothstep(0.03, 0.075, p);
  const laptop3dOpacity = smoothstep(0.02, 0.065, p) * (1 - smoothstep(0.86, 0.93, p));

  // 2-stage 3D trajectory matching r1-dive.webm:
  // Stage A (0.04..0.30): lifts gently off palm while retaining silver-back/profile orientation (yaw -114 -> -92)
  // Stage B (0.30..0.86): sweeps smoothly CCW from side profile to square-on center (yaw -92 -> 0)
  const liftT = smoothstep(0.04, 0.30, p);
  const rotT = smoothstep(0.30, 0.86, p);

  let laptopX: number;
  let laptopY: number;
  let laptopScale: number;
  let laptopYawDeg: number;
  let laptopPitchDeg: number;
  let laptopRollDeg: number;

  if (p <= 0.30) {
    laptopX = lerp(956, 860, liftT);
    laptopY = lerp(522, 504, liftT);
    laptopScale = lerp(0.245, 0.38, liftT);
    laptopYawDeg = lerp(-114, -92, liftT);
    laptopPitchDeg = lerp(11, 9.0, liftT);
    laptopRollDeg = lerp(-7, -4, liftT);
  } else {
    laptopX = lerp(860, 720, rotT);
    laptopY = lerp(504, 446, rotT);
    laptopScale = lerp(0.38, 1.0, rotT);
    laptopYawDeg = lerp(-92, 0, rotT);
    laptopPitchDeg = lerp(9.0, 2.0, smoothstep(0.42, 0.86, p));
    laptopRollDeg = lerp(-4, 0, rotT);
  }

  const specularPhase = clamp01((p - 0.34) / 0.48);
  const shadowAlpha = smoothstep(0.10, 0.26, p) * (1 - smoothstep(0.86, 0.93, p));

  const casePlateOpacity = smoothstep(0.84, 0.92, p);
  const screenOpacity = smoothstep(0.88, 0.96, p);
  const caseUiOpacity = smoothstep(0.92, 1.0, p);

  return {
    progress: p,
    uiOut,
    framePoseBlend,
    charGesture,
    headTurnDeg,
    headShiftX,
    torsoLeanDeg,
    armLiftDeg,
    armShiftX,
    armShiftY,
    charOpacity,
    studioScale,
    studioBgOpacity,
    heldLaptopOpacity,
    laptop3dOpacity,
    laptopX,
    laptopY,
    laptopScale,
    laptopYawDeg,
    laptopPitchDeg,
    laptopRollDeg,
    specularPhase,
    shadowAlpha,
    casePlateOpacity,
    screenOpacity,
    caseUiOpacity,
    isCaseActive: p >= 0.985,
  };
}

