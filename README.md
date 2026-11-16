# FocusLearn

Plataforma inteligente de estudos e produtividade acadêmica construída com **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS** e **Firebase (Authentication + Cloud Firestore)**.

O FocusLearn centraliza o acompanhamento de disciplinas, cronômetro Pomodoro com sintetizador de som ambiente, planejador semanal, cadernos em Markdown, metas semestrais e salas de estudo da comunidade em tempo real — com sincronização na nuvem para contas autenticadas e modo de visualização local (`localStorage`) para uso imediato.

---

## Funcionalidades

### Autenticação e Contas
- **Login com Google** (`signInWithPopup`) e fluxos completos de **E-mail/Senha**, **Cadastro** (`/cadastro`) e **Recuperação de Senha** (`/recuperar-senha`).
- Persistência em nuvem via **Cloud Firestore** quando autenticado e fallback automático em `localStorage` no modo visitante.

### 8 Módulos Integrados no Painel Principal (`/`)
1. **Visão Geral (Dashboard)**: Indicadores dinâmicos de desempenho, mapa de calor de frequência dos últimos 30 dias, gráfico semanal de carga de estudo, widget de Pomodoro rápido sincronizado e lista de micro-tarefas.
2. **Matérias & Cursos**: CRUD completo de disciplinas, filtro por status (`Ativas`, `Concluídas`, `Todas`), edição inline de notas `P1`/`P2`, calculadora automática de média e situação acadêmica (Aprovado, Final ou Reprovado) e atalho de 1 clique para iniciar uma sessão Pomodoro na matéria.
3. **Cronômetro Pomodoro & Modo Zen**: Timer global (`25m`, `50m`, `5m`, `15m`) vinculado à disciplina selecionada, registro automático das sessões concluídas, modo tela cheia sem distrações (saída com `Escape`) e sintetizador de áudio ambiente via **Web Audio API** (`Chuva`, `Lo-Fi`, `Ruído Branco`, `Biblioteca`) com controle de volume e aviso sonoro ao finalizar.
4. **Planejador Semanal**: Grade interativa de 7 dias (`SEG`–`DOM`) por horário (`08:00`–`20:00`) com agendamento direto ao clicar em células vazias, criação/remoção de blocos e filtros por categoria (`Aula`, `Revisão`, `Prova`, `Pausa`).
5. **Estatísticas & Metas**: Distribuição de horas estudadas por disciplina, gerenciamento de metas semestrais (com incremento de progresso e trava ao concluir) e exportação para impressão/PDF.
6. **Anotações & Cadernos**: Layout em dois painéis com busca, filtro por tags, editor Markdown e pré-visualização renderizada em tempo real.
7. **Comunidade & Chat**: Canais em tempo real (`#calculo`, `#algoritmos`, `#geral`) sincronizados via `onSnapshot` do Firestore para usuários autenticados, com envio e exclusão das próprias mensagens.
8. **Configurações & Perfil**: Edição de perfil acadêmico, alternância de tema **Claro / Escuro** persistida, gerenciamento de sessão e opção de restauração dos dados locais.

---

