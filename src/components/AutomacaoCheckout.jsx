"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./AutomacaoCheckout.module.css";

export default function AutomacaoCheckout() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(typeof window !== "undefined");
  const [step, setStep] = useState(1); // 1: Form, 2: Payment
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState(null);

  // Initialize from searchParams directly to avoid useEffect setState
  const [selectedSlot, setSelectedSlot] = useState(() => {
    if (typeof window !== "undefined") {
      return searchParams.get("date") || null;
    }
    return null;
  });

  // ManyChat subscriber ID from URL (used by webhook to send message)
  const [mcSubscriberId, setMcSubscriberId] = useState(() => {
    if (typeof window !== "undefined") {
      return searchParams.get("mc_subscriber_id") || null;
    }
    return null;
  });

  // PIX
  const [pixData, setPixData] = useState(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (step === 2 && paymentStatus === "pending" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, paymentStatus, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Autofill from URL params (name, email, phone/telefone, date, mc_subscriber_id)
    const urlName = searchParams.get("name") || searchParams.get("nome");
    const urlEmail = searchParams.get("email");
    const urlPhone = searchParams.get("phone") || searchParams.get("telefone") || searchParams.get("whatsapp");
    let urlDate = searchParams.get("date") || searchParams.get("data");
    const urlMcSubscriberId = searchParams.get("mc_subscriber_id") || searchParams.get("subscriber_id");

    // Limpa caracteres de markdown ou sujeira na data se vier do chat (ex: "2026-08-03T14:00:00.000Z](https://...")
    if (urlDate) {
      urlDate = urlDate.split("]")[0].split(")")[0].trim();
    }

    if (urlMcSubscriberId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preenchimento único via URL (init com guard)
      setMcSubscriberId(urlMcSubscriberId);
    }

    if (urlName || urlEmail || urlPhone) {
      setForm(prev => {
        let phoneFormatted = urlPhone || prev.telefone;
        if (urlPhone) {
          let value = String(urlPhone).replace(/\D/g, "");
          // Se vier com o DDI do Brasil (ex: 5513988658518), remove o 55 inicial se tiver 12 ou 13 dígitos
          if ((value.length === 12 || value.length === 13) && value.startsWith("55")) {
            value = value.slice(2);
          }
          if (value.length > 11) value = value.slice(0, 11);
          if (value.length > 10) {
            phoneFormatted = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
          } else if (value.length > 6) {
            phoneFormatted = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
          } else if (value.length > 2) {
            phoneFormatted = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
          } else if (value.length > 0) {
            phoneFormatted = value.replace(/^(\d{0,2}).*/, "($1");
          }
        }

        return {
          ...prev,
          nome: urlName || prev.nome,
          email: urlEmail || prev.email,
          telefone: phoneFormatted,
        };
      });
    }

    if (urlDate) {
      setSelectedSlot(urlDate);
      localStorage.setItem('selectedSlot', urlDate);
    }

    const savedSlot = localStorage.getItem('selectedSlot');
    if (savedSlot && !urlDate) {
      setSelectedSlot(savedSlot);
    } else if (!savedSlot && !urlDate && !urlName) {
      window.location.href = "/#investimento";
    }

    // Persistência do PIX
    const savedPix = localStorage.getItem('pixData');
    const savedPixTime = localStorage.getItem('pixTimestamp');
    if (savedPix && savedPixTime) {
      const elapsed = (Date.now() - parseInt(savedPixTime)) / 1000;
      if (elapsed < 15 * 60) {
        setPixData(JSON.parse(savedPix));
        setStep(2);
        setTimeLeft(Math.floor(15 * 60 - elapsed));
      } else {
        localStorage.removeItem('pixData');
        localStorage.removeItem('pixTimestamp');
      }
    }
  }, [searchParams]);

  const handleReset = () => {
    localStorage.removeItem('pixData');
    localStorage.removeItem('pixTimestamp');
    setPixData(null);
    setStep(1);
    setTimeLeft(15 * 60);
  };

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
          start: selectedSlot,
          subscriber_id: mcSubscriberId
        }),
      });

      const data = await res.json();
      if (data.status !== "success") throw new Error(data.error || "Erro ao processar");

      setPixData(data);
      localStorage.setItem('pixData', JSON.stringify(data));
      localStorage.setItem('pixTimestamp', Date.now().toString());
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
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  }

  if (!mounted) return null;

  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
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
                  <p className={styles.subtitle}>Horário reservado:</p>
                  <strong>{formatSelectedDate(selectedSlot)}</strong>
                  <Link href="/#investimento" className={styles.changeTime}>Alterar horário</Link>
                </div>

                <h3 className={styles.formTitle}>Finalizar Pedido</h3>
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
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className={styles.input}
                      value={form.telefone}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 11) value = value.slice(0, 11);
                        if (value.length > 10) {
                          value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
                        } else if (value.length > 6) {
                          value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
                        } else if (value.length > 2) {
                          value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
                        } else if (value.length > 0) {
                          value = value.replace(/^(\d{0,2}).*/, "($1");
                        }
                        setForm({ ...form, telefone: value });
                      }}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={pixLoading}>
                    {pixLoading ? "Processando..." : "Gerar QR Code PIX →"}
                  </button>
                  <div className={styles.secureBadge}>Sua vaga fica garantida por 15 minutos</div>
                </form>
                {submitError && <div className={styles.submitError}>{submitError}</div>}
              </div>
            )}

            {/* PASSO 2: PAGAMENTO (PIX) */}
            {step === 2 && pixData && paymentStatus !== "approved" && (
              <div className={styles.pixContent}>
                <div className={styles.pixHeader}>
                  <h3 className={styles.pixTitle}>Aguardando Pagamento</h3>
                  <p className={styles.subtitle}>Não feche essa tela enquanto o pagamento é processado, para não perder sua reserva.</p>
                  <div className={styles.timerBadge}>Expira em {formatTime(timeLeft)}</div>
                  <p className={styles.timerNotice}>Sua reserva é válida por 15 minutos</p>
                  {process.env.NODE_ENV === 'development' && (
                    <button onClick={handleReset} className={styles.devBtn} style={{ marginTop: '10px', padding: '8px 16px', fontSize: '12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      [DEV] Gerar Novo PIX
                    </button>
                  )}
                </div>

                {timeLeft === 0 ? (
                  <div className={styles.expiredContent}>
                    <div className={styles.expiredIcon}>!</div>
                    <h3 className={styles.formTitle}>Tempo Expirado</h3>
                    <p className={styles.expiredText}>O prazo de 15 minutos para esta reserva terminou. Clique no botão abaixo para gerar um novo código.</p>
                    <button onClick={handleReset} className={styles.submitBtn}>Gerar Novo QR Code</button>
                  </div>
                ) : (
                  <div className={styles.pixBody}>
                    <div className={styles.qrCodeContainer}>
                      {(pixData.pix?.code) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- QR dinâmico por URL remota
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixData.pix.code)}`}
                          alt="QR Code PIX"
                          className={styles.qrCode}
                        />
                      ) : <div className={styles.pixLoading}>Gerando QR Code...</div>}
                    </div>
                    <div className={styles.pixInstructions}>
                      <div className={styles.instructionItem}>
                        <div className={styles.instructionIcon}>1</div>
                        <p>Abra o app do seu banco preferido</p>
                      </div>
                      <div className={styles.instructionItem}>
                        <div className={styles.instructionIcon}>2</div>
                        <p>Escolha a opção de pagar via <strong>Pix QR Code</strong></p>
                      </div>
                      <div className={styles.instructionItem}>
                        <div className={styles.instructionIcon}>3</div>
                        <p>Aponte a câmera ou cole o código copia e cola abaixo</p>
                      </div>
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
                )}
              </div>
            )}

            {/* SUCESSO: APROVADO */}
            {paymentStatus === "approved" && (
              <div className={styles.approvedContent}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.approvedTitle}>Pacto Confirmado!</h3>
                <p className={styles.subtitle}>Recebemos seu pagamento. Nossa equipe já está preparando a sua automação.</p>
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
            <div className={styles.activationPlan}>
              <h4>Assessoria Estratégica</h4>
              <p className={styles.subtitle}>Ao assinar nossa ferramenta, você ganha uma sessão estratégica de 1 hora para mapear e implementar a captação e a automação da sua clínica.</p>
            </div>
            <ul className={styles.summaryBenefits}>
              <li>✦ IA de Atendimento 24/7</li>
              <li>✦ Agendamento Inteligente</li>
              <li>✦ Sem fidelidade ou multas</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

