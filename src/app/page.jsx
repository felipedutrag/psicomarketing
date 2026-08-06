import { MinimalHeader } from "@/components/minimal-header";
import { BotFlowScene } from "@/components/bot-flow-scene";
import { FeatureTabs } from "@/components/feature-tabs";
import { LiveVoiceAgentDemo } from "@/components/live-voice-agent-demo";
import { StartVoiceButton } from "@/components/start-voice-button";
import { ProcessTimeline } from "@/components/process-timeline";
import { ComparisonTable } from "@/components/comparison-table";
import { PlanCalculator } from "@/components/plan-calculator";
import { MinimalFooter } from "@/components/minimal-footer";
import { siteContent as content } from "@/content/site-content";
import { SectionBadge } from "@/components/section-badge";
import {
  Boxes,
  Workflow,
  Scale,
  Coins,
  Sparkles,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Home({ searchParams }) {
  // Ler parâmetros nome e id da URL
  const params = await searchParams
  const urlParams = {
    nome: params?.nome || null,
    id: params?.id || null
  };
  return (
    <main className="site-scope relative min-h-screen overflow-x-clip bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-60 pointer-events-none" />

      {/* Top Ambient Light Orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Middle Right Ambient Glow */}
      <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      {/* Bottom Ambient Glow */}
      <div className="absolute bottom-20 -left-40 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-14 px-3 sm:px-4 pt-4 pb-4 md:px-8 md:pt-6 md:pb-8 lg:gap-20">
        <MinimalHeader />

        {/* Hero & Calendar Section */}
        <section className="flex flex-col gap-6 sm:gap-10 pt-2">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center space-y-3 pt-0.5 sm:pt-1.5 md:pt-2 pb-4 sm:pb-6 md:pb-8">
            <SectionBadge icon={Sparkles} className="self-center">
              {content.heroBadge}
            </SectionBadge>
            <h1 className="text-2xl sm:text-3xl leading-tight font-semibold md:text-5xl max-w-[24ch] mx-auto text-center">
              Sua secretária de IA com <br /><span className="text-indigo-600 dark:text-indigo-400 font-bold underline underline-offset-4 decoration-primary/30">super poderes</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              {content.heroDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-0">
              <StartVoiceButton label={content.primaryCtaLabel} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <HeartPulse className="size-3.5 text-indigo-500" />
                Feito para psicólogos
              </span>
              <span aria-hidden className="hidden sm:inline text-zinc-300 dark:text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-indigo-500" />
                WhatsApp + Google Calendar
              </span>
              <span aria-hidden className="hidden sm:inline text-zinc-300 dark:text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-indigo-500" />
                Zero conflitos de agenda
              </span>
            </div>
          </div>

          <Card className="w-full overflow-hidden border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 md:border-zinc-200/90 md:bg-zinc-100/70 md:dark:border-zinc-800/90 md:dark:bg-zinc-900/50">
            <CardContent className="p-0">
              <BotFlowScene />
            </CardContent>
          </Card>
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Live Voice Agent Interactive Demo - Mobile Only (Before Modulos) */}
        <section id="live-demo-mobile" className="block space-y-4 scroll-mt-24 md:hidden">
          <LiveVoiceAgentDemo placement="mobile" />
        </section>

        {/* Interactive Connectors Ecosystem Workspace */}
        <section id="modulos" className="space-y-4 scroll-mt-24">
          <div className="space-y-2.5 sm:space-y-3">
            <SectionBadge icon={Boxes}>{content.connectorsBadge}</SectionBadge>
            <h2 className="max-w-[22ch] text-xl sm:text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
              {content.connectorsTitle}
            </h2>
            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              {content.connectorsDescription}
            </p>
          </div>
          <FeatureTabs plugins={content.connectors} />
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Live Voice Agent Interactive Demo - Desktop Only (After Modulos) */}
        <section id="live-demo-desktop" className="hidden space-y-4 scroll-mt-24 md:block">
          <LiveVoiceAgentDemo placement="desktop" />
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Timeline Pipeline */}
        <section id="fluxo" className="hidden space-y-4 scroll-mt-24 md:block">
          <div className="space-y-2.5 sm:space-y-3">
            <SectionBadge icon={Workflow}>Fluxo de Automação</SectionBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              {content.flowTitle}
            </h2>
            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              {content.flowDescription}
            </p>
          </div>
          <ProcessTimeline steps={content.flowSteps} />
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Notion-Style Comparison Matrix */}
        <section className="hidden space-y-4 md:block">
          <div className="space-y-2.5 sm:space-y-3">
            <SectionBadge icon={Scale}>Comparativo Direto</SectionBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              Manual vs. Automação Inteligente
            </h2>
            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              Entenda por que clínicas e psicólogos estão migrando para o modelo modular.
            </p>
          </div>
          <ComparisonTable />
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Final Investment Section & Calculator */}
        <section id="investimento" className="hidden space-y-4 scroll-mt-24 md:block">
          <div className="space-y-2.5 sm:space-y-3">
            <SectionBadge icon={Coins}>
              {content.investmentBadge}
            </SectionBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              {content.investmentTitle}
            </h2>
            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              {content.investmentDescription}
            </p>
          </div>

          <div className="w-full">
              <PlanCalculator />
            </div>
        </section>
      </div>

      <MinimalFooter />
    </main>
  );
}