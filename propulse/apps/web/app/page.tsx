import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarRange, Crosshair, TrendingUp } from "lucide-react";
import { Brand, buttonVariants } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";
import { ProductPreview } from "@/components/product-preview";
import { Reveal } from "@/components/reveal";
import "./marketing.css";

const steps = [
  { Icon: CalendarRange, title: "Deteta a vaga", description: "Uma desistência abre um espaço na agenda. Vê onde ainda podes recuperar uma marcação." },
  { Icon: Crosshair, title: "Encontra quem pode voltar", description: "Na demonstração, cada vaga é cruzada com o histórico dos clientes para sugerir a quem vale a pena ligar." },
  { Icon: TrendingUp, title: "Mede o que recuperaste", description: "Acompanha as marcações que voltaram à agenda e distingue receita potencial de receita recebida." },
];

export default function Home() {
  return <div className="marketing">
    <header className="site-header"><div className="site-width site-header-row">
      <Link href="/" aria-label="PROPULSE, início"><Brand /></Link>
      <nav className="site-nav" aria-label="Navegação principal">
        <Link href="#produto">Produto</Link>
        <Link href="#como-funciona">Como funciona</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link className={buttonVariants({ variant: "outline" })} href="/access/login">Iniciar sessão</Link>
      </div>
    </div></header>
    <main>
      <section className="site-hero" aria-labelledby="home-title">
        <div className="hero-light" aria-hidden="true" />
        <div className="site-width hero-content">
          <div className="hero-copy">
            <h1 id="home-title">A tua próxima<br /> oportunidade <em>tem hora.</em></h1>
            <p>Uma hora vazia amanhã ainda é uma oportunidade. Na próxima semana, é só um número no relatório.</p>
            <div className="hero-actions">
              <Link className={buttonVariants()} href="/access/registo">Criar conta <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className={buttonVariants({ variant: "ghost" })} href="#produto">Explorar demonstração <ArrowDown size={15} aria-hidden="true" /></Link>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>
      <Reveal id="como-funciona" className="site-width workflow">
        <div className="workflow-intro">
          <h2>De vaga na agenda<br /> a cliente de volta.</h2>
          <p>Para estúdios, salões e outros negócios que trabalham por marcação.</p>
        </div>
        <ol>{steps.map(({ Icon, title, description }) => <li key={title}>
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
          <div><h3>{title}</h3><p>{description}</p></div>
        </li>)}</ol>
      </Reveal>
      <Reveal className="site-width site-cta">
        <h2>Começa pela tua agenda.</h2>
        <Link className={buttonVariants()} href="/access/registo">Criar conta <ArrowRight size={16} aria-hidden="true" /></Link>
      </Reveal>
    </main>
    <footer className="site-footer"><div className="site-width site-header-row">
      <Link href="/" aria-label="PROPULSE, início"><Brand /></Link>
      <Link href="/access/login">Iniciar sessão</Link>
    </div></footer>
  </div>;
}

