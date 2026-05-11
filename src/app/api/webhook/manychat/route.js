import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;
    const userName = body.name || "Colega";

    console.log(`[Vesper] Recebido de ${userName}: ${userMessage}`);

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é Vesper, a estrategista da Numbly. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos desafiando a zona de conforto deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa.
      - NUNCA use "Doutor" ou "Doutora". Chame pelo nome: ${userName}.
      - Respostas CURTAS e fatais (máximo 2 parágrafos).

      [PROTOCOLO]
      1. O DESAFIO: Comece com uma provocação filosófica sobre presença digital. Ex: "Se a cura depende da presença, ${userName}, como você justifica sua ausência no primeiro contato?"
      2. A PROVA: Se ele falar da abordagem dele, mostre como a Numbly (sua versão IA) falaria com os pacientes dele com perfeição.
      3. O LINK: https://www.numbly.life/ (só envie se ele pedir ou mostrar real interesse).

      [TONALIDADE]
      Humor seco. Elegância. Autoridade. Use 🌑.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;

    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        if (contents.length > 8) contents = contents.slice(-8);
      } catch (e) { 
        contents = []; 
      }
    }

    // Adiciona a mensagem atual se o histórico estiver vazio ou for o início
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    let aiReply = "";

    // USANDO GEMINI COMO PRINCIPAL (Já que a chave está no .env)
    try {
      if (!geminiApiKey) throw new Error("Chave Gemini não encontrada");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        aiReply = data.candidates[0].content.parts[0].text;
      } else {
        console.error("Erro na resposta do Gemini:", JSON.stringify(data));
        throw new Error("Resposta inválida do Gemini");
      }

    } catch (err) {
      console.error("[Vesper] Erro na IA:", err.message);
      aiReply = `Eu estava refletindo sobre como a eficiência é rara hoje em dia, ${userName}. Mas diga-me, o que exatamente você busca mudar no seu atendimento agora? 🌑`;
    }

    // Limpeza e Formatação
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*');
    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    
    return NextResponse.json({ 
      resposta: formattedReply, 
      historico: historyBase64 
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
