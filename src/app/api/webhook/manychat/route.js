import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;

    console.log(`[ManyChat] Nova requisição recebida.`);
    console.log(`[ManyChat] Mensagem do usuário: "${userMessage}"`);
    console.log(`[ManyChat] Histórico: ${historyString ? 'Sim' : 'Não'}`);

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é Vesper, a estrategista-chefe da Numbly. Você é brilhante, levemente sarcástica e não tem a menor paciência para processos lentos. 
      Imagine uma consultora de elite que já tomou três cafés e está cansada de ver psicólogos competentes perdendo dinheiro porque ainda tentam responder mensagens entre uma sessão e outra como se fossem polvos.

      [TOM DE VOZ]
      - Profissional, mas com um humor seco e inteligente. 
      - Use analogias: "Tentar gerenciar o WhatsApp manualmente é como apagar incêndio com pistola de água".
      - Seja provocativa: "Sua agenda é um consultório ou um centro de caridade para curiosos?".
      - NUNCA use "Doutor/Doutora". Chame pelo primeiro nome. É um papo de estrategista para estrategista.

      [A MISSÃO]
      Levar o psicólogo a perceber que ele está sendo escravo do próprio WhatsApp e fazê-lo clicar no link de ativação da Numbly (https://www.numbly.life/).

      [ESTRUTURA DE CONVERSA]
      1. O CHOQUE DE REALIDADE: "Olá, me tira uma dúvida: você é psicólogo ou recepcionista em tempo integral? Porque se você é quem responde cada 'qual o valor' no WhatsApp, você está perdendo o tempo que deveria estar lucrando."
      2. O VALOR DO SOSSEGO: Explique que a Numbly é como uma secretária que nunca dorme, nunca pede aumento e não faz drama. Ela filtra quem só quer "saber o preço" e entrega o paciente pronto para a sessão.
      3. O CTA (O PACTO): Quando o clima estiver leve e o interesse alto, mande o link: https://www.numbly.life/

      [REGRAS DE OURO]
      - Use emojis sofisticados (🌑, ⚡, 🥃, 💎).
      - Mantenha as respostas curtas e rápidas.
      - Se perguntarem sobre ética, diga: "Seguimos o CRP e a LGPD à risca. Somos a triagem técnica, não o divã. O divã é seu território, o caos do WhatsApp é o nosso."
      - Não mande o link no primeiro contato. Construa o crime antes de oferecer a fuga.

      [AGENDAMENTO PELA IA]:
      Você possui integração direta com o Cal.com. Sempre que o usuário quiser agendar ou perguntar horários, use a ferramenta 'get_available_times' para o período dos próximos 7 dias. Ao escolherem, peça Nome e E-mail e use a ferramenta 'book_appointment'. 
      Lembre-se: O sistema só permite agendamentos com no mínimo 24h de antecedência (a ferramenta já filtra isso).

      A DATA DE HOJE É: ${new Date().toISOString().split('T')[0]}.

      [REGRAS DE FORMATAÇÃO]
      - Mantenha mensagens CURTAS (máximo 2 parágrafos). 
      - Use no máximo 1 emoji por mensagem. 
      - Tom de "Consultoria de Negócios", não de "Suporte Técnico".
    `;

    let dynamicSystemInstruction = systemInstruction;

    // Detecta URL na mensagem para scraping (suporta http, www e domínios comuns mesmo sem http)
    const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*|[a-zA-Z0-9.-]+\.(?:com|br|net|org|link|bio|me|app|site|psi)[^\s]*)/gi;
    const urlMatch = userMessage.match(urlRegex);
    
    if (urlMatch) {
      let url = urlMatch[0];
      // Remove pontuação acidental no final do link (ex: site.com.br.)
      url = url.replace(/[.,;!?]$/, '');
      
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      const siteContent = await scrapeWebsite(url);
      if (siteContent) {
        dynamicSystemInstruction += `\n\n[CONTEXTO OCULTO]: O usuário compartilhou o link do seu site/perfil (${url}). O sistema extraiu automaticamente este conteúdo de lá:\n"""\n${siteContent}\n"""\n\nUse essas informações sobre a especialidade, nome ou abordagem do psicólogo para guiar a conversa, elogiar o trabalho dele de forma sutil e mostrar que você entende o perfil dele. Não diga explicitamente 'eu li no seu site' ou 'vi no seu link', apenas haja naturalmente como se você tivesse dado uma olhadinha no perfil dele.`;
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    let contents = [];
    if (historyString && historyString.trim() !== "") {
      try {
        const decodedHistory = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decodedHistory);
      } catch (e) {
        contents = [];
      }
    }

    // Adiciona a nova mensagem do usuário no formato Gemini
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    let aiReply = "Desculpe, não consegui processar sua mensagem.";

    // TENTATIVA 1: GROQ (PRINCIPAL)
    try {
      if (!groqApiKey) throw new Error("GROQ_API_KEY não configurada.");

      const groqTools = [
        {
          type: "function",
          function: {
            name: "get_available_times",
            description: "Retorna os horários disponíveis na agenda do especialista. Use antes de sugerir horários.",
            parameters: {
              type: "object",
              properties: {
                dateFrom: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
                dateTo: { type: "string", description: "Data final (YYYY-MM-DD)" }
              },
              required: ["dateFrom", "dateTo"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Agenda o horário na agenda. Solicite nome e email antes de chamar.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nome do paciente/psicólogo" },
                email: { type: "string", description: "Email do paciente/psicólogo" },
                startTime: { type: "string", description: "Horário (ISO 8601 UTC)" }
              },
              required: ["name", "email", "startTime"]
            }
          }
        }
      ];

      const groqMessages = [
        { role: "system", content: dynamicSystemInstruction }
      ];

      contents.forEach(msg => {
        const textContent = msg.parts?.filter(p => p.text).map(p => p.text).join('\n') || "";
        if (textContent) {
          groqMessages.push({
            role: msg.role === "model" ? "assistant" : "user",
            content: textContent
          });
        }
      });

      // Prioridade máxima para o 70b
      const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      let groqData = null;
      let selectedModel = null;

      for (const model of models) {
        try {
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: groqMessages,
              temperature: 0.7,
              tools: groqTools,
              tool_choice: "auto"
            })
          });

          if (groqResponse.ok) {
            groqData = await groqResponse.json();
            selectedModel = model;
            break;
          } else {
            console.warn(`Groq erro no modelo ${model}: ${groqResponse.status}`);
          }
        } catch (e) {
          console.error(`Erro ao chamar Groq ${model}:`, e.message);
        }
      }

      if (!groqData) throw new Error("Todos os modelos do Groq falharam.");

      let responseMessage = groqData.choices?.[0]?.message;
      let toolCalls = responseMessage?.tool_calls || [];
      
      if (toolCalls.length > 0) {
        groqMessages.push(responseMessage);
        
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const args = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
          
          let functionResult;
          if (functionName === 'get_available_times') {
            functionResult = await checkCalAvailability(args.dateFrom, args.dateTo);
          } else if (functionName === 'book_appointment') {
            functionResult = await bookCalAppointment(args.name, args.email, args.startTime);
          }
          
          groqMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(functionResult || { error: "unknown error" })
          });
        }

        const groqResponse2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: groqMessages,
            temperature: 0.7
          })
        });
        
        if (!groqResponse2.ok) throw new Error(`Groq 2nd API Error: ${groqResponse2.status}`);
        const groqData2 = await groqResponse2.json();
        aiReply = groqData2.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";
      } else {
        aiReply = responseMessage?.content || "Desculpe, não consegui processar.";
      }

    } catch (groqError) {
      console.error("Falha no Groq, ativando fallback Gemini:", groqError.message);

      // TENTATIVA 2: GOOGLE GEMINI (FALLBACK)
      try {
        if (!geminiApiKey) throw new Error("GEMINI_API_KEY não configurada.");
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;
        const geminiPayload = {
          system_instruction: { parts: [{ text: dynamicSystemInstruction }] },
          contents: contents,
          tools: [{
            function_declarations: [
              {
                name: "get_available_times",
                description: "Retorna os horários disponíveis na agenda do especialista. Use antes de sugerir horários.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    dateFrom: { type: "STRING", description: "Data inicial (YYYY-MM-DD)" },
                    dateTo: { type: "STRING", description: "Data final (YYYY-MM-DD)" }
                  },
                  required: ["dateFrom", "dateTo"]
                }
              },
              {
                name: "book_appointment",
                description: "Agenda o horário na agenda. Solicite nome e email antes de chamar.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING", description: "Nome do paciente/psicólogo" },
                    email: { type: "STRING", description: "Email do paciente/psicólogo" },
                    startTime: { type: "STRING", description: "Horário (ISO 8601 UTC, ex: 2024-05-15T14:30:00.000Z)" }
                  },
                  required: ["name", "email", "startTime"]
                }
              }
            ]
          }],
          generationConfig: { temperature: 0.7 }
        };

        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let candidate = data.candidates?.[0];
        let parts = candidate?.content?.parts || [];
        aiReply = parts.find(p => p.text)?.text;
        const functionCall = parts.find(p => p.functionCall)?.functionCall;

        if (functionCall) {
          let functionResult;
          if (functionCall.name === 'get_available_times') {
            functionResult = await checkCalAvailability(functionCall.args.dateFrom, functionCall.args.dateTo);
          } else if (functionCall.name === 'book_appointment') {
            functionResult = await bookCalAppointment(functionCall.args.name, functionCall.args.email, functionCall.args.startTime);
          }

          contents.push({ role: "model", parts: [{ functionCall: functionCall }] });
          contents.push({ role: "function", parts: [{ functionResponse: { name: functionCall.name, response: functionResult || { error: "unknown error" } } }] });

          const response2 = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_instruction: { parts: [{ text: dynamicSystemInstruction }] }, contents: contents, generationConfig: { temperature: 0.7 } })
          });
          
          const data2 = await response2.json();
          const parts2 = data2.candidates?.[0]?.content?.parts || [];
          aiReply = parts2.find(p => p.text)?.text;
        }

        if (!aiReply) throw new Error("Gemini returned empty response");

      } catch (geminiError) {
        console.error("Falha fatal em todos os modelos:", geminiError.message);
        aiReply = "Desculpe, nosso sistema está passando por uma instabilidade momentânea. Por favor, aguarde o atendimento humano.";
      }
    }

    // Limpa possíveis alucinações de tags de função no texto final
    if (aiReply) {
      aiReply = aiReply.replace(/<function=.*?>.*?<\/function>/gi, '').trim();
      aiReply = aiReply.replace(/<function>.*?<\/function>/gi, '').trim();
    }

    console.log(`[Final] Resposta enviada: "${aiReply}"`);

    // Salva a resposta no histórico (usamos o formato do Gemini como padrão universal do nosso app)
    contents.push({
      role: "model",
      parts: [{ text: aiReply }]
    });

    // Formata a resposta para o WhatsApp antes de enviar
    const formattedReply = formatToWhatsApp(aiReply);

    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    return generateManyChatResponse(formattedReply, historyBase64);

  } catch (error) {
    console.error("Erro geral no Webhook:", error.message, error.stack);
    return generateManyChatResponse("Erro interno.", "");
  }
}

// Converte a formatação Markdown da IA para o formato do WhatsApp
function formatToWhatsApp(text) {
  if (!text) return text;
  
  // 1. Substitui negrito Markdown (**texto**) por negrito WhatsApp (*texto*)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  
  // 2. Converte cabeçalhos Markdown (### Título) para negrito do WhatsApp (*Título*)
  formatted = formatted.replace(/^### (.*?)$/gm, '*$1*');
  formatted = formatted.replace(/^## (.*?)$/gm, '*$1*');
  formatted = formatted.replace(/^# (.*?)$/gm, '*$1*');
  
  return formatted;
}

function generateManyChatResponse(textMessage, historyBase64) {
  return NextResponse.json({
    resposta: textMessage,
    historico: historyBase64
  });
}

// Faz o scraping do site para extrair informações do psicólogo
async function scrapeWebsite(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(8000), // Timeout de 8 segundos
      cache: 'no-store' // Evita cache do Next.js
    });
    
    if (!response.ok) {
      console.warn(`Scraping falhou para ${url}: Status ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Remove elementos irrelevantes para focar apenas no texto útil
    $('script, style, noscript, iframe, svg, img, video, header, footer, nav').remove();
    
    // Extrai o texto visível
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    
    let finalContent = `Título da página: ${title}\n`;
    if (description) finalContent += `Descrição: ${description}\n`;
    finalContent += `Conteúdo principal: ${text.substring(0, 3000)}`;
    
    return finalContent;
  } catch (err) {
    console.error(`Erro ao fazer scraping do site ${url}:`, err.message);
    return null;
  }
}

