const RAIO = 90;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/**
 * Cria o "Anel de Impulso": um anel circular que mostra o quanto
 * das calorias-meta do dia ja foi consumido, com o numero central
 * mostrando quanto ainda resta.
 */
export function criarAnelProgresso({ consumidas, meta }) {
  const wrap = document.createElement('div');
  wrap.className = 'anel-wrap';

  const restante = Math.max(meta - consumidas, 0);
  const percentual = meta > 0 ? Math.min(consumidas / meta, 1) : 0;
  const offset = CIRCUNFERENCIA * (1 - percentual);

  wrap.innerHTML = `
    <svg class="anel-svg" viewBox="0 0 200 200">
      <circle class="anel-fundo" cx="100" cy="100" r="${RAIO}"></circle>
      <circle class="anel-progresso" cx="100" cy="100" r="${RAIO}"
        stroke-dasharray="${CIRCUNFERENCIA}"
        stroke-dashoffset="${offset}"></circle>
    </svg>
    <div class="anel-centro">
      <div class="anel-numero">${restante}</div>
      <div class="anel-legenda">kcal restantes</div>
    </div>
  `;

  return wrap;
}
