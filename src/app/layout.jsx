import { Plus_Jakarta_Sans, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata = {
  title: "Psicomarketing | Inteligência Artificial e Alta Performance para Psicólogos",
  description: "Aumente sua conversão e lote sua agenda com IA Humanizada no WhatsApp. Sites luxuosos e tráfego estratégico para psicólogos de elite.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${mono.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  try {
    var storageKey = "psicomarketing-theme";
    var stored = localStorage.getItem(storageKey);
    var resolved = stored === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
