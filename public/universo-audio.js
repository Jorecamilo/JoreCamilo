export function createAudioTest(field) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const emptyMessage = local ? 'Audio de prueba no cargado' : 'Audio no disponible';
  const panel = document.createElement('section');
  panel.className = 'audio-prueba'; panel.hidden = true; panel.setAttribute('aria-label', 'Reproductor de Madravilla');
  panel.innerHTML = `<p class="audio-titulo">Madravilla — JoreCamilo</p>
    <p class="audio-creditos"><a href="https://www.instagram.com/jorecamilo/" target="_blank" rel="noopener noreferrer">JoreCamilo</a> <span>∞</span> <a href="https://www.instagram.com/magdalenamorenales/" target="_blank" rel="noopener noreferrer">Magdalena</a></p>
    <p class="audio-estado" role="status">${emptyMessage}</p>
    <div class="audio-controles"><button type="button" class="audio-play" disabled aria-label="Reproducir">PLAY</button>
    <input class="audio-progreso" type="range" min="0" max="100" value="0" step="0.1" disabled aria-label="Posición del audio">
    <span class="audio-tiempo">0:00 / 0:00</span></div>
    ${local ? `<button type="button" class="audio-cargar">CARGAR AUDIO DE PRUEBA</button>
    <input class="audio-archivo" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" hidden>` : ''}
    <p class="audio-plataformas">COMPRAR EN BANDCAMP</p>`;
  field.appendChild(panel);
  const audio = document.createElement('audio'); audio.preload = 'metadata'; panel.appendChild(audio);
  const file = panel.querySelector('.audio-archivo'), play = panel.querySelector('.audio-play');
  const seek = panel.querySelector('.audio-progreso'), status = panel.querySelector('.audio-estado');
  const time = panel.querySelector('.audio-tiempo');
  let url = null, generation = 0;
  const format = s => Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  function update() {
    const valid = Number.isFinite(audio.duration) && audio.duration > 0;
    play.disabled = !url || !valid; seek.disabled = play.disabled;
    seek.max = valid ? audio.duration : 100; seek.value = audio.currentTime || 0;
    time.textContent = `${format(audio.currentTime)} / ${format(audio.duration)}`;
    play.textContent = audio.paused ? 'PLAY' : 'PAUSA';
    play.setAttribute('aria-label', audio.paused ? 'Reproducir' : 'Pausar');
  }
  function clear() {
    generation++; audio.pause(); audio.removeAttribute('src'); audio.load();
    if (url) URL.revokeObjectURL(url); url = null; if (file) file.value = '';
    status.textContent = emptyMessage; update();
  }
  panel.querySelector('.audio-cargar')?.addEventListener('click', () => file.click());
  file?.addEventListener('change', () => {
    const selected = file.files[0]; if (!selected) return;
    clear();
    if (!/\.(mp3|wav)$/i.test(selected.name)) { status.textContent = 'Selecciona un archivo MP3 o WAV'; return; }
    url = URL.createObjectURL(selected); audio.src = url;
    status.textContent = selected.name; audio.load();
  });
  play.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    const current = generation;
    try { await audio.play(); } catch (error) {
      if (current === generation && error.name !== 'AbortError') status.textContent = 'No se pudo reproducir el archivo';
    }
  });
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); update(); });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'emptied']) audio.addEventListener(event, update);
  audio.addEventListener('error', () => { if (url) { clear(); status.textContent = 'Formato de audio no compatible'; } });
  const pauseHidden = () => { if (document.hidden) audio.pause(); };
  document.addEventListener('visibilitychange', pauseHidden);
  return {
    get isOpen() { return !panel.hidden; },
    show() { panel.hidden = false; field.dataset.audioTest = 'true'; field.setAttribute('aria-hidden', 'false'); },
    hide() { clear(); panel.hidden = true; delete field.dataset.audioTest; field.setAttribute('aria-hidden', 'true'); },
    dispose() { this.hide(); document.removeEventListener('visibilitychange', pauseHidden); panel.remove(); }
  };
}
