export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

type Owned = { organization_id: string; id: string };
type Created = Owned & { created_at: string };
type Writable<Row, Fields extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Fields> & { organization_id: string };
  Update: Partial<Pick<Row, Fields>>;
  Relationships: [];
};

type Customer = Created & { name: string; email: string | null; phone: string | null; notes: string; archived: boolean };
type Barber = Created & { name: string; active: boolean };
type Service = Barber & { duration_minutes: number; price_cents: number };
type Hours = Owned & { barber_id: string | null; weekday: number; opens_at: string; closes_at: string };

export type OperationsTables = {
  customers: Writable<Customer, "name" | "email" | "phone" | "notes" | "archived">;
  services: Writable<Service, "name" | "active" | "duration_minutes" | "price_cents">;
  barbers: Writable<Barber, "name" | "active">;
  weekly_hours: Writable<Hours, "barber_id" | "weekday" | "opens_at" | "closes_at">;
  appointments: {
    Row: Created & {
      customer_id: string; service_id: string; barber_id: string; starts_at: string; ends_at: string;
      service_name: string; quoted_price_cents: number; currency: string; status: AppointmentStatus;
    };
    Insert: never;
    Update: never;
    Relationships: [
      { foreignKeyName: "appointments_organization_id_customer_id_fkey"; columns: ["organization_id", "customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["organization_id", "id"] },
      { foreignKeyName: "appointments_organization_id_barber_id_fkey"; columns: ["organization_id", "barber_id"]; isOneToOne: false; referencedRelation: "barbers"; referencedColumns: ["organization_id", "id"] },
    ];
  };
};

export type OperationsFunctions = {
  book_appointment: { Args: { p_org: string; p_customer: string; p_service: string; p_barber: string; p_start: string; p_existing?: string }; Returns: string };
  set_appointment_status: { Args: { p_org: string; p_id: string; p_status: AppointmentStatus }; Returns: undefined };
};
