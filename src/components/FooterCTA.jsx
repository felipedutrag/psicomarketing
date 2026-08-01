import styles from "./FooterCTA.module.css";
import Logo from "./Logo";

export default function FooterCTA() {
  return (
    <footer className={styles.footerCTA} id="contato">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.ctaWrapper}>
          <h2 className={styles.ctaTitle}>Pare de perder pacientes por demora</h2>
          <p className={styles.ctaSubtitle}>Domine sua agenda e escale sua clínica com uma IA que atende, qualifica e agenda por você — 24 horas por dia.</p>
          <a href="#preco" className="btn-primary">Agendar Assessoria</a>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.brand}>
            <Logo />
          </div>
          
          <div className={styles.copyright}>
            <p>&copy; {new Date().getFullYear()} Psicomarketing. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
