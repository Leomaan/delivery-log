# Lunch Tracker — Ponto 10

Sistema para registro e controle financeiro de entregas diárias de refeições (quentinhas) e recebimentos por local.

## Arquitetura do Repositório

O projeto utiliza um **Monorepo Leve com `pnpm workspaces`**:

```text
lunch-tracker/
├── backend/              # API Node.js + TypeScript + Fastify + Prisma
│   ├── src/
│   │   ├── config/       # Validação de variáveis de ambiente (Zod)
│   │   └── server.ts     # Ponto de entrada do servidor
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
| `pnpm start`     | Executa a versão compilada de produção                    |
| `pnpm lint`      | Executa o ESLint em todo o repositório                    |
| `pnpm format`    | Formata os arquivos com Prettier                          |
| `pnpm typecheck` | Verifica a tipagem estrita do TypeScript (`tsc --noEmit`) |
| `pnpm test`      | Executa a suíte de testes com Vitest                      |
