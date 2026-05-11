import styles from "./CopySection.module.css";

export default function CopySection() {
  return (
    <section className={styles.copySection} id="copy">
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          
          <div className={styles.painPoints}>
            <h2 className={styles.title}>
              O paciente de hoje <span className={styles.highlight}>não tem paciência</span> para esperar.
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Demora na resposta:</strong> Você está em sessão e leva horas para responder. O paciente procura o próximo da lista do Google.</p>
              </li>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Alergia a "preço por direct":</strong> Passar o dia inteiro respondendo a mesma coisa, apenas para o contato sumir ao saber o valor da consulta.</p>
              </li>
              <li className={styles.listItem}>
                <div className={styles.icon}>✕</div>
                <p><strong>Desorganização:</strong> Tentativas falhas de alinhar agendas, mensagens perdidas e reagendamentos que tomam sua energia vital.</p>
              </li>
            </ul>
          </div>

          <div className={styles.solution}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>A Solução: IA Humanizada no WhatsApp</h3>
              <p className={styles.cardText}>
                Nós transformamos seu WhatsApp em uma <strong>máquina de triagem e agendamento</strong>, trabalhando por você 24 horas por dia.
              </p>
              <p className={styles.cardText}>
                A Inteligência Artificial tem a sua personalidade: acolhe, responde dúvidas, filtra "curiosos" e já insere o paciente na sua agenda.
              </p>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>1 min</span>
                  <span className={styles.statLabel}>Tempo de Resposta</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>-80%</span>
                  <span className={styles.statLabel}>Tempo Gasto no Celular</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
