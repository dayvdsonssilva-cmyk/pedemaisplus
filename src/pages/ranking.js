import { obterSessaoAtual } from '../lib/auth.js';
import { buscarPerfil, buscarTodosTreinos, buscarRanking } from '../lib/db.js';
import { detalharPontos, PONTOS_POR_DIA_TREINADO, PONTOS_POR_DIA_SEQUENCIA } from '../lib/calculos.js';
import { criarNavbar } from '../components/navbar.js';
import { navegarPara } from '../router.js';

const MEDALHAS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

export async function montar(raiz) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    navegarPara('/login');
    return { destruir() {} };
  }

  const perfil = await buscarPerfil(sessao.user.id);
  if (!perfil) {
    navegarPara('/onboarding');
    return { destruir() {} };
  }

  const todosTreinos = await buscarTodosTreinos(sessao.user.id);
  const detalhe = detalharPontos(todosTreinos);

  // Busca o ranking geral (real, de todos os usuarios, via funcao segura
  // no Supabase). No modo demo vem uma lista fake pra visualizar.
  const outrosJogadores = await buscarRanking();
  const primeiroNome = perfil.nome.split(' ')[0];

  const jogadores = outrosJogadores
    .filter((j) => j.user_id !== sessao.user.id)
    .map((j) => ({ nome: j.nome, pontos: j.pontos, voce: false }));
  jogadores.push({ nome: primeiroNome, pontos: detalhe.total, voce: true });
  jogadores.sort((a, b) => b.pontos - a.pontos);

  const posicaoVoce = jogadores.findIndex((j) => j.voce) + 1;
  const bonusCalorico = detalhe.total - detalhe.diasTreinados * PONTOS_POR_DIA_TREINADO - detalhe.streak * PONTOS_POR_DIA_SEQUENCIA;

  const listaHTML = jogadores.map((j, indice) => {
    const pos = indice + 1;
    const classeTop = pos === 1 ? ' top1' : pos === 2 ? ' top2' : pos === 3 ? ' top3' : '';
    const rotuloPos = pos <= 3 ? MEDALHAS[pos - 1] : pos;
    return `
      <div class="ranking-item${classeTop}${j.voce ? ' voce' : ''}">
        <div class="ranking-pos">${rotuloPos}</div>
        <div class="ranking-avatar">${j.nome.charAt(0).toUpperCase()}</div>
        <div class="ranking-info">
          <p class="titulo">${j.nome}${j.voce ? ' (voce)' : ''}</p>
          <p class="sub">${j.pontos} pontos</p>
        </div>
        <div class="ranking-pontos">${j.pontos}</div>
      </div>
    `;
  }).join('');

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tela">
      <h2 style="font-size:22px;margin-bottom:4px;">Ranking</h2>
      <p style="color:var(--cinza);font-size:14px;margin-bottom:20px;">
        Quem e mais constante fica na frente. Duracao e calorias contam pouco.
      </p>

      <div class="cartao" style="margin-bottom:14px;text-align:center;">
        <p class="rotulo" style="margin-bottom:6px;">Sua posicao</p>
        <p class="anel-numero" style="font-size:36px;">#${posicaoVoce}</p>
      </div>

      <div class="cartao" style="margin-bottom:20px;">
        <p class="rotulo" style="margin-bottom:10px;">Como seus ${detalhe.total} pontos foram calculados</p>
        <div class="linha-pontos">
          <span class="label">${detalhe.diasTreinados} dia${detalhe.diasTreinados !== 1 ? 's' : ''} treinado${detalhe.diasTreinados !== 1 ? 's' : ''} &times; 30</span>
          <span class="valor">${detalhe.diasTreinados * PONTOS_POR_DIA_TREINADO}</span>
        </div>
        <div class="linha-pontos">
          <span class="label">${detalhe.streak} dia${detalhe.streak !== 1 ? 's' : ''} seguidos &times; 10</span>
          <span class="valor">${detalhe.streak * PONTOS_POR_DIA_SEQUENCIA}</span>
        </div>
        <div class="linha-pontos">
          <span class="label">Bonus de calorias (limitado por dia)</span>
          <span class="valor">${bonusCalorico}</span>
        </div>
        <p style="font-size:11px;color:var(--cinza);margin-top:10px;">
          O que mais pesa e treinar em dias diferentes, nao a duracao que voce digita.
          Cada dia so pontua uma vez, tenha 1 ou 5 treinos registrados nele.
        </p>
      </div>

      ${listaHTML}
    </div>
  `;

  raiz.innerHTML = '';
  raiz.appendChild(container);
  raiz.appendChild(criarNavbar());

  return { destruir() {} };
}
