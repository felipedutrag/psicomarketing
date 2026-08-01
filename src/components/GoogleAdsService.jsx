import styles from "./GoogleAdsService.module.css";

export default function GoogleAdsService() {
  return (
    <section className={styles.adsService}>
      <div className={`container ${styles.container}`}>
        
        <div className={styles.visual}>
          <div className={styles.searchCard}>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <span className={styles.searchText}>psicólogo perto de mim</span>
            </div>
            
            <div className={styles.adResult}>
              <div className={styles.adBadge}>Patrocinado</div>
              <h4 className={styles.adTitle}>Psicologia Clínica | Agende sua Sessão</h4>
              <p className={styles.adLink}>www.seusite.com.br</p>
              <p className={styles.adDesc}>
                Atendimento presencial e online. Especialista em ansiedade e depressão. 
                Abordagem acolhedora e focada no seu bem-estar.
              </p>
              <div className={styles.adExtensions}>
                <span>📍 Av. Paulista, 1000</span>
                <span>📞 (11) 99999-9999</span>
              </div>
            </div>

            <div className={styles.adResult}>
              <div className={styles.adBadge}>Patrocinado</div>
              <h4 className={styles.adTitle}>Terapia Online Especializada</h4>
              <p className={styles.adLink}>www.seusite.com.br/online</p>
              <p className={styles.adDesc}>
                Sessões por vídeo com total sigilo e conforto. Comece sua jornada 
                de autoconhecimento hoje mesmo.
              </p>
              <div className={styles.adExtensions}>
                <span>🌐 Atendimento em todo Brasil</span>
              </div>
            </div>
          </div>
          
          <div className={styles.floatingGraph}>
            <div className={styles.graphHeader}>
              <span className={styles.graphLabel}>Cliques no Anúncio</span>
              <span className={styles.graphTrend}>↑ 214%</span>
            </div>
            <div className={styles.graphBars}>
              <div className={styles.graphBarWrap}>
                <div className={styles.graphBar} style={{ height: '35%' }}></div>
              </div>
              <div className={styles.graphBarWrap}>
                <div className={styles.graphBar} style={{ height: '55%' }}></div>
              </div>
              <div className={styles.graphBarWrap}>
                <div className={styles.graphBar} style={{ height: '72%' }}></div>
              </div>
              <div className={styles.graphBarWrap}>
                <div className={`${styles.graphBar} ${styles.graphBarHighlight}`} style={{ height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.badge}>Serviço 02</div>
          <h2 className={styles.title}>
            Pacientes qualificados procurando por você <span className={styles.highlight}>agora mesmo</span>
          </h2>
          <p className={styles.description}>
            O Google Ads é a máquina de aquisição mais poderosa para psicólogos. Colocamos o seu nome no topo das buscas exatamente no momento em que o paciente procura ajuda profissional.
          </p>
          
          <ul className={styles.features}>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="22" x2="18" y1="12" y2="12"/>
                  <line x1="6" x2="2" y1="12" y2="12"/>
                  <line x1="12" x2="12" y1="6" y2="2"/>
                  <line x1="12" x2="12" y1="22" y2="18"/>
                </svg>
              </div>
              <div>
                <strong>Segmentação Cirúrgica</strong>
                <p>Anúncios direcionados para sua cidade, bairro ou para o Brasil inteiro, se você atende online.</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                </svg>
              </div>
              <div>
                <strong>Marketing Ético (CRP)</strong>
                <p>Zero promessas de cura, zero sensacionalismo. Apenas posicionamento estratégico e informativo, dentro do código de ética.</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </section>
  );
}
