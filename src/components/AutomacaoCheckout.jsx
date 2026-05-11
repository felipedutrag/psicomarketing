"use client";

import { useState, useMemo } from "react";
import styles from "./AutomacaoCheckout.module.css";

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  let count = 0;
  let offset = 1; // começa amanhã

  while (days.length < 5) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    // pula sábado (6) e domingo (0)
    if (dow !== 0 && dow !== 6) {
      // O primeiro dia disponível (amanhã útil) é marcado como ocupado
      const isBusy = count === 0;
      days.push({
        date: d,
        dayName: DIAS_PT[dow],
        dayNum: d.getDate(),
        month: MESES_PT[d.getMonth()],
        isBusy,
        slots: isBusy
          ? []
          : [
              { id: "manha", label: "09:00 – manhã" },
              { id: "tarde", label: "14:00 – tarde" },
            ],
      });
      count++;
    }
    offset++;
  }
  return days;
}

export default function AutomacaoCheckout() {
  const days = useMemo(() => buildDays(), []);

  const [currentDay, setCurrentDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const activeDay = days[currentDay];

  function handlePrev() {
    setCurrentDay((p) => Math.max(0, p - 1));
    setSelectedSlot(null);
  }
  function handleNext() {
    setCurrentDay((p) => Math.min(days.length - 1, p + 1));
    setSelectedSlot(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.email || !selectedSlot) return;
    setStatus("loading");
    // Simula envio (aqui você pode conectar à sua API real)
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("success");
  }

  if (status === "success") {
    const slot = activeDay.slots.find((s) => s.id === selectedSlot);
    return (
      <section className={styles.section} id="checkout">
        <div className={`container ${styles.container}`}>
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Instalação agendada!</h2>
            <p className={styles.successText}>
              Você escolheu o dia <strong>{activeDay.dayNum}/{activeDay.month}</strong> às{" "}
              <strong>{slot?.label}</strong>. Em breve enviaremos uma confirmação para{" "}
              <strong>{form.email}</strong>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="checkout">
      <div className={`container ${styles.container}`}>

        {/* — Cabeçalho da dobra — */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            Instalação da Automação IA
          </div>
          <h2 className={styles.title}>
            Sua secretária de IA pronta{" "}
            <span className={styles.highlight}>em 24 horas</span>
          </h2>
          <p className={styles.subtitle}>
            Escolha um horário para a nossa equipe instalar e configurar a Automação de WhatsApp com IA no seu consultório. A sessão é gratuita e dura 30 minutos.
          </p>
        </div>

        {/* — Grid: formulário + calendário — */}
        <div className={styles.grid}>

          {/* Coluna 1 – Formulário */}
          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Seus dados</h3>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="nome" className={styles.label}>Nome completo</label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="Dra. Ana Silva"
                    className={styles.input}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>E-mail profissional</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ana@clinica.com.br"
                    className={styles.input}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.selectedSummary}>
                  {selectedSlot ? (
                    <>
                      <span className={styles.summaryCheck}>✓</span>
                      <span>
                        <strong>{activeDay.dayName}, {activeDay.dayNum} de {activeDay.month}</strong>
                        {" "}— {activeDay.slots.find((s) => s.id === selectedSlot)?.label}
                      </span>
                    </>
                  ) : (
                    <span className={styles.summaryEmpty}>← Escolha um horário no calendário</span>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn-primary ${styles.submitBtn}`}
                  disabled={!selectedSlot || !form.nome || !form.email || status === "loading"}
                >
                  {status === "loading" ? "Confirmando…" : "Confirmar instalação grátis →"}
                </button>

                <p className={styles.disclaimer}>
                  Sessão gratuita, sem compromisso. Cancelamento com 1h de antecedência.
                </p>
              </form>
            </div>
          </div>

          {/* Coluna 2 – Carrossel de calendário */}
          <div className={styles.calCol}>
            <div className={styles.calCard}>
              <div className={styles.calHeader}>
                <button
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentDay === 0}
                  aria-label="Dia anterior"
                >
                  ‹
                </button>
                <div className={styles.calDateInfo}>
                  <span className={styles.calDayName}>{activeDay.dayName}</span>
                  <span className={styles.calDayNum}>{activeDay.dayNum}</span>
                  <span className={styles.calMonth}>{activeDay.month}</span>
                </div>
                <button
                  className={styles.navBtn}
                  onClick={handleNext}
                  disabled={currentDay === days.length - 1}
                  aria-label="Próximo dia"
                >
                  ›
                </button>
              </div>

              {/* Paginação de pontos */}
              <div className={styles.dots}>
                {days.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === currentDay ? styles.dotActive : ""}`}
                    onClick={() => { setCurrentDay(i); setSelectedSlot(null); }}
                    aria-label={`Ir para dia ${i + 1}`}
                  />
                ))}
              </div>

              {/* Slots de horário */}
              {activeDay.isBusy ? (
                <div className={styles.busyBox}>
                  <span className={styles.busyIcon}>⏳</span>
                  <p className={styles.busyText}>Todos os horários ocupados</p>
                  <p className={styles.busyHint}>Selecione outro dia ›</p>
                </div>
              ) : (
                <div className={styles.slots}>
                  {activeDay.slots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.slot} ${selectedSlot === slot.id ? styles.slotSelected : ""}`}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      <span className={styles.slotIcon}>
                        {slot.id === "manha" ? "🌅" : "🌤️"}
                      </span>
                      <span className={styles.slotLabel}>{slot.label}</span>
                      {selectedSlot === slot.id && <span className={styles.slotCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.calFooter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Confirmação imediata por e-mail</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
