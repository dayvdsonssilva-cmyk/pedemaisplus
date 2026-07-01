# IMPULSO

App mobile de treino, peso e meta calorica. Preto, vermelho e branco.
O usuario cadastra altura/peso/idade/nivel de atividade, o app calcula
TMB, gasto calorico total (TDEE) e a meta diaria de calorias pra bater
o objetivo de peso, no ritmo que a pessoa escolher. Todo dia ela marca
se treinou, quanto comeu, e ve o progresso num anel visual.

## Stack

- Vite + JavaScript puro (ES Modules), sem framework — leve e rapido em qualquer celular
- Supabase (Auth com e-mail/senha real + Postgres com Row Level Security)
- Deploy: Vercel

## Estrutura do projeto

```
impulso/
  index.html              -> HTML raiz, fontes, viewport mobile
  src/
    main.js                -> registra rotas e inicia o app
    router.js               -> roteador simples baseado em hash
    lib/
      supabase.js            -> cliente supabase
      auth.js                 -> cadastro, login, logout, sessao
      db.js                    -> leitura/escrita de perfil e checkins
      calculos.js               -> TMB, TDEE, meta calorica, macros (o "cerebro")
    pages/
      login.js, cadastro.js, onboarding.js,
      dashboard.js, exercicios.js, perfil.js
    components/
      navbar.js               -> menu inferior fixo
      anelProgresso.js          -> anel de calorias (elemento de assinatura visual)
    styles/
      global.css, componentes.css
  supabase/
    schema.sql              -> tabelas + Row Level Security (rode isso no Supabase)
```

Cada tela e cada responsabilidade (auth, banco, calculo, UI) ficam em
arquivos separados de proposito — assim fica facil manter e o app
carrega rapido em qualquer aparelho.

## Testar local sem configurar nada (modo demo)

O app detecta sozinho se o Supabase nao foi configurado ainda e liga um
**modo demo**: os dados (cadastro, perfil, check-ins) ficam salvos so
no `localStorage` do seu navegador, sem precisar de internet nem de
conta no Supabase. Aparece uma faixa vermelha no topo avisando
"MODO DEMO" pra nao ter duvida.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`, cria uma conta (pode ser e-mail
fake tipo `teste@teste.com`), preenche o onboarding e testa o fluxo
inteiro — check-in, treino, edicao de perfil, tudo funcionando local.

Quando quiser passar pro banco real (antes do deploy), e so seguir a
secao abaixo e criar o `.env.local` com as chaves do Supabase — o modo
demo desliga sozinho e o app passa a gravar no Postgres de verdade.
Os dados do modo demo nao migram automaticamente (ficam so no
navegador), entao depois de configurar o Supabase voce vai criar a
conta de novo, agora "de verdade".

## Novidades desta versao

- **Ranking (gamificacao)**: nova aba com troféu. Pontuacao pensada pra
  nao dar pra trapacear: 30 pontos por DIA diferente treinado (nao por
  registro avulso), 10 pontos por dia de sequencia, e um teto de 20
  pontos/dia vindo de calorias queimadas (trava em 400kcal/dia
  contadas, entao digitar duracao gigante nao aumenta a pontuacao). A
  logica esta duplicada de proposito em `src/lib/calculos.js` (front)
  e em `supabase/schema.sql` (funcoes `calcular_pontos` / `obter_ranking`)
  pra sempre bater o mesmo numero dos dois lados.
- **Ranking real entre usuarios com seguranca**: a funcao SQL
  `obter_ranking()` roda como `security definer`, ou seja, consegue
  calcular os pontos de todo mundo mesmo com RLS ativado — mas so
  devolve nome e pontos, nunca peso, idade ou qualquer outro dado
  privado. E o jeito correto de expor um ranking publico sem abrir
  brecha nas outras tabelas.
- **Historico de treino corrigido**: agora cada treino registrado vira
  uma linha propria na tabela `treinos` (antes um dia so guardava 1
  treino e o segundo sobrescrevia o primeiro).
- **Streak com fogo animado**: sequencia de dias treinados aparece com
  um selo `🔥 X dias seguidos` no painel, e uma animacao de fogo sobe
  da tela toda vez que voce salva calorias ou registra um treino.
- **Menu travado**: a navbar inferior agora e `position: fixed` de
  verdade, sempre visivel, nao rola junto com o conteudo.
- **Estimativa de calorias por foto (IA com visao)**: botao no painel
  pra tirar/enviar foto do prato e receber uma estimativa de calorias
  e macros. Roda via `/api/estimar-calorias.js`, uma funcao serverless
  do Vercel que usa sua propria chave de IA — a chave nunca fica
  exposta no navegador. Ver secao "IA de fotos" abaixo.

## IA de fotos (estimativa de calorias)

1. Crie uma chave de API em [console.anthropic.com](https://console.anthropic.com).
2. No Vercel, va em **Settings > Environment Variables** e adicione:
   ```
   ANTHROPIC_API_KEY = sua-chave-aqui
   ```
   **Importante**: essa variavel NAO leva o prefixo `VITE_`. Se levasse,
   o Vite embutiria a chave no codigo do navegador e qualquer pessoa
   que abrisse o DevTools conseguiria roubar e usar sua cota. Por isso
   ela so existe dentro da funcao serverless (`api/estimar-calorias.js`),
   que roda no servidor do Vercel, nunca no navegador do usuario.
3. Pra testar essa funcao localmente (o `npm run dev` sozinho nao
   executa funcoes `/api`, so o Vercel CLI faz isso):
   ```bash
   npm install -g vercel
   vercel dev
   ```
   Isso sobe o Vite E as funcoes serverless juntos em localhost.
4. O resultado da IA e sempre uma **estimativa**, nunca gravada
   automaticamente — o app mostra como sugestao editavel e so soma no
   campo de calorias quando voce clica em "Usar essa estimativa".
5. Se preferir usar outra IA com visao (ex: GPT-4o da OpenAI, que
   voce ja usa em outros projetos), so trocar a chamada `fetch` dentro
   de `api/estimar-calorias.js` pela API da OpenAI, mantendo a mesma
   ideia: chave guardada em variavel de ambiente do servidor, nunca no
   front-end.

## Como colocar pra rodar (com Supabase, pra deploy)

### 1. Criar o projeto no Supabase

1. Va em [supabase.com](https://supabase.com) e crie um projeto novo (gratuito).
2. No painel do projeto, abra **SQL Editor** e cole o conteudo inteiro
   de `supabase/schema.sql`, depois clique em Run. Isso cria as tabelas
   `profiles` e `checkins` ja com Row Level Security ativado — ou seja,
   cada usuario so consegue ver e alterar os proprios dados, nunca os
   de outra pessoa.
3. Em **Authentication > Providers**, confirme que o login por
   e-mail/senha esta habilitado (vem habilitado por padrao).
4. Se quiser testar rapido sem precisar confirmar e-mail: em
   **Authentication > Settings**, desative "Confirm email" (so pra
   desenvolvimento; em producao o ideal e deixar ativado).
5. Em **Project Settings > API**, copie a **Project URL** e a
   **anon public key**.

### 2. Configurar o projeto localmente

```bash
npm install
cp .env.example .env.local
```

Abra `.env.local` e cole a URL e a chave que voce copiou do Supabase:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Rodar localmente

```bash
npm run dev
```

Abre em `http://localhost:5173`. Testa em modo responsivo do navegador
(F12 > toggle device toolbar) pra ver como fica no celular.

