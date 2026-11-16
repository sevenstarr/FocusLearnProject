# FocusLearn

Plataforma inteligente de estudos e produtividade acadêmica construída com **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL (Cloud SQL)** com **Drizzle ORM** e **Firebase Authentication**.

O FocusLearn centraliza o acompanhamento de disciplinas, cronômetro Pomodoro com sintetizador de som ambiente, planejador semanal, cadernos em Markdown, metas semestrais e salas de estudo da comunidade — com persistência relacional em PostgreSQL via API Routes protegidas por tokens JWT do Firebase e modo de visualização local (`localStorage`) para uso imediato.

---

## Funcionalidades

### Autenticação e Contas
- **Login com Google** (`signInWithPopup`) e fluxos completos de **E-mail/Senha**, **Cadastro** (`/cadastro`) e **Recuperação de Senha** (`/recuperar-senha`).
- Verificação de identidade no backend via **Firebase Admin SDK** (`Authorization: Bearer <idToken>`) em todas as rotas `/api/*`.
- Fallback automático em `localStorage` no modo visitante quando não autenticado.

### 8 Módulos Integrados no Painel Principal (`/`)
1. **Visão Geral (Dashboard)**: Indicadores dinâmicos de desempenho, mapa de calor de frequência dos últimos 30 dias, gráfico semanal de carga de estudo, widget de Pomodoro rápido sincronizado e lista de micro-tarefas.
2. **Matérias & Cursos**: CRUD completo de disciplinas, filtro por status (`Ativas`, `Concluídas`, `Todas`), edição inline de notas `P1`/`P2`, calculadora automática de média e situação acadêmica (Aprovado, Final ou Reprovado) e atalho de 1 clique para iniciar uma sessão Pomodoro na matéria.
3. **Cronômetro Pomodoro & Modo Zen**: Timer global (`25m`, `50m`, `5m`, `15m`) vinculado à disciplina selecionada, registro transacional das sessões concluídas com incremento automático de horas da matéria, modo tela cheia sem distrações (saída com `Escape`) e sintetizador de áudio ambiente via **Web Audio API** (`Chuva`, `Lo-Fi`, `Ruído Branco`, `Biblioteca`) com controle de volume e aviso sonoro ao finalizar.
4. **Planejador Semanal**: Grade interativa de 7 dias (`SEG`–`DOM`) por horário (`08:00`–`20:00`) com agendamento direto ao clicar em células vazias, criação/remoção de blocos e filtros por categoria (`Aula`, `Revisão`, `Prova`, `Pausa`).
5. **Estatísticas & Metas**: Distribuição de horas estudadas por disciplina, gerenciamento de metas semestrais (com incremento de progresso e trava ao concluir) e exportação para impressão/PDF.
6. **Anotações & Cadernos**: Layout em dois painéis com busca, filtro por tags, editor Markdown e pré-visualização renderizada em tempo real.
7. **Comunidade & Chat**: Canais (`#calculo`, `#algoritmos`, `#geral`) persistidos no PostgreSQL com envio e exclusão das próprias mensagens.
8. **Configurações & Perfil**: Edição de perfil acadêmico, alternância de tema **Claro / Escuro** persistida, gerenciamento de sessão e opção de restauração dos dados locais.

---

