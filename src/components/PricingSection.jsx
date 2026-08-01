import styles from "./PricingSection.module.css";
import BookingCalendar from "./BookingCalendar";

export default function PricingSection() {
  return (
    <section className={styles.pricingSection} id="preco">
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          
          <div className={styles.content}>
            <div className={styles.badge}>Investimento Estratégico</div>
            <h2 className={styles.title}>
              Quanto vale o seu <span className={`${styles.highlight} ${styles.mobileBreak}`}>tempo hoje?</span>
            </h2>
            <p className={styles.description}>
              A automação não é gasto, é sua secretária de alta performance trabalhando 24h por dia, sem folga, sem encargos e sem reclamar.
            </p>
            
            <div className={styles.valuePoints}>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <strong>Setup e Assessoria Estratégica</strong>
                  <p>Mapeamos a melhor forma de personalizar sua IA de acordo com a sua clínica.</p>
                </div>
              </div>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <strong>Alto Retorno (ROI)</strong>
                  <p>Um único paciente novo agendado já paga meses de assinatura — o retorno sobre o seu investimento é imediato.</p>
                </div>
              </div>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </div>
                <div>
                  <strong>Personalização Completa</strong>
                  <p>Sua IA moldada à sua abordagem clínica, com o tom de voz e a integração de agenda que você precisar.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.pricingWrapper}>
            <BookingCalendar />
          </div>

        </div>
      </div>
    </section>
  );
}