### 4. Publicar no Vercel

1. Suba esse projeto pra um repositorio no GitHub.
2. No Vercel, importe o repositorio (o `vercel.json` ja configura tudo
   como projeto Vite).
3. Em **Settings > Environment Variables**, adicione
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores
   do `.env.local`.
4. Deploy. Pronto, o app fica acessivel em qualquer celular pelo link.

## Como a meta calorica e calculada

- **TMB** (Taxa Metabolica Basal): formula de Mifflin-St Jeor, a mais
  usada e precisa hoje para pessoas saudaveis.
- **TDEE** (gasto total diario): TMB multiplicado pelo fator de
  atividade que a pessoa escolheu (sedentario ate muito ativo).
- **Meta diaria**: TDEE menos o deficit necessario pro ritmo de perda
  escolhido (0,25 a 1kg/semana). Existe um piso de seguranca: a meta
  nunca fica abaixo de 1,1x a TMB, pra evitar dieta perigosa mesmo se
  a pessoa escolher o ritmo mais agressivo.
- **Macros**: proteina em 2g por kg de peso (preserva massa magra),
  gordura em 25% das calorias, carboidrato no que sobra.

Tudo isso fica em `src/lib/calculos.js`, separado do resto — se quiser
ajustar as formulas ou os fatores, e o unico arquivo que precisa mexer.

## Seguranca

- Autenticacao real via Supabase Auth (e-mail + senha, hash e sessao
  gerenciados pelo Supabase, nunca em texto puro).
- Row Level Security (RLS) ativado em `profiles`, `checkins` e
  `treinos`: mesmo que alguem descubra a chave publica (anon key), so
  consegue ler/escrever os proprios dados — a policy compara sempre
  `auth.uid()` com o dono da linha.
- O ranking publico e a unica excecao de proposito: as funcoes
  `calcular_pontos` e `obter_ranking` rodam como `security definer`
  pra conseguir somar os pontos de todos os usuarios, mas so devolvem
  nome e pontuacao — nunca peso, idade, ou qualquer outro dado da
  tabela `profiles` ou `treinos`.
- Nenhuma chave secreta fica no front-end; a anon key e feita pra ser
  publica e so funciona dentro das regras de RLS. Ja a
  `ANTHROPIC_API_KEY` (usada pra estimar calorias por foto) fica
  exclusivamente na funcao serverless, nunca chega no navegador.
- Variaveis sensiveis ficam em `.env.local` (fora do Git, ja no
  `.gitignore`) e nas Environment Variables do Vercel em producao.

## Proximos passos sugeridos

- PWA (manifest.json + service worker) pra instalar como app no celular.
- Grafico de evolucao de peso (historico ja fica salvo em `checkins`).
- Notificacao push lembrando de fazer o check-in do dia.
