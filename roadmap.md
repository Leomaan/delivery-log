# ROADMAP — Lunch Tracker

Documento-base para agentes e desenvolvedores. Leia a seção **Contexto e Regras Globais** antes de executar qualquer fase. Cada fase tem objetivo, tarefas e **critérios de aceite**; só avance quando todos forem atendidos.

---

## 1. Contexto

Aplicação para registrar as quentinhas (almoços) entregues por dia a diferentes locais, permitindo saber com **valor exato**:

- quantidade e valor entregue por local e período;
- valor recebido (pagamentos) por local e período;
- saldo (entregue − recebido).

### Stack

| Camada                    | Tecnologia                                            |
| ------------------------- | ----------------------------------------------------- |
| Runtime                   | Node.js (LTS) + TypeScript (strict)                   |
| API                       | Fastify                                               |
| Validação                 | zod                                                   |
| ORM / Banco               | Prisma + PostgreSQL                                   |
| Auth                      | JWT de acesso curto + refresh token (cookie httpOnly) |
| Testes                    | Vitest                                                |
| Frontend (fase posterior) | React + TypeScript + Tailwind CSS                     |
| Infra                     | Docker Compose, GitHub Actions                        |

### Informações ainda indefinidas (não assumir; registrar como decisão pendente)

- Forma de cobrança: por entrega, semanal ou mensal (define se pagamento é vinculado a entregas ou apenas abate o saldo).
- Descontos, cortesias e devoluções.
- Múltiplos usuários com login ou uso individual.
- Tipos/tamanhos de produto (P, M, G, com/sem bebida).

Enquanto indefinidas, implementar o modelo mínimo e **não** criar estruturas especulativas.

---

## 2. Regras Globais (obrigatórias para todos os agentes)

### Idioma

- Conversa e documentação em português.
- Código, identificadores, nomes de arquivos, mensagens de commit e mensagens de erro de API em **inglês**.

### Arquitetura em camadas

```
Route → Controller → Service → Repository → Prisma
```

| Camada     | Pode                                                | Não pode                      |
| ---------- | --------------------------------------------------- | ----------------------------- |
| Route      | Declarar endpoint, auth, schema                     | Conter lógica                 |
| Controller | Extrair dados da requisição, devolver resposta HTTP | Acessar banco, calcular regra |
| Service    | Regra de negócio, transações, orquestração          | Conhecer `req`/`res`          |
| Repository | Queries Prisma                                      | Conter regra de negócio       |

Controllers finos; regra de negócio sempre no service.

### Dinheiro

- Valores **sempre em centavos (`Int`)**. Nunca `float`.
- Conversão para reais apenas na camada de apresentação.
- Helpers centralizados em `src/shared/lib/money.ts`.

### Integridade dos dados

- O preço unitário da entrega (`unitCents`) é **copiado no momento da criação** e nunca recalculado.
- Entregas e pagamentos **não são apagados**: usar cancelamento/estorno com motivo e `canceledAt`.
- Operações em mais de uma tabela dentro de `prisma.$transaction`.
- Constraints no banco (`CHECK (quantity > 0)`, `CHECK (amount_cents > 0)`), além da validação na aplicação.
- Intervalos de preço de um mesmo local **não podem se sobrepor**.

### Segurança

- Toda entrada validada com zod.
- Nunca usar `$queryRawUnsafe`.
- Segredos somente em variáveis de ambiente; `.env` no `.gitignore`; `.env.example` versionado.
- Senhas com argon2.
- Mensagens de erro genéricas ao cliente; detalhes apenas no log.
- Dados sensíveis nunca aparecem em logs.

### Padrões de API

- Prefixo `/api/v1`.
- Erros padronizados: `{ "code": string, "message": string }`.
- Listagens paginadas (`page`, `limit`, teto máximo de `limit`).
- `/health` para monitoramento.

### Qualidade

- ESLint + Prettier + typecheck sem erros.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Todo service novo com testes unitários; toda rota nova com teste de integração.
- Migrations versionadas via `prisma migrate`; nunca `db push` em produção.
- Um PR/commit por tarefa lógica, pequeno e revisável.

### Definition of Done (qualquer tarefa)

- [ ] Código segue as camadas e regras acima
- [ ] Lint, typecheck e testes passando
- [ ] Testes cobrindo o comportamento novo e casos de erro
- [ ] Sem segredos ou dados sensíveis no código/logs
- [ ] Documentação/README atualizados se houve mudança de uso

---

## 3. Estrutura de pastas alvo

