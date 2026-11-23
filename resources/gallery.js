(() => {
  const dialog = document.querySelector('.image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const heading = dialog.querySelector('h2');
  const image = dialog.querySelector('[data-full-image]');
  const caption = dialog.querySelector('[data-caption]');
  const status = dialog.querySelector('[data-status]');
  const png = dialog.querySelector('[data-png]');
  const svg = dialog.querySelector('[data-svg-file]');
  let opener;

  function revealLinkedCard() {
    const card = document.getElementById(location.hash.slice(1));
    const original = card?.closest('.original-cards');
    if (original) {
      original.open = true;
      card.scrollIntoView();
    }
  }
  revealLinkedCard();
  window.addEventListener('hashchange', revealLinkedCard);

  document.querySelectorAll('a[data-artwork]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      heading.textContent = link.dataset.title;
      image.src = png.href = link.href;
      image.alt = link.querySelector('img').alt;
      svg.href = link.dataset.svg;
      caption.textContent = link.dataset.caption;
      status.textContent = '';
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus({preventScroll:true}));
  dialog.querySelector('[data-copy]').addEventListener('click', async () => {
    const source = opener;
    try {
      await navigator.clipboard.writeText(caption.textContent);
      if (source === opener) status.textContent = 'Caption copied.';
    } catch {
      if (source !== opener || !dialog.open) return;
      const range = document.createRange();
      range.selectNodeContents(caption);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Caption selected. Use Copy to copy it.';
    }
  });
})();
