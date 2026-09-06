# 🚀 Psicomarketing — B2B Lead Scraping & AI-Driven WhatsApp Outreach Engine

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Maps_Scraper-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white" alt="Google Maps" />
  <img src="https://img.shields.io/badge/WhatsApp_Web.js-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Web" />
  <img src="https://img.shields.io/badge/Multi--LLM_Fallback-7928CA?style=for-the-badge&logo=openai&logoColor=white" alt="Multi-LLM" />
</p>

---

## 📌 Overview

**Psicomarketing Dashboard** is an end-to-end B2B prospecting, lead generation, and automated messaging platform tailored for clinical psychologists, therapists, and healthcare clinics.

The system orchestrates Google Maps business scraping, cascades AI message customization (Gemini 3.5 Flash → NVIDIA Nemotron → Groq Llama 3.3), and operates headless WhatsApp Web dispatch queues with anti-ban delays and business-hour scheduling.

---

## ✨ Key Features

- 🔍 **Google Maps Prospecting:** Automated extraction of clinic names, WhatsApp numbers, websites, and addresses across multiple cities.
- 🤖 **Cascading Multi-LLM Personalization:** Generates highly tailored, professional outreach pitches with automated provider failovers.
- 📱 **Headless WhatsApp Dispatch:** Background execution via Puppeteer (`whatsapp-web.js`) that persists even when the browser is closed.
- 🛡️ **Anti-Ban Architecture:** Dynamic jitter delays between messages and configurable daily dispatch windows.
- 📊 **Real-Time Operational Analytics:** Visual delivery rates, response tracking, and lead lifecycle indicators.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router, Server Actions) |
| **Language** | TypeScript |
| **Scraping & Automation** | Cheerio, Puppeteer, `whatsapp-web.js` |
| **Artificial Intelligence** | Google Gemini, NVIDIA AI, Groq SDK |
| **Persistence & Cache** | Redis, Notion API Client |

---

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/felipedutrag/psicomarketing.git
cd psicomarketing

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 👤 Author

Developed by **Felipe Dutra**  
- **GitHub:** [@felipedutrag](https://github.com/felipedutrag)  
- **Email:** [felipedutra@outlook.com](mailto:felipedutra@outlook.com)