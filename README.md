<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand-assets/focuslearn-horizontal-dark.svg" />
    <img src="brand-assets/focuslearn-horizontal-light.svg" alt="FocusLearn" width="380" />
  </picture>
</p>

Plataforma inteligente de estudos e produtividade acadêmica construída com **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4** e **Supabase (Auth + PostgreSQL)**. Drizzle permanece no repositório para ferramentas e compatibilidade com o schema legado.

O FocusLearn centraliza o acompanhamento de disciplinas, cronômetro Pomodoro com sintetizador de som ambiente, planejador semanal, cadernos em Markdown, metas semestrais e salas de estudo da comunidade — com persistência relacional no Supabase PostgreSQL via API Routes protegidas por tokens JWT do **Supabase Auth** e modo de visualização local (`localStorage`) para uso imediato.

---

## Funcionalidades

### Autenticação e Contas (Supabase Auth)
- **Login com Google OAuth** via **Supabase Auth** (`signInWithOAuth` com PKCE + callback em `/auth/callback`) e fluxos completos de **E-mail/Senha**, **Cadastro** (`/cadastro`) e **Recuperação de Senha** (`/recuperar-senha`).
- Verificação de identidade no backend via `supabase.auth.getUser(token)` (`Authorization: Bearer <access_token>`) em todas as rotas `/api/*`.
- Fallback automático em `localStorage` no modo visitante quando não autenticado.

### Módulos Integrados no Painel Principal (`/`)
1. **Visão Geral (Dashboard)**: Indicadores dinâmicos de desempenho, mapa de calor de frequência dos últimos 30 dias, gráfico semanal de carga de estudo, widget de Pomodoro rápido sincronizado e lista de micro-tarefas.
2. **Matérias & Cursos**: CRUD completo de disciplinas, avaliações personalizáveis com escala e método de cálculo configuráveis, critérios de aprovação e prova final ajustáveis, simulador vinculado a uma matéria ou independente e atalho de 1 clique para iniciar uma sessão Pomodoro.
3. **Cronômetro Pomodoro & Modo Zen**: Timer global (`25m`, `50m`, `5m`, `15m`) vinculado à disciplina selecionada, registro transacional das sessões concluídas com incremento automático de horas da matéria, modo tela cheia sem distrações (saída com `Escape`) e sintetizador de áudio ambiente via **Web Audio API** (`Chuva`, `Lo-Fi`, `Ruído Branco`, `Biblioteca`) com controle de volume e aviso sonoro ao finalizar.
4. **Planejador Semanal**: Grade interativa de 7 dias (`SEG`–`DOM`) por horário (`08:00`–`20:00`) com agendamento direto ao clicar em células vazias, criação/remoção de blocos, filtros por categoria e importação/exportação `.ics`.
5. **Estatísticas & Metas**: Distribuição de horas estudadas por disciplina, gerenciamento de metas semestrais (com incremento de progresso e trava ao concluir) e exportação para impressão/PDF.
6. **Anotações & Cadernos**: Layout em dois painéis com busca, filtro por tags, editor Markdown e pré-visualização renderizada em tempo real.
7. **Comunidade & Chat**: Canais (`#calculo`, `#algoritmos`, `#geral`) persistidos no PostgreSQL com envio e exclusão das próprias mensagens.
8. **Estudos Inteligentes**: distribuição sugerida do tempo por desempenho/horas estudadas, cartões de revisão espaçada e quizzes gerados a partir de anotações com Gemini.
9. **Comunidade & Salas de Foco**: canais de mensagens, salas compartilhadas com meta e presença atualizada periodicamente.
10. **Configurações & Perfil**: Edição de perfil acadêmico, alternância de tema **Claro / Escuro** persistida, gerenciamento de sessão e opção de restauração dos dados locais.

Edições e remoções feitas durante uma falha de rede ficam em uma fila local vinculada à conta e são reenviadas ao reconectar. Respostas de conflito podem ser tentadas novamente ou descartadas nas configurações. Criações e incrementos de metas exigem conexão ativa.

---

