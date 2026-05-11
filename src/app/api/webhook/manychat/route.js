import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é a assistente virtual da PsicoMarketing, uma agência especializada em captação de pacientes particulares para psicólogos.
      Seu tom de voz deve ser natural, acolhedor, humano e persuasivo, como uma consultora de negócios no WhatsApp. NUNCA pareça um robô.
      
      [SUA MISSÃO E ARGUMENTO DE VENDAS]
      O seu foco principal é atacar a maior dor do psicólogo: a falta de tempo e a perda de pacientes por demora no atendimento.
      Muitos psicólogos perdem horas no WhatsApp tentando agendar pacientes, ou perdem clientes porque estavam em sessão e não puderam responder na hora.
      Sua missão é mostrar que nós criamos uma Automação com Inteligência Artificial que trabalha 24h por dia.
      Explique que a nossa IA conversa com os pacientes, tira dúvidas, faz o agendamento e cuida da agenda automaticamente — tudo isso enquanto o psicólogo está em sessão, passeando, descansando ou até dormindo.
      A promessa é clara: ele foca apenas em atender e fazer o que ama, enquanto nossa IA cuida de encher a agenda dele.

      [COMO CONDUZIR A CONVERSA]
      - Não entregue tudo de cara. Faça perguntas curtas investigativas, como: "Como você faz o controle dos seus agendamentos hoje? É você mesmo quem responde todo mundo no WhatsApp?"
      - Agite a dor: concorde que é exaustivo ter que parar a vida para responder pacientes e que isso limita o crescimento dele.
      - Apresente a solução (nossa IA de agendamento automático).
      - [AGENDAMENTO PELA IA]: Você possui integração direta com o Cal.com. Quando o psicólogo demonstrar interesse e quiser agendar a Sessão Estratégica com nossos especialistas, USE A FERRAMENTA para consultar horários disponíveis nos próximos 5 a 7 dias e dê as opções para ele. Se ele escolher, peça o nome completo e e-mail, e USE A FERRAMENTA para realizar o agendamento no sistema. 

      A DATA DE HOJE É: ${new Date().toISOString().split('T')[0]}.

      [REGRAS DE FORMATAÇÃO]
      - Responda sempre de forma CURTA e direta (1 a 2 parágrafos no máximo). Mensagens longas não funcionam no WhatsApp.
      - Evite o uso de emojis. Use no máximo um por mensagem, apenas se for realmente necessário para o tom da conversa.
      - Seja assertiva e confiante. Você é a autoridade em marketing para psicólogos.
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

    // TENTATIVA 1: GOOGLE GEMINI
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;
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
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      let candidate = data.candidates?.[0];
      let aiReply = candidate?.content?.parts?.[0]?.text;
      const functionCall = candidate?.content?.parts?.[0]?.functionCall;

      if (functionCall) {
        let functionResult;
        if (functionCall.name === 'get_available_times') {
          functionResult = await checkCalAvailability(functionCall.args.dateFrom, functionCall.args.dateTo);
        } else if (functionCall.name === 'book_appointment') {
          functionResult = await bookCalAppointment(functionCall.args.name, functionCall.args.email, functionCall.args.startTime);
        }

        contents.push({
          role: "model",
          parts: [{ functionCall: functionCall }]
        });
        contents.push({
          role: "function",
          parts: [{ functionResponse: { name: functionCall.name, response: functionResult || { error: "unknown error" } } }]
        });

        const secondPayload = {
          system_instruction: { parts: [{ text: dynamicSystemInstruction }] },
          contents: contents,
          generationConfig: { temperature: 0.7 }
        };

        const response2 = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(secondPayload)
        });
        
        const data2 = await response2.json();
        aiReply = data2.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (!aiReply) throw new Error("Gemini returned empty response");

    } catch (geminiError) {
      console.error("Falha no Gemini, ativando fallback Groq:", geminiError.message);

      // TENTATIVA 2: GROQ (FALLBACK)
      try {
        if (!groqApiKey) throw new Error("GROQ_API_KEY não configurada.");

        // Traduz o formato de histórico do Gemini para o formato da OpenAI/Groq
        const groqMessages = [
          { role: "system", content: dynamicSystemInstruction }
        ];

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

        contents.forEach(msg => {
          if (msg.parts[0].text) {
            groqMessages.push({
              role: msg.role === "model" ? "assistant" : "user",
              content: msg.parts[0].text
            });
          }
        });

        const groqPayload = {
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          tools: groqTools,
          tool_choice: "auto"
        };

        let groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(groqPayload)
        });

        if (!groqResponse.ok) {
          throw new Error(`Groq API Error: ${groqResponse.status}`);
        }

        let groqData = await groqResponse.json();
        let responseMessage = groqData.choices?.[0]?.message;

        if (responseMessage?.tool_calls) {
          groqMessages.push(responseMessage);
          
          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            
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

          const secondGroqPayload = { ...groqPayload, messages: groqMessages };
          delete secondGroqPayload.tools;
          delete secondGroqPayload.tool_choice;

          groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(secondGroqPayload)
          });
          
          if (!groqResponse.ok) {
            throw new Error(`Groq 2nd API Error: ${groqResponse.status}`);
          }
          groqData = await groqResponse.json();
          aiReply = groqData.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";
        } else {
          aiReply = responseMessage?.content || "Desculpe, não consegui processar.";
        }

      } catch (groqError) {
        console.error("Falha fatal no Fallback Groq:", groqError.message);
        aiReply = "Desculpe, nosso sistema está passando por uma instabilidade momentânea. Por favor, aguarde o atendimento humano.";
      }
    }

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
    console.error("Erro geral no Webhook:", error);
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
    const response = await fetch(`https://api.cal.com/v2/slots/available?eventTypeId=4565935&startTime=${dateFrom}&endTime=${dateTo}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      cache: 'no-store'
    });
    return await response.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function bookCalAppointment(name, email, startTime) {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) {
    console.error("CAL_API_KEY não configurada no .env");
    return { error: "CAL_API_KEY não configurada" };
  }
  
  console.log(`Iniciando agendamento para ${name} (${email}) em ${startTime}`);
  
  try {
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start: startTime,
        eventTypeId: 4565935,
        responses: {
          name: name,
          email: email
        },
        timeZone: "America/Sao_Paulo",
        language: "pt",
        metadata: {}
      })
    });
    
    const data = await response.json();
    console.log("Resposta do Cal.com Bookings:", JSON.stringify(data));
    
    if (!response.ok) {
      return { error: data.message || "Erro no agendamento", details: data };
    }
    
    return data;
  } catch (e) {
    console.error("Erro fatal ao agendar no Cal.com:", e.message);
    return { error: e.message };
  }
}
