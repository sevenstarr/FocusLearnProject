# Relatório de aquisição e revisão — FocusLearn

**Data da análise:** 18/11/2026

**Repositório de origem:** https://github.com/sevenstarr/FocusLearnProject

**Commit baixado:** `70f7dfc695bd4007c9244194be676cc446e7ab46`

**Commit publicado em:** 17/11/2026

**Escopo:** inventário estático do código e revisão dos fluxos de autenticação, persistência, comunidade e cronômetro. Nenhum arquivo funcional da aplicação foi alterado nesta revisão.

## Resultado da aquisição

- O código foi clonado para `FocusLearnProject-source`, preservando o histórico Git e o remoto `origin` configurado para o repositório indicado.
- A cópia existente, o ZIP e as outras pastas de trabalho no diretório pai foram preservados.
- O clone começou limpo na branch `main`. Este relatório é a única adição local e ainda não foi commitado.
- O projeto contém uma aplicação Next.js 15 / React 19 / TypeScript, com Supabase Auth e PostgreSQL como caminho principal, Drizzle ORM como camada de acesso e um modo local baseado em `localStorage`.

## Resumo da revisão

O projeto já separa boa parte do acesso a dados por repositórios e valida o token Supabase no backend. O cronômetro de foco recompensado também confirma o tempo no servidor antes de registrar créditos. Encontrei dois problemas funcionais prioritários ligados à configuração documentada e ao histórico do chat. Também recomendo fortalecer validação de entrada, automação de qualidade e a estratégia de migrações.

## Achados

### P1 — O fallback para PostgreSQL local não funciona com autenticação sem Supabase

`verifyRequestAuth` retorna `null` sempre que Supabase não está configurado ([src/lib/api-auth.ts:24](src/lib/api-auth.ts:24)). As rotas de API dependem desse verificador antes de acessar o gateway de dados. Embora o gateway escolha Drizzle/PostgreSQL quando Supabase não está configurado ([src/db/gateway.ts:62](src/db/gateway.ts:62)), a requisição é recusada antes de chegar a essa camada. Isso contradiz a descrição de fallback no README e torna o caminho Drizzle inacessível pelas rotas atuais sem uma estratégia de autenticação local.

**Ação sugerida:** decidir entre suportar autenticação local de forma explícita e segura ou remover/documentar como indisponível o fallback de PostgreSQL. Evitar aceitar um UID enviado pelo cliente como substituto de autenticação.

### P1 — O chat deixa de mostrar mensagens novas depois das primeiras 100

A consulta ordena mensagens da mais antiga para a mais recente e aplica `limit(100)` ([src/db/supabase-repositories.ts:952](src/db/supabase-repositories.ts:952)). Quando um canal ultrapassa 100 mensagens, as próximas consultas continuam retornando o mesmo início do histórico; o polling a cada oito segundos no cliente não corrige isso ([components/FocusProvider.tsx:454](components/FocusProvider.tsx:454)).

**Ação sugerida:** paginar por cursor/`created_at` e buscar a janela mais recente, ou carregar mensagens posteriores à última mensagem já exibida. Manter limite e ordem consistentes entre páginas.

### P2 — O endpoint de chat aceita texto de tamanho ilimitado antes de truncar

O handler lê o corpo JSON e só verifica se a mensagem está vazia ([app/api/community/route.ts:43](app/api/community/route.ts:43)); o repositório trunca o texto para 1.000 caracteres ao inserir ([src/db/supabase-repositories.ts:973](src/db/supabase-repositories.ts:973)). Assim, payloads muito grandes ainda são recebidos e processados antes do truncamento.

**Ação sugerida:** impor tamanho máximo no handler antes de persistir, retornar `400` para mensagens acima do limite e adotar validação de schema compartilhada nas rotas que recebem JSON.

### P2 — Lint pode ser ignorado durante build de produção

O Next está configurado para ignorar erros de ESLint durante o build ([next.config.ts:5](next.config.ts:5)). Isso permite publicar uma build sem que o lint bloqueie a integração, e não há script de teste automatizado no `package.json` ([package.json:5](package.json:5)).

