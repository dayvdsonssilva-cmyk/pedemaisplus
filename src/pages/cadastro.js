import { cadastrar } from '../lib/auth.js';
import { entrar } from '../lib/auth.js';
import { navegarPara } from '../router.js';

export async function montar(raiz) {
  raiz.innerHTML = `
    <div class="tela" style="display:flex;flex-direction:column;justify-content:center;min-height:100vh;padding-bottom:24px;">
      <div style="text-align:center;margin-bottom:40px;">
        <span class="marca">IMPULSO<span class="ponto">.</span></span>
        <p style="color:var(--cinza);font-size:14px;margin-top:8px;">Cria sua conta em 20 segundos.</p>
      </div>

      <div id="erro-area"></div>

      <form id="form-cadastro">
        <div class="campo">
          <label class="rotulo">E-mail</label>
          <input type="email" id="email" placeholder="voce@email.com" required autocomplete="email" />
        </div>
        <div class="campo">
          <label class="rotulo">Senha</label>
          <input type="password" id="senha" placeholder="Minimo 6 caracteres" required autocomplete="new-password" minlength="6" />
        </div>
        <button type="submit" class="btn btn-primario" id="btn-cadastrar">Criar conta</button>
      </form>

      <button class="btn btn-texto" id="btn-ir-login" style="margin-top:12px;">
        Ja tem conta? Entrar
      </button>
    </div>
  `;

  const form = raiz.querySelector('#form-cadastro');
  const erroArea = raiz.querySelector('#erro-area');
  const btnCadastrar = raiz.querySelector('#btn-cadastrar');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroArea.innerHTML = '';
    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Criando...';

    const email = raiz.querySelector('#email').value.trim();
    const senha = raiz.querySelector('#senha').value;

    try {
      await cadastrar({ email, senha });
      // Se a confirmacao de e-mail estiver desligada no Supabase,
      // ja existe sessao ativa. Caso contrario, tentamos logar direto
      // (funciona quando "confirm email" esta desativado no projeto).
      try {
        await entrar({ email, senha });
      } catch (_) { /* segue para a tela de onboarding mesmo assim */ }
      navegarPara('/onboarding');
    } catch (erro) {
      erroArea.innerHTML = `<div class="erro">${erro.message}</div>`;
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = 'Criar conta';
    }
  });

  raiz.querySelector('#btn-ir-login').addEventListener('click', () => {
    navegarPara('/login');
  });

  return { destruir() {} };
}
