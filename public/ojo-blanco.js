// Album artwork: one playback per document, independent of song/audio controls.
export function createWhiteEye(container) {
  const video = container.querySelector('video');
  const still = container.querySelector('img');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false;
  video.muted = true;
  function fallback() {
    finished = true;
    video.pause(); video.hidden = true; still.hidden = false;
  }
  function show() {
    container.hidden = false;
    container.parentElement.setAttribute('aria-hidden', 'false');
    if (motion.matches) { fallback(); return; }
    if (!finished) video.play().catch(() => {
      if (!container.hidden) fallback();
    });
  }
  function hide() { container.hidden = true; video.pause(); }
  video.addEventListener('ended', () => { finished = true; });
  video.addEventListener('error', fallback);
  video.querySelector('source:last-child').addEventListener('error', fallback);
  motion.addEventListener('change', () => { if (motion.matches) fallback(); });
  // Reduced motion must not briefly autoplay before initialization.
  if (motion.matches) fallback();
  return { show, hide };
}