**Ação sugerida:** executar lint e verificações de tipos em CI como etapas obrigatórias; manter o build isolado dessas verificações apenas se o pipeline garantir que elas rodem antes da publicação.

## Plano de melhorias e otimizações

1. **Resolver o contrato de execução local (P1):** escolher uma arquitetura suportada para autenticação e persistência local; atualizar README, `.env.example` e respostas da aplicação para refletir exatamente os modos disponíveis.
2. **Corrigir a leitura do chat (P1):** implementar paginação por cursor e janela recente; considerar substituir polling integral por Supabase Realtime ou polling incremental para reduzir transferência e consultas repetidas.
3. **Validar entradas no servidor (P2):** adotar schemas por rota, limites de tamanho, enumerações e limites de paginação; padronizar respostas de erro sem expor detalhes internos do banco.
4. **Criar verificações automatizadas (P2):** adicionar testes unitários para regras de domínio e integração para isolamento entre usuários, transições de sessão, recompensas e compra de cosméticos; configurar CI para lint, TypeScript e build.
5. **Unificar migrações (P2):** documentar qual conjunto (`supabase/migrations` ou `drizzle`) é fonte oficial, automatizar a aplicação em ambiente descartável e detectar divergência de schema antes de produção.
6. **Acompanhar desempenho (P3):** medir consultas e latência das rotas de workspace/chat, reduzir respostas que retornam campos desnecessários e aplicar paginação onde listas podem crescer.

## Ideias de features

- **Plano de estudos adaptativo:** transformar avaliações e metas em um plano semanal ajustável conforme o tempo disponível e o progresso real.
- **Revisão espaçada:** agendar revisões de matérias/anotações com intervalos configuráveis e lembretes, com um painel de itens para revisar hoje.
- **Quiz a partir das anotações:** gerar perguntas de estudo usando o conteúdo escolhido pelo usuário; o pacote `@google/genai` está declarado, mas não encontrei uso ativo dele no código da aplicação revisado.
- **Salas de foco ao vivo:** sessões compartilhadas com presença, metas de grupo e atualização em tempo real, aproveitando a base de comunidade existente.
- **Sincronização offline:** fila local de alterações com resolução explícita de conflitos ao reconectar, em vez de manter dados locais e autenticados como modos separados.
- **Exportação de calendário:** exportar blocos do planejador em formato `.ics` e permitir importar calendário acadêmico.

## Limites desta revisão

Esta foi uma revisão estática do código do commit indicado. Não configurei credenciais, não conectei banco ou Supabase, não executei a aplicação, lint, build, testes ou análise de vulnerabilidades de dependências. Os achados são baseados nos fluxos e arquivos listados acima; recomendações de produto são propostas para priorização.

## Implementação posterior

Após a revisão, foram aplicadas mudanças no clone local:

- Chat passa a retornar a janela das mensagens mais recentes; criação limita o corpo a 8 KiB e o texto a 1.000 caracteres.
- Modo Drizzle/Cloud SQL foi documentado como legado sem autenticação de API. Modo visitante usa o armazenamento local do navegador.
- O build deixou de ignorar lint; foi adicionado script TypeScript e workflow CI de lint, tipagem e build.
- Supabase foi definido como fonte oficial das migrations; adicionadas migrations para salas de foco e limites de geração de quizzes (5 por usuário/minuto).
- Adicionadas fila offline de edições/remoções idempotentes, cache autenticado por usuário e lista de conflitos com ações de tentar novamente/descartar.
- Adicionadas sugestões de plano de estudo, cartões de revisão espaçada, geração autenticada de quiz via Gemini, salas de foco com presença e importação/exportação `.ics` semanal.

**Limites da implementação:** não foi configurado o banco; as migrations novas precisam ser aplicadas no Supabase. Quizzes exigem `GEMINI_API_KEY` e conta autenticada. Cartões são locais a este navegador/perfil. A fila offline cobre PATCH/DELETE idempotentes; criações e incrementos de metas continuam exigindo rede.

## QA local — 18/11/2026

