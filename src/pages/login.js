import { entrar } from '../lib/auth.js';
import { navegarPara } from '../router.js';

export async function montar(raiz) {
  raiz.innerHTML = `
    <div class="tela" style="display:flex;flex-direction:column;justify-content:center;min-height:100vh;padding-bottom:24px;">
      <div style="text-align:center;margin-bottom:40px;">
        <span class="marca">IMPULSO<span class="ponto">.</span></span>
        <p style="color:var(--cinza);font-size:14px;margin-top:8px;">Treino, peso e meta. Todo dia.</p>
      </div>

      <div id="erro-area"></div>

      <form id="form-login">
        <div class="campo">
          <label class="rotulo">E-mail</label>
          <input type="email" id="email" placeholder="voce@email.com" required autocomplete="email" />
        </div>
        <div class="campo">
          <label class="rotulo">Senha</label>
          <input type="password" id="senha" placeholder="Sua senha" required autocomplete="current-password" minlength="6" />
        </div>
        <button type="submit" class="btn btn-primario" id="btn-entrar">Entrar</button>
      </form>

      <button class="btn btn-texto" id="btn-ir-cadastro" style="margin-top:12px;">
        Ainda nao tem conta? Cadastre-se
      </button>
    </div>
  `;

  const form = raiz.querySelector('#form-login');
  const erroArea = raiz.querySelector('#erro-area');
  const btnEntrar = raiz.querySelector('#btn-entrar');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroArea.innerHTML = '';
    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';

    const email = raiz.querySelector('#email').value.trim();
    const senha = raiz.querySelector('#senha').value;

    try {
      await entrar({ email, senha });
      navegarPara('/painel');
    } catch (erro) {
      erroArea.innerHTML = `<div class="erro">${erro.message}</div>`;
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
  });

  raiz.querySelector('#btn-ir-cadastro').addEventListener('click', () => {
    navegarPara('/cadastro');
  });

  return { destruir() {} };
}
