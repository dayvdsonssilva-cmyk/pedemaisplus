import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const CREDENCIAIS_VALIDAS = Boolean(url) && Boolean(anonKey) && !url.includes('SEU-PROJETO');

/**
 * MODO_DEMO so liga quando voce roda local (npm run dev) SEM
 * configurar o .env.local - e uma conveniencia pra testar rapido.
 *
 * Em build de producao (npm run build / o que o Vercel roda pra
 * publicar), import.meta.env.DEV e false, entao MODO_DEMO NUNCA liga
 * sozinho em producao. Se faltar configuracao la, o app nao finge
 * que funciona: ele mostra uma tela de erro clara (ver main.js) em
 * vez de rodar escondido em modo demo, o que faria qualquer pessoa
 * que se cadastrasse perder os dados sem perceber.
 */
export const MODO_DEMO = !CREDENCIAIS_VALIDAS && import.meta.env.DEV;

export const supabase = CREDENCIAIS_VALIDAS
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

if (MODO_DEMO) {
  console.info(
    '[IMPULSO] Rodando em MODO DEMO (sem Supabase configurado). ' +
    'Os dados ficam salvos so nesse navegador. ' +
    'Configure .env.local com suas chaves do Supabase pra usar o banco real.'
  );
}
