import styles from "./FooterCTA.module.css";
import Logo from "./Logo";

export default function FooterCTA() {
  return (
    <footer className={styles.footerCTA} id="contato">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.ctaWrapper}>
          <h2 className={styles.ctaTitle}>Automatize seu crescimento</h2>
          <p className={styles.ctaSubtitle}>Recupere seu tempo e multiplique seus pacientes com IA.</p>
          <a href="https://wa.me/5511999999999" className="btn-primary">Falar com um Especialista</a>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.brand}>
            <Logo />
            <p>Inteligência artificial para clínicas e profissionais de elite.</p>
          </div>
          
          <nav className={styles.nav}>
            <a href="#">Início</a>
            <a href="#automacao">Automação</a>
            <a href="#servicos">Serviços</a>
            <a href="mailto:contato@numbly.com.br">Contato</a>
          </nav>
          
          <div className={styles.copyright}>
            <p>&copy; {new Date().getFullYear()} Numbly. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
