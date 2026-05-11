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
              Quanto vale seu <span className={styles.highlight}>tempo?</span>
            </h2>
            <p className={styles.description}>
              Nossa automação não é um custo, é uma secretária de alta performance que trabalha 24h por dia, sem férias ou encargos.
            </p>
            
            <div className={styles.valuePoints}>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <strong>Setup Completo</strong>
                  <p>Configuramos toda a IA com a sua personalidade e horários da sua clínica.</p>
                </div>
              </div>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <strong>ROI Imediato</strong>
                  <p>Um único paciente novo agendado já paga meses da ferramenta.</p>
                </div>
              </div>
              <div className={styles.point}>
                <div className={styles.pointIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </div>
                <div>
                  <strong>Plano de Ativação</strong>
                  <p>Sua primeira sessão de ajuste e ativação está inclusa no valor mensal.</p>
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
