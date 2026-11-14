import { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { getWorkspace } from "@propulse/database";
import { roleLabels, slugSchema } from "@propulse/shared";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { Screen, StatusText, styles, TouchButton, usePalette } from "../../lib/ui";

type Workspace = NonNullable<Awaited<ReturnType<typeof getWorkspace>>["data"]>;

export default function WorkspacePage() {
  const router = useRouter();
  const colors = usePalette();
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = slugSchema.safeParse(params.slug).data;
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const [state, setState] = useState<{ slug: string; workspace?: Workspace; error?: string }>();
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!slug || !userId || !supabase) return;
    let active = true;
    void getWorkspace(supabase, userId, slug).then(({ data, error }) => {
      if (!active) return;
      setState({ slug, workspace: data ?? undefined, error: error ? "Verifique a ligação e tente novamente." : undefined });
    }).catch(() => { if (active) setState({ slug, error: "Verifique a ligação e tente novamente." }); });
    return () => { active = false; };
  }, [slug, userId, retry]);

  if (loading) return <Screen title="A carregar"><ActivityIndicator color={colors.accent} /></Screen>;
  if (!session) return <Redirect href="/" />;
  if (!slug || (state?.slug === slug && !state.workspace)) return <Screen title="Espaço indisponível">
    {state?.error && <><StatusText>{state.error}</StatusText><TouchButton label="Tentar novamente" onPress={() => {
      setState(undefined); setRetry((count) => count + 1);
    }} /></>}
    <TouchButton label="As minhas barbearias" secondary onPress={() => router.replace("/workspaces")} />
  </Screen>;
  const active = state?.slug === slug ? state.workspace : undefined;
  if (!active?.organization) return <Screen title="A carregar"><ActivityIndicator color={colors.accent} /></Screen>;
  const { organization, role } = active;
  return <Screen title={organization.name} subtitle={roleLabels[role]}>
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Dados do espaço</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{organization.timezone} · {organization.currency}</Text>
    </View>
    <TouchButton label="Trocar de barbearia" secondary onPress={() => router.replace("/workspaces")} />
  </Screen>;
}
