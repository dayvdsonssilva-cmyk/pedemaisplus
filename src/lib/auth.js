import { supabase, MODO_DEMO } from './supabase.js';
import { mockCadastrar, mockEntrar, mockSair, mockObterSessaoAtual } from './mockStore.js';

export async function cadastrar({ email, senha }) {
  if (MODO_DEMO) return mockCadastrar({ email, senha });
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) throw traduzErro(error);
  return data;
}

export async function entrar({ email, senha }) {
  if (MODO_DEMO) return mockEntrar({ email, senha });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw traduzErro(error);
  return data;
}

export async function sair() {
  if (MODO_DEMO) return mockSair();
  const { error } = await supabase.auth.signOut();
  if (error) throw traduzErro(error);
}

export async function obterSessaoAtual() {
  if (MODO_DEMO) return mockObterSessaoAtual();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function ouvirMudancasDeSessao(callback) {
  if (MODO_DEMO) return { unsubscribe() {} };
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    callback(sessao);
  });
  return data.subscription;
}

function traduzErro(error) {
  const msg = error.message || '';
  if (msg.includes('already registered')) return new Error('Esse e-mail ja tem cadastro. Tenta entrar.');
  if (msg.includes('Invalid login credentials')) return new Error('E-mail ou senha incorretos.');
  if (msg.includes('Password should be')) return new Error('A senha precisa ter pelo menos 6 caracteres.');
  if (msg.includes('valid email')) return new Error('Digite um e-mail valido.');
  return new Error('Algo deu errado. Tenta de novo em instantes.');
}
