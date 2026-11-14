import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const light = { background: "#ffffff", surface: "#f7f7f8", text: "#171717", muted: "#626663", border: "#dedede", accent: "#25543d", onAccent: "#ffffff", error: "#932f2b" };
const dark = { background: "#141715", surface: "#1b201d", text: "#f2f4f2", muted: "#a9b2ab", border: "#333b35", accent: "#b1d7bc", onAccent: "#14251b", error: "#ffb4ad" };

export function usePalette() { return useColorScheme() === "dark" ? dark : light; }

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const colors = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.body, { color: colors.muted }]}>{subtitle}</Text>}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  </SafeAreaView>;
}

export function TouchButton({ label, onPress, disabled, secondary }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  const colors = usePalette();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.button, {
      opacity: disabled ? .55 : pressed ? .8 : 1,
      borderColor: secondary ? colors.border : colors.accent,
      backgroundColor: secondary ? colors.background : colors.accent,
    }]}>
    <Text style={{ color: secondary ? colors.text : colors.onAccent, fontSize: 15, fontWeight: "600" }}>{label}</Text>
  </Pressable>;
}
export function StatusText({ children }: { children: string }) {
  const colors = usePalette();
  return <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.body, { color: colors.error }]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  screen: { padding: 23, paddingTop: 30 },
  title: { fontSize: 31, fontWeight: "700", letterSpacing: -1 },
  body: { fontSize: 15, lineHeight: 22, marginTop: 7 },
  content: { gap: 14, marginTop: 24 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  input: { minHeight: 49, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 16 },
  button: { minHeight: 48, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center", padding: 10 },
  card: { borderWidth: 1, borderRadius: 10, padding: 15, minHeight: 58, justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "600" },
});
