import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.content}`}>
        <div className={styles.badge}>Marketing Exclusivo para Psicólogos</div>
        <h1 className={styles.title}>
          Lote sua agenda com <br />
          <span className={styles.highlight}>pacientes particulares</span>
        </h1>
        <p className={styles.subtitle}>
          Construímos sua autoridade digital através de sites premium, Google Ads e automação. 
          Sem ferir o código de ética. Sem depender de convênios.
        </p>
        <div className={styles.actions}>
          <a href="#contato" className="btn-primary">
            Quero lotar minha agenda
          </a>
          <a href="#servicos" className="btn-outline">
            Ver Serviços
          </a>
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
