/**
 * IMPULSO - Calculos de metabolismo e meta calorica.
 * Formula de Mifflin-St Jeor (padrao mais preciso e usado hoje
 * para estimar taxa metabolica basal em pessoas saudaveis).
 *
 * Nota: seguindo o padrao do projeto, evitamos operadores
 * <= e >= em favor de !(x < N) / !(x > N).
 */

export const FATORES_ATIVIDADE = {
  sedentario: { fator: 1.2, rotulo: 'Sedentario', descricao: 'Pouco ou nenhum exercicio' },
  leve: { fator: 1.375, rotulo: 'Leve', descricao: 'Exercicio leve 1 a 3x/semana' },
  moderado: { fator: 1.55, rotulo: 'Moderado', descricao: 'Exercicio moderado 3 a 5x/semana' },
  ativo: { fator: 1.725, rotulo: 'Ativo', descricao: 'Exercicio intenso 6 a 7x/semana' },
  muito_ativo: { fator: 1.9, rotulo: 'Muito ativo', descricao: 'Treino intenso diario ou trabalho fisico' }
};

export const RITMOS_PERDA = [0.25, 0.5, 0.75, 1];

// 1kg de gordura equivale a aproximadamente 7700 kcal
const KCAL_POR_KG_GORDURA = 7700;

/**
 * Taxa Metabolica Basal (Mifflin-St Jeor)
 */
export function calcularTMB({ peso_kg, altura_cm, idade, sexo }) {
  const base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade;
  if (sexo === 'masculino') return Math.round(base + 5);
  if (sexo === 'feminino') return Math.round(base - 161);
  // "outro": usa media entre as duas formulas, abordagem neutra e segura
  return Math.round(base - 78);
}

/**
 * Gasto calorico total diario (TDEE) = TMB x fator de atividade
 */
export function calcularTDEE(tmb, nivelAtividade) {
  const info = FATORES_ATIVIDADE[nivelAtividade] || FATORES_ATIVIDADE.leve;
  return Math.round(tmb * info.fator);
}

/**
 * Meta calorica diaria para emagrecimento, com piso de seguranca:
 * nunca deixamos a meta cair abaixo de 1.1x a TMB (evita deficit
 * perigoso independente do ritmo escolhido pelo usuario).
 */
export function calcularMetaCalorica({ tdee, tmb, ritmoPerdaKgSemana }) {
  const deficitDiario = Math.round((ritmoPerdaKgSemana * KCAL_POR_KG_GORDURA) / 7);
  const metaBruta = tdee - deficitDiario;
  const piso = Math.round(tmb * 1.1);
  if (metaBruta < piso) return piso;
  return metaBruta;
}

/**
 * Distribuicao de macros para emagrecimento preservando massa magra:
 * proteina 2g/kg, gordura 25% das calorias, carboidrato no restante.
 */
export function calcularMacros({ metaCalorica, pesoAtualKg }) {
  const proteinaG = Math.round(pesoAtualKg * 2);
  const proteinaKcal = proteinaG * 4;

  const gorduraKcal = Math.round(metaCalorica * 0.25);
  const gorduraG = Math.round(gorduraKcal / 9);

  const carboKcal = Math.max(metaCalorica - proteinaKcal - gorduraKcal, 0);
  const carboG = Math.round(carboKcal / 4);

  return {
    proteina_g: proteinaG,
    gordura_g: gorduraG,
    carboidrato_g: carboG
  };
}

/**
 * Consolida todos os calculos a partir do perfil salvo no banco.
 */
export function calcularPainelCompleto(perfil) {
  const tmb = calcularTMB({
    peso_kg: perfil.peso_atual_kg,
    altura_cm: perfil.altura_cm,
    idade: perfil.idade,
    sexo: perfil.sexo
  });
  const tdee = calcularTDEE(tmb, perfil.nivel_atividade);
  const metaCalorica = calcularMetaCalorica({
    tdee,
    tmb,
    ritmoPerdaKgSemana: perfil.ritmo_perda_kg_semana
  });
  const macros = calcularMacros({ metaCalorica, pesoAtualKg: perfil.peso_atual_kg });

  const pesoParaPerder = Math.max(perfil.peso_atual_kg - perfil.peso_meta_kg, 0);
  const semanasEstimadas = perfil.ritmo_perda_kg_semana > 0
    ? Math.ceil(pesoParaPerder / perfil.ritmo_perda_kg_semana)
    : 0;

  return { tmb, tdee, metaCalorica, macros, pesoParaPerder, semanasEstimadas };
}