## Stack Tecnológica

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/)
- **Banco de Dados & ORM**: **PostgreSQL** (`pg` pool) + [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit (`drizzle/`)
- **Autenticação**: [Firebase Authentication](https://firebase.google.com/) (Client SDK + `firebase-admin`)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + `tw-animate-css`
- **Animações e Ícones**: [Motion](https://motion.dev/) (`motion/react`) & [Lucide React](https://lucide.dev/)
- **Markdown**: [`react-markdown`](https://github.com/remarkjs/react-markdown)
- **Áudio**: Web Audio API nativa (síntese procedural no navegador)

---

## Estrutura do Projeto

```text
├── app/
│   ├── api/
│   │   ├── community/             # GET/POST/DELETE mensagens da comunidade
│   │   ├── goals/                 # POST/PATCH/DELETE metas semestrais
│   │   ├── notes/                 # POST/PATCH/DELETE cadernos em Markdown
│   │   ├── profile/               # PATCH perfil acadêmico e tema
│   │   ├── schedule/              # POST/DELETE blocos da grade semanal
│   │   ├── sessions/              # POST registro transacional Pomodoro + horas
│   │   ├── subjects/              # POST/PATCH/DELETE disciplinas e notas
│   │   ├── tasks/                 # POST/PATCH/DELETE micro-tarefas
│   │   └── workspace/             # GET bootstrap/upsert e carregamento inicial
│   ├── cadastro/page.tsx          # Página de criação de conta
│   ├── login/page.tsx             # Página de login (Google e E-mail/Senha)
│   ├── recuperar-senha/page.tsx   # Página de recuperação de senha
│   ├── globals.css                # Configuração Tailwind v4, variantes dark e impressão
│   ├── layout.tsx                 # Fontes, metadados e providers globais
│   └── page.tsx                   # Entrada principal da plataforma
├── src/
│   ├── db/
│   │   ├── drizzle.config.ts      # Configuração do Drizzle Kit (admin)
│   │   ├── index.ts               # Pool PostgreSQL (Object Method) + instância Drizzle
│   │   ├── repositories.ts        # Consultas e mutações tipadas com Drizzle ORM
│   │   ├── schema.ts              # Definição das 8 tabelas PostgreSQL e relações
│   │   └── users.ts               # Upsert de usuário e seed inicial atômico
│   └── lib/
│       ├── api-auth.ts            # Verificação de Bearer JWT do Firebase
│       └── firebase-admin.ts      # Inicialização do Firebase Admin SDK
├── drizzle/
│   └── 0000_shocking_hiroim.sql   # Migration SQL inicial (8 tabelas, FKs e índices)
├── components/
│   ├── views/                     # Os 8 módulos visuais do painel
│   ├── FirebaseProvider.tsx       # Contexto de autenticação Firebase
│   ├── FocusLearnShell.tsx        # Layout principal, sidebar e navegação
│   ├── FocusProvider.tsx          # Estado global, chamadas API e fallback local
│   ├── ToastBanner.tsx            # Notificações toast
│   ├── UserAvatar.tsx             # Avatar do usuário com fallback de iniciais
│   └── ZenModeModal.tsx           # Modo de foco em tela cheia
├── hooks/
│   └── use-mobile.ts              # Detecção responsiva via useSyncExternalStore
└── lib/
    ├── audio.ts                   # Sintetizador Web Audio API e sino de conclusão
    ├── firebase.ts                # Inicialização do Firebase Client Auth
    ├── seedData.ts                # Dados iniciais de exemplo e cálculo de médias
    ├── types.ts                   # Tipagens TypeScript do domínio
    └── utils.ts                   # Utilitários de classe CSS
```

---

## Modelo de Dados e Migrations (PostgreSQL)

As migrations SQL versionadas ficam em `drizzle/` e são geradas a partir de `src/db/schema.ts`:

- `users` — Perfil acadêmico, preferências, streak e flag `seeded` (`uid` único indexado)
- `subjects` — Disciplinas, créditos, notas `p1`/`p2` e `hours_studied` (FK `owner_id -> users.uid`)
- `quick_tasks` — Micro-tarefas rápidas (FK `owner_id -> users.uid`)
- `pomodoro_sessions` — Histórico de blocos Pomodoro concluídos (FK `owner_id -> users.uid`)
- `schedule_blocks` — Blocos do planejador semanal (FK `owner_id -> users.uid`)
- `study_notes` — Cadernos em Markdown com tags em `jsonb` (FK `owner_id -> users.uid`)
- `semester_goals` — Metas semestrais com status `active` / `completed` (FK `owner_id -> users.uid`)
- `community_messages` — Mensagens por canal da comunidade (FK `author_id -> users.uid`)

Todas as chaves estrangeiras possuem `ON DELETE CASCADE` e índices nas colunas de consulta frequente.

---

## Como Executar Localmente

### 1. Pré-requisitos
- **Node.js 20+**
- Banco **PostgreSQL** (Cloud SQL ou instância compatível)
- Projeto no [Firebase Console](https://console.firebase.google.com/) com **Authentication** ativado

### 2. Clonar e instalar dependências

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
npm install
```

### 3. Configurar variáveis e credenciais

1. Copie `.env.example` para `.env.local` (ou `.env` para o Drizzle Kit) e preencha as credenciais do PostgreSQL:
   ```bash
   cp .env.example .env.local
   ```
   Variáveis esperadas:
   - `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD` (usuário de leitura/escrita da aplicação)
   - `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` (usuário administrativo usado pelas migrations do Drizzle Kit)

2. Configure `firebase-applet-config.json` na raiz do projeto com as credenciais web do seu projeto Firebase:
   ```json
   {
     "apiKey": "SUA_FIREBASE_API_KEY",
     "authDomain": "SEU_PROJETO.firebaseapp.com",
     "projectId": "SEU_PROJECT_ID",
     "storageBucket": "SEU_PROJETO.firebasestorage.app",
     "messagingSenderId": "SEU_SENDER_ID",
     "appId": "SEU_APP_ID"
   }
   ```
3. No **Firebase Console → Authentication → Sign-in method**, ative o provedor **Google** (e, opcionalmente, **E-mail/senha**).

### 4. Executar migrations e iniciar

```bash
# Gerar nova migration SQL a partir de src/db/schema.ts (quando alterar o schema)
npm run db:generate

# Aplicar schema no PostgreSQL
npm run db:push

# Iniciar em desenvolvimento na porta 3000
npm run dev
```

Acesse `http://localhost:3000` no navegador.

---

## Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js na porta `3000` |
| `npm run build` | Compila a aplicação para produção (`output: "standalone"`) |
| `npm run start` | Executa a build de produção |
| `npm run lint` | Executa ESLint no código do projeto |
| `npm run db:generate` | Gera arquivos de migration SQL em `drizzle/` via Drizzle Kit |
| `npm run db:push` | Sincroniza o schema `src/db/schema.ts` no PostgreSQL |
| `npm run clean` | Limpa artefatos de cache do Next.js |

---

## Licença

Projeto desenvolvido para organização e produtividade acadêmica. Sinta-se à vontade para adaptar e evoluir conforme as necessidades do seu fluxo de estudos.
