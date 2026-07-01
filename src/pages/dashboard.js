import { obterSessaoAtual, sair } from '../lib/auth.js';
import {
  buscarPerfil,
  buscarCheckinDeHoje,
  salvarCheckinDeHoje,
  buscarTreinosHoje,
  buscarTodosTreinos
} from '../lib/db.js';
import { calcularPainelCompleto, calcularProgressoPeso, calcularStreak } from '../lib/calculos.js';
import { criarAnelProgresso } from '../components/anelProgresso.js';
import { criarNavbar } from '../components/navbar.js';
import { dispararFogo } from '../components/fogoAnimado.js';
import { navegarPara } from '../router.js';

export async function montar(raiz) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    navegarPara('/login');
    return { destruir() {} };
  }

  const perfil = await buscarPerfil(sessao.user.id);
  if (!perfil || !perfil.onboarding_completo) {
    navegarPara('/onboarding');
    return { destruir() {} };
  }

  const checkin = await buscarCheckinDeHoje(sessao.user.id);
  const treinosHoje = await buscarTreinosHoje(sessao.user.id);
  const todosTreinos = await buscarTodosTreinos(sessao.user.id);
  const painel = calcularPainelCompleto(perfil);
  const consumidasHoje = (checkin && checkin.calorias_consumidas) || 0;
  const treinou = Boolean((checkin && checkin.treinou) || treinosHoje.length > 0);
  const streak = calcularStreak(todosTreinos);
  const progressoPeso = calcularProgressoPeso({
    pesoInicial: perfil.peso_inicial_kg,
    pesoAtual: perfil.peso_atual_kg,
    pesoMeta: perfil.peso_meta_kg
  });

  const primeiroNome = perfil.nome.split(' ')[0];
  const inicial = primeiroNome.charAt(0).toUpperCase();

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tela">
      <div class="topo-usuario">
        <div>
          <p class="saudacao">${saudacaoPorHorario()}</p>
          <h1 class="nome">${primeiroNome}</h1>
        </div>
        <div class="avatar-inicial">${inicial}</div>
      </div>

      ${streak > 0 ? `
        <div class="streak-badge">
          <span class="chama">\u{1F525}</span>
          <span>${streak} dia${streak > 1 ? 's' : ''} seguidos treinando</span>
        </div>
      ` : ''}

      <div id="area-anel"></div>

      <div class="grid-stats">
        <div class="stat-card destaque">
          <div class="valor">${painel.metaCalorica}</div>
          <p class="rotulo">Meta kcal / dia</p>
        </div>
        <div class="stat-card">
          <div class="valor">${consumidasHoje}</div>
          <p class="rotulo">Consumidas hoje</p>
        </div>
        <div class="stat-card">
          <div class="valor">${painel.macros.proteina_g}g</div>
          <p class="rotulo">Proteina</p>
        </div>
        <div class="stat-card">
          <div class="valor">${painel.macros.carboidrato_g}g</div>
          <p class="rotulo">Carboidrato</p>
        </div>
      </div>

      <div class="cartao" style="margin-top:16px;">
        <label class="rotulo">Registrar calorias consumidas hoje</label>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <input type="number" id="input-calorias" placeholder="Ex: 1450" value="${consumidasHoje || ''}" min="0" style="flex:1;" />
          <button class="btn btn-primario" id="btn-salvar-calorias" style="width:auto;padding:14px 18px;">Salvar</button>
        </div>
        <button type="button" class="btn btn-secundario" id="btn-abrir-camera">\u{1F4F7} Estimar calorias por foto</button>
        <input type="file" id="input-foto" accept="image/*" capture="environment" style="display:none;" />
        <div id="area-resultado-foto"></div>
      </div>

      <div class="checkin-toggle${treinou ? ' feito' : ''}" id="toggle-treino">
        <div>
          <p style="font-weight:700;font-size:14px;">Treinei hoje</p>
          <p style="font-size:12px;color:var(--cinza);margin-top:2px;">
            ${treinosHoje.length > 0
              ? `${treinosHoje.length} treino${treinosHoje.length > 1 ? 's' : ''} registrado${treinosHoje.length > 1 ? 's' : ''} hoje`
              : 'Marca quando fizer qualquer exercicio'}
          </p>
        </div>
        <div class="switch${treinou ? ' ligado' : ''}" id="switch-treino">
          <div class="switch-bolinha"></div>
        </div>
      </div>

      <div class="cartao" style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;">
          <span class="rotulo" style="margin-bottom:0;">Rumo a meta</span>
          <span style="font-size:12px;color:var(--cinza);">${perfil.peso_atual_kg}kg &rarr; ${perfil.peso_meta_kg}kg</span>
        </div>
        <div class="barra-fundo">
          <div class="barra-preenchimento" style="width:${progressoPeso}%;"></div>
        </div>
        <p style="font-size:12px;color:var(--cinza);margin-top:8px;">
          ${painel.pesoParaPerder > 0
            ? `Faltam ${painel.pesoParaPerder.toFixed(1)}kg &middot; ~${painel.semanasEstimadas} semanas no seu ritmo`
            : 'Meta alcancada. Hora de manter o resultado.'}
        </p>
      </div>

      <button class="btn btn-texto" id="btn-sair" style="margin-top:20px;">Sair da conta</button>
    </div>
  `;

  const areaAnel = container.querySelector('#area-anel');
  areaAnel.appendChild(criarAnelProgresso({ consumidas: consumidasHoje, meta: painel.metaCalorica }));

  raiz.innerHTML = '';
  raiz.appendChild(container);
  raiz.appendChild(criarNavbar());

  raiz.querySelector('#btn-salvar-calorias').addEventListener('click', async (evento) => {
    const valor = Number(raiz.querySelector('#input-calorias').value) || 0;
    await salvarCheckinDeHoje(sessao.user.id, { calorias_consumidas: valor });
    dispararFogo(evento.currentTarget);
    setTimeout(() => montar(raiz), 250);
  });

  raiz.querySelector('#switch-treino').addEventListener('click', async (evento) => {
    const novoValor = !treinou;
    await salvarCheckinDeHoje(sessao.user.id, { treinou: novoValor });
    if (novoValor) dispararFogo(evento.currentTarget);
    setTimeout(() => montar(raiz), novoValor ? 250 : 0);
  });

  raiz.querySelector('#btn-sair').addEventListener('click', async () => {
    await sair();
    navegarPara('/login');
  });

  raiz.querySelector('#btn-abrir-camera').addEventListener('click', () => {
    raiz.querySelector('#input-foto').click();
  });

  raiz.querySelector('#input-foto').addEventListener('change', (evento) => {
    const arquivo = evento.target.files[0];
    if (arquivo) estimarCaloriasPorFoto(arquivo, raiz);
  });

  return { destruir() {} };
}

function saudacaoPorHorario() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Manda a foto pra funcao serverless /api/estimar-calorias (que usa
 * sua chave de IA guardada so no servidor) e mostra o resultado como
 * uma SUGESTAO editavel - nunca grava direto sem o usuario confirmar.
 */
function estimarCaloriasPorFoto(arquivo, raiz) {
  const area = raiz.querySelector('#area-resultado-foto');
  area.innerHTML = `
    <div class="cartao resultado-foto" style="display:flex;align-items:center;gap:10px;">
      <div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>
      <span style="font-size:13px;color:var(--cinza-claro);">Analisando a foto...</span>
    </div>
  `;

  const leitor = new FileReader();
  leitor.onload = async () => {
    const base64Completo = leitor.result;
    const imagemBase64 = base64Completo.split(',')[1];
    const mediaType = arquivo.type || 'image/jpeg';

    try {
      const resposta = await fetch('/api/estimar-calorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemBase64, mediaType })
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || 'Falha ao analisar a foto.');
      exibirResultadoFoto(resultado, raiz);
    } catch (_erro) {
      area.innerHTML = `<div class="erro" style="margin-top:0;">Nao consegui analisar a foto agora. Tenta de novo ou digita as calorias manualmente.</div>`;
    }
  };
  leitor.readAsDataURL(arquivo);
}

function exibirResultadoFoto(resultado, raiz) {
  const area = raiz.querySelector('#area-resultado-foto');
  if (!resultado.calorias_estimadas || resultado.calorias_estimadas < 1) {
    area.innerHTML = `<div class="erro" style="margin-top:0;">${resultado.observacao || 'Nao deu pra identificar comida nessa foto.'}</div>`;
    return;
  }
  area.innerHTML = `
    <div class="cartao resultado-foto">
      <p style="font-weight:700;font-size:14px;margin-bottom:4px;">${resultado.prato}</p>
      <p class="anel-numero" style="font-size:30px;">~${resultado.calorias_estimadas} kcal</p>
      <p style="font-size:11px;color:var(--cinza);margin-bottom:10px;">
        Confianca: ${resultado.confianca || 'media'} &middot; ${resultado.observacao || 'Estimativa por IA, ajuste se achar necessario.'}
      </p>
      <button type="button" class="btn btn-primario" id="btn-usar-estimativa" style="margin-bottom:8px;">Usar essa estimativa</button>
      <button type="button" class="btn btn-texto" id="btn-descartar-estimativa">Descartar</button>
    </div>
  `;

  raiz.querySelector('#btn-usar-estimativa').addEventListener('click', () => {
    const inputCalorias = raiz.querySelector('#input-calorias');
    const atual = Number(inputCalorias.value) || 0;
    inputCalorias.value = atual + resultado.calorias_estimadas;
    area.innerHTML = '';
  });
  raiz.querySelector('#btn-descartar-estimativa').addEventListener('click', () => {
    area.innerHTML = '';
  });
}