## Stack Tecnológica

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + `tw-animate-css`
- **Animações e Ícones**: [Motion](https://motion.dev/) (`motion/react`) & [Lucide React](https://lucide.dev/)
- **Markdown**: [`react-markdown`](https://github.com/remarkjs/react-markdown)
- **Backend / BaaS**: [Firebase Authentication & Cloud Firestore](https://firebase.google.com/)
- **Áudio**: Web Audio API nativa (síntese procedural no navegador, sem arquivos MP3 externos)
- **Qualidade e Segurança**: ESLint 9 (`eslint-config-next` + `@firebase/eslint-plugin-security-rules`)

---

## Estrutura do Projeto

```text
├── app/
│   ├── cadastro/page.tsx          # Página de criação de conta
│   ├── login/page.tsx             # Página de login (Google e E-mail/Senha)
│   ├── recuperar-senha/page.tsx   # Página de recuperação de senha
│   ├── globals.css                # Configuração Tailwind v4, variantes dark e impressão
│   ├── layout.tsx                 # Fontes, metadados e providers globais
│   └── page.tsx                   # Entrada principal da plataforma
├── components/
│   ├── views/
│   │   ├── CommunityView.tsx      # Chat da comunidade por canais
│   │   ├── DashboardView.tsx      # Visão geral, heatmap e tarefas rápidas
│   │   ├── NotesView.tsx          # Cadernos em Markdown
│   │   ├── PlannerView.tsx        # Grade semanal interativa
│   │   ├── PomodoroView.tsx       # Cronômetro e sintetizador de áudio
│   │   ├── SettingsProfileView.tsx# Perfil acadêmico, tema e conta
│   │   ├── StatsGoalsView.tsx     # Estatísticas e metas semestrais
│   │   └── SubjectsView.tsx       # Disciplinas e cálculo de média
│   ├── FirebaseProvider.tsx       # Contexto de autenticação Firebase
│   ├── FocusLearnShell.tsx        # Layout principal, sidebar e navegação
│   ├── FocusProvider.tsx          # Estado global, Firestore onSnapshot e fallback local
│   ├── ToastBanner.tsx            # Notificações toast
│   ├── UserAvatar.tsx             # Avatar do usuário com fallback de iniciais
│   └── ZenModeModal.tsx           # Modo de foco em tela cheia
├── hooks/
│   └── use-mobile.ts              # Detecção responsiva via useSyncExternalStore
├── lib/
│   ├── audio.ts                   # Sintetizador Web Audio API e sino de conclusão
│   ├── firebase.ts                # Inicialização do Firebase App, Auth e Firestore
│   ├── seedData.ts                # Dados iniciais de exemplo e cálculo de médias
│   ├── types.ts                   # Tipagens TypeScript do domínio
│   └── utils.ts                   # Utilitários de classe CSS
├── firestore.rules                # Regras de segurança do Cloud Firestore
├── firestore.rules.test.ts        # Casos de auditoria das regras de segurança
├── firebase-blueprint.json        # Esquema declarativo das coleções do Firestore
└── package.json
```

---

## Modelo de Dados e Segurança (Firestore)

Os dados privados de cada estudante ficam isolados sob `/users/{userId}` com validação estrita de propriedade (`ownerId == request.auth.uid`) e esquema de campos em `firestore.rules`:

- `/users/{userId}` — Perfil acadêmico e preferências de tema/meta diária
- `/users/{userId}/subjects/{subjectId}` — Disciplinas, notas e horas estudadas
- `/users/{userId}/tasks/{taskId}` — Micro-tarefas rápidas
- `/users/{userId}/sessions/{sessionId}` — Histórico imutável de blocos Pomodoro
- `/users/{userId}/schedule/{blockId}` — Blocos da grade semanal
- `/users/{userId}/notes/{noteId}` — Anotações em Markdown
- `/users/{userId}/goals/{goalId}` — Metas semestrais
- `/communityMessages/{messageId}` — Mensagens públicas dos canais `#calculo`, `#algoritmos` e `#geral` (leitura para usuários autenticados, criação/remoção restrita ao autor)

---

## Como Executar Localmente

### 1. Pré-requisitos
- **Node.js 20+**
- **npm** (ou gerenciador compatível)
- Um projeto no [Firebase Console](https://console.firebase.google.com/) com **Authentication** e **Cloud Firestore** ativados

### 2. Clonar e instalar dependências

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
npm install
```

### 3. Configurar variáveis e Firebase

1. Copie `.env.example` para `.env.local` caso utilize variáveis de ambiente no deploy:
   ```bash
   cp .env.example .env.local
   ```
2. Crie ou atualize o arquivo `firebase-applet-config.json` na raiz do projeto com as credenciais web do seu projeto Firebase:
   ```json
   {
     "apiKey": "SUA_FIREBASE_API_KEY",
     "authDomain": "SEU_PROJETO.firebaseapp.com",
     "projectId": "SEU_PROJECT_ID",
     "storageBucket": "SEU_PROJETO.firebasestorage.app",
     "messagingSenderId": "SEU_SENDER_ID",
     "appId": "SEU_APP_ID",
     "firestoreDatabaseId": "(default)"
   }
   ```
3. No **Firebase Console → Authentication → Sign-in method**:
   - Ative o provedor **Google** (e adicione `localhost` aos domínios autorizados).
   - *(Opcional)* Ative o provedor **E-mail/senha** se desejar habilitar login, cadastro e recuperação por senha além do Google.
4. Implante as regras de segurança do arquivo `firestore.rules` no seu banco Firestore:
   ```bash
   npx firebase deploy --only firestore:rules
   ```

### 4. Iniciar em desenvolvimento

```bash
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
| `npm run lint` | Executa ESLint no código e nas regras de segurança do Firestore |
| `npm run clean` | Limpa artefatos de cache do Next.js |

---

## Licença

Projeto desenvolvido para organização e produtividade acadêmica. Sinta-se à vontade para adaptar e evoluir conforme as necessidades do seu fluxo de estudos.
