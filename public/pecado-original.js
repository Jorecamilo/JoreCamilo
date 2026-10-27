import { createEyeRain } from './ojos-apilados.js';
import { createAlbumParts } from './album-partes.js';
import { createWhiteEye } from './ojo-blanco.js';
import { createSongVisual } from './cancion-visual.js';
import { createAudioTest } from './universo-audio.js';
createAlbumParts(document.getElementById('album-partes'));
const field = document.getElementById('pieza-campo');
const index = document.querySelector('.indice');
const video = document.getElementById('cojito-album');
const artist = document.getElementById('artista-vista');
const songVisual = createSongVisual(field, video);
const eye = createWhiteEye(document.getElementById('ojo-blanco'));
const player = createAudioTest(field);
const rainField = document.getElementById('ojos-apilados');
const rain = createEyeRain(rainField);
let selected = 'album';
function size() {
  field.style.left = matchMedia('(max-width: 760px)').matches ? '0px' : `${index.getBoundingClientRect().right}px`;
}
const observer = new ResizeObserver(size); observer.observe(index);
window.addEventListener('resize', size); size();
function showView(view) {
  selected = view;
  field.dataset.cancion = view;
  field.dataset.parte = view.startsWith('parte:') ? view.slice(6) : '';
  rain.hide(); rainField.hidden = true; eye.hide(); songVisual.hide(); video.pause(); video.hidden = true; artist.hidden = true;
  field.setAttribute('aria-hidden', 'false');
  for (const item of document.querySelectorAll('.cancion-trigger')) item.setAttribute('aria-pressed', String(item.dataset.cancion === view));
  if (view === 'parte:brillo') { rainField.hidden = false; rain.show(true); }
  else if (view === 'album') eye.show();
  else if (view === 'artista') artist.hidden = false;
  else if (view === 'madravilla') {
    video.hidden = false; video.muted = true; player.show(); songVisual.show();
    video.play().catch(error => { if (error.name !== 'AbortError') console.warn('COJITO_PLAY', error.message); });
  }
}
for (const button of document.querySelectorAll('.cancion-trigger')) button.addEventListener('click', () => showView(button.dataset.cancion));
for (const id of ['oscuridad', 'claridad', 'brillo']) document.getElementById('parte-' + id).addEventListener('click', () => showView('parte:' + id));
document.getElementById('album-vista-trigger').addEventListener('click', () => showView('album'));
document.getElementById('artista-vista-trigger').addEventListener('click', () => showView('artista'));
requestAnimationFrame(() => { document.documentElement.classList.add('tema-blanco'); showView('album'); });
window.addEventListener('pagehide', () => { rain.hide(); eye.hide(); player.hide(); songVisual.hide(); video.pause(); });
window.addEventListener('pageshow', event => { if (event.persisted) showView(selected); });
