export function capHorizontalSpeed(vx, maxSpeed) {
  if (vx > maxSpeed) {
    return maxSpeed;
  }
  if (vx < -maxSpeed) {
    return -maxSpeed;
  }
  return vx;
}

export function computeHorizontalStep({
  vx,
  inputDirection,
  dt,
  acceleration,
  drag,
  maxSpeed
}) {
  let next = vx;

  if (inputDirection !== 0) {
    next += inputDirection * acceleration * dt;
  } else if (next !== 0) {
    const dragAmount = drag * dt;
    if (Math.abs(next) <= dragAmount) {
      next = 0;
    } else {
      next -= Math.sign(next) * dragAmount;
    }
  }

  return capHorizontalSpeed(next, maxSpeed);
}

export function applyJumpCut(currentVy, jumpCutMultiplier) {
  if (currentVy >= 0) {
    return currentVy;
  }
  return currentVy * jumpCutMultiplier;
}

export function simulateHorizontalRun({
  durationMs = 1000,
  dtMs = 1000 / 60,
  acceleration = 1800,
  maxSpeed = 220
} = {}) {
  const dt = dtMs / 1000;
  const steps = Math.round(durationMs / dtMs);
  let vx = 0;
  for (let i = 0; i < steps; i += 1) {
    vx = computeHorizontalStep({
      vx,
      inputDirection: 1,
      dt,
      acceleration,
      drag: 0,
      maxSpeed
    });
  }
  return vx;
}

export function simulateJumpApex({
  holdDurationMs,
  dtMs = 1000 / 120,
  gravity = 1200,
  jumpVelocity = -430,
  jumpCutMultiplier = 0.45
}) {
  const dt = dtMs / 1000;
  let y = 0;
  let vy = jumpVelocity;
  let timeMs = 0;
  let released = false;
  let minY = 0;

  while (timeMs < 5000) {
    if (!released && timeMs >= holdDurationMs) {
      vy = applyJumpCut(vy, jumpCutMultiplier);
      released = true;
    }

    vy += gravity * dt;
    y += vy * dt;

    if (y < minY) {
      minY = y;
    }

    timeMs += dtMs;

    if (y >= 0 && vy > 0 && timeMs > 100) {
      break;
    }
  }

  return Math.abs(minY);
}
