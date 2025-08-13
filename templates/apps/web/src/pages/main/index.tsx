import { useState } from 'react'
import { trpc } from '../../app/trpc'

export function MainPage() {
  const utils = trpc.useUtils()
  const chatsQuery = trpc.listChats.useQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const chatQuery = trpc.getChat.useQuery(selectedId!, { enabled: !!selectedId })
  const createChat = trpc.createChat.useMutation({
    onSuccess: (c) => {
      utils.listChats.invalidate()
      setSelectedId(c.id)
    },
  })
  const sendMessage = trpc.sendMessage.useMutation({
    onSuccess: (c) => {
      utils.getChat.setData(c.id, c)
      utils.listChats.invalidate()
    },
  })

  const [message, setMessage] = useState('')

  const chats = chatsQuery.data ?? []
  const chat = chatQuery.data ?? undefined

  const onNewChat = () => {
    createChat.mutate({})
  }

  const onSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedId) return
    sendMessage.mutate({ chatId: selectedId, content: message.trim() })
    setMessage('')
  }

  return (
    <div className="container" role="main">
      <header>
        <h1>__PROJECT_NAME__</h1>
      </header>
      <div className="row" style={{ gap: 16 }}>
        <aside style={{ width: 280 }}>
          <button onClick={onNewChat}>New chat</button>
          {chatsQuery.isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="list">
              {chats.map((c: any) => (
                <li
                  key={c.id}
                  className={`card ${selectedId === c.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="text">{c.title}</div>
                  <div className="row">
                    <span className="dim">{new Date(c.updatedAt).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main style={{ flex: 1 }}>
          {!selectedId ? (
            <p>Select a chat to begin.</p>
          ) : chatQuery.isLoading ? (
            <p>Loading chat...</p>
          ) : chat ? (
            <div className="col" style={{ gap: 12 }}>
              <div className="col" style={{ gap: 8 }}>
                {chat.messages.map((m: any) => (
                  <div key={m.id} className={`card role-${m.role}`}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong>{m.role}</strong>
                      <span className="dim">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text">{m.content}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={onSend} className="inputRow">
                <input
                  placeholder="Send a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}


