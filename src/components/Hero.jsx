import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.heroWrapper}`}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>✦</span>
            Inteligência Artificial para Psicólogos
          </div>
          <h1 className={styles.title}>
            Atendimento que <br />
            <span className={styles.highlight}>converte</span> enquanto você atende, dorme ou viaja...
          </h1>
          <p className={styles.subtitle}>
            Pare de perder pacientes enquanto você está em sessão. Sua nova Secretária de IA no WhatsApp acolhe, filtra curiosos e agenda consultas no piloto automático.
          </p>
        </div>
      </div>
      
      <div className={styles.scrollIndicator}>
        <div className={styles.mouse}>
          <div className={styles.wheel}></div>
        </div>
        <span className={styles.scrollText}>Role para descobrir</span>
      </div>
    </section>
  );
}
