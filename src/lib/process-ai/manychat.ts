import { sendMessage, sendMessageWithButtons, type Button } from '@/lib/manychat'

export { type Button }

export async function mcSendMessage(userId: string, text: string) {
  console.log('[MC_SEND_MSG]', userId, text.substring(0, 100))
  return sendMessage(userId, text)
}

export async function mcSendMessageWithButtons(userId: string, text: string, buttons: Button[]) {
  console.log('[MC_SEND_MSG_BTNS]', userId, text.substring(0, 100), buttons)
  return sendMessageWithButtons(userId, text, buttons)
}