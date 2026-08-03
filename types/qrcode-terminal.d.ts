declare module 'qrcode-terminal' {
  export function generate(
    text: string,
    options?: {
      small?: boolean
      colors?: boolean
      level?: 'L' | 'M' | 'Q' | 'H'
    },
    callback?: (qrcode: string) => void
  ): void

  export function toDataURL(
    text: string,
    options?: {
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
      margin?: number
      width?: number
      color?: { dark?: string; light?: string }
    }
  ): Promise<string>
}
