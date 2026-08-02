import { Suspense } from "react";
import { MinimalHeader } from "@/components/minimal-header";
import AutomacaoCheckout from "@/components/AutomacaoCheckout";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Checkout | Psicomarketing",
  description: "Finalize a contratação da sua Automação de WhatsApp com IA.",
};

export default function CheckoutPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="max-w-7xl mx-auto pt-4 px-4">
        <MinimalHeader />
      </div>
      <main className={styles.main}>
        <Suspense fallback={<div style={{ padding: "50px", textAlign: "center", color: "#fff" }}>Carregando checkout...</div>}>
          <AutomacaoCheckout />
        </Suspense>
      </main>
      <footer style={{ textAlign: "center", padding: "30px", color: "#333", fontSize: "0.8rem" }}>
        © {new Date().getFullYear()} Psicomarketing. Todos os direitos reservados.
      </footer>
    </div>
  );
}
