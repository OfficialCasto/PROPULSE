import { useCallback, useEffect, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { getWorkspaces } from "@propulse/database";
import { roleLabels } from "@propulse/shared";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { Screen, StatusText, styles, TouchButton, usePalette } from "../../lib/ui";

type WorkspaceList = NonNullable<Awaited<ReturnType<typeof getWorkspaces>>["data"]>;

export default function Workspaces() {
  const router = useRouter();
  const colors = usePalette();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const [list, setList] = useState<WorkspaceList | null>(null);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    void getWorkspaces(supabase, userId).then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Não foi possível carregar as barbearias. Verifique a ligação.");
      else setList(data);
    }).catch(() => { if (active) setError("Não foi possível carregar as barbearias. Verifique a ligação."); });
    return () => { active = false; };
  }, [userId, retry]);

  const signOut = useCallback(async () => {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) setError("Não foi possível terminar a sessão. Tente novamente.");
    } catch { setError("Não foi possível terminar a sessão. Tente novamente."); }
    finally { setSigningOut(false); }
  }, [signingOut]);

  if (loading) return <Screen title="A carregar"><ActivityIndicator color={colors.accent} /></Screen>;
  if (!session) return <Redirect href="/" />;
  return <Screen title="As minhas barbearias" subtitle="Escolha o espaço de trabalho que quer abrir.">
    {error ? <>
      <StatusText>{error}</StatusText>
      <TouchButton label="Tentar novamente" secondary onPress={() => { setError(""); setRetry((count) => count + 1); }} />
    </> : !list ? <ActivityIndicator color={colors.accent} /> : list.length === 0 ?
      <Text style={[styles.body, { color: colors.muted }]}>Crie uma barbearia ou aceite um convite através da aplicação web.</Text> :
      list.map(({ organization, role }) => organization && <Pressable key={organization.id} accessibilityRole="button"
        onPress={() => router.push({ pathname: "/workspaces/[slug]", params: { slug: organization.slug } })}
        style={({ pressed }) => [styles.card, { backgroundColor: pressed ? colors.surface : colors.background, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{organization.name}</Text>
        <Text style={{ color: colors.muted }}>{roleLabels[role]}</Text>
      </Pressable>)}
    <TouchButton label={signingOut ? "A sair…" : "Terminar sessão"} secondary disabled={signingOut} onPress={() => void signOut()} />
  </Screen>;
}
