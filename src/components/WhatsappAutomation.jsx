import styles from "./WhatsappAutomation.module.css";

export default function WhatsappAutomation() {
  return (
    <section className={styles.whatsappService} id="automacao">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.content}>
          <div className={styles.badge}>Nosso Carro-Chefe</div>
          <h2 className={styles.title}>
            Sua IA atende, <span className={styles.highlight}>tria e agenda</span> por você
          </h2>
          <p className={styles.description}>
            Psicólogos perdem até 40% dos contatos porque demoram a responder durante as sessões. Ative uma secretária digital implacável no seu próprio WhatsApp.
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
                <strong>Respostas Imediatas</strong>
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
            <li>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2l8 9v7l4 3v-10L22 3z"/>
                </svg>
              </div>
              <div>
                <strong>Triagem de Leads Qualificados</strong>
                <p>A IA qualifica pacientes reais e ignora curiosos, blindando o seu tempo clínico.</p>
              </div>
            </li>
          </ul>

        </div>

        <div className={styles.visual}>
          <div className={styles.phoneFrame}>
            <div className={styles.chatHeader}>
              <div className={styles.avatar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.5}}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className={styles.chatInfo}>
                <h4>Clínica de Psicologia</h4>
                <p>Online</p>
              </div>
            </div>
            <div className={styles.chatBody}>
              <div className={`${styles.bubble} ${styles.received}`}>
                Olá! Queria marcar uma sessão pra hoje, tipo... agora? Sei que é em cima da hora, mas o surto veio forte. 😅
                <span className={styles.time}>10:00</span>
              </div>
              <div className={`${styles.bubble} ${styles.sent}`}>
                Olá! Respire fundo, estamos aqui para ajudar. O Dr. está em sessão no momento, mas eu consigo agilizar seu acolhimento agora mesmo.
                <span className={styles.time}>10:00</span>
              </div>
              <div className={`${styles.bubble} ${styles.sent}`}>
                Para esses momentos, o ideal é vermos o horário mais próximo possível, pode ser? O valor da sessão é R$ 250. Vamos ver a agenda?
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
              <span className={styles.inputPlaceholder}>Mensagem...</span>
              <div className={styles.sendIcon}>➤</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

