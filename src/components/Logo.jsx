"use client";

import styles from "./Logo.module.css";

export default function Logo({ centered = false }) {
  return (
    <div className={`${styles.logoWrapper} ${centered ? styles.centered : ""}`} onClick={() => window.location.href = '/'}>
      <div className={styles.logoIcon}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 5V35" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round"/>
          <path d="M10 15C10 15 10 28 20 28C30 28 30 15 30 15" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="20" cy="5" r="3" fill="var(--accent-primary)"/>
          <path d="M35 10L32 13M35 10L38 7M35 10L38 13M35 10L32 7" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <defs>
            <linearGradient id="paint0_linear" x1="20" y1="5" x2="20" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C5A059"/>
              <stop offset="1" stopColor="#8A6E35"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={styles.brandName}>Num<span className={styles.highlight}>bly</span></span>
    </div>
  );
}
