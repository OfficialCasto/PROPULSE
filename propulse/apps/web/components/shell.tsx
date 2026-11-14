import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "./ui";
import { ThemeToggle } from "./theme";
import { ActionForm } from "./forms";
import { signOut } from "@/lib/actions";

export function AccessShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="access-layout">
    <aside className="access-side">
      <Link href="/" aria-label="PROPULSE, início"><Brand /></Link>
      <p>O espaço de trabalho<br /> do teu negócio.</p>
    </aside>
    <main className="access-main">
      <div className="access-toolbar"><Link href="/" aria-label="PROPULSE, início" className="small-brand"><Brand /></Link><ThemeToggle /></div>
      <div className="access-content"><h1>{title}</h1><p className="lede">{subtitle}</p>{children}</div>
    </main>
  </div>;
}

export function WorkShell({ children }: { children: ReactNode }) {
  return <>
    <header className="topbar"><div className="topbar-inner">
      <Link href="/workspaces" aria-label="PROPULSE, negócios"><Brand /></Link>
      <div className="header-actions"><ThemeToggle /><ActionForm action={signOut} label="Sair" variant="outline" compact /></div>
    </div></header>
    <main className="work-main">{children}</main>
  </>;
}
