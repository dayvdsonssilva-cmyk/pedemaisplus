const rotas = new Map();
let raiz = null;
let instanciaAtual = null;

export function registrarRota(caminho, moduloPagina) {
  rotas.set(caminho, moduloPagina);
}

export function definirRaiz(elemento) {
  raiz = elemento;
}

export function navegarPara(caminho) {
  if (window.location.hash !== `#${caminho}`) {
    window.location.hash = caminho;
  } else {
    renderizarRotaAtual();
  }
}

export function iniciarRouter(rotaPadrao) {
  window.addEventListener('hashchange', renderizarRotaAtual);
  if (!window.location.hash) {
    window.location.hash = rotaPadrao;
  } else {
    renderizarRotaAtual();
  }
}

async function renderizarRotaAtual() {
  const caminho = window.location.hash.replace('#', '') || '/';
  const pagina = rotas.get(caminho);

  if (instanciaAtual && typeof instanciaAtual.destruir === 'function') {
    instanciaAtual.destruir();
  }

  if (!pagina) {
    raiz.innerHTML = '<div class="tela"><p>Pagina nao encontrada.</p></div>';
    return;
  }

  raiz.innerHTML = '<div class="tela-loading"><div class="spinner"></div></div>';
  instanciaAtual = await pagina.montar(raiz);
}

export function rotaAtual() {
  return window.location.hash.replace('#', '') || '/';
}
