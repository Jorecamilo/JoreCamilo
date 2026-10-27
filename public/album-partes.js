// Definitive global numbering; unnamed songs remain non-interactive.
export const albumSongs = Array.from({ length: 15 }, (_, i) => {
  const number = i + 1;
  return { number, id: number === 7 ? 'madravilla' : `pendiente-${number}`,
    title: number === 7 ? 'Madravilla' : null,
    part: number <= 6 ? 'oscuridad' : number <= 14 ? 'claridad' : 'brillo' };
});
export function createAlbumParts(container) {
  const parts = [['oscuridad', 'PARTE I — OSCURIDAD'], ['claridad', 'PARTE II — CLARIDAD'], ['brillo', 'PARTE III — BRILLO']];
  const panels = [];
  for (const [id, title] of parts) {
    const section = document.createElement('section'); section.className = `album-parte ${id}`;
    const heading = document.createElement('h2');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'parte-trigger';
    button.id = `parte-${id}`; const label = document.createElement('span'); label.className = 'proteccion-texto'; label.textContent = title; button.append(label);
    button.setAttribute('aria-controls', `canciones-${id}`);
    const panel = document.createElement('div'); panel.className = 'parte-panel'; panel.id = `canciones-${id}`;
    panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', button.id);
    const inner = document.createElement('div'); inner.className = 'parte-interior';
    const list = document.createElement('ol'); list.className = 'parte-canciones';
    for (const song of albumSongs.filter(song => song.part === id)) {
      const item = document.createElement('li'); item.value = song.number;
      if (!song.title) { list.append(item); continue; }
      const trigger = document.createElement('button');
      trigger.type = 'button'; trigger.className = 'cancion-trigger'; trigger.dataset.cancion = song.id; trigger.textContent = song.title;
      item.append(trigger); list.append(item);
    }
    function expand(open) {
      button.setAttribute('aria-expanded', String(open)); section.classList.toggle('abierta', open);
      panel.inert = !open; panel.setAttribute('aria-hidden', String(!open));
    }
    panels.push({ id, expand });
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      for (const panel of panels) panel.expand(panel.id === id && open);
    });
    heading.append(button); inner.append(list); panel.append(inner); section.append(heading, panel); container.append(section);
    expand(id === 'claridad');
  }
}
