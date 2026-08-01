import styles from "./Portfolio.module.css";

export default function Portfolio() {
  return (
    <section className={styles.portfolioSection} id="portfolio">
      <div className="container">
        <div className={styles.header}>
          <h2 className="section-title">Portfólio de Alta Conversão</h2>
          <p className="section-subtitle">
            Padrões de design minimalistas e sofisticados que aplicamos para blindar a autoridade dos nossos clientes. Role os sites abaixo.
          </p>
        </div>

        <div className={styles.grid}>
          
          {/* Site 1: Minimalista Clínico */}
          <div className={styles.mockup}>
            <div className={styles.browserBar}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.viewport}>
              <div className={`${styles.miniSite} ${styles.site1}`}>
                <header className={styles.msHeader}>
                  <div className={styles.msLogo}>Dra. Ana Silva</div>
                  <nav className={styles.msNav}>
                    <span>Início</span><span>Sobre</span><span>Contato</span>
                  </nav>
                </header>
                <section className={styles.msHero}>
                  <h1>Saúde mental levada a sério.</h1>
                  <p>Acolhimento profissional para ajudar você a reencontrar o seu equilíbrio emocional.</p>
                  <button className={styles.msBtn}>Agendar Sessão</button>
                </section>
                <section className={styles.msFeatures}>
                  <div className={styles.msFeatureCard}>
                    <i>🧠</i>
                    <h4>Terapia Cognitiva</h4>
                    <p>Foco em resolver problemas atuais e mudar padrões.</p>
                  </div>
                  <div className={styles.msFeatureCard}>
                    <i>🌱</i>
                    <h4>Desenvolvimento</h4>
                    <p>Crescimento pessoal e superação de traumas.</p>
                  </div>
                </section>
                <footer className={styles.msFooter}>
                  <p>© Dra. Ana Silva. CRP: 00/00000</p>
                </footer>
              </div>
            </div>
          </div>

          {/* Site 2: Dark Premium */}
          <div className={styles.mockup}>
            <div className={styles.browserBar}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.viewport}>
              <div className={`${styles.miniSite} ${styles.site2}`}>
                <header className={styles.msHeader}>
                  <div className={styles.msLogo}>Instituto Vórtex</div>
                  <nav className={styles.msNav}>
                    <span>Clínica</span><span>Especialistas</span>
                  </nav>
                </header>
                <section className={styles.msHero}>
                  <h1>Alta Performance Mental.</h1>
                  <p>Terapia especializada para líderes, executivos e profissionais sob alta pressão.</p>
                  <button className={styles.msBtn}>Inicie sua Jornada</button>
                </section>
                <section className={styles.msGrid}>
                  <div className={styles.msGridItem}></div>
                  <div className={styles.msGridItem}></div>
                  <div className={styles.msGridItem}></div>
                </section>
                <section className={styles.msContentBlock}>
                  <h3>Metodologia Baseada em Dados</h3>
                  <p>Utilizamos os mais recentes avanços da neurociência para acelerar resultados.</p>
                </section>
                <footer className={styles.msFooter}>
                  <p>Instituto Vórtex © 2026</p>
                </footer>
              </div>
            </div>
          </div>

          {/* Site 3: Warm Earthy */}
          <div className={styles.mockup}>
            <div className={styles.browserBar}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.viewport}>
              <div className={`${styles.miniSite} ${styles.site3}`}>
                <header className={styles.msHeader}>
                  <div className={styles.msLogo}>Espaço Acolher</div>
                </header>
                <section className={styles.msHero}>
                  <h1>Um espaço seguro para você ser quem é.</h1>
                  <button className={styles.msBtn}>Fale Conosco</button>
                </section>
                <section className={styles.msList}>
                  <div className={styles.msListItem}>
                    <div className={styles.msAvatar}></div>
                    <div className={styles.msListText}>
                      <h4>Psicanálise</h4>
                      <p>Mergulho profundo nas raízes do seu inconsciente.</p>
                    </div>
                  </div>
                  <div className={styles.msListItem}>
                    <div className={styles.msAvatar}></div>
                    <div className={styles.msListText}>
                      <h4>Terapia de Casal</h4>
                      <p>Mediação e reencontro para relacionamentos.</p>
                    </div>
                  </div>
                </section>
                <footer className={styles.msFooter}>
                  <p>Agende via WhatsApp</p>
                </footer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
