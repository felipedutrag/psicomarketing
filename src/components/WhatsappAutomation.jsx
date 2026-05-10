import styles from "./WhatsappAutomation.module.css";

export default function WhatsappAutomation() {
  return (
    <section className={styles.whatsappService} id="automacao">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.content}>
          <div className={styles.badge}>Serviço 03</div>
          <h2 className={styles.title}>
            Atendimento que <span className={styles.highlight}>converte</span> enquanto você atende
          </h2>
          <p className={styles.description}>
            Psicólogos perdem até 40% dos contatos porque demoram a responder enquanto estão em sessão. Implementamos uma secretária digital inteligente no seu WhatsApp.
          </p>
          
          <ul className={styles.features}>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"/>
                  <rect width="16" height="12" x="4" y="8" rx="2"/>
                  <path d="M2 14h2"/>
                  <path d="M20 14h2"/>
                  <path d="M15 13v2"/>
                  <path d="M9 13v2"/>
                </svg>
              </div>
              <div>
                <strong>Respostas Imediatas e Humanizadas</strong>
                <p>Saudação acolhedora, explicação de valores e triagem automática.</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <div>
                <strong>Agendamento Facilitado</strong>
                <p>Integração com sua agenda, reduzindo a fricção e confirmando horários automaticamente.</p>
              </div>
            </li>
          </ul>

          <a href="#contato" className={`btn-outline ${styles.btn}`}>Ver Demonstração</a>
        </div>

        <div className={styles.visual}>
          <div className={styles.phoneFrame}>
            <div className={styles.chatHeader}>
              <div className={styles.avatar}></div>
              <div className={styles.chatInfo}>
                <h4>Clínica de Psicologia</h4>
                <p>Online</p>
              </div>
            </div>
            <div className={styles.chatBody}>
              <div className={`${styles.bubble} ${styles.received}`}>
                Olá! Gostaria de saber os valores da sessão.
                <span className={styles.time}>10:00</span>
              </div>
              <div className={`${styles.bubble} ${styles.sent}`}>
                Olá! Seja muito bem-vindo(a). Meu nome é assistente virtual da clínica. É um prazer falar com você. 🌿
                <span className={styles.time}>10:00</span>
              </div>
              <div className={`${styles.bubble} ${styles.sent}`}>
                Nossos atendimentos são focados em psicoterapia para adultos. O valor da sessão particular é R$ 250,00. Gostaria de ver os horários disponíveis para esta semana?
                <span className={styles.time}>10:00</span>
              </div>
              <div className={`${styles.bubble} ${styles.received}`}>
                Sim, por favor!
                <span className={styles.time}>10:01</span>
              </div>
              <div className={`${styles.bubble} ${styles.sent}`}>
                Perfeito. <a href="#" className={styles.link}>Clique aqui</a> para acessar nossa agenda online e escolher o melhor horário.
                <span className={styles.time}>10:01</span>
              </div>
            </div>
            <div className={styles.chatInput}>
              <span>Mensagem...</span>
              <div className={styles.sendIcon}>➤</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
