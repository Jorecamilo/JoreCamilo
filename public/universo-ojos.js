// Lightweight, fixed-step particle pile. Coordinates use a 600-unit canvas.
export function createEyeRain(field) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lluvia-ojos'; canvas.hidden = true;
  field.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [], raf = 0, start = 0, last = 0, elapsed = 0, accumulator = 0;
  let width = 600, height = 600, count = 160, frames = 0, totalWork = 0;
  let shown = false, finished = false;
  const random = (a, b) => a + Math.random() * (b - a);
  function resize() {
    const oldHeight = height;
    height = 600 * Math.max(1, field.clientHeight) / Math.max(1, field.clientWidth);
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(field.clientWidth * ratio);
    canvas.height = Math.round(field.clientHeight * ratio);
    for (const p of particles) p.y += height - oldHeight;
    draw();
  }
  function spawn() {
    const radius = random(13, 23);
    particles.push({ x: 300 + random(-1, 1) * random(15, 135), y: -radius * 2,
      r: radius, vy: random(45, 110), vx: random(-25, 25), angle: random(-.45, .45),
      spin: random(-.7, .7), type: Math.floor(random(0, 3)) });
  }
  function step(dt, time) {
    const fraction = Math.min(1, time / 2.8);
    const desired = Math.floor(count * fraction * fraction);
    while (particles.length < desired) spawn();
    const gravity = Math.max(2200, height * 6);
    for (const p of particles) {
      if (p.rest) continue;
      p.vy += gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
    // Flattened collision envelopes match the almond-shaped drawings.
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (a.rest && b.rest) continue;
          const dx = b.x - a.x, dy = (b.y - a.y) / .55;
          const sum = (a.r + b.r) * .93;
          if (Math.abs(dx) >= sum || Math.abs(dy) >= sum) continue;
          const d = Math.hypot(dx, dy) || .001;
          if (d >= sum) continue;
          const nx = dx / d, ny = dy / d, overlap = (sum - d) / (a.rest || b.rest ? 1 : 2);
          if (!a.rest) { a.x -= nx * overlap; a.y -= ny * overlap * .55; }
          if (!b.rest) { b.x += nx * overlap; b.y += ny * overlap * .55; }
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            a.vx += relative * nx * .5; b.vx -= relative * nx * .5;
            a.vy += relative * ny * .5; b.vy -= relative * ny * .5;
          }
          a.spin *= .85; b.spin *= .85;
          a.vx *= .6; b.vx *= .6;
          if (b.rest && ny > .94) a.rest = true;
          if (a.rest && ny < -.94) b.rest = true;
          if (a.rest) { a.vx = a.vy = a.spin = 0; }
          if (b.rest) { b.vx = b.vy = b.spin = 0; }
        }
        a.x = Math.max(a.r, Math.min(width - a.r, a.x));
        const floor = height - 18 - a.r * .55;
        if (a.y > floor) { a.y = floor; a.rest = true; a.vy = 0; a.vx *= .7; a.spin *= .6; }
        if (time > 3.5) { a.vx *= .8; a.vy *= .8; a.spin *= .8; }
      }
    }
  }
  function drawEye(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    const r = p.r;
    ctx.lineWidth = 1.1; ctx.strokeStyle = '#000'; ctx.fillStyle = p.type === 2 ? '#000' : '#fff';
    ctx.beginPath(); ctx.moveTo(-r, 0);
    ctx.bezierCurveTo(-r * .4, -r * .8, r * .45, -r * .7, r, 0);
    ctx.bezierCurveTo(r * .4, r * .65, -r * .5, r * .7, -r, 0);
    ctx.fill(); ctx.stroke();
    if (p.type !== 1) {
      ctx.strokeStyle = p.type === 2 ? '#fff' : '#000';
      ctx.beginPath(); ctx.arc(0, 0, r * .32, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = p.type === 2 ? '#fff' : '#000';
      ctx.beginPath(); ctx.arc(0, 0, r * .14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#000'; ctx.lineWidth = .7;
    for (let i = -2; i <= 2; i++) {
      const x = i * r * .27, y = -r * .46 * (1 - (x / r) ** 2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 1.12, y - r * .14); ctx.stroke();
    }
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) drawEye(p);
  }
  function frame(now) {
    raf = 0;
    if (!shown) return;
    const workStart = performance.now();
    elapsed = Math.min(4, (now - start) / 1000);
    accumulator += Math.min(.1, (now - last) / 1000); last = now;
    while (accumulator >= 1 / 120) { step(1 / 120, elapsed); accumulator -= 1 / 120; }
    draw(); frames++; totalWork += performance.now() - workStart;
    finished = elapsed >= 4;
    canvas.dataset.state = JSON.stringify({ elapsed, count: particles.length, finished, frames,
      averageWorkMs: totalWork / frames, wallMs: now - start });
    if (!finished) raf = requestAnimationFrame(frame);
  }
  const observer = new ResizeObserver(resize); observer.observe(field);
  return {
    show(restart = false) {
      if (restart || !particles.length) {
        cancelAnimationFrame(raf); particles = []; finished = false; elapsed = 0;
        frames = 0; totalWork = 0; accumulator = 0; count = field.clientWidth < 500 ? 90 : 120;
        start = last = performance.now();
      }
      shown = true; canvas.hidden = false; resize();
      if (!finished && !raf) raf = requestAnimationFrame(frame);
    },
    hide() { shown = false; canvas.hidden = true; cancelAnimationFrame(raf); raf = 0; },
    dispose() { this.hide(); observer.disconnect(); canvas.remove(); }
  };
}
