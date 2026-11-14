import { useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { loginSchema } from "@propulse/shared";
import { useSession } from "../lib/session";
import { supabase } from "../lib/supabase";
import { Screen, StatusText, styles, TouchButton, usePalette } from "../lib/ui";

export default function Login() {
  const colors = usePalette();
  const { session, loading, error: sessionError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!supabase) return <Screen title="Configuração em falta" subtitle="Esta instalação precisa de estar ligada ao Supabase." />;
  if (loading) return <Screen title="A carregar"><ActivityIndicator color={colors.accent} /></Screen>;
  if (session) return <Redirect href="/workspaces" />;
  const client = supabase;
  async function submit() {
    if (pending) return;
    const input = loginSchema.safeParse({ email, password });
    if (!input.success) { setError(input.error.issues[0]?.message ?? "Verifique os dados."); return; }
    setPending(true);
    setError("");
    try {
      const { error: authError } = await client.auth.signInWithPassword(input.data);
      if (authError) setError(authError.status === 429 ? "Demasiadas tentativas. Tente mais tarde." : authError.name === "AuthRetryableFetchError"
        ? "Não foi possível ligar ao servidor. Verifique a sua ligação."
        : "Verifique as credenciais e a confirmação do email.");
    } catch {
      setError("Não foi possível iniciar sessão. Verifique a sua ligação.");
    } finally {
      setPending(false);
    }
  }

  const fieldColors = { color: colors.text, backgroundColor: colors.background, borderColor: colors.border };
  return <Screen title="Iniciar sessão" subtitle="Entre com a conta da sua barbearia.">
    <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Email</Text>
      <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false}
        style={[styles.input, fieldColors]} value={email} onChangeText={setEmail} />
    </View>
    <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Palavra-passe</Text>
      <TextInput accessibilityLabel="Palavra-passe" secureTextEntry autoComplete="current-password"
        style={[styles.input, fieldColors]} value={password} onChangeText={setPassword} onSubmitEditing={() => void submit()} />
    </View>
    {(error || sessionError) && <StatusText>{error || sessionError!}</StatusText>}
    <TouchButton label={pending ? "A entrar…" : "Entrar"} disabled={pending} onPress={() => void submit()} />
  </Screen>;
}
