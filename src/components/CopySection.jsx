import styles from "./CopySection.module.css";

const PAINS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "A Resposta Que Demora Demais",
    text: "Você está em sessão e o WhatsApp não para. Enquanto você não responde, o paciente já marcou horário com quem atendeu primeiro.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 18s-2-1.5-2-3" />
      </svg>
    ),
    title: "Horas Jogadas Fora com Curiosos",
    text: "Você repete as mesmas explicações dezenas de vezes por dia para contatos que somem na hora de falar em valor — e nunca viram paciente.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9 16 2 2 4-4" />
      </svg>
    ),
    title: "Agenda em Caos",
    text: "Reagendamentos por mensagem, horários confundidos, energia gasta em tarefas que deveriam ser automáticas — e não clínicas.",
  },
];

const FLOW = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "Paciente entra em contato"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path x1="17" y1="19" x2="21" y2="19" />
      </svg>
    ),
    label: "IA responde em segundos"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9 16 2 2 4-4" />
      </svg>
    ),
    label: "Agendamento automático"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    ),
    label: "Você só aparece na sessão"
  },
];

export default function CopySection() {
  return (
    <section className={styles.copySection} id="copy">
      <div className={`container ${styles.container}`}>

        {/* Header centralizado */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>O Problema Real</div>
          <h2 className={styles.title}>
            O paciente de hoje{" "}
            <span className={styles.highlight}>não tem paciência</span>{" "}
            para esperar.
          </h2>
          <p className={styles.subtitle}>
            Enquanto você entrega o seu melhor em sessão, pacientes em potencial somem no vácuo — e agendam com quem respondeu primeiro. Não é falta de demanda. É falta de velocidade.
          </p>
        </div>

        {/* Cards de dor */}
        <div className={styles.painGrid}>
          {PAINS.map((p, i) => (
            <div key={i} className={styles.painCard}>
              <div className={styles.painIcon}>{p.icon}</div>
              <h3 className={styles.painTitle}>{p.title}</h3>
              <p className={styles.painText}>{p.text}</p>
              <div className={styles.painBadge}>✕ Problema</div>
            </div>
          ))}
        </div>

        {/* Alerta de ROI */}
        <div className={styles.roiWarning}>
          <span className={styles.warningIcon}>⚠️</span>
          <p>
            <strong>A verdade brutal:</strong> Investir em anúncios e demorar para responder é <span>jogar dinheiro fora.</span> Você paga pelo clique, mas quem atende primeiro leva o paciente.
          </p>
        </div>

        {/* Divisor "A SOLUÇÃO" */}
        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerLabel}>A SOLUÇÃO</span>
          <div className={styles.dividerLine}></div>
        </div>

        {/* Card de solução */}
        <div className={styles.solutionCard}>
          <div className={styles.solutionLeft}>
            <h3 className={styles.solutionTitle}>
              Sua secretária que <span className={styles.highlight}>nunca dorme, nunca falta</span> ⚡
            </h3>
            <p className={styles.subtitle}>
              A IA acolhe, esclarece dúvidas e qualifica pacientes reais 24h por dia, agendando direto na sua agenda — sem intervalo, sem folga, sem erro.
            </p>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>&lt; 1min</span>
                <span className={styles.statLabel}>Tempo de Resposta</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>-80%</span>
                <span className={styles.statLabel}>Tempo no Celular</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Disponibilidade</span>
              </div>
            </div>
          </div>

          {/* Fluxo visual */}
          <div className={styles.solutionRight}>
            <div className={styles.flowLabel}>Como funciona</div>
            <div className={styles.flow}>
              {FLOW.map((step, i) => (
                <div key={i} className={styles.flowStep}>
                  <div className={styles.flowTimeline}>
                    <div className={styles.flowIcon}>{step.icon}</div>
                    {i < FLOW.length - 1 && <div className={styles.flowLine}></div>}
                  </div>
                  <div className={styles.flowContent}>
                    <span className={styles.flowText}>{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
