# Progress Log — FocusLearn SaaS

Documento de contexto técnico para continuidade por outros agentes e desenvolvedores.

---

## 1. Visão Geral do Projeto

- **Nome**: FocusLearn (`metadata.json`)
- **Objetivo**: Plataforma web inteligente de estudos e produtividade acadêmica em português (`pt-BR`), convertida de 4 protótipos HTML estáticos (`/public/assets/aistudio/*.html`) para **Next.js 15 (App Router)** com autenticação Firebase e persistência relacional em **PostgreSQL (Cloud SQL)** via **Drizzle ORM**.
- **Design System**: Tailwind CSS v4 (`@import "tailwindcss";`, variante `dark` baseada na classe `.dark` em `<html>`), fontes `Plus Jakarta Sans`, `DM Sans` e `JetBrains Mono`, ícones via `lucide-react` e animações com `motion/react`.

---

## 2. O Que Já Foi Implementado

### 2.1. Frontend & Módulos do Painel (`/app/page.tsx`)
Gerenciado por `components/FocusLearnShell.tsx` e `components/FocusProvider.tsx`:

1. **Visão Geral (`components/views/DashboardView.tsx`)**:
   - KPIs dinâmicos calculados a partir de sessões Pomodoro, disciplinas e tarefas.
   - Mapa de calor interativo de frequência (últimos 30 dias) e gráfico semanal de carga de estudo.
   - Widget de Pomodoro rápido sincronizado com o timer global e CRUD de micro-tarefas.
2. **Matérias & Cursos (`components/views/SubjectsView.tsx`)**:
   - CRUD completo de disciplinas, filtro por status (`all`, `active`, `completed`).
   - Edição inline de notas `P1`/`P2` com calculadora acadêmica (`calculateUFCGrade` em `lib/seedData.ts`: Aprovado Direto, Prova Final ou Reprovado).
   - Atalho de 1 clique para iniciar o Pomodoro na matéria selecionada.
3. **Cronômetro Pomodoro & Modo Zen (`components/views/PomodoroView.tsx` + `components/ZenModeModal.tsx`)**:
   - Timer global (`25m`, `50m`, `5m`, `15m`) persistente entre abas.
   - Registro automático de sessões concluídas no PostgreSQL com incremento de `hoursStudied` da disciplina.
   - Modo tela cheia sem distrações (saída com tecla `Escape`).
   - Sintetizador procedural de áudio ambiente via Web Audio API (`lib/audio.ts`: `rain`, `lofi`, `white-noise`, `library`) com controle de volume e sino sonoro de conclusão (`playCompletionChime`).
4. **Planejador Semanal (`components/views/PlannerView.tsx`)**:
   - Grade semanal (`SEG`–`DOM`, `08:00`–`20:00`) com clique em células vazias para agendar, filtro por tipo (`aula`, `revisao`, `prova`, `pausa`) e criação/exclusão de blocos.
5. **Estatísticas & Metas (`components/views/StatsGoalsView.tsx`)**:
   - Barras de distribuição de horas por matéria.
   - Metas semestrais com criação, incremento `+1` (travado após `completed`) e exclusão.
   - Exportação/impressão para PDF via `window.print()` e regras `@media print` em `app/globals.css`.
6. **Anotações & Cadernos (`components/views/NotesView.tsx`)**:
   - Layout em dois painéis com busca, filtro por tags, editor Markdown e pré-visualização em tempo real (`react-markdown`).
7. **Comunidade & Chat (`components/views/CommunityView.tsx`)**:
   - Canais `#calculo`, `#algoritmos` e `#geral` com envio, listagem (polling a cada 8s quando autenticado) e exclusão das próprias mensagens.
   - Prompt de login Google quando acessado em modo local.
8. **Configurações & Perfil (`components/views/SettingsProfileView.tsx`)**:
   - Edição de perfil acadêmico (`UserProfile`), alternância de tema Claro/Escuro persistida, gerenciamento de sessão e reset do estado local.

### 2.2. Autenticação Firebase (`/app/login`, `/app/cadastro`, `/app/recuperar-senha`)
- **Client SDK**: `lib/firebase.ts` e `components/FirebaseProvider.tsx` (`signInWithPopup` com Google, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, `sendEmailVerification`).
- **Admin SDK**: `src/lib/firebase-admin.ts` (import estático obrigatório de `firebase-applet-config.json`) e `src/lib/api-auth.ts` (`verifyRequestAuth` validando `Authorization: Bearer <token>`).
- **Fallback Local**: Quando o usuário não está autenticado/verificado, o `FocusProvider` opera localmente via `localStorage` (`focuslearn_local_state_v2`) com dados iniciais de `lib/seedData.ts`. Quando `user && user.emailVerified` é verdadeiro, sincroniza com a API PostgreSQL.

### 2.3. Banco de Dados Relacional (Supabase + Cloud SQL PostgreSQL + Migrations)
- **Integração Supabase (`@supabase/supabase-js`)**:
  - `src/lib/supabase.ts`: cliente administrativo server-side (`getSupabaseAdmin`, `isSupabaseConfigured`) usando `NEXT_PUBLIC_SUPABASE_URL` (ou `SUPABASE_URL`) e `SUPABASE_SERVICE_ROLE_KEY`.
  - `src/db/supabase-repositories.ts`: implementação completa de todas as operações do FocusLearn (perfil, seed atômico, matérias, tarefas, sessões Pomodoro com soma de horas, planejador, anotações Markdown, metas e comunidade) via `@supabase/supabase-js`.
  - `supabase/migrations/20261116000000_initial_schema.sql`: migration SQL inicial pronta para Supabase CLI / SQL Editor com as 8 tabelas, FKs (`ON DELETE CASCADE`), índices e `ENABLE ROW LEVEL SECURITY` em todas as tabelas.
