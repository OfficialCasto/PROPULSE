# PROPULSE

Aplicação de gestão para barbearias. O repositório contém a base da Fase 1, com Next.js, Expo, TypeScript, pnpm e Supabase.

## Abrir a aplicação web

Na raiz do projeto, com Node.js 24.3+ da linha 24 e pnpm 11.25:

```sh
pnpm install --frozen-lockfile
pnpm web
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Use o servidor Next.js. O botão **Go Live** do VS Code serve ficheiros estáticos e não executa esta aplicação.

A página inicial está disponível sem configuração. Para registar contas, criar barbearias e gerir equipas, ligue o Supabase.

## Ligar o Supabase local

1. Inicie o Docker e execute `pnpm db:start`.
2. Execute `pnpm db:reset` para aplicar as migrações **à base de dados local de desenvolvimento**, recriando os seus dados.
3. Consulte `pnpm db:status`. Copie `apps/web/.env.example` para `apps/web/.env.local` e preencha o URL e a chave publicável (ou a chave anon da stack local). Use `http://127.0.0.1:3000` como URL da aplicação.
4. Reinicie `pnpm web`. O URL do serviço local de email é indicado em `pnpm db:status`. Abra lá as ligações de confirmação e recuperação.
5. Para testar a app nativa, configure `apps/mobile/.env.local` a partir do exemplo e execute `pnpm mobile`. Consulte as instruções para dispositivos em [docs/mobile.md](docs/mobile.md).

Use [docs/deployment.md](docs/deployment.md) para a configuração de um projeto Supabase de staging.

## Verificações

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Os testes de `pnpm test` executam a migração e as políticas RLS em PostgreSQL embebido (PGlite), com um esquema mínimo que representa a identidade do Supabase Auth. Para testar a stack completa e o email local, consulte [docs/operations.md](docs/operations.md).

## Documentação

- [Arquitetura e checklist](docs/architecture.md)
- [Operação da barbearia e testes da Fase 2](docs/phase-2.md)(docs/database.md) e [contratos](docs/api.md)
- [Segurança](docs/security.md)
- [Deploy](docs/deployment.md), [mobile](docs/mobile.md) e [operações](docs/operations.md)
- [Pagamentos](docs/payments.md) e [IA](docs/ai.md)
