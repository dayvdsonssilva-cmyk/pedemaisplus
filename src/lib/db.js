import { supabase, MODO_DEMO } from './supabase.js';
import {
  mockBuscarPerfil,
  mockCriarPerfil,
  mockAtualizarPerfil,
  mockBuscarCheckinDeHoje,
  mockSalvarCheckinDeHoje,
  mockRegistrarTreino,
  mockBuscarTreinosHoje,
  mockBuscarTodosTreinos,
  mockBuscarRanking
} from './mockStore.js';

export async function buscarPerfil(userId) {
  if (MODO_DEMO) return mockBuscarPerfil(userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function criarPerfil(perfil) {
  if (MODO_DEMO) return mockCriarPerfil(perfil);
  const { data, error } = await supabase
    .from('profiles')
    .insert(perfil)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarPerfil(userId, campos) {
  if (MODO_DEMO) return mockAtualizarPerfil(userId, campos);
  const { data, error } = await supabase
    .from('profiles')
    .update(campos)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

function dataDeHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export async function buscarCheckinDeHoje(userId) {
  if (MODO_DEMO) return mockBuscarCheckinDeHoje(userId);
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('data', dataDeHoje())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function salvarCheckinDeHoje(userId, campos) {
  if (MODO_DEMO) return mockSalvarCheckinDeHoje(userId, campos);
  const payload = { user_id: userId, data: dataDeHoje(), ...campos };
  const { data, error } = await supabase
    .from('checkins')
    .upsert(payload, { onConflict: 'user_id,data' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------- Treinos (cada registro fica separado) ----------------------

/**
 * Registra um treino como uma linha NOVA (nunca sobrescreve o treino
 * anterior do mesmo dia). Tambem liga o flag "treinou" do check-in
 * do dia, pra manter o painel sincronizado.
 */
export async function registrarTreino(userId, dados) {
  if (MODO_DEMO) return mockRegistrarTreino(userId, dados);
  const payload = { user_id: userId, data: dataDeHoje(), ...dados };
  const { data, error } = await supabase
    .from('treinos')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  await salvarCheckinDeHoje(userId, { treinou: true });
  return data;
}

export async function buscarTreinosHoje(userId) {
  if (MODO_DEMO) return mockBuscarTreinosHoje(userId);
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('user_id', userId)
    .eq('data', dataDeHoje())
    .order('hora', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function buscarHistoricoTreinos(userId, limite = 20) {
  if (MODO_DEMO) return mockBuscarTodosTreinos(userId, limite);
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .order('hora', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}

/**
 * Busca TODOS os treinos do usuario (sem limite de paginacao curto),
 * usado pra calcular streak/pontos localmente no modo demo e como
 * fallback. Em produção o ranking de verdade vem de buscarRanking().
 */
export async function buscarTodosTreinos(userId) {
  if (MODO_DEMO) return mockBuscarTodosTreinos(userId, 10000);
  const { data, error } = await supabase
    .from('treinos')
    .select('data, calorias_gastas_exercicio')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// ---------------------- Ranking ----------------------

/**
 * Busca o ranking de TODOS os usuarios (nome + pontos), via funcao
 * SQL "obter_ranking()" que roda como security definer no Supabase -
 * ou seja, ela consegue ver os treinos de todo mundo pra calcular os
 * pontos, mas so devolve nome e pontos, nunca dado privado de
 * ninguem. Ver supabase/schema.sql para o detalhe de seguranca.
 */
export async function buscarRanking() {
  if (MODO_DEMO) return mockBuscarRanking();
  const { data, error } = await supabase.rpc('obter_ranking');
  if (error) throw error;
  return data || [];
}
