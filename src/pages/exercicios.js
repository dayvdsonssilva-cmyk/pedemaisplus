import { obterSessaoAtual } from '../lib/auth.js';
import { buscarPerfil, buscarTreinosHoje, buscarHistoricoTreinos, registrarTreino } from '../lib/db.js';
import { MAX_MINUTOS_POR_TREINO } from '../lib/calculos.js';
import { criarNavbar } from '../components/navbar.js';
import { dispararFogo } from '../components/fogoAnimado.js';
import { navegarPara } from '../router.js';

const EXERCICIOS = [
  { chave: 'caminhada', rotulo: 'Caminhada', met: 3.5 },
  { chave: 'corrida', rotulo: 'Corrida', met: 8 },
  { chave: 'musculacao', rotulo: 'Musculacao', met: 5 },
  { chave: 'ciclismo', rotulo: 'Ciclismo', met: 7.5 },
  { chave: 'natacao', rotulo: 'Natacao', met: 6 },
  { chave: 'hiit', rotulo: 'HIIT', met: 9 },
  { chave: 'yoga', rotulo: 'Yoga', met: 2.5 },
  { chave: 'futebol', rotulo: 'Futebol', met: 7 }
];

let tipoSelecionado = 'caminhada';

export async function montar(raiz) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    navegarPara('/login');
    return { destruir() {} };
  }

  const perfil = await buscarPerfil(sessao.user.id);
  const treinosHoje = await buscarTreinosHoje(sessao.user.id);
  const historico = await buscarHistoricoTreinos(sessao.user.id, 20);

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tela">
      <h2 style="font-size:22px;margin-bottom:4px;">Treino de hoje</h2>
      <p style="color:var(--cinza);font-size:14px;margin-bottom:20px;">
        Escolhe o que voce fez. Pode registrar quantos treinos quiser no dia.
      </p>

      <div class="chips" id="chips-exercicio">
        ${EXERCICIOS.map((ex) => `
          <button type="button" class="chip${ex.chave === tipoSelecionado ? ' selecionado' : ''}" data-valor="${ex.chave}">
            ${ex.rotulo}
          </button>
        `).join('')}
      </div>

      <div class="campo" style="margin-top:18px;">
        <label class="rotulo">Duracao (minutos)</label>
        <input type="number" id="input-duracao" placeholder="Ex: 40" min="1" max="${MAX_MINUTOS_POR_TREINO}" />
      </div>

      <div class="cartao" style="margin-bottom:18px;">
        <p style="font-size:13px;color:var(--cinza);">Gasto estimado</p>
        <p class="anel-numero" style="font-size:32px;" id="texto-gasto">0 kcal</p>
      </div>

      <button class="btn btn-primario" id="btn-registrar">Registrar treino</button>

      ${treinosHoje.length > 0 ? `
        <h3 style="font-size:16px;margin-top:28px;margin-bottom:12px;">Hoje</h3>
        <div class="lista-exercicios" id="lista-hoje">
          ${treinosHoje.map((t) => renderizarLinhaTreino(t, true)).join('')}
        </div>
      ` : ''}

      <h3 style="font-size:16px;margin-top:28px;margin-bottom:12px;">Historico</h3>
      <div class="lista-exercicios">
        ${historico.length === 0
          ? '<p style="color:var(--cinza);font-size:14px;">Ainda sem registros. Comeca hoje.</p>'
          : historico.map((t) => renderizarLinhaTreino(t, false)).join('')}
      </div>
    </div>
  `;

  raiz.innerHTML = '';
  raiz.appendChild(container);
  raiz.appendChild(criarNavbar());

  const inputDuracao = raiz.querySelector('#input-duracao');
  const textoGasto = raiz.querySelector('#texto-gasto');

  function atualizarGasto() {
    const ex = EXERCICIOS.find((e) => e.chave === tipoSelecionado);
    const minutos = Math.min(Number(inputDuracao.value) || 0, MAX_MINUTOS_POR_TREINO);
    const peso = (perfil && perfil.peso_atual_kg) || 70;
    const kcal = Math.round(ex.met * peso * (minutos / 60));
    textoGasto.textContent = `${kcal} kcal`;
    return kcal;
  }
  atualizarGasto();
  inputDuracao.addEventListener('input', atualizarGasto);

  raiz.querySelectorAll('#chips-exercicio .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      raiz.querySelectorAll('#chips-exercicio .chip').forEach((c) => c.classList.remove('selecionado'));
      chip.classList.add('selecionado');
      tipoSelecionado = chip.dataset.valor;
      atualizarGasto();
    });
  });

  raiz.querySelector('#btn-registrar').addEventListener('click', async (evento) => {
    const minutos = Math.min(Number(inputDuracao.value) || 0, MAX_MINUTOS_POR_TREINO);
    if (minutos < 1) {
      inputDuracao.focus();
      return;
    }
    const kcal = atualizarGasto();
    const btn = raiz.querySelector('#btn-registrar');
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    await registrarTreino(sessao.user.id, {
      tipo_exercicio: tipoSelecionado,
      duracao_min: minutos,
      calorias_gastas_exercicio: kcal
    });

    dispararFogo(evento.currentTarget);
    setTimeout(() => montar(raiz), 300);
  });

  return { destruir() {} };
}

function renderizarLinhaTreino(t, ehHoje) {
  const rotulo = (EXERCICIOS.find((e) => e.chave === t.tipo_exercicio) || {}).rotulo || 'Treino';
  const quando = ehHoje ? t.hora : `${formatarData(t.data)}${t.hora ? ` &middot; ${t.hora}` : ''}`;
  return `
    <div class="exercicio-item">
      <div class="exercicio-icone">&#9889;</div>
      <div class="exercicio-info">
        <p class="titulo">${rotulo}</p>
        <p class="sub">${quando}${t.duracao_min ? ` &middot; ${t.duracao_min} min` : ''}</p>
      </div>
      ${t.calorias_gastas_exercicio ? `<span class="exercicio-cal">-${t.calorias_gastas_exercicio} kcal</span>` : ''}
    </div>
  `;
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}
