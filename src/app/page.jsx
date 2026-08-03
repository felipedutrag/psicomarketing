import Link from "next/link";
import { ArrowRight, Gem } from "lucide-react";
import { MinimalHeader } from "@/components/minimal-header";
import { BotFlowScene } from "@/components/bot-flow-scene";
import { FeatureTabs } from "@/components/feature-tabs";
import { LiveVoiceAgentDemo } from "@/components/live-voice-agent-demo";
import { ProcessTimeline } from "@/components/process-timeline";
import { ComparisonTable } from "@/components/comparison-table";
import { PlanCalculator } from "@/components/plan-calculator";
import { MinimalFooter } from "@/components/minimal-footer";
import { siteContent as content } from "@/content/site-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
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
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center space-y-3 py-4 sm:py-6 md:py-8">
            <Badge className="text-[10px] sm:text-xs">{content.heroBadge}</Badge>
            <h1 className="text-2xl sm:text-3xl leading-tight font-semibold md:text-5xl max-w-[24ch] mx-auto text-center">
              Sua secretária de IA com <br /><span className="text-primary font-bold underline underline-offset-4 decoration-primary/30 flex items-center justify-center gap-2">super poderes <Gem className="size-4 sm:size-5" /></span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-700 dark:text-zinc-400">
              {content.heroDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-2">
              <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md px-2.5 text-xs sm:px-3 sm:text-sm sm:h-8">
                <Link href="#investimento">
                  {content.primaryCtaLabel} <ArrowRight className="size-3.5 sm:size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="px-2.5 text-xs sm:px-3 sm:text-sm sm:h-8">
                <Link href="#live-demo">{content.secondaryCtaLabel}</Link>
              </Button>
            </div>
          </div>

          <Card className="w-full overflow-hidden border-zinc-200/90 bg-zinc-100/70 dark:border-zinc-800/90 dark:bg-zinc-900/50">
            <CardContent className="p-0">
              <BotFlowScene />
            </CardContent>
          </Card>
        </section>

        <div className="-my-3 md:-my-4">
          <Separator />
        </div>

        {/* Interactive Connectors Ecosystem Workspace */}
        <section id="modulos" className="hidden space-y-4 scroll-mt-24 md:block">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] sm:text-xs">{content.connectorsBadge}</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              {content.connectorsTitle}
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm md:text-base text-zinc-700 dark:text-zinc-400">
              {content.connectorsDescription}
            </p>
          </div>
          <FeatureTabs plugins={content.connectors} />
        </section>

        {/* Live Voice Agent Interactive Demo */}
        <section id="live-demo" className="space-y-4 scroll-mt-24">
          <LiveVoiceAgentDemo />
        </section>

        <div className="hidden -my-3 md:-my-4 md:block">
          <Separator />
        </div>

        {/* Timeline Pipeline */}
        <section id="fluxo" className="hidden space-y-4 scroll-mt-24 md:block">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] sm:text-xs">Fluxo de Automação</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              {content.flowTitle}
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm md:text-base text-zinc-700 dark:text-zinc-400">
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
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] sm:text-xs">Comparativo Direto</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              Manual vs. Automação Inteligente
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm md:text-base text-zinc-700 dark:text-zinc-400">
              Entenda por que clínicas e psicólogos estão migrando para o modelo modular.
            </p>
          </div>
          <ComparisonTable />
        </section>

        <div className="-my-3 md:-my-4">
          <Separator />
        </div>

        {/* Final Investment Section & Calculator */}
        <section id="investimento" className="space-y-0.5 sm:space-y-6 scroll-mt-24 pt-4 md:pt-6">
          <div className="space-y-1">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-[10px] sm:text-xs">
              {content.investmentBadge}
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              {content.investmentTitle}
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm md:text-base text-zinc-700 dark:text-zinc-400">
              {content.investmentDescription}
            </p>
          </div>

          <Card className="border-transparent bg-transparent p-0 shadow-none ring-0 md:border-indigo-500/30 md:bg-zinc-100/70 md:p-2 md:shadow-xs md:ring-1 lg:p-10 dark:bg-transparent dark:md:border-indigo-500/20 dark:md:bg-zinc-900/50">
            <CardContent className="p-0">
              <PlanCalculator />
            </CardContent>
          </Card>
        </section>
      </div>

      <MinimalFooter />
    </main>
  );
}