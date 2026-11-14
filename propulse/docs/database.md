# Base de dados

A migração inicial cria organizações, perfis, associações e convites. Uma associação pertence a uma organização e a um utilizador e é única nesse par. Um índice parcial garante um proprietário por organização. Uma transação cria o perfil, a organização, a associação de proprietário e o evento de auditoria.

RLS controla a leitura em todas as tabelas. As alterações passam por RPCs com permissões explícitas. Funções auxiliares privilegiadas vivem em `private`, que deve ficar fora dos esquemas expostos. O histórico de auditoria também vive em `private`.

Convites guardam o hash SHA-256 de um token aleatório, expiram em sete dias e só podem ser aceites pela conta com o email confirmado correspondente. A aceitação bloqueia a linha do convite. A criação, revogação e mudança de papel serializam-se na linha da organização. Recriar um convite revoga o anterior.

Os dados iniciais usam `Europe/Lisbon` e `EUR`. A Fase 2 acrescenta clientes, serviços, barbeiros, horários e marcações. Consulte [Operação da barbearia](phase-2.md).
