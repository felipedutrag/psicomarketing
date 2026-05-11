"use client";

import styles from "./Logo.module.css";

export default function Logo({ centered = false }) {
  return (
    <div className={`${styles.logoWrapper} ${centered ? styles.centered : ""}`} onClick={() => window.location.href = '/'}>
      <div className={styles.logoIcon}>
        <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Architectural Frame */}
          <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="url(#gold_grad)" strokeWidth="1" strokeLinejoin="round" opacity="0.5"/>
          
          {/* Minimalist Psi */}
          <path d="M20 12V30" stroke="url(#gold_grad)" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 18C14 18 14 26 20 26C26 26 26 18 26 18" stroke="url(#gold_grad)" strokeWidth="1.5" strokeLinecap="round"/>
          
          {/* Top Diamond Point */}
          <path d="M20 2L24 6L20 10L16 6L20 2Z" fill="url(#gold_grad)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
          </path>

          <defs>
            <linearGradient id="gold_grad" x1="5" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F1D39B"/>
              <stop offset="0.5" stopColor="#C5A059"/>
              <stop offset="1" stopColor="#8A6E35"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={styles.brandName}>Num<span className={styles.highlight}>bly</span></span>
    </div>
  );
}
