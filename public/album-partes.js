// Stable slots preserve the album's 15-song capacity. Null parts are unassigned;
// array positions are not final track numbers. Only real titles are rendered.
export const albumSongs = [
  { id: 'madravilla', title: 'Madravilla', part: 'claridad' },
  ...Array.from({ length: 14 }, (_, i) => ({ id: `pendiente-${i + 2}`, title: null, part: null }))
];
export function createAlbumParts(container) {
  const parts = [['oscuridad', 'PARTE I — OSCURIDAD'], ['claridad', 'PARTE II — CLARIDAD'], ['brillo', 'PARTE III — BRILLO']];
  for (const [id, title] of parts) {
    const section = document.createElement('section'); section.className = `album-parte ${id}`;
    const heading = document.createElement('h2');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'parte-trigger';
    button.id = `parte-${id}`; button.textContent = title;
    button.setAttribute('aria-controls', `canciones-${id}`);
    const panel = document.createElement('div'); panel.className = 'parte-panel'; panel.id = `canciones-${id}`;
    panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', button.id);
    const inner = document.createElement('div'); inner.className = 'parte-interior';
    const list = document.createElement('ol'); list.className = 'parte-canciones';
    for (const song of albumSongs.filter(song => song.part === id && song.title)) {
      const item = document.createElement('li'); const trigger = document.createElement('button');
      trigger.type = 'button'; trigger.className = 'cancion-trigger'; trigger.dataset.cancion = song.id; trigger.textContent = song.title;
      item.append(trigger); list.append(item);
    }
    function expand(open) {
      button.setAttribute('aria-expanded', String(open)); section.classList.toggle('abierta', open);
      panel.inert = !open; panel.setAttribute('aria-hidden', String(!open));
    }
    button.addEventListener('click', () => expand(button.getAttribute('aria-expanded') !== 'true'));
    heading.append(button); inner.append(list); panel.append(inner); section.append(heading, panel); container.append(section);
    expand(id === 'claridad');
  }
}
