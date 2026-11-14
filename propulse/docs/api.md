# Contratos de dados da Fase 1

As apps usam o Supabase Data API com a sessão do utilizador. Tipos e consultas de seleção de barbearia vivem em `packages/database`. A validação partilhada vive em `packages/shared`.

| RPC | Resultado | Autorização |
| --- | --- | --- |
| `create_organization` | UUID da organização | Conta com email confirmado |
| `create_invitation` | Token apresentado uma vez | Proprietário ou administrador, conforme o papel |
| `accept_invitation` | UUID da organização | Email confirmado correspondente e token ativo |
| `revoke_invitation` | Sem conteúdo | Proprietário ou administrador, conforme o papel |
| `set_member_role` | Sem conteúdo | Proprietário ou administrador, conforme os papéis de origem e destino |

O proprietário gere papéis de administração e inferiores. Um administrador gere papéis de gerente, barbeiro e rececionista. O papel de proprietário é protegido. A autorização é verificada com base na associação atual, incluindo nos pedidos feitos diretamente ao Data API.
