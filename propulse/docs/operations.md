# Operações

## Validação

- Execute as verificações do README. PGlite aplica a migração verdadeira com utilizadores e papéis isolados para testes.
- Com Supabase local a correr e a web configurada, registe duas contas de teste. Abra a confirmação no email local. Crie duas barbearias, confirme que cada conta só vê as suas e aceite um convite com o destinatário correto.
- Verifique no browser a recuperação, a expiração e revogação de convites e a saída. Use um dispositivo iOS e um Android para validar a sessão nativa.
- Execute os advisors do projeto Supabase de staging e valide o Data API com a chave publicável antes de publicar.

## Recuperação e preparação

Mantenha ambientes separados. Antes de produção, configure alertas e backups no Supabase, defina objetivos de recuperação e ensaie o restauro num ambiente separado. Se houver uma falha de isolamento, suspenda o acesso afetado, preserve a auditoria e valide a mitigação com a suite de segurança. Evite recolher tokens ou palavras-passe nos logs.

## Próxima entrega

Adicionar horários, serviços e barbeiros ao esquema isolado por organização, com os passos de configuração guardados por barbearia. Usar essa base para lançar a primeira criação de marcação com teste de conflito concorrente.
