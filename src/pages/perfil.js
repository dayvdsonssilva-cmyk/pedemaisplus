import { obterSessaoAtual, sair } from '../lib/auth.js';
import { buscarPerfil, atualizarPerfil } from '../lib/db.js';
import { calcularPainelCompleto, FATORES_ATIVIDADE, RITMOS_PERDA } from '../lib/calculos.js';
import { criarNavbar } from '../components/navbar.js';
import { navegarPara } from '../router.js';

let estado = {};

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

  estado = { sexo: perfil.sexo, nivel_atividade: perfil.nivel_atividade, ritmo_perda_kg_semana: perfil.ritmo_perda_kg_semana };
  const painel = calcularPainelCompleto(perfil);

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tela">
      <h2 style="font-size:22px;margin-bottom:20px;">Seu perfil</h2>

      <div class="grid-stats" style="margin-bottom:20px;">
        <div class="stat-card">
          <div class="valor">${painel.tmb}</div>
          <p class="rotulo">TMB (kcal)</p>
        </div>
        <div class="stat-card">
          <div class="valor">${painel.tdee}</div>
          <p class="rotulo">Gasto total (kcal)</p>
        </div>
      </div>

      <div id="erro-area"></div>

      <form id="form-perfil">
        <div class="campo">
          <label class="rotulo">Nome</label>
          <input type="text" id="nome" value="${perfil.nome}" required />
        </div>

        <div class="campo">
          <label class="rotulo">Peso atual (kg)</label>
          <input type="number" step="0.1" id="peso_atual" value="${perfil.peso_atual_kg}" required min="30" max="300" />
        </div>

        <div class="campo">
          <label class="rotulo">Peso meta (kg)</label>
          <input type="number" step="0.1" id="peso_meta" value="${perfil.peso_meta_kg}" required min="30" max="300" />
        </div>

        <div class="campo">
          <label class="rotulo">Altura (cm)</label>
          <input type="number" id="altura" value="${perfil.altura_cm}" required min="120" max="230" />
        </div>

        <div class="campo">
          <label class="rotulo">Idade</label>
          <input type="number" id="idade" value="${perfil.idade}" required min="14" max="90" />
        </div>

        <div class="campo">
          <label class="rotulo">Nivel de atividade</label>
          <div class="chips" id="chips-atividade">
            ${Object.entries(FATORES_ATIVIDADE).map(([chave, info]) => `
              <button type="button" class="chip${chave === perfil.nivel_atividade ? ' selecionado' : ''}" data-valor="${chave}">
                ${info.rotulo}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Ritmo de perda</label>
          <div class="chips" id="chips-ritmo">
            ${RITMOS_PERDA.map((ritmo) => `
              <button type="button" class="chip${ritmo === perfil.ritmo_perda_kg_semana ? ' selecionado' : ''}" data-valor="${ritmo}">
                ${String(ritmo).replace('.', ',')} kg/semana
              </button>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn btn-primario" id="btn-salvar">Salvar alteracoes</button>
      </form>

      <button class="btn btn-texto" id="btn-sair" style="margin-top:16px;">Sair da conta</button>
    </div>
  `;

  raiz.innerHTML = '';
  raiz.appendChild(container);
  raiz.appendChild(criarNavbar());

  configurarChips(raiz, '#chips-atividade', (v) => { estado.nivel_atividade = v; });
  configurarChips(raiz, '#chips-ritmo', (v) => { estado.ritmo_perda_kg_semana = Number(v); });

  const form = raiz.querySelector('#form-perfil');
  const erroArea = raiz.querySelector('#erro-area');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroArea.innerHTML = '';
    const btn = raiz.querySelector('#btn-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      await atualizarPerfil(sessao.user.id, {
        nome: raiz.querySelector('#nome').value.trim(),
        peso_atual_kg: Number(raiz.querySelector('#peso_atual').value),
        peso_meta_kg: Number(raiz.querySelector('#peso_meta').value),
        altura_cm: Number(raiz.querySelector('#altura').value),
        idade: Number(raiz.querySelector('#idade').value),
        nivel_atividade: estado.nivel_atividade,
        ritmo_perda_kg_semana: estado.ritmo_perda_kg_semana
      });
      navegarPara('/painel');
    } catch (erro) {
      erroArea.innerHTML = '<div class="erro">Nao deu pra salvar agora. Tenta de novo.</div>';
      btn.disabled = false;
      btn.textContent = 'Salvar alteracoes';
    }
  });

  raiz.querySelector('#btn-sair').addEventListener('click', async () => {
    await sair();
    navegarPara('/login');
  });

  return { destruir() {} };
}

function configurarChips(raiz, seletor, aoSelecionar) {
  const container = raiz.querySelector(seletor);
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('selecionado'));
      chip.classList.add('selecionado');
      aoSelecionar(chip.dataset.valor);
    });
  });
}
