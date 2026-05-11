import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CopySection from "@/components/CopySection";
import WebsiteService from "@/components/WebsiteService";
import Portfolio from "@/components/Portfolio";
import GoogleAdsService from "@/components/GoogleAdsService";
import WhatsappAutomation from "@/components/WhatsappAutomation";
import Schedule from "@/components/Schedule";
import FooterCTA from "@/components/FooterCTA";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <CopySection />
      <WhatsappAutomation />
      <WebsiteService />
      <Portfolio />
      <GoogleAdsService />
      <Schedule />
      <FooterCTA />
    </main>
  );
}
