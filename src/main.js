import './styles/global.css';
import './styles/componentes.css';

import { definirRaiz, registrarRota, iniciarRouter } from './router.js';
import { obterSessaoAtual } from './lib/auth.js';
import { MODO_DEMO, CREDENCIAIS_VALIDAS } from './lib/supabase.js';

import * as PaginaLogin from './pages/login.js';
import * as PaginaCadastro from './pages/cadastro.js';
import * as PaginaOnboarding from './pages/onboarding.js';
import * as PaginaDashboard from './pages/dashboard.js';
import * as PaginaExercicios from './pages/exercicios.js';
import * as PaginaRanking from './pages/ranking.js';
import * as PaginaPerfil from './pages/perfil.js';

async function iniciar() {
  const raiz = document.getElementById('app');
  definirRaiz(raiz);

  // Se chegou aqui em producao (nao e npm run dev) sem credenciais
  // reais do Supabase, nao inicia o app fingindo que funciona -
  // mostra um erro claro pra quem publicou corrigir a configuracao,
  // em vez de deixar usuarios reais se cadastrando em algo que nao
  // salva nada.
  if (!CREDENCIAIS_VALIDAS && !MODO_DEMO) {
    exibirErroDeConfiguracao(raiz);
    return;
  }

  if (MODO_DEMO) {
    console.info('[IMPULSO] Modo demo ativo (apenas em npm run dev local, sem .env configurado).');
  }

  registrarRota('/login', PaginaLogin);
  registrarRota('/cadastro', PaginaCadastro);
  registrarRota('/onboarding', PaginaOnboarding);
  registrarRota('/painel', PaginaDashboard);
  registrarRota('/exercicios', PaginaExercicios);
  registrarRota('/ranking', PaginaRanking);
  registrarRota('/perfil', PaginaPerfil);

  const sessao = await obterSessaoAtual();
  const rotaInicial = sessao ? '/painel' : '/login';

  iniciarRouter(rotaInicial);
}

function exibirErroDeConfiguracao(raiz) {
  raiz.innerHTML = `
    <div class="tela" style="display:flex;flex-direction:column;justify-content:center;min-height:100vh;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#9888;&#65039;</p>
      <h2 style="font-size:18px;margin-bottom:12px;">Configuracao pendente</h2>
      <p style="color:var(--cinza);font-size:14px;line-height:1.5;">
        O app nao encontrou as credenciais do Supabase (<code>VITE_SUPABASE_URL</code>
        e <code>VITE_SUPABASE_ANON_KEY</code>). Adicione essas variaveis em
        Settings &gt; Environment Variables no Vercel e faca um novo deploy.
      </p>
    </div>
  `;
}

iniciar();
