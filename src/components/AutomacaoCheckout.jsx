"use client";

import { useState, useEffect } from "react";
import styles from "./AutomacaoCheckout.module.css";

export default function AutomacaoCheckout() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Payment
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [status, setStatus] = useState("idle"); 
  const [submitError, setSubmitError] = useState(null);

  // Scheduling (now comes from Landing Page)
  const [selectedSlot, setSelectedSlot] = useState(null);

  // PIX
  const [pixData, setPixData] = useState(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); 
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSlot = localStorage.getItem('selectedSlot');
    if (savedSlot) {
      setSelectedSlot(savedSlot);
    } else {
      // Se não houver slot, redireciona de volta para escolher um
      window.location.href = "/#preco";
    }
  }, []);

  // Polling de Status de Pagamento
  useEffect(() => {
    let interval;
    if (pixData && paymentStatus === "pending" && step === 2) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ggpix/payment-status?order_id=${pixData.order_id || pixData.id}`);
          const data = await res.json();
          if (data.success && data.status === "approved") {
            setPaymentStatus("approved");
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Erro ao verificar status:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [pixData, paymentStatus, step]);

  async function handleFinalSubmit(e) {
    if (e) e.preventDefault();
    if (!form.nome || !form.email || !form.telefone || !selectedSlot) return;
    
    setStatus("submitting");
    setPixLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/cal/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.nome,
          email: form.email,
          phone: form.telefone,
          start: selectedSlot
        }),
      });
      
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.error || "Erro ao processar");

      setPixData(data);
      setStep(2); // Avança para o pagamento
      setStatus("success");
    } catch (e) {
      setSubmitError(e.message);
      setStatus("error");
    } finally {
      setPixLoading(false);
    }
  }

  function formatSelectedDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { 
      day: "numeric", 
      month: "long", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }

  if (!mounted) return null;

  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            Finalização de Reserva
          </div>
          <h2 className={styles.title}>
            {paymentStatus === "approved" ? "Pacto Confirmado!" : "Quase lá..."}
          </h2>
        </div>

        <div className={styles.checkoutWrapper}>
          <div className={styles.mainCard}>
            
            {/* INDICADOR DE PASSOS (AGORA SÓ 2) */}
            <div className={styles.stepIndicator}>
              {[1, 2].map((s) => (
                <div key={s} className={`${styles.step} ${step >= s ? styles.stepActive : ""}`}>
                  <div className={styles.stepDot}>{s}</div>
                  <span className={styles.stepLabel}>{s === 1 ? "Seus Dados" : "Pagamento"}</span>
                </div>
              ))}
            </div>
            
            {/* PASSO 1: DADOS */}
            {step === 1 && (
              <div className={styles.formContent}>
                <div className={styles.selectedTimeInfo}>
                  <p>Horário reservado:</p>
                  <strong>{formatSelectedDate(selectedSlot)}</strong>
                  <a href="/#preco" className={styles.changeTime}>Alterar horário</a>
                </div>

                <h3 className={styles.formTitle}>Dados para a Ativação</h3>
                <form onSubmit={handleFinalSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>Seu Nome</label>
                    <input type="text" placeholder="Dra. Ana Silva" className={styles.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>E-mail</label>
                    <input type="email" placeholder="ana@clinica.com.br" className={styles.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>WhatsApp / Telefone</label>
                    <input type="tel" placeholder="(11) 99999-9999" className={styles.input} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} required />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={pixLoading}>
                    {pixLoading ? "Processando..." : "Gerar QR Code PIX →"}
                  </button>
                  <div className={styles.secureBadge}>Sua vaga está garantida por 15 minutos</div>
                </form>
                {submitError && <div className={styles.submitError}>{submitError}</div>}
              </div>
            )}

            {/* PASSO 2: PAGAMENTO (PIX) */}
            {step === 2 && pixData && paymentStatus !== "approved" && (
              <div className={styles.pixContent}>
                <div className={styles.pixHeader}>
                  <h3 className={styles.formTitle}>Aguardando Pagamento</h3>
                  <div className={styles.timerBadge}>Vence em 2h</div>
                </div>
                <div className={styles.pixBody}>
                  <div className={styles.qrCodeContainer}>
                    {(pixData.pix?.code) ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixData.pix.code)}`}
                        alt="QR Code PIX"
                        className={styles.qrCode}
                      />
                    ) : <div className={styles.pixLoading}>Gerando QR Code...</div>}
                  </div>
                  <div className={styles.pixInstructions}>
                    <p>1. Abra o app do seu banco</p>
                    <p>2. Escolha "Pagar via Pix QR Code"</p>
                    <p>3. Aponte a câmera ou cole o código abaixo</p>
                  </div>
                  <div className={styles.pixCopyPaste}>
                    <div className={styles.copyInputGroup}>
                      <input readOnly value={pixData.pix?.code || ""} className={styles.copyInput} />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.pix?.code || "");
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className={styles.copyBtn}
                      >
                        {copied ? "✓ Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.paymentStatus}><div className={styles.statusSpinner}></div>Monitorando pagamento em tempo real...</div>
              </div>
            )}

            {/* SUCESSO: APROVADO */}
            {paymentStatus === "approved" && (
              <div className={styles.approvedContent}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.approvedTitle}>Pacto Confirmado!</h3>
                <p className={styles.approvedText}>Recebemos seu pagamento. A <strong>Dra. Lilith</strong> já está preparando sua automação.</p>
                <button className={styles.submitBtn} onClick={() => window.location.href = "/"}>Voltar ao Início</button>
              </div>
            )}
          </div>

          {/* CARD DE RESUMO (LATERAL) */}
          <div className={styles.summaryCard}>
            <h3 className={styles.formTitle}>Resumo do Pedido</h3>
            <div className={styles.planInfo}>
              <div className={styles.summaryItem}><span>Assinatura Mensal IA</span><span>R$ 99,00</span></div>
              <div className={styles.summaryItem}><span>Setup & Ativação</span><span className={styles.free}>INCLUSO</span></div>
            </div>
            <div className={styles.summaryTotal}><span>Total</span><span className={styles.totalAmount}>R$ 99,00</span></div>
            <ul className={styles.summaryBenefits}>
              <li>✦ IA de Atendimento 24/7</li>
              <li>✦ Agendamento Inteligente</li>
              <li>✦ Sessão de Setup Inclusa</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
