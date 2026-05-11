import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CopySection from "@/components/CopySection";
import WebsiteService from "@/components/WebsiteService";
import GoogleAdsService from "@/components/GoogleAdsService";
import WhatsappAutomation from "@/components/WhatsappAutomation";
import PricingSection from "@/components/PricingSection";
import FooterCTA from "@/components/FooterCTA";
import SecurityEthics from "@/components/SecurityEthics";

export default function Home() {
  return (
      <main>
        <Header />
        <Hero />
        <CopySection />
        <WhatsappAutomation />
        {/* <WebsiteService /> */}
        {/* <GoogleAdsService /> */}
        <PricingSection />
        <SecurityEthics />
        <FooterCTA />
      </main>
  );
}
