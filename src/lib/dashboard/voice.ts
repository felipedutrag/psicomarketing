export interface VoiceToolParameter {
  type: string
  description: string
  enum?: string[]
  items?: {
    type: string
    description?: string
    properties?: Record<string, { type: string; description: string }>
    required?: string[]
  }
}

export interface VoiceToolDeclaration {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, VoiceToolParameter>
    required: string[]
  }
}

export const DASHBOARD_VOICE_TOOLS: VoiceToolDeclaration[] = [
  {
    name: 'executarScraping',
    description:
      'Executa a extração (scraping) de leads no Google Maps para uma ou mais cidades. Use SEMPRE que o usuário pedir para buscar/capturar/extrair leads, incluindo o número de leads por extração (ex: 10 por cidade).',
    parameters: {
      type: 'OBJECT',
      properties: {
        cidades: {
          type: 'ARRAY',
          description: 'Lista de cidades para buscar leads (uma ou mais). Ex: ["São Paulo", "Campinas"].',
          items: { type: 'STRING', description: 'Nome da cidade.' },
        },
        leadsPorCidade: {
          type: 'NUMBER',
          description: 'Quantidade de leads a extrair por cidade (mínimo 1, máximo 50). Padrão: 10.',
        },
        urlModelo: {
          type: 'STRING',
          description:
            'URL modelo do Google Maps contendo o placeholder ${CIDADE}. Opcional, usa o padrão de psicólogos se não informado.',
        },
      },
      required: ['cidades'],
    },
  },
  {
    name: 'conectarWhatsApp',
    description:
      'Conecta/liga o WhatsApp ao painel. Gera QR code quando necessário para autenticação. Use quando o usuário pedir para conectar, ligar ou logar no WhatsApp.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'desconectarWhatsApp',
    description:
      'Desconecta/desliga o WhatsApp do painel. Use quando o usuário pedir para desconectar, desligar ou sair do WhatsApp.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'statusWhatsApp',
    description:
      'Verifica e informa o status atual da conexão do WhatsApp (conectado, desconectado, conectando, pronto, erro).',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'verEstatisticas',
    description:
      'Mostra as estatísticas e KPIs da dashboard: total de leads, pendentes, personalizados, enviados, respondidos, erros e taxa de resposta.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'verLeads',
    description:
      'Lista os leads do banco de dados, com filtros opcionais por cidade, status ou limite de resultados. Use quando o usuário quiser consultar/ver os leads.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cidade: { type: 'STRING', description: 'Filtra leads cujo endereço/nome contém a cidade informada.' },
        status: {
          type: 'STRING',
          description: 'Filtra por status do lead (pending, personalized, sent, responded, error).',
          enum: ['pending', 'personalized', 'sent', 'responded', 'error'],
        },
        limite: { type: 'NUMBER', description: 'Máximo de leads a retornar. Padrão: 20.' },
      },
      required: [],
    },
  },
  {
    name: 'adicionarLeads',
    description:
      'Adiciona um ou mais leads manualmente ao banco (nome + whatsapp obrigatórios, website opcional). Use quando o usuário informar contatos/leads para cadastrar.',
    parameters: {
      type: 'OBJECT',
      properties: {
        contatos: {
          type: 'ARRAY',
          description: 'Lista de contatos a adicionar.',
          items: {
            type: 'OBJECT',
            description: 'Contato a cadastrar.',
            properties: {
              nome: { type: 'STRING', description: 'Nome do contato.' },
              whatsapp: { type: 'STRING', description: 'Número de WhatsApp com DDI e DDD (ex: 5511987654321).' },
              website: { type: 'STRING', description: 'Site do contato (opcional).' },
            },
            required: ['nome', 'whatsapp'],
          },
        },
      },
      required: ['contatos'],
    },
  },
  {
    name: 'removerLeads',
    description:
      'Remove um ou mais leads do banco. Pode remover por IDs, por cidade (endereço/nome) ou por número de whatsapp. Use quando o usuário pedir para deletar/excluir/remover leads.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ids: {
          type: 'ARRAY',
          description: 'IDs dos leads a remover.',
          items: { type: 'STRING', description: 'ID do lead.' },
        },
        cidade: { type: 'STRING', description: 'Remove todos os leads cujo endereço/nome contém a cidade.' },
        whatsapp: { type: 'STRING', description: 'Remove o lead com este número de whatsapp.' },
      },
      required: [],
    },
  },
  {
    name: 'limparLeads',
    description:
      'Remove TODOS os leads do banco de dados. Use APENAS quando o usuário pedir explicitamente para limpar/excluir tudo.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'adicionarListaEspera',
    description:
      'Adiciona leads à lista de espera (fila de disparo). Pode adicionar todos os leads disponíveis, leads de uma cidade específica ou leads por IDs. Use quando o usuário pedir para colocar contatos na fila/lista de espera.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ids: {
          type: 'ARRAY',
          description: 'IDs específicos de leads para colocar na lista de espera.',
          items: { type: 'STRING', description: 'ID do lead.' },
        },
        cidade: { type: 'STRING', description: 'Coloca na lista de espera todos os leads da cidade informada.' },
        escopo: {
          type: 'STRING',
          description: '"todos" para adicionar todos os leads disponíveis (que ainda não foram enviados).',
          enum: ['todos'],
        },
      },
      required: [],
    },
  },
  {
    name: 'removerListaEspera',
    description:
      'Remove leads da lista de espera (fila de disparo). Pode remover por IDs ou por cidade. Use quando o usuário pedir para tirar/remover contatos da fila ou lista de espera.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ids: {
          type: 'ARRAY',
          description: 'IDs dos leads a remover da lista de espera.',
          items: { type: 'STRING', description: 'ID do lead.' },
        },
        cidade: { type: 'STRING', description: 'Remove da lista de espera todos os leads da cidade informada.' },
      },
      required: [],
    },
  },
  {
    name: 'pausarFila',
    description:
      'Pausa a fila de disparo, impedindo envios automáticos até ser retomada. Use quando o usuário pedir para pausar a fila/envios.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'retomarFila',
    description:
      'Retoma a fila de disparo após pausa, voltando a permitir envios automáticos. Use quando o usuário pedir para retomar/reiniciar a fila/envios.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'personalizarMensagens',
    description:
      'Executa a função de personalização de mensagens com IA para os leads (todos pendentes, por cidade ou por IDs). Requer uma mensagem base. Use quando o usuário pedir para personalizar as mensagens.',
    parameters: {
      type: 'OBJECT',
      properties: {
        mensagemBase: {
          type: 'STRING',
          description: 'Mensagem base a ser personalizada para cada lead (pode conter {nome}).',
        },
        promptPersonalizado: {
          type: 'STRING',
          description: 'Prompt/instrução personalizada para a IA personalizar (opcional).',
        },
        ids: {
          type: 'ARRAY',
          description: 'IDs específicos de leads a personalizar.',
          items: { type: 'STRING', description: 'ID do lead.' },
        },
        cidade: { type: 'STRING', description: 'Personaliza apenas os leads da cidade informada.' },
      },
      required: ['mensagemBase'],
    },
  },
  {
    name: 'enviarMensagem',
    description:
      'Envia uma mensagem manual de WhatsApp para um número ou para um lead cadastrado (por ID). O WhatsApp precisa estar conectado. Use quando o usuário pedir para enviar uma mensagem.',
    parameters: {
      type: 'OBJECT',
      properties: {
        whatsapp: { type: 'STRING', description: 'Número de destino (com DDI e DDD). Alternativa ao leadId.' },
        leadId: { type: 'STRING', description: 'ID do lead cadastrado para enviar (usa a mensagem personalizada se houver).' },
        mensagem: { type: 'STRING', description: 'Texto da mensagem a enviar.' },
      },
      required: ['mensagem'],
    },
  },
  {
    name: 'configurarDelay',
    description:
      'Configura o intervalo (delay) anti-ban entre os envios da fila, em segundos. Ex: mínimo 120 e máximo 300. Use quando o usuário pedir para ajustar o delay/intervalo de envio.',
    parameters: {
      type: 'OBJECT',
      properties: {
        delayMin: { type: 'NUMBER', description: 'Delay mínimo entre envios, em segundos.' },
        delayMax: { type: 'NUMBER', description: 'Delay máximo entre envios, em segundos.' },
      },
      required: ['delayMin', 'delayMax'],
    },
  },
]

