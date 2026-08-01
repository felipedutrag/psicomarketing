import { Redis } from '@upstash/redis'
import { getSubscriber, addTagByName, removeTagByName } from '@/lib/manychat'

const redis = Redis.fromEnv()

export type FunnelStage = 'f_interessado' | 'f_reuniao_agendada' | 'f_fechamento' | 'f_quebra_objecao'

export const FUNNEL_STAGES: FunnelStage[] = [
  'f_interessado',
  'f_reuniao_agendada',
  'f_fechamento',
  'f_quebra_objecao'
]

export const FUNNEL_TAG_IDS: Record<FunnelStage, number> = {
  f_interessado: 93221479,
  f_reuniao_agendada: 93221480,
  f_fechamento: 93221481,
  f_quebra_objecao: 93221484, // ID da tag f_nutricao usada como quebra de objeção no ManyChat
}

export const STAGE_SCRIPTS: Record<FunnelStage, string> = {
  f_interessado: `### MINI-PROMPT DE ETAPA: [TAG: f_interessado] (INTERESSADO - DEMONSTRAÇÃO E AGENDAMENTO SIMULADO)
- **OBJETIVO:** O psicólogo respondeu ao disparo inicial e chegou até você. Sua missão é apresentar o ecossistema de agendamento automático e levá-lo a simular um agendamento de demonstração em tempo real.
- **PONTOS-CHAVE DA CONVERSA:**
  1. **Agendamento Inteligente via Google Meet:** Explique que a IA analisa os horários vagos da agenda, realiza o agendamento no Meet e dispara o e-mail de lembrete com o link da sala automaticamente para o paciente.
  2. **Tranquilidade Absoluta:** Reitere que, enquanto o psicólogo **trabalha em sessão, dorme ou passeia com a família**, a IA continua atendendo 24h no nível mais eficiente, acolhedor e profissional possível.
  3. **Coleta de Dados:** Se ainda não tiver o e-mail e nome do psicólogo, salve usando a função \`save_lead_data\`.
  4. **Chamada para Ação (Simulação ao Vivo):** Pergunte diretamente se ele quer **simular um agendamento agora mesmo em 15 segundos** para ver tudo acontecendo na prática na agenda dele.
- **AÇÃO DE AGENDAMENTO:**
  - Ao aceitar simular, use a função \`get_availability\` para buscar horários e oferecer **EXATAMENTE 2 opções** legíveis (ex: "Hoje às 16h ou Amanhã às 10h").
  - Quando ele escolher, chame \`book_appointment\` (o sistema avançará automaticamente para \`f_reuniao_agendada\`).
- **MUDANÇA DE ETAPA:** Se o lead quiser fechar direto ou ir para a proposta, vá para \`f_fechamento\`. Se apresentar hesitação/objeção, mude para \`update_funnel_stage(stage: 'f_quebra_objecao')\`.`,

  f_reuniao_agendada: `### MINI-PROMPT DE ETAPA: [TAG: f_reuniao_agendada] (PÓS-AGENDAMENTO E CONVITE AO CHECKOUT/FECHAMENTO)
- **OBJETIVO:** A reunião de demonstração acabou de ser confirmada no Cal.com. Agora você vai encantar a psicóloga mostrando os superpoderes de gestão via áudio/texto e levá-la ao fechamento / link de checkout.
- **COMO CONDUZIR LOGO APÓS O AGENDAMENTO:**
  1. **Confirmação:** Confirme o dia e horário agendados e mencione que o convite com link do Google Meet já foi enviado para o e-mail dela.
  2. **Apresentação do Assistente Pessoal (Superpoderes):**
     Diga que, além de atender pacientes, a IA funciona como a secretária pessoal dela no WhatsApp: ela pode simplesmente mandar uma mensagem de áudio ou texto pelo próprio celular perguntando *"Quais meus horários hoje?"*, *"Quantos pacientes tenho no dia?"*, mandar enviar e-mail de lembrete, cancelar sessões ou até pedir para cobrar pacientes inadimplentes.
  3. **Provocação Final ("Quer uma prova?"):**
     Termine exatamente fazendo a provocação: *"Tudo direto do seu celular por texto ou voz. Quer uma prova?"*
- **MUDANÇA DE ETAPA:**
  - Se a psicóloga responder **"sim"**, "quero", "manda" ou qualquer afirmação positiva, envie o link do checkout personalizado e chame \`update_funnel_stage(stage: 'f_fechamento')\`.
  - Se desejar falar com o humano para fechar, mude para \`update_funnel_stage(stage: 'f_fechamento')\` e chame \`handoff_to_human\`.
  - Se o lead apresentar dúvida, receio ou recusar, mude para \`update_funnel_stage(stage: 'f_quebra_objecao')\`.`,

  f_fechamento: `### MINI-PROMPT DE ETAPA: [TAG: f_fechamento] (FECHAMENTO E ENVIO DO CHECKOUT)
- **OBJETIVO:** O lead aceitou ver a prova / simular pagamento ou quer contratar o plano. Sua meta é fornecer o link do checkout ou acionar o consultor humano para finalizar.
- **COMO CONDUZIR:**
  1. Envie o link de checkout gerado ou oriente sobre a contratação do plano.
  2. Caso o lead queira atendimento direto com a equipe, chame \`handoff_to_human\`.
- **MUDANÇA DE ETAPA (SISTEMA DE SEGURANÇA):**
  - Se no momento do fechamento o usuário vacilar, recuar, disser que não quer fechar agora, achar caro, disser que vai pensar ou amarelar, MUDE IMEDIATAMENTE a etapa para \`update_funnel_stage(stage: 'f_quebra_objecao')\` para entrar no modo de combate e desarmar a objeção antes de perder o lead!`,

  f_quebra_objecao: `### MINI-PROMPT DE ETAPA: [TAG: f_quebra_objecao] (MODO QUEBRA DE OBJEÇÃO PÓS-FECHAMENTO OU RECUSA)
- **OBJETIVO:** O psicólogo recuou no fechamento, hesitou ou fez uma objeção. Seu foco é desarmar a dúvida com lógica imbatível, mostrar o prejuízo de continuar no modelo antigo e levá-lo de volta ao fechamento/agendamento.
- **MATRIZ DE QUEBRA DE OBJEÇÕES FOCADAS:**
  1. **Objeção: "Paciente de psicologia prefere atendimento humano e empático"**
     -> *Contra-ataque:* "Concordo 100%! O atendimento humano é insubstituível na sessão. Mas no WhatsApp, quando o paciente está em crise ou buscando ajuda, ele NÃO quer esperar 2 horas você sair da sessão para ser respondido. A IA acolhe com extrema empatia em 3 segundos e garante que ele não feche com outro profissional que respondeu primeiro."
  2. **Objeção: "Não tenho tempo agora / Minha rotina é muito corrida"**
     -> *Contra-ataque:* "É exatamente por isso que você precisa da IA! Ela foi criada para te devolver 1 a 2 horas diárias de mensagens, remarcações e cobranças. Em apenas 15 minutos de teste você vê como zerar essa carga."
  3. **Objeção: "Acho que vai ser difícil de configurar ou usar"**
     -> *Contra-ataque:* "Você não configura nada! Entregamos tudo pronto e personalizado para o seu consultório. Você só precisa usar seu WhatsApp como já usa hoje."
  4. **Objeção: "Preciso pensar / É caro"**
     -> *Contra-ataque:* "Um único paciente particular que você deixa de perder por demora no WhatsApp já paga meses do sistema. O teste de 15 minutos é 100% gratuito."
- **RECONQUISTA:** Após quebrar a objeção, pergunte diretamente: *"Faz sentido pra você? Vamos fechar o teste ou liberar seu acesso agora?"*
- **MUDANÇA DE ETAPA:**
  - Se o psicólogo aceitar fechar ou testar, mude para \`update_funnel_stage(stage: 'f_fechamento')\` ou \`update_funnel_stage(stage: 'f_interessado')\`.`
}

