"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, ChevronRight, Clock3, LayoutGrid, UsersRound } from "lucide-react";
import { Brand } from "./ui";

const opportunities = [
  { day: "Ter", time: "14:30", duration: "45 min", initials: "ML", name: "Marta L.", reason: "Costuma marcar à terça", service: "Sessão de acompanhamento", value: 65 },
  { day: "Qua", time: "11:00", duration: "30 min", initials: "TR", name: "Tiago R.", reason: "Já passaram 5 semanas", service: "Sessão de manutenção", value: 45 },
  { day: "Qui", time: "16:15", duration: "60 min", initials: "AS", name: "Ana S.", reason: "Prefere o fim da tarde", service: "Consulta individual", value: 80 },
];
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const recovered = [25, 35, 30, 45, 40, 65];
const potential = [0, 65, 45, 80, 0, 0];

export function ProductPreview() {
  const [active, setActive] = useState(0);
  const selected = opportunities[active]!;

  return <section id="produto" className="product-preview" aria-label="Demonstração do PROPULSE">
    <div className="preview-frame">
      <aside className="preview-sidebar" aria-label="Contexto da demonstração">
        <Brand />
        <p className="preview-space">Estúdio Norte <ChevronRight size={13} aria-hidden="true" /></p>
        <ul className="preview-sections">
          <li><LayoutGrid /> Visão geral</li>
          <li><CalendarDays /> Agenda</li>
          <li><UsersRound /> Clientes</li>
          <li className="preview-current"><ChartNoAxesCombined /> Oportunidades</li>
        </ul>
      </aside>
      <div className="preview-main">
        <header className="preview-heading">
          <div><span className="preview-period">Agenda desta semana</span><h2>Oportunidades</h2></div>
          <span className="preview-badge">Dados de exemplo</span>
        </header>
        <div className="preview-overview">
          <section className="preview-revenue" aria-labelledby="preview-revenue">
            <h3 id="preview-revenue">Receita das marcações recuperadas</h3>
            <div className="preview-totals">
              <div><span>Recuperada</span><strong>{money.format(recovered.reduce((sum, value) => sum + value, 0))}</strong></div>
              <div><span>Potencial em aberto</span><strong>{money.format(opportunities.reduce((sum, item) => sum + item.value, 0))}</strong></div>
            </div>
            <figure className="preview-chart" aria-label="Comparação ilustrativa entre receita recuperada e potencial por dia">
              <div className="chart-columns" aria-hidden="true">{days.map((day, i) => <div className="chart-day" key={day}>
                <div className="chart-bars"><i style={{ height: ((potential[i] ?? 0) / 80) * 100 + "%" }} /><i style={{ height: ((recovered[i] ?? 0) / 80) * 100 + "%" }} /></div>
                <span>{day}</span>
              </div>)}</div>
              <figcaption><span>Recuperada</span><span>Potencial</span></figcaption>
            </figure>
          </section>
          <section className="preview-match" aria-labelledby="preview-match">
            <div className="match-label"><Clock3 size={15} aria-hidden="true" /><h3 id="preview-match">Oportunidade selecionada</h3></div>
            <div aria-live="polite">
              <p className="match-time">{selected.day} · {selected.time}</p>
              <p className="match-service">{selected.service} · {selected.duration}</p>
              <div className="match-contact">
                <span className="match-avatar" aria-hidden="true">{selected.initials}</span>
                <div><strong>{selected.name}</strong><span>{selected.reason}</span></div>
                <strong className="match-value">{money.format(selected.value)}</strong>
              </div>
            </div>
          </section>
        </div>
        <div className="preview-slots">
          <h3>Horários disponíveis <span>{opportunities.length}</span></h3>
          <ul>{opportunities.map((item, i) => <li key={item.name}>
            <button type="button" aria-pressed={active === i} onClick={() => setActive(i)}>
              <span className="slot-date">{item.day} <strong>{item.time}</strong></span>
              <span className="slot-client">{item.name}</span>
              <strong>{money.format(item.value)}</strong>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </li>)}</ul>
        </div>
      </div>
    </div>
  </section>;
}

