# Deployment

Use projetos Supabase distintos para staging e produção. Aplique as migrações em staging e valide a suite completa antes de promover. Use HTTPS e configure a origem exata da web como Site URL e URL permitido no Supabase Auth. Exponha o esquema `public` no Data API.

| App | Variável | Valor |
| --- | --- | --- |
| Web | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| Web | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do projeto |
| Web | `NEXT_PUBLIC_APP_URL` | Origem HTTPS exata da app |
| Mobile | `EXPO_PUBLIC_SUPABASE_URL` | URL HTTPS do projeto |
| Mobile | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do projeto |

Configure SMTP transacional e os templates de confirmação e recuperação em Auth. Use os templates em `supabase/templates`. Mantenha desativados os cliques rastreados para estes emails. As ligações usam `{{ .SiteURL }}/access/confirmar?token_hash={{ .TokenHash }}&type=email` ou `type=recovery`.

Na Vercel, selecione `apps/web` como Root Directory e ative o acesso aos pacotes fora dessa diretoria. Defina as variáveis por ambiente e use o lockfile do monorepo. Para o Expo, veja [mobile.md](mobile.md).

Staging e produção precisam de projetos provisionados, configuração de domínio, SMTP, monitorização e credenciais EAS antes de um lançamento.
