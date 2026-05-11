"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./AutomacaoCheckout.module.css";

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const IS_DEV = process.env.NODE_ENV === "development";

// ——— Formata ISO em hora local BR ———
function formatHour(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

// ——— Formata data local BR ———
function formatDateLabel(dateStr) {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return {
    dayName: DIAS_PT[d.getDay()],
    dayNum: d.getDate(),
    month: MESES_PT[d.getMonth()],
    dateStr,
  };
}

export default function AutomacaoCheckout() {
  // Estado dos slots vindos da API
  const [days, setDays] = useState([]);       // [{dayName, dayNum, month, dateStr, slots:[{start}]}]
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Navegação do carrossel
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);  // ISO string

  // Formulário
  const [form, setForm] = useState({ nome: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // PIX
  const [pixData, setPixData] = useState(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | approved | cancelled

  // ——— Polling de Status de Pagamento ———
  useEffect(() => {
    let interval;
    if (pixData && paymentStatus === "pending" && status === "success") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ggpix/payment-status?order_id=${pixData.order_id}`);
          const data = await res.json();
          if (data.success && data.status === "approved") {
            setPaymentStatus("approved");
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Erro ao verificar status:", e);
        }
      }, 5000); // Verifica a cada 5 segundos
    }
    return () => clearInterval(interval);
  }, [pixData, paymentStatus, status]);

  // ——— Busca slots na nossa API proxy ———
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/cal/slots?days=21");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      // Converte objeto {date: [{start}]} → array de dias com metadados
      const rawSlots = data.slots || {};
      const parsed = Object.entries(rawSlots)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 7) // máx 7 dias no carrossel
        .map(([dateStr, slots]) => ({
          ...formatDateLabel(dateStr),
          slots,
        }));

      setDays(parsed);
      setCurrentDay(0);
      setSelectedSlot(null);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // ——— Simula slots fake para testes DEV ———
  function loadFakeSlots() {
    const today = new Date();
    const fakeDays = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + 4 + i);
      const dateStr = d.toISOString().split("T")[0];
      const hour1 = new Date(d); hour1.setUTCHours(12, 0, 0, 0); // 09h BRT
      const hour2 = new Date(d); hour2.setUTCHours(17, 0, 0, 0); // 14h BRT
      return {
        ...formatDateLabel(dateStr),
        slots: [{ start: hour1.toISOString() }, { start: hour2.toISOString() }],
      };
    });
    setDays(fakeDays);
    setCurrentDay(0);
    setSelectedSlot(null);
    setApiError(null);
    setLoading(false);
  }

  // ——— Gera PIX ———
  async function generatePix(name) {
    setPixLoading(true);
    try {
      const res = await fetch("/api/ggpix/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          total: 29.00,
          name: name
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      }
    } catch (e) {
      console.error("Erro ao gerar PIX:", e);
    } finally {
      setPixLoading(false);
    }
  }

  // ——— Submete agendamento ———
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.email || !selectedSlot) return;
    setStatus("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/cal/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.nome, email: form.email, start: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no agendamento");
      
      setBookingResult(data);
      setStatus("success");
      
      // Se a API de agendamento já retornou o PIX, usamos ele
      if (data.pix) {
        // Precisamos do base64 do QR code
        const qrRes = await fetch("/api/ggpix/pix", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ total: 29.00, name: form.nome })
        });
        const qrData = await qrRes.json();
        if (qrData.success) {
           setPixData(qrData);
        }
      } else {
        // Fallback para gerar manualmente se o agendamento não trouxe
        generatePix(form.nome);
      }
    } catch (e) {
      setSubmitError(e.message);
      setStatus("error");
    }
  }

  const activeDay = days[currentDay];

  // ——— Tela de Sucesso ———
  if (status === "success" && bookingResult) {
    return (
      <section className={styles.section} id="checkout">
        <div className={`container ${styles.container}`}>
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Instalação agendada!</h2>
            <p className={styles.successText}>
              Agendamento confirmado para <strong>{form.nome}</strong>.<br />
              Um convite foi enviado para <strong>{form.email}</strong>.
            </p>
            
            {/* Seção PIX */}
            <div className={styles.pixSection}>
              {paymentStatus === "approved" ? (
                <div className={styles.paymentApproved}>
                  <div className={styles.approvedBadge}>✓ PAGAMENTO CONFIRMADO</div>
                  <h3 className={styles.pixTitle}>Tudo pronto!</h3>
                  <p className={styles.pixSubtitle}>Seu pagamento foi processado. Nossa equipe entrará em contato em breve para a instalação.</p>
                </div>
              ) : (
                <>
                  <h3 className={styles.pixTitle}>Taxa de Ativação</h3>
                  <p className={styles.pixSubtitle}>Pague o PIX de <strong>R$ 29,00</strong> para confirmar a configuração da sua IA.</p>
                  
                  {pixLoading ? (
                    <div className={styles.pixLoading}>Gerando código PIX...</div>
                  ) : pixData ? (
                    <>
                      <div className={styles.qrCodeContainer}>
                        {pixData.qr_code_base64 ? (
                          <img 
                            src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                            alt="QR Code PIX" 
                            className={styles.qrCode}
                          />
                        ) : (
                          <div className={styles.pixLoading}>Carregando QR Code...</div>
                        )}
                      </div>
                      <div className={styles.pixCopyPaste}>
                        <span className={styles.copyLabel}>Copia e Cola</span>
                        <div className={styles.copyInputGroup}>
                          <input 
                            readOnly 
                            value={pixData.pix_code} 
                            className={styles.copyInput} 
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(pixData.pix_code);
                              alert("Código copiado!");
                            }}
                            className={styles.copyBtn}
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.pixError}>Não foi possível gerar o PIX automaticamente. Entre em contato com o suporte.</div>
                  )}
                </>
              )}
            </div>

            {bookingResult.meetingUrl && (
              <a href={bookingResult.meetingUrl} target="_blank" rel="noopener noreferrer" className={`btn-primary ${styles.meetBtn}`}>
                Abrir link do Google Meet →
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="checkout">
      <div className={`container ${styles.container}`}>

        {/* — Cabeçalho — */}
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
            Escolha um horário para a nossa equipe instalar e configurar a Automação de WhatsApp com IA no seu consultório. A sessão é gratuita e dura 60 minutos.
          </p>

          {/* — Botão DEV (apenas em development) — */}
          {IS_DEV && (
            <div className={styles.devBar}>
              <span className={styles.devLabel}>🛠 DEV MODE</span>
              <button className={styles.devBtn} onClick={loadFakeSlots}>
                Carregar Slots Fake
              </button>
              <button className={styles.devBtn} onClick={fetchSlots}>
                Buscar Slots Reais
              </button>
              {apiError && <span className={styles.devError}>{apiError}</span>}
            </div>
          )}
        </div>

        {/* — Estado de carregamento — */}
        {loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner}></div>
            <p>Buscando horários disponíveis…</p>
          </div>
        ) : apiError && !IS_DEV ? (
          <div className={styles.errorBox}>
            <p>⚠️ Não foi possível carregar os horários. <button onClick={fetchSlots} className={styles.retryBtn}>Tentar novamente</button></p>
          </div>
        ) : days.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>Nenhum horário disponível nos próximos dias. Entre em contato diretamente pelo WhatsApp.</p>
          </div>
        ) : (

          /* — Grid principal — */
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

                  {/* Resumo do horário selecionado */}
                  <div className={styles.selectedSummary}>
                    {selectedSlot ? (
                      <>
                        <span className={styles.summaryCheck}>✓</span>
                        <span>
                          <strong>{activeDay?.dayName}, {activeDay?.dayNum}/{activeDay?.month}</strong>
                          {" "}às <strong>{formatHour(selectedSlot)}</strong>
                        </span>
                      </>
                    ) : (
                      <span className={styles.summaryEmpty}>← Escolha um horário no calendário</span>
                    )}
                  </div>

                  {submitError && (
                    <div className={styles.submitError}>{submitError}</div>
                  )}

                  <button
                    type="submit"
                    id="btn-confirmar-agendamento"
                    className={`btn-primary ${styles.submitBtn}`}
                    disabled={!selectedSlot || !form.nome || !form.email || status === "submitting"}
                  >
                    {status === "submitting" ? "Confirmando…" : "Confirmar instalação grátis →"}
                  </button>

                  <p className={styles.disclaimer}>
                    Sessão gratuita, sem compromisso. Você receberá uma confirmação por e-mail.
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
                    onClick={() => { setCurrentDay((p) => Math.max(0, p - 1)); setSelectedSlot(null); }}
                    disabled={currentDay === 0}
                    aria-label="Dia anterior"
                  >‹</button>

                  <div className={styles.calDateInfo}>
                    <span className={styles.calDayName}>{activeDay?.dayName}</span>
                    <span className={styles.calDayNum}>{activeDay?.dayNum}</span>
                    <span className={styles.calMonth}>{activeDay?.month}</span>
                  </div>

                  <button
                    className={styles.navBtn}
                    onClick={() => { setCurrentDay((p) => Math.min(days.length - 1, p + 1)); setSelectedSlot(null); }}
                    disabled={currentDay === days.length - 1}
                    aria-label="Próximo dia"
                  >›</button>
                </div>

                {/* Paginação de pontos */}
                <div className={styles.dots}>
                  {days.map((day, i) => (
                    <button
                      key={day.dateStr || i}
                      className={`${styles.dot} ${i === currentDay ? styles.dotActive : ""}`}
                      onClick={() => { setCurrentDay(i); setSelectedSlot(null); }}
                      aria-label={`Dia ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Slots de horário */}
                {activeDay?.slots?.length ? (
                  <div className={styles.slots}>
                    {activeDay.slots.map((slot, idx) => (
                      <button
                        key={slot.start || idx}
                        id={`slot-${slot.start}`}
                        className={`${styles.slot} ${selectedSlot === slot.start ? styles.slotSelected : ""}`}
                        onClick={() => setSelectedSlot(slot.start)}
                      >
                        <span className={styles.slotIcon}>
                          {new Date(slot.start).getUTCHours() < 13 ? "🌅" : "🌤️"}
                        </span>
                        <span className={styles.slotLabel}>{formatHour(slot.start)}</span>
                        {selectedSlot === slot.start && <span className={styles.slotCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.busyBox}>
                    <span className={styles.busyIcon}>⏳</span>
                    <p className={styles.busyText}>Sem horários neste dia</p>
                    <p className={styles.busyHint}>Selecione outro dia →</p>
                  </div>
                )}

                <div className={styles.calFooter}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Confirmação imediata via Google Meet</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