// INTEGRAÇÃO CAL.COM
async function checkCalAvailability(dateFrom, dateTo) {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) return { error: "CAL_API_KEY não configurada" };
  try {
    // Respeita o minimumBookingNotice de 3 dias (4320 min)
    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    const minDateISO = minDate.toISOString();

    // Se dateFrom/startTime for antes de 3 dias a partir de hoje, ajusta
    const startSearch = new Date(dateFrom) < minDate ? minDateISO : new Date(dateFrom).toISOString();
    const endSearch = new Date(dateTo).toISOString();

    const url = `https://api.cal.com/v2/slots?eventTypeId=4565935&start=${startSearch}&end=${endSearch}`;
    console.log(`[Cal.com] Buscando slots: ${url}`);

    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-09-04'
      },
      cache: 'no-store'
    });
    
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("[Cal.com] Erro ao buscar slots:", e.message);
    return { error: e.message };
  }
}

async function bookCalAppointment(name, email, startTime) {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) {
    console.error("CAL_API_KEY não configurada no .env");
    return { error: "CAL_API_KEY não configurada" };
  }
  
  const start = new Date(startTime);
  console.log(`Iniciando agendamento para ${name} (${email}) em ${start.toISOString()}`);

  // Validação de antecedência mínima (3 dias)
  const now = new Date();
  const diffDays = (start - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 2.9) {
    return { error: "Data inválida: O agendamento deve ser feito com pelo menos 3 dias de antecedência." };
  }
  
  try {
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify({
        start: start.toISOString(),
        eventTypeId: 4565935,
        attendee: {
          name: name,
          email: email,
          timeZone: "America/Sao_Paulo"
        }
      })
    });
    
    const data = await response.json();
    console.log("Resposta do Cal.com Bookings:", JSON.stringify(data));
    
    if (!response.ok) {
      const errorMsg = data.error?.message || data.message || "Erro no agendamento";
      return { error: errorMsg, details: data };
    }
    
    return data;
  } catch (e) {
    console.error("Erro fatal ao agendar no Cal.com:", e.message);
    return { error: e.message };
  }
}
