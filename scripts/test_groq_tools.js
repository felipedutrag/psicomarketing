const groqApiKey = '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';

async function testGroqTools() {
  const dynamicSystemInstruction = `Você é uma assistente virtual da PsicoMarketing. Hoje é ${new Date().toISOString().split('T')[0]}. Você tem acesso à agenda via ferramentas. Sempre que o usuário perguntar sobre horários, você DEVE usar a ferramenta get_available_times.`;
  
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
    }
  ];

  const messages = [
    { role: "system", content: dynamicSystemInstruction },
    { role: "user", content: "Quais horários vocês têm disponíveis para a semana que vem?" }
  ];

  console.log('Testando Groq Tool Calling (Llama 3.3 70B)...');
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: groqTools,
        tool_choice: "auto"
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (data.choices?.[0]?.message?.tool_calls) {
      console.log('✅ SUCESSO: O Groq identificou a necessidade de chamar a ferramenta!');
    } else {
      console.log('❌ FALHA: O Groq não chamou a ferramenta.');
    }
  } catch (e) {
    console.error('Erro no teste:', e.message);
  }
}

testGroqTools();
