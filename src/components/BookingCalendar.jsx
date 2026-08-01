"use client";

import { useState, useEffect } from "react";
import styles from "./BookingCalendar.module.css";

export default function BookingCalendar({ onSelect }) {
  const [slots, setSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentDateIdx, setCurrentDateIdx] = useState(0);

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    setLoadingSlots(true);
    try {
      const res = await fetch("/api/cal/slots?days=14");
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    } catch (e) {
      console.error("Erro ao buscar slots:", e);
    } finally {
      setLoadingSlots(false);
    }
  }

  const availableDates = Object.keys(slots);
  const currentDate = availableDates[currentDateIdx];
  const currentSlots = currentDate ? slots[currentDate] : [];

  function formatDay(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  }

  const handleSelect = (time) => {
    setSelectedSlot(time);
    if (onSelect) onSelect(time);
  };

  return (
    <div className={styles.calendarContainer}>
      <h3 className={styles.title}>Agende sua instalação</h3>
      <p className={styles.subtitle}>Escolha o melhor dia e horário para colocarmos sua IA no ar</p>

      {loadingSlots ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Buscando agenda...</p>
        </div>
      ) : (
        <div className={styles.calendarGrid}>
          <div className={styles.dateNav}>
            <button 
              className={styles.navBtn} 
              disabled={currentDateIdx === 0} 
              onClick={() => setCurrentDateIdx(p => p - 1)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className={styles.currentDate}>
              <h4>{formatDay(currentDate)}</h4>
            </div>
            <button 
              className={styles.navBtn} 
              disabled={currentDateIdx >= availableDates.length - 1} 
              onClick={() => setCurrentDateIdx(p => p + 1)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div className={styles.slotsGrid}>
            {currentSlots.map((slot, i) => {
              const time = new Date(slot.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div 
                  key={i} 
                  className={`${styles.slotItem} ${selectedSlot === slot.time ? styles.slotSelected : ""}`} 
                  onClick={() => handleSelect(slot.time)}
                >
                  {time}
                </div>
              );
            })}
            {currentSlots.length === 0 && !loadingSlots && (
              <div className={styles.emptySlots}>Nenhum horário disponível.</div>
            )}
          </div>
          
          <div className={styles.pricingSummary}>
            <div className={styles.priceInfo}>
              <span className={styles.priceLabel}>Investimento Mensal <br /> <small>(Cancele quando quiser)</small></span>
              <div className={styles.priceValue}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>99</span>
                <span className={styles.period}>/mês</span>
              </div>
            </div>
            <button 
              className={`btn-primary ${styles.submitBtn}`} 
              disabled={!selectedSlot}
              onClick={() => {
                localStorage.setItem('selectedSlot', selectedSlot);
                window.location.href = '/checkout';
              }}
            >
              {selectedSlot ? "Confirmar Horário e Continuar →" : "Escolha um horário acima"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
