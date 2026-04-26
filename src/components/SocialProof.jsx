import { useState, useEffect } from 'react'
import './SocialProof.css'

const EVENTS = [
  { city: 'São Paulo', action: 'acabou de ativar um robô Sarah' },
  { city: 'Rio de Janeiro', action: 'gerou 15 novos leads na última hora' },
  { city: 'Belo Horizonte', action: 'migrou para o Plano Agência' },
  { city: 'Curitiba', action: 'realizou uma venda via PIX agora' },
  { city: 'Salvador', action: 'conectou uma nova instância' },
  { city: 'Fortaleza', action: 'recebeu 50 mensagens em 10 minutos' }
]

export default function SocialProof() {
  const [currentEvent, setCurrentEvent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showEvent = () => {
      const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)]
      setCurrentEvent(randomEvent)
      setVisible(true)

      setTimeout(() => {
        setVisible(false)
      }, 3500)
    }

    const timer = setInterval(() => {
      showEvent()
    }, 20000)

    // Show first one after 3 seconds
    const firstTimer = setTimeout(showEvent, 3000)

    return () => {
      clearInterval(timer)
      clearTimeout(firstTimer)
    }
  }, [])

  if (!currentEvent) return null

  return (
    <div className={`social-proof-toast ${visible ? 'active' : ''}`}>
      <div className="toast-icon">⚡</div>
      <div className="toast-content">
        <p><strong>Alguém em {currentEvent.city}</strong></p>
        <p>{currentEvent.action}</p>
      </div>
    </div>
  )
}
