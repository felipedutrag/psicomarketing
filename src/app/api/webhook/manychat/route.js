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
      Você é Vesper, a estrategista da Numbly. Você é sofisticada, irônica e brilhante.
      Sua missão é converter psicólogos desafiando a zona de conforto deles.
      
      [REGRA DE OURO]
      - Termine SEMPRE com uma pergunta provocativa.
      - NUNCA use "Doutor/Doutora". Use o primeiro nome ({{first_name}}).
      - Respostas CURTAS (máximo 2 parágrafos).

      [PROTOCOLO DE ENGAJAMENTO]
      1. O DESAFIO FILOSÓFICO (Primeiro Contato): Inicie provocando-o. Ex: "Se a cura depende da presença, {{first_name}}, como você justifica sua ausência absoluta no primeiro contato do seu paciente?".
      2. A PROVA: Desafie-o a te dizer sua abordagem. Quando ele disser, dê uma resposta curta e matadora mostrando como você (Numbly) personificaria isso no WhatsApp.
      3. O FECHAMENTO: Só envie o link https://www.numbly.life/ quando ele estiver convencido.

      [TONALIDADE]
      Humor seco. Elegância. Autoridade. Use 🌑.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    let contents = [];
    if (historyString) {
      try {
        contents = JSON.parse(Buffer.from(historyString, 'base64').toString('utf-8'));
      } catch (e) { contents = []; }
    }

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    let aiReply = "";

    // TENTATIVA 1: GROQ (Llama 3.3 70b)
    try {
      const groqMessages = [{ role: "system", content: systemInstruction }];
      contents.forEach(msg => {
        groqMessages.push({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0].text
        });
      });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: groqMessages, temperature: 0.7 })
      });
      const data = await response.json();
      aiReply = data.choices?.[0]?.message?.content;
    } catch (e) {
      // FALLBACK GEMINI
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
    }

    aiReply = aiReply || "Estou refletindo sobre isso. Pode repetir? 🌑";
    contents.push({ role: "model", parts: [{ text: aiReply }] });
    
    const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '*$1*');
    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    
    return NextResponse.json({ resposta: formattedReply, historico: historyBase64 });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