/**
 * IMC apenas como referencia complementar (nao usado para a meta).
 */
export function calcularIMC(pesoKg, alturaCm) {
  const alturaM = alturaCm / 100;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

/**
 * Progresso percentual do peso rumo a meta, limitado entre 0 e 100.
 */
export function calcularProgressoPeso({ pesoInicial, pesoAtual, pesoMeta }) {
  const totalAPerder = pesoInicial - pesoMeta;
  if (!(totalAPerder > 0)) return 0;
  const jaPerdido = pesoInicial - pesoAtual;
  const percentual = (jaPerdido / totalAPerder) * 100;
  if (percentual < 0) return 0;
  if (percentual > 100) return 100;
  return Math.round(percentual);
}

/**
 * ============== Ranking / gamificacao (a prova de trapaca) ==============
 * Mesma regra replicada nas funcoes SQL (obter_ranking / calcular_pontos
 * em supabase/schema.sql), pra o numero mostrado no app sempre bater
 * com o que o banco calcula pro ranking publico.
 *
 * O que mais pesa e CONSTANCIA: dias diferentes treinados e a
 * sequencia (streak). Duracao/calorias digitadas tem um teto por dia,
 * entao nao adianta inventar um treino gigante pra subir no ranking.
 */
export const PONTOS_POR_DIA_TREINADO = 30;
export const PONTOS_POR_DIA_SEQUENCIA = 10;
export const TETO_KCAL_PONTUAVEL_POR_DIA = 400;
export const DIVISOR_BONUS_CALORICO = 20;
export const MAX_MINUTOS_POR_TREINO = 240;

/**
 * Calcula a sequencia atual (dias seguidos, contando de hoje pra tras,
 * com pelo menos 1 treino registrado em cada dia).
 * @param {{data: string}[]} treinos
 */
export function calcularStreak(treinos) {
  const datasComTreino = new Set(treinos.map((t) => t.data));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const chave = cursor.toISOString().slice(0, 10);
    if (datasComTreino.has(chave)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcula os pontos de gamificacao do usuario a partir da lista de
 * treinos. Agrupa por dia (nao importa quantos treinos no mesmo dia)
 * e trava o bonus de calorias em TETO_KCAL_PONTUAVEL_POR_DIA por dia.
 * @param {{data: string, calorias_gastas_exercicio: number}[]} treinos
 */
export function calcularPontos(treinos) {
  const caloriasPorDia = {};
  treinos.forEach((t) => {
    const cal = Math.max(0, Math.min(t.calorias_gastas_exercicio || 0, TETO_KCAL_PONTUAVEL_POR_DIA));
    const atual = caloriasPorDia[t.data] || 0;
    caloriasPorDia[t.data] = Math.min(atual + cal, TETO_KCAL_PONTUAVEL_POR_DIA);
  });

  const diasTreinados = Object.keys(caloriasPorDia).length;
  const streak = calcularStreak(treinos);
  const pontosConstancia = diasTreinados * PONTOS_POR_DIA_TREINADO;
  const pontosSequencia = streak * PONTOS_POR_DIA_SEQUENCIA;
  const bonusCalorico = Object.values(caloriasPorDia).reduce(
    (soma, cal) => soma + Math.round(cal / DIVISOR_BONUS_CALORICO),
    0
  );

  return pontosConstancia + pontosSequencia + bonusCalorico;
}

/**
 * Mesma coisa que calcularPontos, mas devolvendo o detalhamento pra
 * mostrar de forma transparente na tela de ranking.
 */
export function detalharPontos(treinos) {
  const diasUnicos = new Set(treinos.map((t) => t.data));
  const streak = calcularStreak(treinos);
  const total = calcularPontos(treinos);
  return { diasTreinados: diasUnicos.size, streak, total };
}