## Stack Tecnológica

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/)
- **Banco de Dados & Autenticação**: **Supabase** (`@supabase/supabase-js` para Auth + PostgreSQL). Os utilitários Drizzle/Cloud SQL são legados e não são um backend alternativo autenticado da aplicação.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + `tw-animate-css`
- **Animações e Ícones**: [Motion](https://motion.dev/) (`motion/react`) & [Lucide React](https://lucide.dev/)
- **Markdown**: [`react-markdown`](https://github.com/remarkjs/react-markdown)
- **Áudio**: Web Audio API nativa (síntese procedural no navegador)

---

## Estrutura do Projeto

```text
├── app/
│   ├── api/
│   │   ├── auth/config/           # GET configuração pública Supabase em runtime
│   │   ├── community/             # GET/POST/DELETE mensagens da comunidade
│   │   ├── goals/                 # POST/PATCH/DELETE metas semestrais
│   │   ├── notes/                 # POST/PATCH/DELETE cadernos em Markdown
│   │   ├── profile/               # PATCH perfil acadêmico e tema
│   │   ├── schedule/              # POST/DELETE blocos da grade semanal
│   │   ├── sessions/              # POST registro transacional Pomodoro + horas
│   │   ├── subjects/              # POST/PATCH/DELETE disciplinas e notas
│   │   ├── tasks/                 # POST/PATCH/DELETE micro-tarefas
│   │   └── workspace/             # GET bootstrap/upsert e carregamento inicial
│   ├── auth/callback/route.ts     # Callback HTML OAuth Google (popup postMessage + redirect)
│   ├── cadastro/page.tsx          # Página de criação de conta
│   ├── login/page.tsx             # Página de login (Google e E-mail/Senha)
│   ├── recuperar-senha/page.tsx   # Página de recuperação de senha
│   ├── globals.css                # Configuração Tailwind v4, variantes dark e impressão
│   ├── layout.tsx                 # Fontes, metadados e providers globais
│   └── page.tsx                   # Entrada principal da plataforma
├── src/
│   ├── db/
│   │   ├── drizzle.config.ts      # Configuração do Drizzle Kit (admin)
│   │   ├── gateway.ts             # Acesso a dados Supabase e compatibilidade Drizzle legada
│   │   ├── index.ts               # Pool PostgreSQL (Object Method) + instância Drizzle
│   │   ├── repositories.ts        # Repositório Drizzle ORM (PostgreSQL)
│   │   ├── schema.ts              # Definição das 8 tabelas PostgreSQL e relações
│   │   ├── supabase-repositories.ts # Repositório Supabase (@supabase/supabase-js)
│   │   └── users.ts               # Upsert de usuário e seed inicial atômico (Drizzle)
│   └── lib/
│       ├── api-auth.ts            # Verificação de Bearer JWT via Supabase Auth
│       └── supabase.ts            # Cliente server-side Supabase (service role + config)
├── supabase/
│   └── migrations/
│       └── 20261116000000_initial_schema.sql # Migration SQL completa para Supabase + RLS
├── drizzle/
│   └── 0000_shocking_hiroim.sql   # Migration SQL Drizzle inicial
├── components/
│   ├── views/                     # Os 8 módulos visuais do painel
│   ├── AuthProvider.tsx           # Contexto de autenticação Supabase (Google OAuth + E-mail)
│   ├── FocusLearnShell.tsx        # Layout principal, sidebar e navegação
│   ├── FocusProvider.tsx          # Estado global, chamadas API e fallback local
│   ├── ToastBanner.tsx            # Notificações toast
│   ├── UserAvatar.tsx             # Avatar do usuário com fallback de iniciais
│   └── ZenModeModal.tsx           # Modo de foco em tela cheia
├── hooks/
│   └── use-mobile.ts              # Detecção responsiva via useSyncExternalStore
└── lib/
    ├── audio.ts                   # Sintetizador Web Audio API e sino de conclusão
    ├── seedData.ts                # Dados iniciais de exemplo e cálculo de médias
    ├── supabase-browser.ts        # Cliente browser Supabase Auth (PKCE + safeStorage)
    ├── types.ts                   # Tipagens TypeScript do domínio
    └── utils.ts                   # Utilitários de classe CSS
```

---

## Modelo de Dados e Migrations (Supabase / PostgreSQL)

`supabase/migrations/` é a fonte oficial para o banco ativo e deve ser aplicada em ordem via Supabase CLI ou SQL Editor. Os arquivos em `drizzle/` são legado e não devem ser usados como segunda fonte de verdade para produção.

- `users` — Perfil acadêmico, preferências, streak e flag `seeded` (`uid` único indexado)
- `subjects` — Disciplinas, avaliações e critérios acadêmicos em JSONB, nota máxima, método de cálculo e `hours_studied` (FK `owner_id -> users.uid`)
- `quick_tasks` — Micro-tarefas rápidas (FK `owner_id -> users.uid`)
- `pomodoro_sessions` — Histórico de blocos Pomodoro concluídos (FK `owner_id -> users.uid`)
- `study_session_runs`, `credit_transactions`, `cosmetic_ownership` — Sessões validadas, ledger de créditos e inventário da loja
- `schedule_blocks` — Blocos do planejador semanal (FK `owner_id -> users.uid`)
- `study_notes` — Cadernos em Markdown com tags em `jsonb` (FK `owner_id -> users.uid`)
- `semester_goals` — Metas semestrais com status `active` / `completed` (FK `owner_id -> users.uid`)
- `community_messages` — Mensagens por canal da comunidade (FK `author_id -> users.uid`)
- `study_rooms`, `study_room_presence` — Salas de foco, metas e presença atualizada periodicamente por usuário

Todas as chaves estrangeiras possuem `ON DELETE CASCADE` e índices nas colunas de consulta frequente.

---

## Como Executar Localmente (com Supabase)

### 1. Pré-requisitos
- **Node.js 20+**
- Um projeto no [Supabase](https://supabase.com/) com **Database** e **Authentication (Google Provider)** configurados

### 2. Clonar e instalar dependências

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
npm install
```

### 3. Aplicar a Migration no Supabase

1. No painel do seu projeto Supabase, abra **SQL Editor** (ou use a Supabase CLI).
2. Execute todas as migrations em ordem de nome: `20261116000000_initial_schema.sql`, `20261116010000_focus_shop.sql`, `20261116020000_tutorials_seen.sql`, `20261116030000_repair_focus_start_session_rpc.sql`, `20261116040000_subject_assessments.sql`, `20261118010000_study_rooms.sql` e `20261118020000_quiz_generation_limits.sql`.

### Créditos e loja de cosméticos

Créditos são concedidos apenas após sessões de foco concluídas pelo cronômetro autenticado: 1 por 25 minutos, 2 por 50 minutos, com limite móvel de 8 créditos em 24 horas. Pausas e sessões antigas não geram créditos. Compras e recompensas são registradas no ledger do servidor. Modo local/offline permite estudar, mas não concede créditos nem permite compras.

O catálogo inicial oferece os temas Maré (10), Bosque (40) e Nebulosa (100), além dos avatares Raposa (15), Coruja (35) e Capivara (70). Itens podem ser comprados uma vez e equipados após a compra.

### 4. Configurar variáveis e Google OAuth no Supabase

1. Copie `.env.example` para `.env.local` e preencha as chaves do seu projeto Supabase:
   ```bash
   cp .env.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_ANON_KEY"
   SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
   ```
   > As rotas de conta, dados, salas e quizzes exigem Supabase Auth e as chaves do Supabase. Sem conta, o painel oferece um modo local armazenado no navegador; esse modo não usa PostgreSQL. As credenciais `SQL_*` habilitam somente ferramentas Drizzle legadas, não autenticação local.

2. No painel do **Supabase → Authentication → Providers → Google**, ative o provedor Google informando seu Client ID / Client Secret do Google Cloud Console.
3. No **Supabase → Authentication → URL Configuration**, adicione suas URLs de redirect permitidas (ex.: `https://focus-learn-project.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`).
4. No **Google Cloud Console → Credentials (OAuth Client)**, adicione em **Authorized redirect URIs**: `https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback`.

Configure também `GEMINI_API_KEY` no servidor para habilitar quizzes. Quando o usuário inicia a geração, o título e o conteúdo da anotação selecionada são enviados ao Google Gemini.

### 5. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no navegador.

---

## Qualidade e CI

O workflow do GitHub executa lint, TypeScript e build em pushes e pull requests para `main`. As migrations Supabase são a fonte oficial do banco ativo; altere o schema por novos arquivos em `supabase/migrations/` e aplique em ambiente de teste antes de produção.

## Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js na porta `3000` |
| `npm run build` | Compila a aplicação para produção (`output: "standalone"`) |
| `npm run start` | Executa a build de produção |
| `npm run lint` | Executa ESLint no código do projeto |
| `npm run typecheck` | Executa a verificação de tipos TypeScript |
| `npm run db:generate` | Gera arquivos de migration SQL em `drizzle/` via Drizzle Kit |
| `npm run db:push` | Ferramenta legada Drizzle; não usar para o banco Supabase de produção |
| `npm run clean` | Limpa artefatos de cache do Next.js |

---

## Licença

Projeto desenvolvido para organização e produtividade acadêmica. Sinta-se à vontade para adaptar e evoluir conforme as necessidades do seu fluxo de estudos.
