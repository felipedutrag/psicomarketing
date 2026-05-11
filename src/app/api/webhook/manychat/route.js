import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;
    const userName = body.name || "Colega"; // Pega o nome do ManyChat

    console.log(`[ManyChat] Recebido de ${userName}: ${userMessage}`);

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é Vesper, a estrategista da Numbly. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos desafiando a zona de conforto deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa.
      - NUNCA use "Doutor/Doutora". Chame pelo nome: ${userName}.
      - Respostas CURTAS (máximo 2 parágrafos).

      [PROTOCOLO]
      1. O DESAFIO: Comece com uma provocação filosófica sobre presença digital vs. clínica.
      2. A PROVA: Se ele disser a abordagem, mostre como a Numbly (IA) falaria com os pacientes dele sem perder a essência.
      3. O LINK: https://www.numbly.life/ (enviar apenas se houver real interesse).

      [TONALIDADE]
      Humor seco. Elegância. Autoridade. Use 🌑.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    let contents = [];
    if (historyString) {
      try {
        const decoded = Buffer.from(historyString, 'base64').toString('utf-8');
        contents = JSON.parse(decoded);
        // Limita o histórico para não estourar o ManyChat
        if (contents.length > 6) contents = contents.slice(-6);
      } catch (e) { 
        console.error("[ManyChat] Erro ao decodificar histórico:", e.message);
        contents = []; 
      }
    }

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    let aiReply = "";

    // TENTATIVA 1: GROQ
    try {
      if (!groqApiKey) throw new Error("Sem API Key Groq");
      
      const groqMessages = [{ role: "system", content: systemInstruction }];
      contents.forEach(msg => {
        if (msg.parts && msg.parts[0] && msg.parts[0].text) {
          groqMessages.push({
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts[0].text
          });
        }
      });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "llama-3.3-70b-versatile", 
          messages: groqMessages, 
          temperature: 0.7,
          max_tokens: 500 
        })
      });

      if (!response.ok) throw new Error(`Groq Status ${response.status}`);
      const data = await response.json();
      aiReply = data.choices?.[0]?.message?.content;
      console.log("[ManyChat] Resposta via Groq");
    } catch (e) {
      console.error("[ManyChat] Groq falhou, tentando Gemini...", e.message);
      // FALLBACK GEMINI
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: contents
          })
        });
        const data = await response.json();
        aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("[ManyChat] Resposta via Gemini");
      } catch (err) {
        console.error("[ManyChat] Gemini também falhou.");
        aiReply = "Parece que meus circuitos de estratégia tiveram um breve lapso. Podemos continuar, " + userName + "? 🌑";
      }
    }

    aiReply = aiReply || "Interessante... o que mais você pensa sobre isso? 🌑";
    
    // Atualiza histórico
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    // Formatação WhatsApp
    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*');
    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    
    console.log("[ManyChat] Enviando resposta final.");
    return NextResponse.json({ 
      resposta: formattedReply, 
      historico: historyBase64 
    });

  } catch (error) {
    console.error("[ManyChat] Erro fatal no Webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