- Aplicação compilada e aberta em `http://127.0.0.1:3000/login` para revisão no navegador. A versão de produção local continua em execução.
- Verificados no navegador: login, cadastro, recuperação de senha, privacidade, termos e acesso direto ao painel. As páginas públicas renderizaram; `/dashboard` redireciona ao login sem sessão, conforme a proteção de autenticação.
- Verificado o tema claro/escuro e presença dos campos obrigatórios de login. Sem overflow horizontal na viewport mobile simulada pelo Lighthouse.
- Lighthouse mobile na página de login: acessibilidade 100, boas práticas 100, SEO 100 e navegação por agentes 100; 31 auditorias aprovadas e nenhuma reprovada.
- Smoke test HTTP em `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/privacidade`, `/termos`, `/dashboard`, `/api/auth/config` e `/icon.svg`: todos responderam `200`. Rotas autenticadas sem token responderam `401` em `/api/workspace`, `/api/rooms` e `/api/community`; `GET /api/quiz` respondeu `405`, conforme esperado para rota somente POST. `POST /api/quiz` sem autenticação respondeu `401` com mensagem de login.
- `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check` concluíram sem erros. A primeira tentativa de build coincidiu com o servidor de desenvolvimento escrevendo em `.next`; parei o servidor e a nova build limpa concluiu normalmente.
- Durante as verificações foram corrigidos os erros de TypeScript do endpoint da comunidade, oito alertas de lint nos efeitos e no cálculo do plano adaptativo, e foi adicionado `app/icon.svg` para eliminar a ausência de ícone.

### Achados ainda não verificados ou pendentes

- As falhas de navegação e acesso ao modo local identificadas no QA pós-merge foram corrigidas no clone local; detalhes e verificações estão na seção seguinte.
- Supabase, migrations, login/cadastro reais, persistência entre usuários, filas offline, salas compartilhadas e Gemini não foram exercitados: não havia credenciais locais para esses serviços. O comportamento autenticado requer uma configuração de ambiente e banco disponíveis.
- O repositório não tem script de testes automatizados; esta bateria cobriu lint, TypeScript, build, smoke HTTP e navegação manual no navegador.

## QA da produção e correções locais pós-merge — 18/11/2026

- O deploy de produção do commit `07c290b0d69f7c0c446cb16534ff3a8af58ef255` estava `READY` no Vercel. No DevTools conectado, `/login` carregou sem mensagens no console e os recursos da página retornaram `200`. A integração do navegador reiniciou e só mostrou uma página em branco; não consegui acessar a janela física do Chrome que o usuário tinha aberto.
- Requests HTTP ao alias de produção: `GET /`, `/login`, `/cadastro`, `/recuperar-senha`, `/privacidade`, `/termos`, `/dashboard`, `/api/auth/config` responderam `200`; endpoints de dados `/api/workspace`, `/api/rooms`, `/api/community` sem sessão responderam `401`; `GET /api/quiz` respondeu `405`; `POST /api/quiz`, `/api/rooms` e `/api/community` sem sessão responderam `401`.
- Logs Vercel: nenhum grupo de erros de runtime nas últimas 24 horas; nenhum registro de erro, fatal ou aviso nos últimos 30 minutos. O conector Supabase retornou `USER_NOT_LOGGED_IN` / “not connected”, então não foi possível consultar logs, migrations aplicadas ou advisories do banco.
- **Corrigido — navegação sem destino:** o login tinha “Painel Principal” e “Ir ao Painel” apontando para `/`, que redireciona o visitante de volta para `/login`. Removi o link redundante e substituí a ação do cabeçalho por “Experimentar sem conta”.
- **Corrigido — modo visitante inacessível:** o app já armazenava dados de visitante em `localStorage`, mas protegia `/dashboard` e não oferecia outra rota para abrir o painel local. Adicionei `/preview`, com aviso de armazenamento local e retorno fácil ao login; usuários autenticados são redirecionados ao dashboard.
- O README agora documenta `/preview` e os dados que permanecem neste navegador. `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check` passaram. A build lista `/preview`; smoke local retornou `200` para `/login`, `/preview` e `/dashboard`.
- A hidratação e interação do novo fluxo visitante ainda precisam de verificação manual em um navegador conectado. A sessão de Chrome disponível não era a janela já aberta pelo usuário; não acessei nem alterei outra janela depois da correção.
