import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../lib/session";
import { usePalette } from "../lib/ui";

export default function Layout() {
  const colors = usePalette();
  return <SessionProvider>
    <StatusBar style="auto" />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="index" options={{ title: "PROPULSE" }} />
      <Stack.Screen name="workspaces/index" options={{ title: "Barbearias", headerBackVisible: false }} />
      <Stack.Screen name="workspaces/[slug]" options={{ title: "Espaço de trabalho" }} />
    </Stack>
  </SessionProvider>;
}
