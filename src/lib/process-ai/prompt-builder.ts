import { getStageScript, type FunnelStage } from '@/lib/funnel'
import { getCustomPrompt, getDefaultPrompt, PROMPT_DEFAULT_TEXT } from '@/lib/dashboard/prompt-manager'

export async function buildSystemPrompt(firstName: string, stage: FunnelStage): Promise<string> {
  const stageBlock = getStageScript(stage)

  // Verificar se existe prompt customizado no Redis
  const basePrompt = (await getCustomPrompt()) || (await getDefaultPrompt())

  const buttonRestriction = `\n\n# ATENÇÃO CRÍTICA SOBRE BOTÕES:\nVocê só deve usar a tool send_message_with_buttons se o cliente solicitar EXPLICITAMENTE o envio de botões (ex: "manda botões", "envia com botão", "opções por botão"). Caso o cliente NÃO peça expressamente por botões, NUNCA chame a tool send_message_with_buttons; responda sempre com texto simples.`

  const promptWithRule = basePrompt.includes('ATENÇÃO CRÍTICA SOBRE BOTÕES')
    ? basePrompt
    : basePrompt + buttonRestriction

  const cleanName = firstName || "Lead"
  return promptWithRule
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
