import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePose,
  computeHeroFit,
  computeDivePlaybackRate,
  nextCaseIndex,
  prevCaseAction,
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

test('case navigation wraps forward and returns to hero on prev from first case', () => {
  assert.equal(nextCaseIndex(0, 3), 1);
  assert.equal(nextCaseIndex(2, 3), 0);
  assert.deepEqual(prevCaseAction(0), { action: 'toHero', index: 0 });
  assert.deepEqual(prevCaseAction(2), { action: 'swap', index: 1 });
});
