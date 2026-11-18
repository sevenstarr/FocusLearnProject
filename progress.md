# Progress Log — FocusLearn SaaS

Documento de contexto técnico para continuidade por outros agentes e desenvolvedores.

---

## 1. Visão Geral do Projeto

- **Nome**: FocusLearn (`metadata.json`)
- **Objetivo**: Plataforma web inteligente de estudos e produtividade acadêmica em português (`pt-BR`), convertida de 4 protótipos HTML estáticos (`/public/assets/aistudio/*.html`) para **Next.js 15 (App Router)** com autenticação **Supabase Auth** (Google OAuth + E-mail/Senha) e persistência relacional em **Supabase PostgreSQL**. O modo sem conta usa armazenamento local no navegador; Drizzle/Cloud SQL é legado e não autentica as rotas do produto.
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

### 2.2. Autenticação Supabase Auth (`/app/login`, `/app/cadastro`, `/app/recuperar-senha`, `/auth/callback`)
- **Client SDK**: `lib/supabase-browser.ts` (`flowType: 'pkce'`, `safeStorage`) e `components/AuthProvider.tsx` (`useAuth()`), obtendo configuração pública via `NEXT_PUBLIC_*` ou em runtime por `GET /api/auth/config`.
- **Google OAuth**: `signInWithOAuth({ provider: 'google', options: { skipBrowserRedirect: true } })` abrindo popup direto na URL do provedor e recebendo retorno via `app/auth/callback/route.ts` (`postMessage` + `BroadcastChannel`, com suporte também a redirect tradicional fora de iframe).
- **E-mail/Senha & Recuperação**: `signInWithPassword`, `signUp` e `resetPasswordForEmail` via Supabase Auth.
- **Verificação Server-Side**: `src/lib/api-auth.ts` (`verifyRequestAuth` validando `Authorization: Bearer <access_token>` com `supabase.auth.getUser(token)`).
- **Fallback Local**: Quando o usuário não está autenticado, o `FocusProvider` opera localmente via `localStorage` (`focuslearn_local_state_v2`) com dados iniciais de `lib/seedData.ts`. Quando autenticado com sessão válida, sincroniza com a API REST.

### 2.3. Banco de Dados Relacional (Supabase + Cloud SQL PostgreSQL + Migrations)
- **Integração Supabase (`@supabase/supabase-js`)**:
  - `src/lib/supabase.ts`: cliente administrativo server-side (`getSupabaseAdmin`, `isSupabaseConfigured`) usando `NEXT_PUBLIC_SUPABASE_URL` (ou `SUPABASE_URL`) e `SUPABASE_SERVICE_ROLE_KEY`.
  - `src/db/supabase-repositories.ts`: implementação completa de todas as operações do FocusLearn (perfil, seed atômico, matérias, tarefas, sessões Pomodoro com soma de horas, planejador, anotações Markdown, metas e comunidade) via `@supabase/supabase-js`.
  - `supabase/migrations/20261116000000_initial_schema.sql`: migration SQL inicial pronta para Supabase CLI / SQL Editor com as 8 tabelas, FKs (`ON DELETE CASCADE`), índices e `ENABLE ROW LEVEL SECURITY` em todas as tabelas.
- **Gateway de Banco (`src/db/gateway.ts`)**:
  - Todas as rotas `/app/api/*` importam exclusivamente de `src/db/gateway.ts`.
  - Quando `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados (ex.: Vercel / `.env.local`), **todas as operações rodam diretamente no Supabase**.
  - Sem credenciais Supabase, as rotas autenticadas respondem `401`; o modo sem conta usa `localStorage` no navegador. A integração Drizzle/Cloud SQL não é um backend alternativo autenticado e é mantida como legado/ferramenta.
- **Cloud SQL PostgreSQL & Drizzle (legado)**:
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

5. **Logs e diagnóstico de queries Supabase (`src/db/supabase-repositories.ts`)**:
   - Substituídos logs multi-linha `console.error(..., err)` por `throwSupabaseError` em linha única (`console.warn`) com mensagens claras em português para tabelas não migradas (`PGRST205`/`42P01`), chave `service_role` incorreta (`42501`/`Invalid API key`) ou erro de rede (`fetch failed`).
6. **Migração do Login Google & Auth para Supabase Auth**:
   - Removidos `components/FirebaseProvider.tsx`, `lib/firebase.ts` e `src/lib/firebase-admin.ts` das rotas ativas; substituídos por `AuthProvider.tsx`, `lib/supabase-browser.ts`, `app/auth/callback/route.ts`, `app/api/auth/config/route.ts` e `src/lib/api-auth.ts` usando `supabase.auth.getUser(token)`.

---

## 4. Ações Pendentes / Manuais Externas (Console)

1. **Aplicar Migration SQL no Supabase**:
   - Executar `supabase/migrations/20261116000000_initial_schema.sql` no SQL Editor do projeto Supabase (inclui tabelas, RLS, `GRANT` para `service_role` e `NOTIFY pgrst, 'reload schema'`).
2. **Ativar Google OAuth no Supabase**:
   - Em **Supabase → Authentication → Providers → Google**: ativar e preencher Client ID / Client Secret do Google Cloud Console.
   - Em **Supabase → Authentication → URL Configuration → Redirect URLs**: adicionar as URLs de callback (`/auth/callback`) do preview AI Studio, `https://focus-learn-project.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`.
   - No **Google Cloud Console → OAuth Client → Authorized redirect URIs**: adicionar `https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback`.
3. **Secrets / Variáveis de Ambiente**:
   - Garantir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` configurados nos Secrets do AI Studio e na Vercel.

---

## 5. Estado Atual Verificado

- Build (`next build`) e ESLint (`eslint .`) validados após migração completa de banco e autenticação para Supabase.
- Servidor de desenvolvimento reiniciado com código atualizado.
