import { obterSessaoAtual } from '../lib/auth.js';
import { criarPerfil } from '../lib/db.js';
import { FATORES_ATIVIDADE, RITMOS_PERDA } from '../lib/calculos.js';
import { navegarPara } from '../router.js';

let estado = {
  sexo: 'masculino',
  nivel_atividade: 'leve',
  ritmo_perda_kg_semana: 0.5
};

export async function montar(raiz) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    navegarPara('/login');
    return { destruir() {} };
  }

  raiz.innerHTML = `
    <div class="tela">
      <h2 style="font-size:22px;margin-bottom:4px;">Vamos te conhecer</h2>
      <p style="color:var(--cinza);font-size:14px;margin-bottom:24px;">
        Isso define sua meta calorica real. Leva 1 minuto.
      </p>

      <div id="erro-area"></div>

      <form id="form-onboarding">
        <div class="campo">
          <label class="rotulo">Seu nome</label>
          <input type="text" id="nome" placeholder="Como te chamamos?" required />
        </div>

        <div class="campo">
          <label class="rotulo">Idade</label>
          <input type="number" id="idade" placeholder="Ex: 28" required min="14" max="90" />
        </div>

        <div class="campo">
          <label class="rotulo">Sexo biologico (para o calculo calorico)</label>
          <div class="chips" id="chips-sexo">
            <button type="button" class="chip selecionado" data-valor="masculino">Masculino</button>
            <button type="button" class="chip" data-valor="feminino">Feminino</button>
            <button type="button" class="chip" data-valor="outro">Outro</button>
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Altura (cm)</label>
          <input type="number" id="altura" placeholder="Ex: 175" required min="120" max="230" />
        </div>

        <div class="campo">
          <label class="rotulo">Peso atual (kg)</label>
          <input type="number" step="0.1" id="peso_atual" placeholder="Ex: 82.5" required min="30" max="300" />
        </div>

        <div class="campo">
          <label class="rotulo">Peso meta (kg)</label>
          <input type="number" step="0.1" id="peso_meta" placeholder="Ex: 75" required min="30" max="300" />
        </div>

        <div class="campo">
          <label class="rotulo">Nivel de atividade</label>
          <div class="chips" id="chips-atividade">
            ${Object.entries(FATORES_ATIVIDADE).map(([chave, info]) => `
              <button type="button" class="chip${chave === 'leve' ? ' selecionado' : ''}" data-valor="${chave}">
                ${info.rotulo}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Ritmo de perda desejado</label>
          <div class="chips" id="chips-ritmo">
            ${RITMOS_PERDA.map((ritmo) => `
              <button type="button" class="chip${ritmo === 0.5 ? ' selecionado' : ''}" data-valor="${ritmo}">
                ${String(ritmo).replace('.', ',')} kg/semana
              </button>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn btn-primario" id="btn-salvar" style="margin-top:12px;">
          Calcular minha meta
        </button>
      </form>
    </div>
  `;

  configurarChips(raiz, '#chips-sexo', (valor) => { estado.sexo = valor; });
  configurarChips(raiz, '#chips-atividade', (valor) => { estado.nivel_atividade = valor; });
  configurarChips(raiz, '#chips-ritmo', (valor) => { estado.ritmo_perda_kg_semana = Number(valor); });

  const form = raiz.querySelector('#form-onboarding');
  const erroArea = raiz.querySelector('#erro-area');
  const btnSalvar = raiz.querySelector('#btn-salvar');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroArea.innerHTML = '';
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Calculando...';

    const nome = raiz.querySelector('#nome').value.trim();
    const idade = Number(raiz.querySelector('#idade').value);
    const altura_cm = Number(raiz.querySelector('#altura').value);
    const peso_atual_kg = Number(raiz.querySelector('#peso_atual').value);
    const peso_meta_kg = Number(raiz.querySelector('#peso_meta').value);

    try {
      await criarPerfil({
        id: sessao.user.id,
        nome,
        idade,
        sexo: estado.sexo,
        altura_cm,
        peso_inicial_kg: peso_atual_kg,
        peso_atual_kg,
        peso_meta_kg,
        nivel_atividade: estado.nivel_atividade,
        ritmo_perda_kg_semana: estado.ritmo_perda_kg_semana,
        onboarding_completo: true
      });
      navegarPara('/painel');
    } catch (erro) {
      erroArea.innerHTML = `<div class="erro">Nao deu pra salvar. Confere os dados e tenta de novo.</div>`;
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Calcular minha meta';
    }
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
