import styles from "./Hero.module.css";
import DoctoraliaAgenda from "./DoctoraliaAgenda";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.heroWrapper}`}>
        <div className={styles.content}>
          <div className={styles.badge}>Inteligência Artificial para Psicólogos</div>
          <h1 className={styles.title}>
            Sua clínica com <br />
            <span className={styles.highlight}>atendimento 24h</span>
          </h1>
          <p className={styles.subtitle}>
            Pare de perder pacientes enquanto você está em sessão. Implementamos uma Secretária de IA no seu WhatsApp que acolhe, tira dúvidas e agenda consultas automaticamente.
          </p>
          <div className={styles.actions}>
            <a href="#automacao" className="btn-primary">
              Conhecer a Automação
            </a>
            <a href="#portfolio" className="btn-outline">
              Ver Portfólio
            </a>
          </div>
        </div>

        <div className={styles.agendaWrapper}>
          <DoctoraliaAgenda />
        </div>
      </div>
      
      <div className={styles.scrollIndicator}>
        <div className={styles.mouse}>
          <div className={styles.wheel}></div>
        </div>
      </div>
    </section>
  );
}
