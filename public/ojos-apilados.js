// Viewport rain with lightweight prepacked support layers (linear per frame).
export function createEyeRain(field) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lluvia-ojos'; canvas.hidden = true; canvas.setAttribute('aria-hidden', 'true');
  field.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [], raf = 0, start = 0, width = 0, height = 0, shown = false, finished = false;
  let frames = 0, totalWork = 0;
  const random = (a, b) => a + Math.random() * (b - a);
  function layout() {
    width = field.clientWidth; height = field.clientHeight;
    const ratio = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const radius = width < 761 ? 20 : 25;
    const columns = Math.ceil(width / (radius * 1.65));
    const rows = Math.ceil(height / (radius * .75)) + 2;
    const dx = width / columns, dy = height / (rows - 1);
    particles = [];
    for (let row = 0; row < rows; row++) {
      for (let col = -1; col <= columns; col++) {
        const r = radius * random(.92, 1.12);
        const x = (col + .5 + (row % 2) * .5) * dx + random(-2, 2);
        const target = height - row * dy + random(-2, 2);
        const birth = Math.max(0, (row / rows) * 3.05 + random(-.06, .06));
        const fall = .45 + .24 * (1 - row / rows);
        particles.push({x, y:-r*2, target, r, birth, fall, angle:random(-.24,.24),
          turn:random(-.45,.45), type:Math.floor(random(0,3))});
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
  function draw(time) {
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const age = time - p.birth;
      if (age < 0) continue;
      const t = Math.min(1, age / p.fall);
      // Gravity accelerates each eye into its support layer; a small damped
      // rebound settles the impact without quadratic particle comparisons.
      const settle = Math.max(0, age - p.fall);
      const bounce = t === 1 && settle < .24 ? Math.sin(settle / .24 * Math.PI) * p.r * .12 : 0;
      p.y = -p.r * 2 + (p.target + p.r * 2) * t * t - bounce;
      drawEye({...p, angle:p.angle + p.turn * (1 - t)});
    }
  }
  function frame(now) {
    raf = 0; if (!shown) return;
    const workStart = performance.now();
    const time = Math.min(4, (now - start) / 1000);
    draw(time); frames++; totalWork += performance.now() - workStart;
    finished = time >= 4;
    canvas.dataset.state = JSON.stringify({elapsed:time,count:particles.length,finished,frames,
      averageWorkMs:totalWork/frames,wallMs:now-start});
    if (!finished) raf = requestAnimationFrame(frame);
  }
  function resize() {
    if (width === field.clientWidth && height === field.clientHeight) return;
    layout(); if (shown) draw(finished ? 4 : Math.min(4,(performance.now()-start)/1000));
  }
  const observer = new ResizeObserver(() => { if (shown) resize(); }); observer.observe(field);
  return {
    show(restart = false) {
      if (restart || !particles.length) {
        cancelAnimationFrame(raf); raf = 0; layout(); finished = false;
        frames = 0; totalWork = 0; start = performance.now();
      }
      shown = true; canvas.hidden = false; resize();
      if (finished) draw(4);
      else if (!raf) raf = requestAnimationFrame(frame);
    },
    hide() { shown = false; canvas.hidden = true; cancelAnimationFrame(raf); raf = 0; },
    dispose() { this.hide(); observer.disconnect(); canvas.remove(); }
  };
}
