import Header from "@/components/Header";
import AutomacaoCheckout from "@/components/AutomacaoCheckout";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Checkout | Numbly",
  description: "Finalize a contratação da sua Automação de WhatsApp com IA.",
};

export default function CheckoutPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.main}>
        <AutomacaoCheckout />
      </main>
      <footer style={{ textAlign: "center", padding: "30px", color: "#333", fontSize: "0.8rem" }}>
        © {new Date().getFullYear()} Numbly. Todos os direitos reservados.
      </footer>
    </div>
  );
}
