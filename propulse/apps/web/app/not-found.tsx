import Link from "next/link";
import { AccessShell } from "@/components/shell";
import { buttonVariants } from "@/components/ui";

export default function NotFound() {
  return <AccessShell title="Página indisponível" subtitle="A página já não está disponível ou a sua conta não tem acesso.">
    <Link className={buttonVariants()} href="/workspaces">Os meus negócios</Link>
  </AccessShell>;
}
