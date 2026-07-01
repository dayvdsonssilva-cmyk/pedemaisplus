/**
 * IMPULSO - Modo demo.
 * Mesma "forma" de dados do Supabase (auth.users + profiles + checkins),
 * mas guardado no localStorage. Serve so pra testar o app localmente
 * sem precisar configurar nada. Nao usar isso como banco de producao.
 */

const CHAVE_USUARIOS = 'impulso_demo_usuarios';
const CHAVE_SESSAO = 'impulso_demo_sessao';
const CHAVE_PERFIS = 'impulso_demo_perfis';
const CHAVE_CHECKINS = 'impulso_demo_checkins';

function ler(chave, valorPadrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : valorPadrao;
  } catch (_erro) {
    return valorPadrao;
  }
}

function escrever(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function gerarId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function dataDeHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// ---------------------- Autenticacao ----------------------

export async function mockCadastrar({ email, senha }) {
  const usuarios = ler(CHAVE_USUARIOS, {});
  if (usuarios[email]) {
    throw new Error('Esse e-mail ja tem cadastro. Tenta entrar.');
  }
  if (senha.length < 6) {
    throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  }
  const id = gerarId();
  usuarios[email] = { id, email, senha };
  escrever(CHAVE_USUARIOS, usuarios);
  const sessao = { user: { id, email } };
  escrever(CHAVE_SESSAO, sessao);
  return { user: sessao.user, session: sessao };
}

export async function mockEntrar({ email, senha }) {
  const usuarios = ler(CHAVE_USUARIOS, {});
  const usuario = usuarios[email];
  if (!usuario || usuario.senha !== senha) {
    throw new Error('E-mail ou senha incorretos.');
  }
  const sessao = { user: { id: usuario.id, email } };
  escrever(CHAVE_SESSAO, sessao);
  return { user: sessao.user, session: sessao };
}

export async function mockSair() {
  localStorage.removeItem(CHAVE_SESSAO);
}

export async function mockObterSessaoAtual() {
  return ler(CHAVE_SESSAO, null);
}

// ---------------------- Perfil ----------------------

export async function mockBuscarPerfil(userId) {
  const perfis = ler(CHAVE_PERFIS, {});
  return perfis[userId] || null;
}

export async function mockCriarPerfil(perfil) {
  const perfis = ler(CHAVE_PERFIS, {});
  perfis[perfil.id] = { ...perfil, created_at: new Date().toISOString() };
  escrever(CHAVE_PERFIS, perfis);
  return perfis[perfil.id];
}

export async function mockAtualizarPerfil(userId, campos) {
  const perfis = ler(CHAVE_PERFIS, {});
  perfis[userId] = { ...perfis[userId], ...campos, updated_at: new Date().toISOString() };
  escrever(CHAVE_PERFIS, perfis);
  return perfis[userId];
}

// ---------------------- Checkins ----------------------

function chaveCheckin(userId, data) {
  return `${userId}__${data}`;
}

export async function mockBuscarCheckinDeHoje(userId) {
  const checkins = ler(CHAVE_CHECKINS, {});
  return checkins[chaveCheckin(userId, dataDeHoje())] || null;
}

export async function mockSalvarCheckinDeHoje(userId, campos) {
  const checkins = ler(CHAVE_CHECKINS, {});
  const chave = chaveCheckin(userId, dataDeHoje());
  checkins[chave] = {
    ...checkins[chave],
    id: (checkins[chave] && checkins[chave].id) || gerarId(),
    user_id: userId,
    data: dataDeHoje(),
    ...campos
  };
  escrever(CHAVE_CHECKINS, checkins);
  return checkins[chave];
}

export async function mockBuscarHistorico(userId, dias = 14) {
  const checkins = ler(CHAVE_CHECKINS, {});
  return Object.values(checkins)
    .filter((c) => c.user_id === userId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, dias);
}

// ---------------------- Treinos (cada registro fica separado) ----------------------

const CHAVE_TREINOS = 'impulso_demo_treinos';
const CHAVE_RANKING_FAKE = 'impulso_demo_ranking_fake';
const NOMES_RANKING_FAKE = ['Marina', 'Lucas', 'Bia', 'Pedro', 'Ana Julia', 'Rafa', 'Carol', 'Thiago'];

function horaAgora() {
  const agora = new Date();
  return String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
}

export async function mockRegistrarTreino(userId, dados) {
  const treinos = ler(CHAVE_TREINOS, []);
  const item = {
    id: gerarId(),
    user_id: userId,
    data: dataDeHoje(),
    hora: horaAgora(),
    ...dados
  };
  treinos.push(item);
  escrever(CHAVE_TREINOS, treinos);
  await mockSalvarCheckinDeHoje(userId, { treinou: true });
  return item;
}

export async function mockBuscarTreinosHoje(userId) {
  const treinos = ler(CHAVE_TREINOS, []);
  return treinos.filter((t) => t.user_id === userId && t.data === dataDeHoje());
}

export async function mockBuscarTodosTreinos(userId, limite = 20) {
  const treinos = ler(CHAVE_TREINOS, []);
  return treinos
    .filter((t) => t.user_id === userId)
    .sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      return (a.hora || '') < (b.hora || '') ? 1 : -1;
    })
    .slice(0, limite);
}

// ---------------------- Ranking fake (so pra visualizar no modo demo) ----------------------

function gerarRankingFake() {
  let ranking = ler(CHAVE_RANKING_FAKE, null);
  if (!ranking) {
    ranking = NOMES_RANKING_FAKE.map((nome) => ({
      nome,
      pontos: 40 + Math.round(Math.random() * 260)
    }));
    escrever(CHAVE_RANKING_FAKE, ranking);
  }
  return ranking;
}

export async function mockBuscarRanking() {
  // No modo demo so existe 1 usuario de verdade (voce), entao
  // completamos o ranking com concorrentes fake pra dar a sensacao
  // de competicao. Em producao (Supabase) o ranking e 100% real,
  // vindo de obter_ranking() com todos os usuarios cadastrados.
  const sessao = await mockObterSessaoAtual();
  const perfis = ler(CHAVE_PERFIS, {});
  const perfil = sessao ? perfis[sessao.user.id] : null;
  const treinos = sessao ? await mockBuscarTodosTreinos(sessao.user.id, 10000) : [];

  const fake = gerarRankingFake().map((j) => ({
    user_id: 'fake-' + j.nome,
    nome: j.nome,
    pontos: j.pontos,
    dias_treinados: null,
    streak: null
  }));

  if (!sessao || !perfil) return fake;

  return fake; // pontos do usuario real sao calculados e adicionados na propria tela (ranking.js)
}
