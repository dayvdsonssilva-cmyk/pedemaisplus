import './styles/global.css';
import './styles/componentes.css';

import { definirRaiz, registrarRota, iniciarRouter } from './router.js';
import { obterSessaoAtual } from './lib/auth.js';
import { MODO_DEMO } from './lib/supabase.js';

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

  if (MODO_DEMO) {
    exibirSeloDemo();
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

function exibirSeloDemo() {
  const selo = document.createElement('div');
  selo.textContent = 'MODO DEMO \u2022 dados salvos so neste navegador';
  selo.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 999;
    background: #E8151A; color: #fff; font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.4px;
    text-align: center; padding: 6px 8px; text-transform: uppercase;
  `;
  document.body.prepend(selo);
  document.body.style.paddingTop = '28px';
}

iniciar();