```
lunch-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/env.ts
│   │   ├── controllers/
│   │   │   └── <module>.controller.ts
│   │   ├── services/
│   │   │   └── <module>.service.ts
│   │   ├── repositories/
│   │   │   └── <module>.repository.ts
│   │   ├── routes/
│   │   │   └── <module>.routes.ts
│   │   ├── schemas/
│   │   │   └── <module>.schema.ts
│   │   ├── shared/
│   │   │   ├── errors/
│   │   │   ├── plugins/
│   │   │   ├── lib/ (prisma.ts, logger.ts, money.ts, date.ts)
│   │   │   └── types/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/
```

`app.ts` monta o Fastify sem `listen` (facilita testes); `server.ts` apenas inicia o servidor.

---

## 4. Modelo de dados inicial

```prisma
model Place {
  id         Int        @id @default(autoincrement())
  name       String
  active     Boolean    @default(true)
  prices     Price[]
  deliveries Delivery[]
  payments   Payment[]
  createdAt  DateTime   @default(now())
}

model Price {
  id        Int       @id @default(autoincrement())
  placeId   Int
  unitCents Int
  validFrom DateTime  @db.Date
  validTo   DateTime? @db.Date
  place     Place     @relation(fields: [placeId], references: [id])

  @@index([placeId, validFrom])
}

model Delivery {
  id         Int       @id @default(autoincrement())
  placeId    Int
  date       DateTime  @db.Date
  quantity   Int
  unitCents  Int       // frozen at creation time
  totalCents Int
  canceledAt DateTime?
  cancelReason String?
  place      Place     @relation(fields: [placeId], references: [id])
  createdAt  DateTime  @default(now())

  @@index([placeId, date])
}

model Payment {
  id          Int       @id @default(autoincrement())
  placeId     Int
  date        DateTime  @db.Date
  amountCents Int
  canceledAt  DateTime?
  cancelReason String?
  place       Place     @relation(fields: [placeId], references: [id])
  createdAt   DateTime  @default(now())

  @@index([placeId, date])
}
```

`User` e `RefreshToken` entram na Fase 3. Adicionar `createdBy` em `Delivery` e `Payment` nessa mesma fase.

---

## 5. Fases

### Fase 0 — Fundação do repositório

**Objetivo:** projeto roda, lintado e tipado, com ambiente reproduzível.

