// A single formation per visit, then a native video loop. Audio is independent.
export function createWhiteEye(container) {
  const intro = container.querySelector('.ojo-formacion');
  const loop = container.querySelector('.ojo-vivo');
  const still = container.querySelector('img');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 'formation', request = 0, prepared = false;
  intro.muted = loop.muted = true;
  function prepareLoop() {
    if (prepared) return;
    prepared = true; loop.preload = 'auto'; loop.load();
  }
  function fallback(error) {
    intro.pause(); loop.pause(); intro.hidden = loop.hidden = true; still.hidden = false;
    if (error) console.warn('OJO_BLANCO: no se pudo reproducir el vídeo', error.message || error);
  }
  async function playLoop() {
    if (container.hidden || motion.matches) return;
    const token = ++request; prepareLoop();
    loop.hidden = false;
    try {
      await loop.play();
      // Keep the last formation frame above the loop until its first frame is decoded.
      const reveal = () => {
        if (token === request && !container.hidden && !motion.matches) { intro.hidden = true; still.hidden = true; }
      };
      if (loop.requestVideoFrameCallback) loop.requestVideoFrameCallback(reveal); else reveal();
    } catch (error) { if (error.name !== 'AbortError' && !container.hidden) fallback(error); }
  }
  function show() {
    container.hidden = false;
    container.parentElement.setAttribute('aria-hidden', 'false');
    if (motion.matches) { fallback(); return; }
    still.hidden = true;
    if (phase === 'loop') playLoop();
    else {
      intro.hidden = false;
      intro.play().catch(error => { if (error.name !== 'AbortError' && !container.hidden) fallback(error); });
    }
  }
  function hide() { request++; container.hidden = true; intro.pause(); loop.pause(); }
  intro.addEventListener('timeupdate', () => { if (intro.currentTime >= 3) prepareLoop(); });
  intro.addEventListener('ended', () => { phase = 'loop'; playLoop(); });
  intro.addEventListener('error', () => fallback(intro.error));
  loop.addEventListener('error', () => fallback(loop.error));
  motion.addEventListener('change', () => { if (motion.matches) fallback(); else if (!container.hidden) show(); });
  if (motion.matches) fallback();
  return { show, hide };
}
