import styles from "./Header.module.css";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <Logo centered />
      </div>
    </header>
  );
}
