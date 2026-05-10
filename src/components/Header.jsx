import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logoWrapper}>
          <div className={styles.nanoBananaLogo}>
            <div className={styles.psiPillar}></div>
            <div className={styles.psiCurve}></div>
          </div>
          <span className={styles.brandName}>PsicoMarketing</span>
        </div>
      </div>
    </header>
  );
}
