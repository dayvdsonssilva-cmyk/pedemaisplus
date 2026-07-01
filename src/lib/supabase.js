import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const credenciaisValidas = Boolean(url) && Boolean(anonKey) && !url.includes('SEU-PROJETO');

/**
 * MODO_DEMO liga sozinho quando nao ha .env configurado (ou esta com
 * os valores de exemplo). Nesse modo o app usa localStorage no lugar
 * do Supabase, pra dar pra testar tudo sem precisar criar projeto
 * nenhum. Quando voce configurar o .env.local com as chaves reais,
 * isso desliga automaticamente e o app passa a usar o Supabase.
 */
export const MODO_DEMO = !credenciaisValidas;

export const supabase = credenciaisValidas
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
