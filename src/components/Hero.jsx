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
            Pare de perder pacientes enquanto você está em sessão. Implementamos uma Secretária de IA no seu WhatsApp que acolhe, tira dúvidas e agenda consultas automaticamente.
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
