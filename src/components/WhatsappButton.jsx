"use client";

import styles from "./WhatsappButton.module.css";

const WHATSAPP_NUMBER = "5511972667778";
const WHATSAPP_MESSAGE = "Olá! Quero testar a IA de atendimento no WhatsApp agora.";

export default function WhatsappButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsappButton}
      aria-label="Testar agora no WhatsApp"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.19h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.61-.6-2.84-1.23-4.69-4.1-4.83-4.29-.14-.2-1.16-1.54-1.16-2.93 0-1.4.73-2.08 1-2.36.27-.28.58-.35.78-.35.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.01.9 2.16.07.14.11.32.02.51-.09.2-.14.32-.27.49-.14.17-.28.38-.4.51-.14.14-.28.3-.12.58.16.28.72 1.19 1.55 1.93 1.07.95 1.96 1.25 2.24 1.39.28.14.44.12.61-.07.16-.19.7-.82.89-1.1.19-.28.38-.23.63-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36Z"/>
      </svg>
      <span className={styles.label}>Teste agora</span>
    </a>
  );
}
