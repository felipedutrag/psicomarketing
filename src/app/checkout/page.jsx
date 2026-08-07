import { Suspense } from "react";
import { MinimalHeader } from "@/components/minimal-header";
import { PlanCalculator } from "@/components/plan-calculator";
import AutomacaoCheckout from "@/components/AutomacaoCheckout";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Checkout | Psicomarketing",
  description: "Monte seu plano com a calculadora e finalize a contratação da sua Automação de WhatsApp com IA.",
};

export default function CheckoutPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="max-w-7xl mx-auto pt-4 px-4">
        <MinimalHeader />
      </div>
      <main className={styles.main}>
        <Suspense fallback={<div style={{ padding: "50px", textAlign: "center", color: "#fff" }}>Carregando checkout...</div>}>
          <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Monte seu Plano
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2">
                Escolha os conectores e finalize a contratação da sua automação de WhatsApp com IA.
              </p>
            </div>
            <PlanCalculator />
          </section>

          <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <h2 className="text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-300 text-center">
                ou finalize sua reserva de vaga (fluxo rápido)
              </h2>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <AutomacaoCheckout />
          </section>
        </Suspense>
      </main>
      <footer style={{ textAlign: "center", padding: "30px", color: "#333", fontSize: "0.8rem" }}>
        © {new Date().getFullYear()} Psicomarketing. Todos os direitos reservados.
      </footer>
    </div>
  );
}
