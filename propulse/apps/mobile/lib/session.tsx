import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type SessionState = { session: Session | null; loading: boolean; error?: string };
const SessionContext = createContext<SessionState>({ session: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, loading: Boolean(supabase) });
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") setState({ session, loading: false });
    });
    let active = true;
    void client.auth.getSession().then(({ data, error }) => {
      if (active) setState({ session: data.session, loading: false, error: error ? "Não foi possível recuperar a sessão." : undefined });
    }).catch(() => {
      if (active) setState({ session: null, loading: false, error: "Não foi possível recuperar a sessão." });
    });
    const refresh = (status: string) => {
      if (status === "active") void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState ?? "active");
    const listener = AppState.addEventListener("change", refresh);
    return () => {
      active = false;
      subscription.unsubscribe();
      listener.remove();
      void client.auth.stopAutoRefresh();
    };
  }, []);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() { return useContext(SessionContext); }
