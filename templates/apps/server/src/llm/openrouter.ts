import OpenAI from 'openai'

type LLMConfig = { apiKey?: string; model?: string; temperature?: number }

export function createLLM(cfg: LLMConfig) {
  const hasKey = !!cfg.apiKey
  const client = hasKey
    ? new OpenAI({ apiKey: cfg.apiKey, baseURL: 'https://openrouter.ai/api/v1' })
    : null

  async function completeChat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
    if (!client) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      return lastUser ? `You said: ${lastUser.content}` : 'Hello!'
    }
    try {
      const completion = await client.chat.completions.create({
        model: cfg.model ?? 'openrouter/auto',
        temperature: cfg.temperature ?? 0.3,
        messages,
      })
      const content = completion.choices?.[0]?.message?.content ?? ''
      return content
    } catch {
      return 'Sorry, I could not generate a reply.'
    }
  }
  return { completeChat }
}


