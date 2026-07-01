/**
 * Anima uns emojis de fogo subindo e sumindo perto de um elemento
 * (ex: o botao que a pessoa acabou de clicar). Reforco visual
 * positivo ao salvar calorias ou registrar um treino.
 */
export function dispararFogo(elementoOrigem) {
  if (!elementoOrigem) return;
  const rect = elementoOrigem.getBoundingClientRect();
  const quantidade = 3;

  for (let i = 0; i < quantidade; i++) {
    setTimeout(() => {
      const fogo = document.createElement('span');
      fogo.className = 'fogo-flutuante';
      fogo.textContent = '\u{1F525}';
      fogo.style.left = `${rect.left + rect.width / 2 + (Math.random() * 30 - 15)}px`;
      fogo.style.top = `${rect.top - 4}px`;
      document.body.appendChild(fogo);
      setTimeout(() => fogo.remove(), 900);
    }, i * 120);
  }
}
