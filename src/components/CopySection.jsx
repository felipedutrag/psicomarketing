import styles from "./CopySection.module.css";

export default function CopySection() {
  return (
    <section className={styles.copySection} id="copy">
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          
          <div className={styles.painPoints}>
            <h2 className={styles.title}>
              A psicologia moderna exige mais que apenas <span className={styles.highlight}>indicações</span>.
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Cansado de depender de planos de saúde?</strong> Sessões mal remuneradas que esgotam sua energia e limitam seu faturamento.</p>
              </li>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Agenda instável?</strong> Semanas lotadas seguidas de buracos enormes e imprevisibilidade financeira.</p>
              </li>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Medo de ferir a ética do CRP?</strong> Dificuldade em fazer marketing sem parecer "vendedor" ou antiético.</p>
              </li>
            </ul>
          </div>

          <div className={styles.solution}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>A Solução: Captação Ativa & Ética</h3>
              <p className={styles.cardText}>
                Nossa metodologia é baseada em <strong>posicionamento de autoridade</strong>. Não fazemos dancinhas ou promessas milagrosas.
              </p>
              <p className={styles.cardText}>
                Construímos um funil de captação onde <strong>o paciente ideal encontra você</strong> no exato momento em que busca ajuda profissional.
              </p>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Alinhado ao CRP</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>+300%</span>
                  <span className={styles.statLabel}>Valor Percebido</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
