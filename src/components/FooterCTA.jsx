import styles from "./FooterCTA.module.css";
import Logo from "./Logo";

export default function FooterCTA() {
  return (
    <footer className={styles.footerCTA} id="contato">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.ctaWrapper}>
          <h2 className={styles.ctaTitle}>Automatize seu crescimento</h2>
          <p className={styles.ctaSubtitle}>Domine sua agenda e escale sua clínica com inteligência artificial.</p>
          <a href="#preco" className="btn-primary">Agendar Assessoria</a>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.brand}>
            <Logo />
          </div>
          
          <div className={styles.copyright}>
            <p>&copy; {new Date().getFullYear()} Numbly. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
