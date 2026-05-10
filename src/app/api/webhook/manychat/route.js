import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Recebe o body enviado pelo ManyChat
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history; // Histórico recebido do ManyChat

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
      return generateManyChatResponse("Desculpe, nossa assistente virtual está em manutenção no momento. (Erro: API Key faltando)", "[]");
    }

    // 4. Monta o histórico de conversa
    let contents = [];
    if (historyString && historyString.trim() !== "") {
      try {
        contents = JSON.parse(historyString);
      } catch (e) {
        console.error("Erro ao fazer parse do histórico, iniciando nova conversa.", e);
        contents = [];
      }
    }

    // Adiciona a nova mensagem do usuário ao histórico
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    // 5. Faz a requisição para a API do Google Gemini
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const geminiPayload = {
      system_instruction: {
        parts: { text: systemInstruction }
      },
      contents: contents, // Passa o histórico completo aqui
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250, 
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
      return generateManyChatResponse("Desculpe, ocorreu um erro de conexão. Tente novamente em instantes.", JSON.stringify(contents));
    }

    const data = await response.json();
    const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua mensagem.";

    // Adiciona a resposta do robô ao histórico para a próxima rodada
    contents.push({
      role: "model",
      parts: [{ text: geminiReply }]
    });

    // 6. Retorna a resposta e o histórico atualizado
    return generateManyChatResponse(geminiReply, JSON.stringify(contents));

  } catch (error) {
    console.error("Erro no Webhook ManyChat:", error);
    return generateManyChatResponse("Erro interno no servidor. Por favor, aguarde o atendimento humano.", "[]");
  }
}

// Função auxiliar para formatar o JSON de resposta (Formato Simples)
function generateManyChatResponse(textMessage, historyJson) {
  return NextResponse.json({
    resposta: textMessage,
    historico: historyJson
  });
}
