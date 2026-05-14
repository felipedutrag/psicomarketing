"use client";

import styles from "./Logo.module.css";

export default function Logo({ centered = false }) {
  return (
    <div className={`${styles.logoWrapper} ${centered ? styles.centered : ""}`} onClick={() => window.location.href = '/'}>
      <div className={styles.logoIcon}>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dark Obsidian Background Shadow */}
          <path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" fill="#050505" fillOpacity="0.4"/>
          
          {/* Outer Frame */}
          <path d="M24 2L46 13V35L24 46L2 35V13L24 2Z" stroke="url(#gold_liquid_logo)" strokeWidth="0.5" strokeLinejoin="round" opacity="0.3"/>
          
          {/* Sacred Geometry Diamond */}
          <path d="M24 6L40 24L24 42L8 24L24 6Z" stroke="url(#gold_liquid_logo)" strokeWidth="0.8" opacity="0.6"/>
          
          {/* The Aggressive Psi Symbol */}
          <path d="M24 14V34" stroke="url(#gold_liquid_logo)" strokeWidth="2.5" strokeLinecap="butt"/>
          <path d="M24 10L27 14H21L24 10Z" fill="url(#gold_liquid_logo)"/>
          
          <path d="M14 20C14 20 14 30 24 30C34 30 34 20 34 20" stroke="url(#gold_liquid_logo)" strokeWidth="2.2" strokeLinecap="square"/>
          
          <path d="M12 18L14 21L16 18H12Z" fill="url(#gold_liquid_logo)"/>
          <path d="M32 18L34 21L36 18H32Z" fill="url(#gold_liquid_logo)"/>
          
          <circle cx="24" cy="24" r="1.5" fill="url(#gold_liquid_logo)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
          </circle>

          <defs>
            <linearGradient id="gold_liquid_logo" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFD700"/>
              <stop offset="0.4" stopColor="#C5A059"/>
              <stop offset="0.7" stopColor="#8A6E35"/>
              <stop offset="1" stopColor="#D4AF37"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={styles.brandName}>Psico<span className={styles.highlight}>marketing</span></span>
    </div>
  );
}