- [x] Inicializar `backend/` com TypeScript strict, `tsx`, scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`)
- [x] ESLint, Prettier, Husky + lint-staged
- [x] `docker-compose.yml` com PostgreSQL e app
- [x] `config/env.ts` validando variáveis com zod (falha ao subir se faltar)
- [x] `.env.example`, `.gitignore`, README inicial

**Aceite:** `docker compose up` sobe o banco; `npm run lint && npm run typecheck` passam.

### Fase 1 — Núcleo da aplicação

**Objetivo:** servidor base com segurança e tratamento de erros.

- [x] `app.ts` / `server.ts` separados
- [x] Logger pino com `requestId`
- [x] Hierarquia de erros (`AppError`, `NotFoundError`, `ConflictError`, `ValidationError`) + `errorHandler` global
- [x] Plugins: helmet, cors (origem explícita), rate-limit
- [x] Rota `/health`
- [x] Prefixo `/api/v1`

**Aceite:** teste de integração de `/health`; erro lançado em rota retorna JSON padronizado; headers de segurança presentes.

### Fase 2 — Banco de dados

**Objetivo:** schema versionado e acessível.

- [x] `schema.prisma` conforme seção 4
- [x] Primeira migration + constraints `CHECK` (via SQL na migration)
- [x] `shared/lib/prisma.ts` (client único)
- [x] `seed.ts` com dados de desenvolvimento
- [x] Banco de teste isolado para integração

**Aceite:** `prisma migrate dev` e seed funcionam; inserir `quantity <= 0` é rejeitado pelo banco.

### Fase 3 — Autenticação e usuários

**Objetivo:** API protegida.

- [x] Models `User` e `RefreshToken` (hash do token armazenado)
- [x] `POST /auth/login`, `/auth/refresh`, `/auth/logout`
- [x] JWT de acesso (10–15 min) + refresh em cookie `httpOnly`, `secure`, `sameSite`
- [x] Hook de autenticação (`authenticate` para modelo de função única/uso individual)
- [x] Rate-limit mais restrito no login
- [x] Adicionar `createdBy` em `Delivery` e `Payment`

**Aceite:** rotas protegidas retornam 401 sem token; refresh revogado não funciona; testes de auth passando.

### Fase 4 — Places e Prices

**Objetivo:** módulo-modelo que os demais seguirão.

- [x] CRUD de `places` (desativar em vez de excluir)
- [x] `POST /places/:id/prices`: fecha o preço anterior (`validTo = validFrom − 1 dia`) sem sobreposição
- [x] Função de busca do preço vigente por local e data
- [x] Testes unitários do service (incluindo sobreposição e lacunas)

**Aceite:** impossível cadastrar preços sobrepostos; busca por data retorna o preço correto em cada borda de vigência.

### Fase 5 — Deliveries

**Objetivo:** registrar entregas com preço congelado.

- [x] `POST /deliveries`: busca preço vigente, grava `unitCents` e `totalCents = quantity * unitCents` em transação
- [x] Erro claro se não houver preço vigente na data
- [x] `GET /deliveries` com filtros `placeId`, `from`, `to` e paginação
- [x] `POST /deliveries/:id/cancel` (motivo obrigatório), sem exclusão física
- [x] Testes: reajuste de preço não altera entregas antigas

**Aceite:** alterar o preço do local não muda `totalCents` de entregas já registradas; entrega cancelada não entra nos totais.

### Fase 6 — Reports (Conferência de Valores Esperados)

**Objetivo:** organizar lançamentos por tipo/destino (ex.: Prefeitura, Saúde, Fórum) e responder com exatidão "quanto entregou e qual o valor esperado a receber em cada período", respeitando os preços congelados em cada momento.

- [x] `GET /reports/summary` por local/tipo e período: `totalQuantity`, `expectedAmountCents`, detalhamento por local (`byPlace` com histórico de faixas `rates`) e por período (`byPeriod`)
- [x] Agrupamento por dia (`day`), semana (`week`) ou mês (`month`)
- [x] Ignorar registros cancelados
- [x] Testes com cenários numéricos conhecidos (valores esperados calculados à mão)

**Aceite:** soma dos relatórios bate exatamente com a soma dos registros individuais (mesmo após alterações de preço), sem diferença de centavos.

### Fase 7 — CI/CD e endurecimento

- [ ] GitHub Actions: lint → typecheck → testes → build
- [ ] Dockerfile de produção (multi-stage, usuário não-root)
- [ ] Auditoria de dependências (`npm audit`)
- [ ] Documentação da API (OpenAPI via `@fastify/swagger`)
- [ ] Backup do banco documentado

**Aceite:** pipeline verde em PR; imagem de produção sobe e responde `/health`.

### Fase 9 — Frontend

- [ ] Setup React + TypeScript + Tailwind
- [ ] Login e gerenciamento de sessão
- [ ] Tela de lançamento rápido (local, quantidade, salvar)
- [ ] Tela de pagamentos
- [ ] Tela de relatório com filtros de local e período
- [ ] Considerar PWA para uso no celular

**Aceite:** fluxo completo de registrar entrega, registrar pagamento e consultar saldo funcionando de ponta a ponta.

---

## 6. Instruções para agentes

1. Leia este documento inteiro antes de começar.
2. Trabalhe em **uma fase por vez**, na ordem. Não antecipe fases futuras.
3. Antes de codar, confirme que a fase anterior atende todos os critérios de aceite.
4. Se encontrar ambiguidade ou uma decisão pendente (seção 1), **pare e registre a dúvida** em vez de assumir.
5. Não altere regras globais sem aprovação explícita do responsável.
6. Ao concluir uma tarefa, marque o checkbox correspondente e rode lint, typecheck e testes.
7. Reporte ao final de cada fase: o que foi feito, decisões tomadas, pendências e riscos.

---

## 7. Registro de decisões

| Data       | Decisão                                                                                                                                                                             | Responsável |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 2026-11-05 | Adotar Monorepo Leve com `pnpm workspaces` na raiz (gerenciando ESLint, Prettier, Husky, lint-staged e `tsconfig.base.json`) e criar diretórios de módulos sob demanda a cada fase. | Responsável |
| 2026-11-06 | Adotar modelo de função única (uso individual sem múltiplos papéis `ADMIN`/`OPERATOR`) nesta etapa, mantendo autenticação completa (`User`, `RefreshToken`, `createdBy`).           | Responsável |
| 2026-11-06 | Organizar o código por camada na raiz de `src/` (`controllers/`, `services/`, `repositories/`, `routes/`, `schemas/`) e manter todos os testes separados em `tests/unit/` e `tests/integration/`. | Responsável |
| 2026-11-06 | Remover módulo `Payments` e focar o sistema como organizador e conferência de valores esperados por tipo de quentinha (ex.: Prefeitura, Saúde, Fórum), com histórico de preços por data congelado em cada entrega. | Responsável |
