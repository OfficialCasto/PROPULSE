# Arquitetura

PROPULSE é um monólito modular. Next.js App Router trata da interface web e das mutações web. Expo Router serve iOS e Android. As apps partilham esquemas Zod, contratos e o cliente de domínio. Supabase Auth emite identidades. PostgreSQL aplica regras de negócio, isolamento e auditoria em ambas as plataformas.

A web usa autenticação SSR com cookies e validação da sessão nos pontos de entrada protegidos. A app nativa mantém a sessão no Keychain/Keystore. Ambas usam uma chave publicável e os privilégios do utilizador. As mutações de organização passam por RPCs pequenas, transacionais, com papéis verificados a partir das associações atuais.

## Fase 1

- [x] Criar o workspace pnpm/Turborepo e os pacotes partilhados.
- [x] Definir o modelo de organizações, perfis, associações e convites com RLS.
- [x] Implementar registo, confirmação, início/fim de sessão, recuperação e espaços de trabalho na web.
- [x] Implementar início/fim de sessão e seleção de organização no Expo.
- [x] Implementar convites por ligação, aceitação e gestão de papéis na web.
- [ ] Validar o ciclo completo com Supabase local ou staging e dispositivos.
- [ ] Introduzir horários, serviços, barbeiros e preferências como passos persistidos na Fase 2.

## Decisões e riscos

- A organização inicial guarda dados do negócio numa transação que também cria a associação do proprietário. O fluxo inicial termina no espaço de trabalho. Os passos operacionais dependem dos modelos da Fase 2.
- A organização selecionada é uma preferência de navegação. Cada acesso é validado com RLS ou com uma verificação equivalente na RPC.
- Os convites expiram em sete dias e vinculam o email confirmado. O link deve ser entregue ao destinatário pelo operador. A entrega automática depende da integração de mensagens.
- Uma organização tem um proprietário imutável pela aplicação nesta fase. A conta de proprietário exige um fluxo explícito de transferência antes de poder ser eliminada.
- O modelo inicial tem uma localização lógica por organização. Papéis são dados do Postgres, evitando o desfasamento de permissões entre JWT e base de dados.
- Os builds Expo usam a matriz do SDK 58. O build de bundles é independente da assinatura nativa.
