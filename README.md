# Lunch Tracker — Ponto 10

Sistema para registro e controle financeiro de entregas diárias de refeições (quentinhas) e recebimentos por local.

## Arquitetura do Repositório

O projeto utiliza um **Monorepo Leve com `pnpm workspaces`**:

```text
lunch-tracker/
├── backend/              # API Node.js + TypeScript + Fastify + Prisma
│   ├── prisma/           # Schema Prisma, migrations SQL (com CHECK constraints) e seed
│   ├── src/
│   │   ├── config/       # Validação de variáveis de ambiente (Zod)
│   │   ├── controllers/  # Camada HTTP (extrai dados da requisição e envia resposta)
│   │   ├── services/     # Regra de negócio, validações de domínio e orquestração
│   │   ├── repositories/ # Camada de acesso a dados (queries Prisma)
│   │   ├── routes/       # Declaração de endpoints Fastify e hooks de autenticação
│   │   ├── schemas/      # Schemas de validação de entrada com Zod
│   │   ├── shared/       # Erros padronizados, plugins, Prisma client, money, date e logger
│   │   ├── app.ts        # Instância do Fastify (sem listen, pronta para testes)
│   │   └── server.ts     # Ponto de entrada HTTP do servidor
│   ├── tests/            # Testes separados do código-fonte (unit/ e integration/)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # PostgreSQL 16 + App container
├── eslint.config.mjs     # Configuração global do ESLint (Flat Config)
├── pnpm-workspace.yaml   # Definição dos workspaces
└── tsconfig.base.json    # Configuração TypeScript estrita compartilhada
```

## Pré-requisitos

- **Node.js** >= 20 (LTS)
- **pnpm** >= 9
- **Docker** e **Docker Compose**

## Como executar localmente

1. **Instale as dependências na raiz do repositório:**

   ```bash
   pnpm install
   ```

2. **Configure as variáveis de ambiente do backend:**

   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Suba o banco de dados PostgreSQL via Docker Compose:**

   ```bash
   docker compose up -d postgres
   ```

4. **Inicie o servidor em modo de desenvolvimento:**
   ```bash
   pnpm dev
   ```

## Scripts Disponíveis (Raiz)

| Comando          | Descrição                                                 |
| ---------------- | --------------------------------------------------------- |
| `pnpm dev`       | Inicia o backend em modo watch (`tsx`)                    |
| `pnpm build`     | Compila o TypeScript para JavaScript em `backend/dist`    |
| `pnpm start`       | Executa a versão compilada de produção                    |
| `pnpm db:generate` | Gera o Prisma Client a partir do `schema.prisma`          |
| `pnpm db:migrate`  | Executa as migrations do banco de dados (`migrate dev`)   |
| `pnpm db:seed`     | Popula o banco com dados iniciais de desenvolvimento      |
| `pnpm lint`        | Executa o ESLint em todo o repositório                    |
| `pnpm format`    | Formata os arquivos com Prettier                          |
| `pnpm typecheck` | Verifica a tipagem estrita do TypeScript (`tsc --noEmit`) |
| `pnpm test`      | Executa a suíte de testes com Vitest                      |
