import { navegarPara, rotaAtual } from '../router.js';

const ITENS = [
  { rota: '/painel', rotulo: 'Painel', icone: iconeCasa },
  { rota: '/exercicios', rotulo: 'Treino', icone: iconeRaio },
  { rota: '/ranking', rotulo: 'Ranking', icone: iconeTrofeu },
  { rota: '/perfil', rotulo: 'Perfil', icone: iconePessoa }
];

export function criarNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar';

  ITENS.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'navbar-item' + (rotaAtual() === item.rota ? ' ativo' : '');
    btn.innerHTML = `${item.icone()}<span>${item.rotulo}</span>`;
    btn.addEventListener('click', () => navegarPara(item.rota));
    nav.appendChild(btn);
  });

  return nav;
}

function iconeCasa() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';
}
function iconeRaio() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>';
}
function iconePessoa() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>';
}
function iconeTrofeu() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a1 1 0 0 0-1 1c0 3 2 5 4.5 5.3M17 5h3a1 1 0 0 1 1 1c0 3-2 5-4.5 5.3"/></svg>';
}
