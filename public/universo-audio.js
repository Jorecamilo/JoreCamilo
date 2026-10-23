export function createAudioTest(field, { tracks = [], onTrackChange = () => {} } = {}) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  let trackIndex = 0;
  const emptyMessage = local ? 'Selecciona reproducir para escuchar' : 'Audio no disponible';
  const panel = document.createElement('section');
  panel.className = 'audio-prueba'; panel.hidden = true; panel.setAttribute('aria-label', 'Reproductor de Madravilla');
  panel.innerHTML = `<p class="audio-titulo">Madravilla</p>
    <p class="audio-creditos"><a href="https://www.instagram.com/jorecamilo/" target="_blank" rel="noopener noreferrer">JoreCamilo</a> <span>∞</span> <a href="https://www.instagram.com/magdalenamorenales/" target="_blank" rel="noopener noreferrer">Magdalena</a></p>
    <p class="audio-estado" role="status">${emptyMessage}</p>
    <div class="audio-controles"><button type="button" class="audio-aleatorio" disabled aria-label="Aleatorio" aria-pressed="false">⤨</button><button type="button" class="audio-anterior" disabled aria-label="Canción anterior">◀|</button><button type="button" class="audio-play" disabled aria-label="Reproducir">▶</button>
    <button type="button" class="audio-siguiente" disabled aria-label="Canción siguiente">|▶</button>
    <button type="button" class="audio-repetir" aria-label="Repetir canción" aria-pressed="false">↻</button>
    </div><div class="audio-linea"><span class="audio-transcurrido audio-tiempo">0:00</span>
    <input class="audio-progreso" type="range" min="0" max="100" value="0" step="0.1" disabled aria-label="Posición del audio">
    <span class="audio-duracion audio-tiempo">0:00</span></div>
    <div class="audio-opciones"><div class="audio-volumen"><button type="button" class="audio-silencio" aria-label="Ajustar volumen" aria-expanded="false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="audio-ondas" d="M15 8q4 4 0 8m3-11q7 7 0 14"/></svg></button><div class="audio-volumen-popup" hidden><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Volumen" aria-orientation="vertical"><span class="audio-volumen-aviso" hidden>Usa el volumen del dispositivo</span></div></div>
    <label class="audio-calidad">Calidad de audio <select aria-label="Calidad de audio"><option value="flac">Alta</option><option value="mp3">MP3</option></select></label></div>
    <p class="audio-plataformas">COMPRAR EN BANDCAMP</p>`;
  field.appendChild(panel);
  const audio = document.createElement('audio'); audio.preload = 'metadata'; panel.appendChild(audio);
  const quality = panel.querySelector('.audio-calidad select'), play = panel.querySelector('.audio-play');
  const seek = panel.querySelector('.audio-progreso'), status = panel.querySelector('.audio-estado');
  const time = panel.querySelector('.audio-transcurrido'), duration = panel.querySelector('.audio-duracion');
  const previous = panel.querySelector('.audio-anterior'), next = panel.querySelector('.audio-siguiente');
  const repeat = panel.querySelector('.audio-repetir'), volume = panel.querySelector('.audio-volumen input');
  const shuffle = panel.querySelector('.audio-aleatorio');
  let shuffled = false, history = [];
  const supportsFlac = !!audio.canPlayType('audio/flac');
  const connection = navigator.connection;
  const reliableFastConnection = connection && !connection.saveData && connection.effectiveType === '4g' && connection.downlink >= 10;
  quality.value = supportsFlac && reliableFastConnection ? 'flac' : 'mp3';
  quality.querySelector('[value="flac"]').disabled = !supportsFlac;
  const compatibilityMessage = supportsFlac ? '' : 'Este navegador utiliza MP3; FLAC no es compatible.';
  let url = null, generation = 0, pending = null, sourceEvents = null;
  const playable = () => tracks.filter(track => track.sources?.mp3 || track.sources?.flac);
  const sources = () => playable()[trackIndex]?.sources || { mp3: 'https://audio.jorecamilo.com/el-pecado-original/Madravilla.mp3', flac: 'https://audio.jorecamilo.com/el-pecado-original/Madravilla.flac' };
  const format = s => Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  function update() {
    const valid = Number.isFinite(audio.duration) && audio.duration > 0;
    play.disabled = !url || !valid || !!pending; seek.disabled = play.disabled;
    const available = playable();
    shuffle.disabled = available.length < 2;
    previous.disabled = shuffled ? history.length === 0 : trackIndex <= 0;
    next.disabled = shuffled ? available.length < 2 : trackIndex >= available.length - 1;
    seek.max = valid ? audio.duration : 100; seek.value = audio.currentTime || 0;
    time.textContent = format(audio.currentTime); duration.textContent = format(audio.duration);
    seek.style.setProperty('--avance', `${valid ? 100 * audio.currentTime / audio.duration : 0}%`);
    play.textContent = audio.paused ? '▶' : 'Ⅱ';
    play.setAttribute('aria-label', audio.paused ? 'Reproducir' : 'Pausar');
  }
  function clear() {
    generation++; sourceEvents?.abort(); sourceEvents = null; pending = null; audio.pause(); audio.removeAttribute('src'); audio.load();
    url = null;
    status.textContent = emptyMessage; update();
  }
  function loadQuality(position = 0, resume = false) {
    const source = sources()[quality.value];
    if (!source) { status.textContent = 'Audio no disponible'; return; }
    const token = ++generation;
    sourceEvents?.abort(); sourceEvents = new AbortController();
    const state = pending = { position, resume, token };
    audio.pause(); audio.removeAttribute('src'); audio.load();
    url = source; status.textContent = 'Cargando audio…';
    audio.addEventListener('loadedmetadata', async () => {
      if (token !== generation) return;
      audio.currentTime = Math.min(state.position, audio.duration);
      pending = null; status.textContent = compatibilityMessage; update();
      if (state.resume) {
        try { await audio.play(); } catch (error) {
          if (token === generation && error.name !== 'AbortError') status.textContent = 'Pulsa reproducir para continuar';
        }
      }
    }, { once: true, signal: sourceEvents.signal });
    audio.src = source; audio.load(); update();
  }
  quality.addEventListener('change', () => {
    loadQuality(pending?.position ?? audio.currentTime, pending?.resume ?? !audio.paused);
  });
  function moveTrack(direction) {
    const available = playable();
    let target = trackIndex + direction;
    if (shuffled) {
      if (direction < 0) { if (!history.length) return; target = history.pop(); }
      else {
        if (available.length < 2) return;
        const choices = available.map((_, i) => i).filter(i => i !== trackIndex);
        target = choices[Math.floor(Math.random() * choices.length)]; history.push(trackIndex);
      }
    }
    if (target < 0 || target >= available.length) return;
    const resume = !audio.paused || audio.ended; trackIndex = target;
    onTrackChange(available[target]); loadQuality(0, resume);
  }
  shuffle.addEventListener('click', () => {
    if (playable().length < 2) return;
    shuffled = !shuffled; history = []; shuffle.setAttribute('aria-pressed', String(shuffled)); update();
  });
  audio.addEventListener('ended', () => { if (shuffled && !audio.loop) moveTrack(1); });
  previous.addEventListener('click', () => moveTrack(-1));
  next.addEventListener('click', () => moveTrack(1));
  repeat.addEventListener('click', () => {
    audio.loop = !audio.loop; repeat.setAttribute('aria-pressed', String(audio.loop));
  });
  const volumeBox = panel.querySelector('.audio-volumen'), popup = panel.querySelector('.audio-volumen-popup');
  const volumeOpen = panel.querySelector('.audio-silencio');
  function openVolume(open) { popup.hidden = !open; volumeOpen.setAttribute('aria-expanded', String(open)); }
  function updateVolume() {
    const silent = audio.muted || audio.volume === 0;
    panel.querySelector('.audio-ondas').style.display = silent ? 'none' : '';
    volume.value = audio.muted ? 0 : audio.volume;
  }
  volumeOpen.addEventListener('click', () => { openVolume(popup.hidden); if (!popup.hidden) volume.focus(); });
  volume.addEventListener('input', () => {
    const requested = Number(volume.value);
    audio.muted = requested === 0; audio.volume = requested;
    if (Math.abs(audio.volume - requested) > .01) {
      panel.querySelector('.audio-volumen-aviso').hidden = false; volume.disabled = true;
    }
    updateVolume();
  });
  audio.addEventListener('volumechange', updateVolume);
  const outsideVolume = event => { if (!volumeBox.contains(event.target)) openVolume(false); };
  const escapeVolume = event => { if (event.key === 'Escape' && !popup.hidden) { openVolume(false); volumeOpen.focus(); } };
  document.addEventListener('pointerdown', outsideVolume);
  document.addEventListener('keydown', escapeVolume);
  const keyboard = event => {
    if (panel.hidden || event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest('input,textarea,select,button,a,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="tab"]')) return;
    event.preventDefault(); if (!play.disabled) play.click();
  };
  document.addEventListener('keydown', keyboard);
  play.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    const current = generation;
    try { await audio.play(); } catch (error) {
      if (current === generation && error.name !== 'AbortError') status.textContent = 'No se pudo reproducir el archivo';
    }
  });
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); update(); });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'emptied']) audio.addEventListener(event, update);
  audio.addEventListener('error', () => {
    if (!url) return;
    if (quality.value === 'flac' && audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      const position = pending?.position ?? audio.currentTime, resume = pending?.resume ?? !audio.paused;
      quality.value = 'mp3'; loadQuality(position, resume); return;
    }
    clear(); status.textContent = 'No se pudo cargar el audio. Vuelve a seleccionar la calidad para reintentar.';
  });
  const pauseHidden = () => { if (document.hidden) audio.pause(); };
  document.addEventListener('visibilitychange', pauseHidden);
  return {
    get isOpen() { return !panel.hidden; },
    show() { if (!url) loadQuality(); panel.hidden = false; field.dataset.audioTest = 'true'; field.setAttribute('aria-hidden', 'false'); },
    hide() { openVolume(false); clear(); panel.hidden = true; delete field.dataset.audioTest; field.setAttribute('aria-hidden', 'true'); },
    dispose() { this.hide(); document.removeEventListener('visibilitychange', pauseHidden); document.removeEventListener('keydown', keyboard); document.removeEventListener('pointerdown', outsideVolume); document.removeEventListener('keydown', escapeVolume); panel.remove(); }
  };
}
