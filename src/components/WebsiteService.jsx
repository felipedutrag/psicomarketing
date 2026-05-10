import styles from "./WebsiteService.module.css";

export default function WebsiteService() {
  return (
    <section className={styles.websiteService} id="servicos">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.content}>
          <div className={styles.badge}>Serviço 01</div>
          <h2 className={styles.title}>
            O seu <span className={styles.highlight}>Consultório Digital</span>
          </h2>
          <p className={styles.description}>
            Seu site é a primeira impressão do paciente. Criamos plataformas luxuosas, focadas na experiência do usuário e otimizadas para conversão imediata.
          </p>
          
          <ul className={styles.features}>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span><strong>Design Premium:</strong> Estética que transmite confiança e acolhimento.</span>
            </li>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span><strong>Alta Velocidade:</strong> Carregamento em menos de 2 segundos.</span>
            </li>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span><strong>SEO Otimizado:</strong> Estruturado para ser encontrado organicamente no Google.</span>
            </li>
          </ul>

          <a href="#contato" className={`btn-primary ${styles.btn}`}>Ver Modelos de Sites</a>
        </div>

        <div className={styles.visual}>
          <div className={styles.mockupContainer}>
            <div className={styles.laptopMockup}>
              <div className={styles.screen}>
                <div className={styles.browserBar}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
                <div className={styles.sitePreview}>
                  <div className={styles.siteHeader}>
                    <div className={styles.siteLogo}></div>
                    <div className={styles.siteNav}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className={styles.siteHero}>
                    <div className={styles.heroTitle}></div>
                    <div className={styles.heroSubtitle}></div>
                    <div className={styles.heroBtn}></div>
                  </div>
                  <div className={styles.siteContent}>
                    <div className={styles.siteCard}></div>
                    <div className={styles.siteCard}></div>
                    <div className={styles.siteCard}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                <div className={styles.phoneHeader}>
                  <div className={styles.siteLogo}></div>
                  <div className={styles.hamburger}></div>
                </div>
                <div className={styles.phoneHero}>
                  <div className={styles.heroTitle}></div>
                  <div className={styles.heroSubtitle}></div>
                  <div className={styles.heroBtn}></div>
                </div>
                <div className={styles.phoneContent}>
                  <div className={styles.siteCard}></div>
                  <div className={styles.siteCard}></div>
                </div>              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
