const axios = require('axios');

// Configuração da API do ManyChat
const API_KEY = '4890996:1e0f743abaf5e84ed31e9773b7c3196d';
const BASE_URL = 'https://api.manychat.com/fb/subscriber/createSubscriber';

async function addSubscriber(firstName, lastName, phone, gender) {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        gender: gender,
        has_opt_in_sms: true,
        has_opt_in_email: true
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('--- SUBSCRIBER ADICIONADO COM SUCESSO ---');
    console.log('ID do Lead:', response.data.data.id);
  } catch (err) {
    console.error('Erro ao adicionar lead no ManyChat:', err.response?.data || err.message);
  }
}

// Exemplo de uso: addSubscriber('Felipe', 'Advogado', '5511999999999', 'male');

module.exports = { addSubscriber };
