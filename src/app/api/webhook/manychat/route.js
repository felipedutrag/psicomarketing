import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const currentDate = new Date().toISOString();
    const systemInstruction = `
      Você é a assistente virtual de uma clínica de psicologia de alto padrão.
      Seu objetivo é agendar sessões particulares (R$ 250,00).
      Responda sempre de forma curta e amigável (máximo 2 parágrafos).
      
      REGRA PARA AGENDAMENTO:
      Antes de usar a ferramenta de agendamento, você DEVE perguntar ao paciente:
      1. Nome completo
      2. E-mail (necessário para enviar o convite do Google Meet)
      3. Qual data e horário ele prefere.
      
      Hoje é ${currentDate} (UTC). O fuso horário do paciente é Brasil (GMT-3).
      Quando você tiver esses 3 dados, use a ferramenta 'agendar_sessao'.
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
      return generateManyChatResponse("Manutenção no sistema.", "");
    }

    let contents = [];
    if (historyString && historyString.trim() !== "") {
      try {
        const decodedHistory = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decodedHistory);
      } catch (e) {
        contents = [];
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    // Configura a Tool
    const tools = [{
      function_declarations: [
        {
          name: "agendar_sessao",
          description: "Cria o agendamento oficial e gera o link do Google Meet.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Nome do paciente" },
              email: { type: "STRING", description: "E-mail do paciente" },
              startDatetimeIso: { type: "STRING", description: "Data e hora no formato ISO 8601 UTC (ex: 2026-05-15T14:00:00Z)" }
            },
            required: ["name", "email", "startDatetimeIso"]
          }
        }
      ]
    }];

    const geminiPayload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      tools: tools,
      generationConfig: { temperature: 0.7 }
    };

    let response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) return generateManyChatResponse("Erro de conexão.", "");

    let data = await response.json();
    let responsePart = data.candidates?.[0]?.content?.parts?.[0];

    // Verifica se o Gemini decidiu chamar a função
    if (responsePart?.functionCall) {
      const call = responsePart.functionCall;
      
      // Adiciona a chamada de função ao histórico
      contents.push({
        role: "model",
        parts: [responsePart]
      });

      let functionResult = {};

      if (call.name === "agendar_sessao") {
        const args = call.args;
        try {
          // Chamada real para a API do Cal.com
          const calResponse = await fetch("https://api.cal.com/v2/bookings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.CAL_API_KEY}`,
              "cal-api-version": "2024-08-13",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              start: args.startDatetimeIso,
              eventTypeSlug: process.env.CAL_EVENT_SLUG,
              username: process.env.CAL_USERNAME,
              attendee: {
                name: args.name,
                email: args.email,
                timeZone: "America/Sao_Paulo",
                language: "pt-BR"
              }
            })
          });

          const calData = await calResponse.json();
          if (calResponse.ok && calData.status === "success") {
            functionResult = { 
              sucesso: true, 
              mensagem: "Agendamento confirmado!", 
              link_meet: calData.data?.meetingUrl || "Link enviado por e-mail." 
            };
          } else {
            functionResult = { sucesso: false, erro: calData.message || "Erro desconhecido no Cal.com" };
          }
        } catch (error) {
          functionResult = { sucesso: false, erro: error.message };
        }
      }

      // Adiciona o resultado da função ao histórico
      contents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: call.name,
            response: functionResult
          }
        }]
      });

      // Chama o Gemini novamente para ele ler o resultado e falar com o paciente
      const secondPayload = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        tools: tools,
        generationConfig: { temperature: 0.7 }
      };

      const secondResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secondPayload)
      });
      
      const secondData = await secondResponse.json();
      responsePart = secondData.candidates?.[0]?.content?.parts?.[0];
    }

    const geminiReply = responsePart?.text || "Desculpe, não consegui processar.";

    contents.push({
      role: "model",
      parts: [{ text: geminiReply }]
    });

    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    return generateManyChatResponse(geminiReply, historyBase64);

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return generateManyChatResponse("Erro interno.", "");
  }
}

// Função auxiliar para formatar o JSON de resposta (Formato Simples)
function generateManyChatResponse(textMessage, historyBase64) {
  return NextResponse.json({
    resposta: textMessage,
    historico: historyBase64
  });
}
