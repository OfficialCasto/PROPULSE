# Segurança

- Chaves publicáveis nos clientes. Mantenha chaves privilegiadas fora das apps e do repositório.
- Validação web no servidor e controlo de acesso transacional em Postgres. Selecionar outro slug não concede acesso.
- Cookies SSR de sessão com SameSite=Lax e Secure em HTTPS de produção. Os formulários Next.js usam a verificação de origem dos Server Actions. As ações protegidas validam a identidade com Supabase Auth.
- A confirmação de email e recuperação exige um POST explícito para reduzir o efeito de scanners de email. Tokens de convite e confirmação devem ser omitidos dos logs de URL na infraestrutura.
- As apps nativas usam SecureStore com Keychain/Keystore.
- As tabelas não concedem mutações diretas aos papéis do Data API. Mantenha `private` fora da lista de esquemas expostos.
- Use os limites do Supabase Auth para início de sessão, registo e recuperação. Antes de expor staging, configure limites, SMTP e proteção contra abuso no projeto Auth.

Antes de lançar, valide retenção e pedidos de acesso, correção, exportação e eliminação com revisão profissional de privacidade. Contas com associações exigem remoção ou transferência controlada dos vínculos antes de serem eliminadas. Faça uma revisão de dependências, RLS e autenticação da stack implantada.
