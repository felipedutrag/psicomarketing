import styles from "./FooterCTA.module.css";

export default function FooterCTA() {
  return (
    <footer className={styles.footerCTA} id="contato">
      <div className={`container ${styles.container}`}>
        

        <div className={styles.footerLinks}>
          <div className={styles.brand}>
            <h3>PsicoMarketing</h3>
            <p>Agência premium de marketing digital para psicólogos.</p>
          </div>
          
          <div className={styles.linksGroup}>
            <h4>Navegação</h4>
            <ul>
              <li><a href="#">Início</a></li>
              <li><a href="#copy">Nossa Abordagem</a></li>
              <li><a href="#servicos">Serviços</a></li>
            </ul>
          </div>
          
          <div className={styles.linksGroup}>
            <h4>Contato</h4>
            <ul>
              <li>WhatsApp: (11) 99999-9999</li>
              <li>Email: contato@psicomarketing.com.br</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>
        
        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} PsicoMarketing. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
