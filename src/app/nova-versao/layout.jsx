import "./theme.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function NovaVersaoLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
