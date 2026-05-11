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
            <span className={styles.highlight}>converte</span> enquanto você atende
          </h1>
          <p className={styles.subtitle}>
            Pare de perder pacientes enquanto você está em sessão. Uma IA humanizada trabalhando 24h por você.
          </p>
          <div className={styles.actions}>
            <a href="#automacao" className="btn-primary">
              Conhecer a Automação
            </a>
          </div>
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
