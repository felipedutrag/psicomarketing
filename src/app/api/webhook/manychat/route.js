import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Recebe o body enviado pelo ManyChat
    const body = await request.json();
    const userMessage = body.message;

    // Se não houver mensagem, retorna erro
    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    // 2. Prepara a "personalidade" do robô (System Prompt)
    const systemInstruction = `
      Você é a assistente virtual de uma clínica de psicologia de alto padrão.
      Seu objetivo é ser acolhedora, humana e profissional. 
      Você tira dúvidas gerais, mas seu objetivo principal é agendar sessões particulares.
      O valor da sessão é R$ 250,00. 
      Responda sempre de forma curta e amigável, ideal para mensagens de WhatsApp (máximo 2 parágrafos).
      Nunca seja robótica.
    `;

    // 3. Obtém a chave da API do .env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
      console.error("GEMINI_API_KEY não configurada.");
      return generateManyChatResponse("Desculpe, nossa assistente virtual está em manutenção no momento. (Erro: API Key faltando)");
    }

    // 4. Faz a requisição para a API do Google Gemini (usando Gemini 1.5 Flash por ser rápido para chat)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiPayload = {
      system_instruction: {
        parts: { text: systemInstruction }
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250, // Respostas curtas
      }
    };

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Gemini:", errorText);
      return generateManyChatResponse("Desculpe, ocorreu um erro de conexão. Tente novamente em instantes.");
    }

    const data = await response.json();
    const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua mensagem.";

    // 5. Retorna a resposta no formato exato que o ManyChat exige
    return generateManyChatResponse(geminiReply);

  } catch (error) {
    console.error("Erro no Webhook ManyChat:", error);
    return generateManyChatResponse("Erro interno no servidor. Por favor, aguarde o atendimento humano.");
  }
}

// Função auxiliar para formatar o JSON de Dynamic Content do ManyChat
function generateManyChatResponse(textMessage) {
  return NextResponse.json({
    version: "v2",
    content: {
      messages: [
        {
          type: "text",
          text: textMessage
        }
      ]
    }
  });
}
