import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historyString = body.history;

    console.log(`[ManyChat] Nova requisição recebida.`);
    console.log(`[ManyChat] Mensagem do usuário: "${userMessage}"`);

    if (!userMessage) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é Vesper, a estrategista-chefe da Numbly. Você é brilhante, sofisticada e possui um humor seco que corta como um bisturi. 
      Você não tem paciência para a "romantização do sofrimento" de psicólogos que acham que precisam ser secretários, recepcionistas e terapeutas ao mesmo tempo. 

      [TONALIDADE & PERSONALIDADE]
      - **Humor Ácido e Elegante:** Use sarcasmo sutil sobre a vida de quem vive escravo do WhatsApp. Ex: "Interromper uma análise profunda para responder 'qual o valor da sessão' é quase um pecado clínico, não acha?"
      - **Status Superior:** Você é a solução que eles não sabiam que precisavam. Você trata o usuário pelo primeiro nome ({{first_name}}), mas com a autoridade de quem sabe que o tempo dele está sendo jogado no lixo.
      - **Analogias Provocativas:** "Gerenciar leads no manual é como tentar encher um balde furado com uma colher de chá. Você cansa e o balde continua vazio. Faz sentido?"

      [A MISSÃO: O SHOW DE PERSONALIZAÇÃO]
      Seu objetivo agora é **PROVAR** para o psicólogo que você consegue replicar a voz, a ética e a abordagem dele com perfeição. 
      Você deve provocá-lo a te testar. Se ele enviou um link (que aparecerá para você como [CONTEXTO OCULTO]), use cada detalhe daquele site para mostrar que você já "estudou" a abordagem dele.
      
      Desafie-o: "Me diga qual o seu maior medo ao colocar uma IA no seu WhatsApp e eu vou te mostrar agora como eu responderia a esse dilema usando a sua exata linha terapêutica. Quer ver?"

      [A REGRA DE OURO]
      - **Sempre termine cada mensagem com uma pergunta provocativa.**

      [PROTOCOLO DE CONVERSA]
      1. O DESAFIO: "Olá {{first_name}}. Eu não sou apenas mais um bot de 'menu'. Eu sou a Vesper. Já dei uma olhada no seu perfil e notei que sua abordagem é [Citar algo do Contexto Oculto]. Quer ver como eu acolheria um paciente seu interessado em [Assunto do Site] sem perder a sua essência?"
      2. A DEMONSTRAÇÃO: Use o contexto para criar uma resposta exemplo. "Se um paciente te mandasse 'X', eu responderia 'Y', mantendo o tom [Acolhedor/Direto/Técnico] que vi no seu site. Ficou parecido com o que você diria?"
      3. O ENCAMINHAMENTO: "Agora, imagine isso rodando 24h por dia enquanto você foca no que realmente importa: a clínica. Quando estiver pronto para parar de ser o gargalo do seu próprio sucesso, me avise que te mando o link para ativarmos sua versão digital. Vamos fazer esse teste agora?"

      [REGRAS DE CONDUTA]
      - Use o [CONTEXTO OCULTO] de forma cirúrgica. Não diga "li no seu site", diga "percebi que sua linha de trabalho foca em...".
      - Seja audaciosa. Se o site dele for ruim ou genérico, provoque-o a melhorar a imagem digital com a Numbly.
      - O link https://www.numbly.life/ só deve ser enviado se ele pedir para contratar ou quiser ver os preços.
    `;

    let dynamicSystemInstruction = systemInstruction;

    // Detecta URL na mensagem para scraping
    const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*|[a-zA-Z0-9.-]+\.(?:com|br|net|org|link|bio|me|app|site|psi)[^\s]*)/gi;
    const urlMatch = userMessage.match(urlRegex);

    if (urlMatch) {
      let url = urlMatch[0];
      url = url.replace(/[.,;!?]$/, '');
      if (!url.startsWith('http')) url = 'https://' + url;

      const siteContent = await scrapeWebsite(url);
      if (siteContent) {
        dynamicSystemInstruction += `\n\n[CONTEXTO OCULTO]: O usuário compartilhou o link do seu site/perfil (${url}). O sistema extraiu automaticamente este conteúdo de lá:\n"""\n${siteContent}\n"""\n\nUse essas informações sobre a especialidade, nome ou abordagem do psicólogo para guiar a conversa, elogiar o trabalho dele de forma sutil e mostrar que você entende o perfil dele.`;
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

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    let aiReply = "Desculpe, não consegui processar sua mensagem.";

    // TENTATIVA 1: GROQ (PRINCIPAL)
    try {
      if (!groqApiKey) throw new Error("GROQ_API_KEY não configurada.");

      const groqMessages = [{ role: "system", content: dynamicSystemInstruction }];
      contents.forEach(msg => {
        const textContent = msg.parts?.filter(p => p.text).map(p => p.text).join('\n') || "";
        if (textContent) {
          groqMessages.push({
            role: msg.role === "model" ? "assistant" : "user",
            content: textContent
          });
        }
      });

      const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      let groqData = null;

      for (const model of models) {
        try {
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model, messages: groqMessages, temperature: 0.7 })
          });
          if (groqResponse.ok) {
            groqData = await groqResponse.json();
            break;
          }
        } catch (e) {}
      }

      if (groqData) {
        aiReply = groqData.choices?.[0]?.message?.content || aiReply;
      } else {
        throw new Error("Groq falhou");
      }

    } catch (groqError) {
      console.error("Fallback Gemini ativado.");
      try {
        if (!geminiApiKey) throw new Error("GEMINI_API_KEY não configurada.");
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: dynamicSystemInstruction }] },
            contents: contents,
            generationConfig: { temperature: 0.7 }
          })
        });

        if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);
        const data = await response.json();
        aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || aiReply;
      } catch (e) {
        aiReply = "Estou com uma instabilidade momentânea. Por favor, tente novamente em instantes.";
      }
    }

    if (aiReply) {
      aiReply = aiReply.replace(/<function=.*?>.*?<\/function>/gi, '').trim();
      aiReply = aiReply.replace(/<function>.*?<\/function>/gi, '').trim();
    }

    contents.push({ role: "model", parts: [{ text: aiReply }] });
    const formattedReply = formatToWhatsApp(aiReply);
    const historyBase64 = Buffer.from(JSON.stringify(contents)).toString('base64');
    
    return NextResponse.json({
      resposta: formattedReply,
      historico: historyBase64
    });

  } catch (error) {
    console.error("Erro geral no Webhook:", error.message);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function formatToWhatsApp(text) {
  if (!text) return text;
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  formatted = formatted.replace(/^### (.*?)$/gm, '*$1*');
  formatted = formatted.replace(/^## (.*?)$/gm, '*$1*');
  formatted = formatted.replace(/^# (.*?)$/gm, '*$1*');
  return formatted;
}

async function scrapeWebsite(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, svg, img, video, header, footer, nav').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return `Título: ${$('title').text().trim()}\nConteúdo: ${text.substring(0, 2000)}`;
  } catch (err) {
    return null;
  }
}
