export async function GET() {
  return new Response(JSON.stringify({
    id: '845853128',
    first_name: 'Felipe',
    last_input_text: 'quanto custa o plano profissional?',
    whatsapp_phone: '+5513988658518',
    custom_fields: {},
  }), { headers: { 'Content-Type': 'application/json' } })
}
