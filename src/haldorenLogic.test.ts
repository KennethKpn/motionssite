import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePose,
  computeHeroFit,
  computeDivePlaybackRate,
  computeDiveChoreography,
  nextCaseIndex,
  advanceCaseOrExit,
  prevCaseAction,
  shouldHeroInterceptWheel,
} from './haldorenLogic';

test('desktop hero pose covers 1440x900 top-anchored', () => {
  const p = computePose('hero', 1440, 900);
  assert.ok(Math.abs(p.s - 900 / 810) < 1e-6);
  assert.equal(p.y, 0);
  assert.ok(p.x < 0);
});

test('desktop case pose fits laptop between nav and bottom on 1440x900', () => {
  const p = computePose('case', 1440, 900);
  const laptopTop = p.y + 79 * p.s;
  const laptopBottom = p.y + 762 * p.s;
  assert.ok(laptopTop >= 65.9);
  assert.ok(laptopBottom <= 900 - 27.9);
});

test('desktop fitHero keeps wordmark and badge inside visible frame', () => {
  const p = computePose('hero', 1440, 900);
  const fit = computeHeroFit(p, 1440, 900);
  assert.ok(fit.wmLeft > 0);
  assert.ok(fit.wmWidth < 1440);
  assert.ok(fit.badgeLeft <= 986);
  assert.ok(fit.badgeTop <= -165);
  assert.ok(fit.scriptLeft > fit.wmLeft);
});

test('mobile hero and case pose anchor man and laptop cleanly at 390x844', () => {
  const hero = computePose('hero', 390, 844);
  assert.ok(Math.abs(hero.s - 390 / 650) < 1e-6);
  assert.ok(hero.y > 0);
  assert.ok(Math.abs(hero.x - (390 / 2 - 725 * hero.s)) < 1e-6);

  const c = computePose('case', 390, 844, 150, 85);
  assert.ok(c.s > 0.2);
  assert.ok(c.y + 762 * c.s < 844);
});

test('dive playbackRate eases in, peaks near 4.2x mid-move, and stays >= 1.2x', () => {
  const start = computeDivePlaybackRate(0);
  const mid = computeDivePlaybackRate(0.46);
  const end = computeDivePlaybackRate(1);
  assert.ok(Math.abs(start - 1.8) < 1e-6);
  assert.ok(mid > 4.1 && mid <= 4.21);
  assert.ok(end >= 1.2 && end <= 1.81);
});

test('case navigation advances to scrollNext at last case and returns to hero on prev from first case', () => {
  assert.equal(nextCaseIndex(0, 3), 1);
  assert.equal(nextCaseIndex(2, 3), 0);
  assert.deepEqual(advanceCaseOrExit(0, 3), { action: 'swap', index: 1 });
  assert.deepEqual(advanceCaseOrExit(2, 3), { action: 'scrollNext', index: 2 });
  assert.deepEqual(prevCaseAction(0), { action: 'toHero', index: 0 });
  assert.deepEqual(prevCaseAction(2), { action: 'swap', index: 1 });
});

test('shouldHeroInterceptWheel hands control smoothly to page scroll at Case 3 downward or below fold', () => {
  assert.equal(shouldHeroInterceptWheel(0, 0, 0, 3, 24), true);
  assert.equal(shouldHeroInterceptWheel(0, 0, 0, 3, -24), false);
  assert.equal(shouldHeroInterceptWheel(0, 1, 2, 3, 24), false);
  assert.equal(shouldHeroInterceptWheel(0, 1, 2, 3, -24), true);
  assert.equal(shouldHeroInterceptWheel(320, 1, 2, 3, -24), false);
});

test('scroll-synchronized choreography runs cleanly across 0%, 20%, 40%, 60%, 80%, 100%', () => {
  const c0 = computeDiveChoreography(0);
  const c20 = computeDiveChoreography(0.2);
  const c40 = computeDiveChoreography(0.4);
  const c60 = computeDiveChoreography(0.6);
  const c80 = computeDiveChoreography(0.8);
  const c100 = computeDiveChoreography(1);

  assert.equal(c0.heldLaptopOpacity, 1);
  assert.equal(c0.laptop3dOpacity, 0);
  assert.equal(c0.casePlateOpacity, 0);
  assert.equal(c0.screenOpacity, 0);
  assert.equal(c0.isCaseActive, false);

  assert.ok(c20.headTurnDeg > 3.5);
  assert.ok(c20.armLiftDeg < -8);
  assert.equal(c20.heldLaptopOpacity, 0);
  assert.equal(c20.laptop3dOpacity, 1);
  assert.equal(c20.casePlateOpacity, 0);

  assert.equal(c40.charOpacity, 0);
  assert.equal(c60.studioBgOpacity, 0);
  assert.ok(c40.laptopYawDeg > c20.laptopYawDeg && c40.laptopYawDeg < 0);
  assert.ok(c60.laptopYawDeg > c40.laptopYawDeg && c60.laptopYawDeg < 0);
  assert.ok(c80.laptopYawDeg > c60.laptopYawDeg && c80.laptopYawDeg <= 0);
  assert.ok(c60.specularPhase > 0.3 && c60.specularPhase < 0.8);
  assert.equal(c40.casePlateOpacity, 0);
  assert.equal(c60.casePlateOpacity, 0);
  assert.equal(c80.casePlateOpacity, 0);

  assert.equal(c100.laptopYawDeg, 0);
  assert.equal(c100.laptopScale, 1);
  assert.equal(c100.casePlateOpacity, 1);
  assert.equal(c100.screenOpacity, 1);
  assert.equal(c100.caseUiOpacity, 1);
  assert.equal(c100.isCaseActive, true);

  assert.equal(computeDiveChoreography(-0.5).progress, 0);
  assert.equal(computeDiveChoreography(2.0).progress, 1);
});
