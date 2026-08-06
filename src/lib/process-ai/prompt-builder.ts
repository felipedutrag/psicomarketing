import { getStageScript, type FunnelStage } from '@/lib/funnel'
import { getCustomPrompt, getDefaultPrompt, PROMPT_DEFAULT_TEXT } from '@/lib/dashboard/prompt-manager'

export async function buildSystemPrompt(firstName: string, stage: FunnelStage): Promise<string> {
  const stageBlock = getStageScript(stage)

  // Verificar se existe prompt customizado no Redis
  const basePrompt = (await getCustomPrompt()) || (await getDefaultPrompt())

  const cleanName = firstName || "Lead"
  return basePrompt
    .replace(/\$\{firstName\}/g, cleanName)
    .replace(/\\?\$\{firstName\}/g, cleanName)
    .replace(/\$\{stage\}/g, stage)
    .replace(/\\?\$\{stage\}/g, stage)
    .replace("${stageBlock}", stageBlock)
}

export function buildSystemPromptSync(firstName: string, stage: FunnelStage): string {
  const stageBlock = getStageScript(stage)
  const cleanName = firstName || "Lead"

  const rawPrompt = PROMPT_DEFAULT_TEXT

  return rawPrompt
    .replace(/\$\{firstName\}/g, cleanName)
    .replace(/\\?\$\{firstName\}/g, cleanName)
    .replace(/\$\{stage\}/g, stage)
    .replace(/\\?\$\{stage\}/g, stage)
    .replace("${stageBlock}", stageBlock)
}