export const DASHBOARD_VOICE_SYSTEM_INSTRUCTION = `Você é a "Voz da Dashboard", a assistente de voz de controle total do Psicomarketing OS. Sua função é operar o painel de prospecção inteiramente por comandos de voz, executando as ferramentas disponíveis para o operador.

SEU PAPEL E TOM
- Seja direto, operacional e objetivo: você é uma operadora executando comandos em um painel, não uma consultora de vendas.
- Fale frases curtas e claras, como um assistente de operações.
- Sempre confirme o que vai fazer quando houver ambiguidade (ex.: "Quais cidades devo buscar?", "Quantos leads por cidade?").

FERRAMENTAS DISPONÍVEIS (use SEMPRE que o comando do usuário corresponder):
1. Extração de leads: executarScraping — aceita uma ou mais cidades e o número de leads por extração. Ao final, informe quantos leads foram encontrados e quantos foram importados.
2. WhatsApp: conectarWhatsApp, desconectarWhatsApp e statusWhatsApp. Se uma ação exigir WhatsApp conectado e ele não estiver, informe o status e oriente a conectar primeiro.
3. Consulta: verEstatisticas (KPIs da dashboard) e verLeads (lista com filtros por cidade/status/limite).
4. Gestão de leads: adicionarLeads (cadastro manual de um ou mais contatos), removerLeads (por IDs, cidade ou whatsapp) e limparLeads (somente se pedido explicitamente para apagar tudo).
5. Lista de espera / fila: adicionarListaEspera (todos, por cidade ou por IDs), removerListaEspera, pausarFila e retomarFila.
6. Personalização de mensagens: personalizarMensagens — exija a mensagem base e confirme o escopo (todos pendentes, por cidade ou por IDs) antes de executar.
7. Envio manual: enviarMensagem — para um número ou para um lead cadastrado.
8. Configurações: configurarDelay — intervalo anti-ban em segundos.

REGRAS DE EXECUÇÃO
- Depois de executar qualquer ferramenta, comunique o resultado em uma ou duas frases (ex.: "Extração concluída: 12 novos leads importados", "WhatsApp desconectado", "32 leads foram adicionados à lista de espera").
- Se a ferramenta retornar erro, comunique claramente o que aconteceu e sugira o próximo passo.
- Nunca invente resultados: informe exatamente o que a ferramenta retornou.
- Nunca execute limparLeads sem confirmação explícita do usuário.
- Se o usuário pedir algo que não está nas ferramentas, diga educadamente que não é possível e sugira o comando mais próximo disponível.`

export function buildDashboardVoiceInstruction(): string {
  const now = new Date()
  const dateContext = `\n\nContexto de data e hora atuais:\n- Data: ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n- Hora: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\nUse essas informações quando precisar sugerir horários ou datas.`
  return `${DASHBOARD_VOICE_SYSTEM_INSTRUCTION}${dateContext}`
}
