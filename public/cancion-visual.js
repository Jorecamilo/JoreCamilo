// Reusable visual/lyrics switch; does not own or interrupt audio playback.
export function createSongVisual(field, visual) {
  const toolbar = document.createElement('div');
  toolbar.className = 'cancion-vistas'; toolbar.hidden = true;
  toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Contenido de la canción');
  toolbar.innerHTML = '<button type="button" aria-pressed="true">Visual</button><button type="button" aria-pressed="false">Letra</button>';
  const lyrics = document.createElement('div'); lyrics.className = 'cancion-letra'; lyrics.hidden = true;
  lyrics.tabIndex = 0; lyrics.setAttribute('aria-label', 'Letra de la canción');
  const [visualButton, lyricsButton] = toolbar.querySelectorAll('button');
  field.append(toolbar, lyrics);
  function select(showLyrics) {
    lyrics.hidden = !showLyrics;
    visual.style.visibility = showLyrics ? 'hidden' : '';
    visualButton.setAttribute('aria-pressed', String(!showLyrics));
    lyricsButton.setAttribute('aria-pressed', String(showLyrics));
  }
  visualButton.addEventListener('click', () => select(false));
  lyricsButton.addEventListener('click', () => select(true));
  return {
    show(text = 'Letra próximamente') { lyrics.textContent = text; toolbar.hidden = false; select(false); },
    hide() { toolbar.hidden = true; lyrics.hidden = true; visual.style.visibility = ''; },
    dispose() { this.hide(); toolbar.remove(); lyrics.remove(); }
  };
}
