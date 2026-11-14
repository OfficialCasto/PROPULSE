"use client";

import { AccessShell } from "@/components/shell";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <AccessShell title="Ocorreu um erro" subtitle="Não foi possível carregar esta página.">
    <Button onClick={reset}>Tentar novamente</Button>
  </AccessShell>;
}
