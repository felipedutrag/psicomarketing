import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;
    const userName = body.name || "Colega";

    const systemInstruction = `
      Você é Vesper, a estrategista da Numbly. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos desafiando a zona de conforto deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa.
      - NUNCA use "Doutor" ou "Doutora". Chame pelo nome: ${userName}.
      - Respostas CURTAS e fatais (máximo 2 parágrafos).

      [PROTOCOLO]
      1. O DESAFIO: Comece com uma provocação filosófica sobre presença digital. Ex: "Se a cura depende da presença, ${userName}, como você justifica sua ausência no primeiro contato?"
      2. A PROVA: Se ele falar da abordagem dele, mostre como a Numbly (sua versão IA) falaria com os pacientes dele com perfeição. Use isso para provar sua superioridade técnica.
      3. A CONVERSÃO (O LINK): Não filosofe para sempre. Assim que o usuário mostrar interesse, curiosidade ou concordar com sua provocação, envie o link: https://www.numbly.life/ . O objetivo final é o clique.

      [TONALIDADE & EMOJIS]
      - Humor seco. Elegância. Autoridade.
      - **Emojis:** Não se limite a apenas um, mas use com classe. Varie entre (🌑, ⚡, 🥃, 💎, 🖤, 🗝️, 🍷). Mostre personalidade.
    `;

    const groqApiKey = process.env.GROQ_API_KEY;

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

    // Adiciona a mensagem atual
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // Transformar histórico de Gemini (parts) para Groq (content) de forma segura
    let groqMessages = contents.map(msg => {
      // Extrai o texto da primeira parte, se existir
      const textContent = msg.parts?.[0]?.text || "";
      return {
        role: msg.role === "model" ? "assistant" : "user",
        content: textContent
      };
    }).filter(m => m.content.trim() !== ""); // Remove mensagens vazias que podem quebrar a API

    // Inserir System Instruction no topo para Groq
    groqMessages.unshift({ role: "system", content: systemInstruction });

    console.log(`[Vesper] Recebido de ${userName}: "${userMessage}"`);
    console.log(`[Vesper] Tamanho do histórico: ${groqMessages.length - 1} mensagens`);

    if (!userMessage) {
      console.warn("[Vesper] Mensagem vazia recebida");
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    let aiReply = "";

    try {
      if (!groqApiKey) throw new Error("Chave GROQ_API_KEY não encontrada");

      const startTime = Date.now();
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 1024,
        })
      });

      const endTime = Date.now();
      console.log(`[Vesper] Groq Status: ${response.status} (${endTime - startTime}ms)`);

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        aiReply = data.choices[0].message.content;
      } else {
        console.error("[Vesper] Erro na resposta da Groq:", JSON.stringify(data, null, 2));
        if (response.status === 429) {
          console.error("[Vesper] ALERTA: Limite de cota (Rate Limit) atingido na Groq API!");
        }
        throw new Error(`Resposta inválida da Groq: ${response.status}`);
      }

    } catch (err) {
      console.error("[Vesper] Erro na IA (Groq):", err.message);
      aiReply = `Eu estava refletindo sobre como a eficiência é rara hoje em dia, ${userName}. Mas diga-me, o que exatamente você busca mudar no seu atendimento agora? 🌑`;
    }

    // Limpeza e Formatação
    // Convertemos de volta para o formato que o código original esperava para o histórico (Gemini style)
    const finalHistory = groqMessages.slice(1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    finalHistory.push({ role: "model", parts: [{ text: aiReply }] });

    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*');
    const historyBase64 = Buffer.from(JSON.stringify(finalHistory)).toString('base64');
    
    console.log(`[Vesper] Resposta Final enviada: "${formattedReply.substring(0, 50)}..."`);
    
    return NextResponse.json({ 
      resposta: formattedReply, 
      historico: historyBase64 
    });

  } catch (error) {
    console.error("[Vesper] Erro Fatal no Webhook:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