- **Gateway de Banco (`src/db/gateway.ts`)**:
  - Todas as rotas `/app/api/*` importam exclusivamente de `src/db/gateway.ts`.
  - Quando `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados (ex.: Vercel / `.env.local`), **todas as operações rodam diretamente no Supabase**.
  - Caso ainda não estejam definidos (ex.: preview interno do AI Studio), o gateway utiliza o PostgreSQL Cloud SQL local (`drizzle-orm` + `pg`) para manter a aplicação funcional.
- **Cloud SQL PostgreSQL & Drizzle (fallback local no AI Studio)**:
  - Instância `moonlit-rock-j5v9p` / `ai-studio-55559ac6` (`us-west2`), `src/db/schema.ts`, `src/db/drizzle.config.ts`, `drizzle/0000_shocking_hiroim.sql` e `src/db/index.ts` com `idleTimeoutMillis: 10000`, `keepAlive: true` e tratamento silencioso de desconexões ociosas em *scale-to-zero*.

### 2.4. API Routes (`/app/api/*`)
Todas protegidas por `verifyRequestAuth` e conectadas via `src/db/gateway.ts`:
- `GET /api/workspace`
- `PATCH /api/profile`
- `POST /api/subjects` · `PATCH / DELETE /api/subjects/[id]`
- `POST /api/tasks` · `PATCH / DELETE /api/tasks/[id]`
- `POST /api/sessions`
- `POST /api/schedule` · `DELETE /api/schedule/[id]`
- `POST /api/notes` · `PATCH / DELETE /api/notes/[id]`
- `POST /api/goals` · `PATCH / DELETE /api/goals/[id]`
- `GET / POST /api/community` · `DELETE /api/community/[id]`

### 2.5. Documentação e Config
- `README.md`: documentação completa em português para GitHub (incluindo passo a passo do Supabase, migration SQL e deploy).
- `.env.example`: inclui variáveis `GEMINI_API_KEY`, `APP_URL`, `SQL_*`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- `package.json`: scripts `dev`, `build`, `start`, `lint`, `clean`, `db:generate`, `db:push`.
- Arquivos legados do Firestore inicial (`firebase-blueprint.json`, `firestore.rules`, `firestore.rules.test.ts`, `security_spec.md`) permanecem no repositório para referência, mas a persistência ativa usa `/api/*` + Supabase/PostgreSQL.

---

## 3. Problemas Resolvidos Recentemente

1. **Erro de pool ocioso no PostgreSQL (`Connection terminated unexpectedly`)**:
   - *Causa*: o proxy/instância Cloud SQL em *scale-to-zero* encerrava conexões TCP/Unix ociosas e o `pool.on('error')` emitia `console.error`.
   - *Solução*: adicionado `idleTimeoutMillis: 10000`, `keepAlive: true` e filtro de desconexões ociosas benignas em `src/db/index.ts`.
2. **Cache `.next` corrompido (`ENOENT: app-paths-manifest.json` / `routes-manifest.json`)**:
   - *Solução*: limpeza completa de `.next` (`rm -rf .next`) e rebuild limpo.
3. **Falha de build em `next/font/google` (`TypeError: Cannot read properties of null (reading '1')`)**:
   - *Causa*: o loader `next/font/google` do Next.js 15.5.29 falhou ao parsear URLs de fontes no build (`loader.js:122`).
   - *Solução*: substituído em `app/layout.tsx` por `<link rel="stylesheet">` direto do Google Fonts no `<head>`, com `@theme inline` em `app/globals.css` apontando diretamente para `"DM Sans"`, `"Plus Jakarta Sans"` e `"JetBrains Mono"`.
4. **Regras ESLint / React 19**:
   - Corrigidos `set-state-in-effect` em `FocusProvider.tsx`, `SettingsProfileView.tsx` e `hooks/use-mobile.ts` (refatorado com `useSyncExternalStore`), e imagem de avatar migrada para `next/image` em `components/UserAvatar.tsx` com `lh3.googleusercontent.com` em `next.config.ts`.

---

## 4. Ações Pendentes / Manuais Externas (Console)

1. **Ativar o Supabase no projeto externo / Vercel**:
   - Executar `supabase/migrations/20261116000000_initial_schema.sql` no SQL Editor do projeto Supabase (ou `supabase db push`).
   - Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel / `.env.local`.
2. **Domínio Vercel no Firebase Authentication**:
   - Adicionar `focus-learn-project.vercel.app` em:
     - Firebase Console → `moonlit-rock-j5v9p` → **Authentication → Settings → Authorized domains**
     - *(Se necessário para OAuth Google)* Google Cloud Console → OAuth Client `126975480206-5raq0jhcpq1d57gpv3ecnl0n8m5oo9u2.apps.googleusercontent.com` → Origens JS autorizadas: `https://focus-learn-project.vercel.app`.
3. **Provedor E-mail/Senha (Opcional)**:
   - Login com Google funciona imediatamente. Para habilitar login/cadastro por E-mail e Senha, ativar o provedor *Email/Password* no Firebase Authentication Console.

---

## 5. Estado Atual Verificado

- Build (`next build`) e ESLint (`eslint .`) validados após integração do Supabase e correções de `.next` e fontes.
- Servidor de desenvolvimento reiniciado com build limpo.
