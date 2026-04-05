import { useEffect, useRef, useState } from 'react'
import { FaUser, FaThumbsUp, FaThumbsDown } from "react-icons/fa6"
import { GiDeerHead } from "react-icons/gi"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const LOADING_MESSAGES = ['🤔 Düşünüyor...','🦌 Hacettepe kaynakları taranıyor...' ,'🧑‍🍳 Cevap üretiliyor...']

const ChatMessage = ({ sender, message, isPlaceholder, skipTypewriter, timestamp, apiVersion }) => {
    const [displayedMsg, setDisplayedMsg] = useState("")
    const [isTypingComplete, setIsTypingComplete] = useState(false)
    const [feedbackGiven, setFeedbackGiven] = useState(null) // null | 'Positive' | 'Negative'
    const timeoutRef = useRef(null)

    const V2_API_URL = import.meta.env.VITE_V2_API_URL
    const V2_API_KEY = import.meta.env.VITE_V2_API_KEY

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        if (sender === 'AI' && isPlaceholder) {
            // Cycling loading animation with slow dots
            let msgIndex = 0
            let charIndex = 0
            setDisplayedMsg('')
            setIsTypingComplete(false)

            const typeNext = () => {
                const currentMsg = LOADING_MESSAGES[msgIndex]
                if (charIndex < currentMsg.length) {
                    const char = currentMsg[charIndex]
                    setDisplayedMsg(currentMsg.slice(0, charIndex + 1))
                    charIndex++
                    timeoutRef.current = setTimeout(typeNext, char === '.' ? 220 : 45)
                } else {
                    // Pause, then start next message
                    timeoutRef.current = setTimeout(() => {
                        msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length
                        charIndex = 0
                        setDisplayedMsg('')
                        typeNext()
                    }, 700)
                }
            }
            typeNext()

            return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }

        } else if (sender === 'AI' && !skipTypewriter) {
            // Greeting message — one-time typewriter
            setDisplayedMsg('')
            setIsTypingComplete(false)
            let charIndex = 0
            const interval = setInterval(() => {
                setDisplayedMsg(message.slice(0, charIndex + 1))
                charIndex++
                if (charIndex >= message.length) {
                    clearInterval(interval)
                    setIsTypingComplete(true)
                }
            }, 25)
            return () => clearInterval(interval)

        } else {
            // Instant display — real AI responses, history, human messages
            setDisplayedMsg(message)
            setIsTypingComplete(true)
        }
    }, [message])

    const sendFeedback = async (feedbackValue) => {
        if (feedbackGiven) return
        setFeedbackGiven(feedbackValue)
        const sessionId = localStorage.getItem('v2_session_id')
        try {
            await fetch(V2_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': V2_API_KEY,
                },
                body: JSON.stringify({
                    action: 'feedback',
                    session_id: sessionId,
                    timestamp: timestamp,
                    feedback_value: feedbackValue,
                })
            })
        } catch (error) {
            console.error('Feedback error:', error)
            setFeedbackGiven(null)
        }
    }

    const showFeedback = sender === 'AI' && !isPlaceholder && isTypingComplete && apiVersion === 'v2' && timestamp

    return (
        <div className="w-full max-w-5xl p-2 mb-2 flex items-start text-tertiary bg-black rounded-lg">
            {sender === 'AI' && <GiDeerHead className={`flex-shrink-0 w-8 mr-2 mt-1 text-2xl ${isPlaceholder ? 'text-[#9ca3af]' : 'text-secondary'}`} />}
            {sender === 'Human' && <FaUser className="flex-shrink-0 w-8 mr-2 mt-1 text-2xl" />}
            <div className="flex flex-col flex-1">
                {sender === 'AI' ? (
                    isPlaceholder ? (
                        <p className="text-[#9ca3af]">{displayedMsg}</p>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {displayedMsg}
                            </ReactMarkdown>
                        </div>
                    )
                ) : (
                    <p>{displayedMsg}</p>
                )}
                {showFeedback && (
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => sendFeedback('Positive')}
                            disabled={feedbackGiven !== null}
                            className={`p-1.5 rounded transition-colors duration-200 focus:outline-none ${
                                feedbackGiven === 'Positive'
                                    ? 'text-secondary'
                                    : feedbackGiven !== null
                                    ? 'text-[#4b5563] cursor-not-allowed'
                                    : 'text-[#9ca3af] hover:text-secondary'
                            }`}
                        >
                            <FaThumbsUp />
                        </button>
                        <button
                            onClick={() => sendFeedback('Negative')}
                            disabled={feedbackGiven !== null}
                            className={`p-1.5 rounded transition-colors duration-200 focus:outline-none ${
                                feedbackGiven === 'Negative'
                                    ? 'text-secondary'
                                    : feedbackGiven !== null
                                    ? 'text-[#4b5563] cursor-not-allowed'
                                    : 'text-[#9ca3af] hover:text-secondary'
                            }`}
                        >
                            <FaThumbsDown />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatMessage
