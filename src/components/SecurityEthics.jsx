import styles from "./SecurityEthics.module.css";

export default function SecurityEthics() {
  const points = [
    {
      title: "Não Substitui o Terapeuta",
      text: "A IA é uma ferramenta. Ela não realiza sessões, não oferece aconselhamento e não interfere no processo clínico."
    },
    {
      title: "Sem Diagnósticos, Nunca",
      text: "Nossa tecnologia é programada para não emitir diagnósticos ou opiniões clínicas. O foco é estritamente triagem e agendamento."
    },
    {
      title: "Ética e LGPD em Primeiro Lugar",
      text: "Todos os dados são tratados com sigilo absoluto, respeitando as normas do CRP e a Lei Geral de Proteção de Dados.",
    },    {
      title: "Você no Controle, Sempre",
      text: "Acompanhe todas as conversas em tempo real e assuma o atendimento manualmente a qualquer momento."
    }
  ];

  return (
    <section className={styles.securitySection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div className={styles.badge}>Segurança e Ética</div>
          <h2 className={styles.title}>
            Tecnologia que <span className={styles.highlight}>respeita os seus limites</span>
          </h2>
          <p className={styles.description}>
            Construímos uma solução ciente da sensibilidade da sua profissão. A IA atua como sua secretária — nunca como sua substituta.
          </p>
        </div>

        <div className={styles.grid}>
          {points.map((point, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className={styles.cardContent}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.warningBox}>
          <p>
            <strong>Importante:</strong> Em casos de crise ou mensagens que indiquem risco iminente, a IA é instruída a fornecer contatos de emergência (como o CVV) e alertar o profissional imediatamente.
          </p>
        </div>
      </div>
    </section>
  );
}
