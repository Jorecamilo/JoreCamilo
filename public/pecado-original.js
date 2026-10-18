import { createEyeRain } from './universo-ojos.js';
import { createAudioTest } from './universo-audio.js';
const field = document.getElementById('pieza-campo');
const index = document.querySelector('.indice');
const video = document.getElementById('cojito-album');
const rain = createEyeRain(field);
const player = createAudioTest(field);
let selected = null;
function size() {
  field.style.left = matchMedia('(max-width: 760px)').matches ? '0px' : `${index.getBoundingClientRect().right}px`;
}
const observer = new ResizeObserver(size); observer.observe(index);
window.addEventListener('resize', size); size();
for (const button of document.querySelectorAll('.cancion-trigger')) {
  button.addEventListener('click', () => {
    selected = button.dataset.cancion;
    field.dataset.cancion = selected;
    rain.hide(); player.hide(); video.pause(); video.hidden = true;
    const white = selected !== 'el-monte-la-flor';
    document.documentElement.classList.toggle('tema-blanco', white);
    for (const item of document.querySelectorAll('.cancion-trigger')) item.setAttribute('aria-pressed', String(item === button));
    if (selected === 'madravilla') {
      video.hidden = false; video.muted = true; player.show();
      video.play().catch(error => { if (error.name !== 'AbortError') console.warn('COJITO_PLAY', error.message); });
    }
  });
}
requestAnimationFrame(() => { document.documentElement.classList.add('tema-blanco'); rain.show(true); });
window.addEventListener('pagehide', () => { rain.hide(); player.hide(); video.pause(); });
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    if (selected) document.querySelector(`[data-cancion="${selected}"]`).click();
    else rain.show(true);
  }
});
