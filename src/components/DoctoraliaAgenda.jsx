"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./DoctoraliaAgenda.module.css";

export default function DoctoraliaAgenda() {
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [bookingStatus, setBookingStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch("/api/cal/slots?days=14");
        const data = await res.json();
        if (data.status === "success" && data.slots) {
          // O Cal.com V2 retorna data.data (slots) como um objeto Record<string, Slot[]>
          // Ex: { "2024-05-15": [{ time: "..." }, ...] }
          const formattedSlots = {};
          
          Object.keys(data.slots).forEach(dateKey => {
            const dateObj = new Date(dateKey + "T12:00:00"); // Midday to avoid TZ shifts
            const label = dateObj.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            });
            formattedSlots[label] = data.slots[dateKey];
          });
          
          setSlots(formattedSlots);
        }
      } catch (err) {
        console.error("Erro ao carregar slots:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingStatus("loading");
    try {
      const res = await fetch("/api/cal/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          start: selectedSlot.time,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingStatus("success");
      } else {
        throw new Error(data.error || "Erro ao agendar");
      }
    } catch (err) {
      setBookingStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando agenda...</div>;

  return (
    <div className={styles.agendaContainer}>
      <div className={styles.agendaHeader}>
        <h3>Agendar sessão estratégica</h3>
        <p className={styles.subtitle}>Escolha um horário para sua consultoria</p>
      </div>

      <div className={styles.datesContainer}>
        {Object.keys(slots).map((dateLabel, dayIndex) => {
          const daySlots = slots[dateLabel];
          if (!daySlots || daySlots.length === 0) return null;
          
          return (
            <div key={`${dateLabel}-${dayIndex}`} className={styles.dateColumn}>
              <div className={styles.dateLabel}>{dateLabel}</div>
              <div className={styles.slotsList}>
                {daySlots.map((slot, slotIndex) => {
                  const slotTime = slot.time || slot.start || (typeof slot === 'string' ? slot : null);
                  const dateObj = slotTime ? new Date(slotTime) : null;
                  const isValidDate = dateObj && !isNaN(dateObj.getTime());

                  return (
                    <button
                      key={`${slotTime || slotIndex}-${slotIndex}`}
                      className={styles.slotButton}
                      onClick={() => {
                        if (isValidDate) {
                          setSelectedSlot({ ...slot, time: slotTime });
                          setShowModal(true);
                        }
                      }}
                      disabled={!isValidDate}
                    >
                      {isValidDate 
                        ? dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "Indisponível"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            
            {bookingStatus === "success" ? (
              <div className={styles.success}>
                <h4>Agendamento Confirmado!</h4>
                <p>Você receberá um e-mail com o link da sala em instantes.</p>
                <button className="btn-primary" onClick={() => setShowModal(false)}>Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleBook} className={styles.form}>
                <h4>Confirmar Agendamento</h4>
                <p className={styles.slotDetail}>
                  {new Date(selectedSlot.time).toLocaleString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                />
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.input}
                />
                
                {bookingStatus === "error" && <p className={styles.error}>{errorMessage}</p>}
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={bookingStatus === "loading"}
                >
                  {bookingStatus === "loading" ? "Processando..." : "Confirmar Horário"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
