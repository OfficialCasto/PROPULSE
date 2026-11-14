# Mobile

O Expo Router serve a navegação nativa. A app inicial suporta entrada, saída, lista de barbearias e espaço selecionado. O registo, a confirmação de email, a recuperação e a aceitação de convites estão disponíveis na web nesta fase.

Copie `apps/mobile/.env.example` para `apps/mobile/.env.local` e configure o projeto Supabase. Em rede local, use o IP acessível a partir do dispositivo. No emulador Android, normalmente é `10.0.2.2` em vez de `127.0.0.1`. Utilize um ambiente HTTPS para dispositivos e builds distribuídos.

`pnpm mobile` arranca o Metro. `pnpm --filter @propulse/mobile build` exporta bundles iOS e Android. A assinatura e distribuição exigem perfis EAS e as contas Apple e Google correspondentes. Teste a persistência e renovação da sessão em dispositivos antes de distribuir.
