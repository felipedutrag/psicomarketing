"use client";

import { useEffect } from "react";
import styles from "./Schedule.module.css";

export default function Schedule() {
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
  }, []);

  return (
    <section className={styles.scheduleSection} id="agenda">
      <div className="container">
        <h2 className="section-title">Pronto para transformar seu consultório?</h2>
        <p className="section-subtitle">
          Agende uma sessão estratégica sem compromisso. Nossa equipe criará um plano de captação sob medida para a sua especialidade com vagas limitadas para garantir a máxima qualidade do nosso serviço.
        </p>
        
        <div className={styles.calContainer}>
          <div 
            style={{ width: "100%", height: "100%", overflow: "scroll" }} 
            id="my-cal-inline-viabilidade-patente"
          ></div>
        </div>
      </div>
    </section>
  );
}
