# Operação da barbearia

A primeira entrega da Fase 2 acrescenta um diretório de clientes com pesquisa e arquivo, catálogo de serviços, perfis de barbeiros, horários semanais agenda em lista e indicadores operacionais simples. Clientes, serviços e barbeiros são registos reais da organização ativa.

## Testar o fluxo

1. Aplique as migrações a uma instância Supabase de desenvolvimento ou staging.
2. Inicie sessão com uma conta confirmada e crie uma barbearia.
3. Abra **Gestão da barbearia**. Crie um cliente, um serviço e um barbeiro.
4. Em **Horários**, adicione o período da barbearia e o período do barbeiro para o mesmo dia da semana. Para definir uma pausa, adicione dois períodos separados.
5. Em **Agenda**, escolha uma data futura e crie uma marcação. Tente marcar outro serviço no mesmo horário para o mesmo barbeiro. A base de dados deve rejeitar a segunda marcação.

Proprietários, administradores e gerentes configuram o catálogo e os horários. Rececionistas podem gerir clientes e marcações. O acesso do barbeiro às suas próprias marcações depende da ligação do perfil de trabalho a uma conta e será implementado com esse vínculo.

## Decisões

- Os horários são períodos da semana no fuso da organização. A marcação deve caber num único período da barbearia e num único período do barbeiro.
- A reserva guarda o horário UTC, o nome do serviço, o preço acordado e a moeda. O preço acordado não constitui receita.
- As chaves estrangeiras compostas ligam cada marcação a registos da mesma organização. A restrição de exclusão GiST impede sobreposição por barbeiro, incluindo pedidos concorrentes. O cancelamento liberta o horário.
- Uma mudança de horários aplica-se às novas marcações. O operador deve contactar clientes com marcações já aceites quando altera a disponibilidade.

O reagendamento altera o horário de uma marcação futura na mesma transação e preserva o preço e a duração acordados.

## Trabalho seguinte

- Vistas de calendário.
- Serviço por barbeiro, acesso ao próprio calendário, exceções de horário e pesquisa do seletor de clientes.
- Onboarding com progresso, histórico de cliente, métricas por período e testes no Supabase completo.
- Reserva pública, pagamentos registados, relatórios, campanhas, automações, IA, subscrições e fluxos móveis completos.
