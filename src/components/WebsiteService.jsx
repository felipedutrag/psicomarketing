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

        </div>

        <div className={styles.visual}>
          <div className={styles.mockupContainer}>

            {/* LAPTOP MOCKUP */}
            <div className={styles.laptopMockup}>
              <div className={styles.screen}>
                {/* Browser chrome */}
                <div className={styles.browserBar}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <div className={styles.urlBar}>dra.anasilva.com.br</div>
                </div>

                {/* Mini-site content */}
                <div className={styles.sitePreview}>
                  {/* Nav */}
                  <div className={styles.siteHeader}>
                    <div className={styles.siteLogo}>
                      <div className={styles.logoMark}></div>
                      <div className={styles.logoText}></div>
                    </div>
                    <div className={styles.siteNav}>
                      <span></span>
                      <span></span>
                      <span className={styles.navCta}></span>
                    </div>
                  </div>

                  {/* Hero */}
                  <div className={styles.siteHero}>
                    <div className={styles.heroAvatar}>
                      <div className={styles.avatarRing}></div>
                      <div className={styles.avatarImg}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    </div>
                    <div className={styles.heroText}>
                      <div className={styles.heroEyebrow}></div>
                      <div className={styles.heroTitle}></div>
                      <div className={styles.heroSubtitle}></div>
                      <div className={styles.heroSubtitle} style={{width: '75%'}}></div>
                      <div className={styles.heroBtn}></div>
                    </div>
                  </div>

                  {/* Cards de serviço */}
                  <div className={styles.siteContent}>
                    {[
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    ].map((icon, i) => (
                      <div key={i} className={styles.siteCard}>
                        <div className={styles.cardIcon}>{icon}</div>
                        <div className={styles.cardLine}></div>
                        <div className={styles.cardLine} style={{width: '70%'}}></div>
                      </div>
                    ))}
                  </div>

                  {/* Depoimento */}
                  <div className={styles.testimonialStrip}>
                    <div className={styles.testimonialQuote}>"</div>
                    <div className={styles.testimonialLines}>
                      <div className={styles.tLine}></div>
                      <div className={styles.tLine} style={{width:'65%'}}></div>
                    </div>
                    <div className={styles.testimonialStars}>★★★★★</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* PHONE MOCKUP */}
            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                {/* Phone nav */}
                <div className={styles.phoneHeader}>
                  <div className={styles.siteLogo}>
                    <div className={styles.logoMark}></div>
                  </div>
                  <div className={styles.hamburger}></div>
                </div>

                {/* Phone hero */}
                <div className={styles.phoneHero}>
                  <div className={styles.phoneAvatar}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className={styles.heroTitle}></div>
                  <div className={styles.heroSubtitle}></div>
                  <div className={styles.heroBtn}></div>
                </div>

                {/* Phone cards */}
                <div className={styles.phoneContent}>
                  <div className={styles.siteCard}>
                    <div className={styles.cardLine}></div>
                    <div className={styles.cardLine} style={{width:'60%'}}></div>
                  </div>
                  <div className={styles.siteCard}>
                    <div className={styles.cardLine}></div>
                    <div className={styles.cardLine} style={{width:'80%'}}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
