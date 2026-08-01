import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function generateResponse(userText: string): Promise<string> {
  if (!genAI) return 'Desculpe, estou temporariamente indisponível. Em breve poderei ajudar!'
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(userText)
  return result.response.text()
}
