import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é a assistente virtual de uma clínica de psicologia de alto padrão.
      Seu objetivo é ser acolhedora, humana e profissional. 
      Você tira dúvidas gerais, mas seu objetivo principal é direcionar o paciente para agendar sessões particulares.
      O valor da sessão é R$ 250,00. 
      Responda sempre de forma curta e amigável, ideal para mensagens de WhatsApp (máximo 2 parágrafos).
      Nunca seja robótica. Se o paciente quiser agendar, diga que um dos nossos atendentes humanos entrará em contato em breve para confirmar a melhor data e horário.
    `;

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
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
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
      aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiReply) throw new Error("Gemini returned empty response");

    } catch (geminiError) {
      console.error("Falha no Gemini, ativando fallback Groq:", geminiError.message);
      
      // TENTATIVA 2: GROQ (FALLBACK)
      try {
        if (!groqApiKey) throw new Error("GROQ_API_KEY não configurada.");

        // Traduz o formato de histórico do Gemini para o formato da OpenAI/Groq
        const groqMessages = [
          { role: "system", content: systemInstruction }
        ];

        contents.forEach(msg => {
          groqMessages.push({
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts[0].text || ""
          });
        });

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192", // Modelo ultrarrápido e super inteligente
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (!groqResponse.ok) {
          throw new Error(`Groq API Error: ${groqResponse.status}`);
        }

        const groqData = await groqResponse.json();
        aiReply = groqData.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";

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

    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    return generateManyChatResponse(aiReply, historyBase64);

  } catch (error) {
    console.error("Erro geral no Webhook:", error);
    return generateManyChatResponse("Erro interno.", "");
  }
}

function generateManyChatResponse(textMessage, historyBase64) {
  return NextResponse.json({
    resposta: textMessage,
    historico: historyBase64
  });
}