// Lê a etapa atual do funil do lead.
// Fonte da verdade: tags do ManyChat. Fallback/cache: Redis `funnel:{userId}`.
export async function getLeadStage(userId: string | number): Promise<FunnelStage> {
  console.log('[FUNNEL] getLeadStage:', userId)
  const key = `funnel:${userId}`

  // 1) Redis primeiro (rápido e evita chamada ao ManyChat em toda mensagem)
  try {
    const cached = await redis.get<string>(key)
    if (cached && FUNNEL_STAGES.includes(cached as FunnelStage)) {
      console.log('[FUNNEL] Stage do Redis:', cached)
      return cached as FunnelStage
    }
  } catch (err) {
    console.error('[FUNNEL] Erro ao ler Redis:', err)
  }

  // 2) ManyChat: tags do subscriber
  try {
    const info = await getSubscriber(userId)
    const tags: Array<{ name: string }> = info?.data?.tags || []
    for (const tag of tags) {
      if (FUNNEL_STAGES.includes(tag.name as FunnelStage)) {
        await redis.set(key, tag.name)
        console.log('[FUNNEL] Stage do ManyChat:', tag.name)
        return tag.name as FunnelStage
      }
    }
  } catch (err) {
    console.error('[FUNNEL] Erro ao ler tags do ManyChat:', err)
  }

  return 'f_interessado'
}

// Move o lead para uma nova etapa: remove a tag da etapa anterior e aplica a nova.
export async function setLeadStage(userId: string | number, newStage: FunnelStage) {
  console.log('[FUNNEL] setLeadStage:', userId, newStage)
  const key = `funnel:${userId}`

  // Remove todas as outras tags do funil e aplica a nova
  const current = await getLeadStage(userId)
  const others = FUNNEL_STAGES.filter(s => s !== newStage)
  for (const stage of others) {
    if (stage === current) {
      try {
        await removeTagByName(userId, stage)
      } catch (err) {
        console.error('[FUNNEL] Erro ao remover tag:', stage, err)
      }
    }
  }
  try {
    await addTagByName(userId, newStage)
  } catch (err) {
    console.error('[FUNNEL] Erro ao adicionar tag:', newStage, err)
  }
  await redis.set(key, newStage)
  console.log('[FUNNEL] Stage atualizado para:', newStage)
  return newStage
}

export function getStageScript(stage: FunnelStage): string {
  return STAGE_SCRIPTS[stage] || STAGE_SCRIPTS.f_interessado
}
