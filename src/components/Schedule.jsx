"use client";

import { useEffect, useState } from "react";
import styles from "./Schedule.module.css";

export default function Schedule() {
  const [pixData, setPixData] = useState(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // ——— Polling de Status de Pagamento ———
  useEffect(() => {
    let interval;
    if (pixData && paymentStatus === "pending" && booked) {
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
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [pixData, paymentStatus, booked]);

  // ——— Gera PIX ———
  async function generatePix(name) {
    setPixLoading(true);
    try {
      const res = await fetch("/api/ggpix/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          total: 29.00,
          name: name || "Cliente Agenda"
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

  useEffect(() => {
    (function (C, A, L) {
      let p = function (a, ar) {
        a.q.push(ar);
      };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            let script = d.createElement("script");
            script.src = A;
            d.head.appendChild(script);
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    window.Cal("init", "viabilidade-patente", { origin: "https://app.cal.com" });

    window.Cal.ns["viabilidade-patente"]("inline", {
      elementOrSelector: "#my-cal-inline-viabilidade-patente",
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", theme: "light" },
      calLink: "fdgoncalves/viabilidade-patente",
    });

    window.Cal.ns["viabilidade-patente"]("ui", {
      theme: "light",
      hideEventTypeDetails: false,
      layout: "month_view",
    });

    // Evento de agendamento bem-sucedido
    window.Cal("on", {
      action: "bookingSuccessful",
      callback: (e) => {
        console.log("Booking successful", e);
        setBooked(true);
        const name = e.data?.attendees?.[0]?.name || "Cliente";
        generatePix(name);
      }
    });
  }, []);

  return (
    <section className={styles.scheduleSection} id="agenda">
      <div className="container">
        <h2 className="section-title">
          {booked ? "Prase em te ver em breve!" : "Pronto para transformar seu consultório?"}
        </h2>
        <p className="section-subtitle">
          {booked 
            ? "Seu agendamento foi realizado com sucesso. Agora, realize o pagamento da taxa para confirmar." 
            : "Agende uma sessão estratégica sem compromisso. Nossa equipe criará um plano de captação sob medida para a sua especialidade com vagas limitadas para garantir a máxima qualidade do nosso serviço."
          }
        </p>
        
        <div className={styles.calContainer}>
          {!booked ? (
            <div 
              style={{ width: "100%", height: "100%", overflow: "scroll" }} 
              id="my-cal-inline-viabilidade-patente"
            ></div>
          ) : (
            <div className={styles.pixSuccessBox}>
              <div className={styles.successIcon}>✓</div>
              
              {paymentStatus === "approved" ? (
                <div className={styles.paymentApproved}>
                  <div className={styles.approvedBadge}>✓ PAGAMENTO CONFIRMADO</div>
                  <h3 className={styles.pixTitle}>Tudo pronto!</h3>
                  <p className={styles.pixSubtitle}>Seu pagamento foi processado. Nossa equipe entrará em contato em breve para a sessão estratégica.</p>
                </div>
              ) : (
                <>
                  <h3 className={styles.pixTitle}>Taxa de Ativação</h3>
                  <p className={styles.pixSubtitle}>Pague o PIX de <strong>R$ 29,00</strong> para confirmar sua sessão estratégica.</p>
                  
                  {pixLoading ? (
                    <div className={styles.pixLoading}>Gerando código PIX...</div>
                  ) : pixData ? (
                    <div className={styles.pixContent}>
                      <div className={styles.qrCodeContainer}>
                        {pixData.qr_code_base64 ? (
                          <img 
                            src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                            alt="QR Code PIX" 
                            className={styles.qrCode}
                          />
                        ) : (
                          <div className={styles.pixLoading}>Carregando imagem do QR Code...</div>
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
                    </div>
                  ) : (
                    <div className={styles.pixError}>Não foi possível gerar o PIX automaticamente. Entre em contato com o suporte.</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
