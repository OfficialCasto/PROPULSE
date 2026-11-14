import type { SupabaseClient } from "@supabase/supabase-js";

import type { OperationsTables, OperationsFunctions } from "./operations";

export type Role = "owner" | "admin" | "manager" | "barber" | "receptionist";
type Organization = {
  id: string; name: string; slug: string; logo_url: string | null;
  email: string | null; phone: string | null; address: string | null;
  timezone: string; currency: string; created_at: string; updated_at: string;
};
type Profile = { id: string; full_name: string; email: string; avatar_url: string | null; created_at: string };
type Membership = { id: string; organization_id: string; user_id: string; role: Role; created_at: string };
type Invitation = {
  id: string; organization_id: string; email: string; role: Role; created_by: string;
  created_at: string; expires_at: string; accepted_at: string | null; revoked_at: string | null;
};
type OrganizationArgs = { p_name: string; p_slug: string; p_email: string; p_phone: string; p_address: string };
type Table<Row, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: Relationships;
};
export type Database = {
  public: {
    Tables: OperationsTables & {
      organizations: Table<Organization>;
      profiles: Table<Profile>;
      memberships: Table<Membership, [{
        foreignKeyName: "memberships_organization_id_fkey";
        columns: ["organization_id"];
        isOneToOne: false;
        referencedRelation: "organizations";
        referencedColumns: ["id"];
      }, {
        foreignKeyName: "memberships_user_id_fkey";
        columns: ["user_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      }]>;
      invitations: Table<Invitation>;
    };
    Views: Record<never, never>;
    Functions: OperationsFunctions & {
      create_organization: { Args: OrganizationArgs; Returns: string };
      create_invitation: { Args: { p_org: string; p_email: string; p_role: Role }; Returns: string };
      accept_invitation: { Args: { p_token: string }; Returns: string };
      revoke_invitation: { Args: { p_org: string; p_invitation: string }; Returns: undefined };
      set_member_role: { Args: { p_org: string; p_member: string; p_role: Role }; Returns: undefined };
    };
    Enums: { member_role: Role };
    CompositeTypes: Record<never, never>;
  };
};

export type PropulseClient = SupabaseClient<Database>;
export async function getWorkspaces(client: PropulseClient, userId: string) {
  return client.from("memberships")
    .select("role, organization:organizations(id,name,slug,timezone,currency)")
    .eq("user_id", userId).order("created_at");
}

export async function getWorkspace(client: PropulseClient, userId: string, slug: string) {
  return client.from("memberships")
    .select("role, organization:organizations!inner(id,name,slug,timezone,currency)")
    .eq("user_id", userId).eq("organization.slug", slug).maybeSingle();
}
