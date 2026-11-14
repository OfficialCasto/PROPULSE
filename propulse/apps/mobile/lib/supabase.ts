import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";
import type { Database } from "@propulse/database";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient<Database>(url, key, {
  auth: {
    storage: {
      getItem: (name) => SecureStore.getItemAsync(name),
      setItem: (name, value) => SecureStore.setItemAsync(name, value),
      removeItem: (name) => SecureStore.deleteItemAsync(name),
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
}) : null;
