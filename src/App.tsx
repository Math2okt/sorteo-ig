import { useEffect, useState, useRef } from 'react'
import iconImg from './assets/image.png'
import bannerImg from './assets/banner.png'
import './App.css'

type Comment = {
  id: string
  username: string
  text: string
  like_count: number | null
  created_at: number
}

function App() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Comment | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    fetch('/listComments.json')
      .then((res) => res.json())
      .then((data: Comment[]) => {
        const mentionRegex = /@([\w.]+)/g

        const userMap = new Map<
          string,
          { comments: Comment[]; mentions: Set<string>; seenPatterns: Set<string> }
        >()

        for (const comment of data) {
          const username = comment.username
          if (!userMap.has(username)) {
            userMap.set(username, { comments: [], mentions: new Set(), seenPatterns: new Set() })
          }
          const entry = userMap.get(username)!

          const commentMentions: string[] = []
          for (const m of comment.text.matchAll(mentionRegex)) {
            const mentioned = m[1]
            if (mentioned !== username) {
              commentMentions.push(mentioned)
              entry.mentions.add(mentioned)
            }
          }

          const pattern = [...commentMentions].sort().join(',')
          if (!entry.seenPatterns.has(pattern)) {
            entry.seenPatterns.add(pattern)
            entry.comments.push(comment)
          }
        }

        const valid = Array.from(userMap.values())
          .filter((e) => e.mentions.size >= 2)
          .flatMap((e) => e.comments)

        setComments(valid)
        setCurrentIndex(Math.floor(Math.random() * valid.length))
        setLoading(false)
      })
  }, [])

  const spin = () => {
    if (spinning || comments.length === 0) return
    setSpinning(true)
    setWinner(null)

    const phases = [
      { duration: 1200, interval: 50 },
      { duration: 1000, interval: 120 },
      { duration: 800, interval: 250 },
      { duration: 600, interval: 450 },
    ]

    let phaseIndex = 0
    let timeouts: number[] = []

    const runPhase = () => {
      if (phaseIndex >= phases.length) {
        const idx = Math.floor(Math.random() * comments.length)
        setCurrentIndex(idx)
        setWinner(comments[idx])
        setSpinning(false)
        return
      }

      const phase = phases[phaseIndex]
      const id = window.setInterval(() => {
        setCurrentIndex(Math.floor(Math.random() * comments.length))
      }, phase.interval)
      intervalRef.current = id

      const tid = window.setTimeout(() => {
        window.clearInterval(id)
        intervalRef.current = null
        phaseIndex++
        runPhase()
      }, phase.duration)
      timeouts.push(tid)
    }

    runPhase()
  }

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Cargando comentarios...</p>
      </div>
    )
  }

  return (
    <div className="layout">
      <div className="banner-col">
        <img src={bannerImg} className="banner-img" alt="" />
      </div>
      <div className="raffle-col">
        <img src={iconImg} className="icon-img" alt="" />
        <h1>Sorteo</h1>
        {/* <p className="subtitle">{comments.length} participantes</p> */}

        <div className="card">
          <div className="comment">
            <span className={`username ${spinning ? 'blink' : ''}`}>
              @{comments[currentIndex].username}
            </span>
            <span className={`text ${spinning ? 'blink' : ''}`}>
              {comments[currentIndex].text}
            </span>
          </div>
        </div>

        <button
          className={`btn ${spinning ? 'spinning-btn' : ''}`}
          onClick={spin}
          disabled={spinning}
        >
          {spinning ? 'Sorteando...' : winner ? 'Nuevo sorteo' : '¡Sortear!'}
        </button>

        {winner && (
          <div className="winner-box">
            <span className="winner-label">Ganador</span>
            <span className="winner-name">@{winner.username}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
