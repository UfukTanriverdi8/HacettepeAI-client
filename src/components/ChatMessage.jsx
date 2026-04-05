import { useEffect, useRef, useState } from 'react'
import { FaUser } from "react-icons/fa6"
import { GiDeerHead } from "react-icons/gi"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import FeedbackModal from './FeedbackModal'

const LOADING_MESSAGES = ['🤔 Düşünüyor...','🦌 Hacettepe kaynakları taranıyor...' ,'🧑‍🍳 Cevap üretiliyor...']

const ChatMessage = ({ sender, message, isPlaceholder, skipTypewriter, timestamp, question, language }) => {
    const [displayedMsg, setDisplayedMsg] = useState("")
    const [isTypingComplete, setIsTypingComplete] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const timeoutRef = useRef(null)

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

    const showFeedbackButton = sender === 'AI' && !isPlaceholder && isTypingComplete && timestamp && !feedbackSubmitted

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
                {showFeedbackButton && (
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="mt-2 text-xs text-[#9ca3af] hover:text-secondary transition-colors duration-200 self-start"
                    >
                        💬 {language === 'TR' ? 'Geri bildirimde bulun' : 'Give feedback'}
                    </button>
                )}
                {showFeedbackModal && (
                    <FeedbackModal
                        onClose={(submitted) => {
                            setShowFeedbackModal(false)
                            if (submitted) setFeedbackSubmitted(true)
                        }}
                        question={question}
                        answer={message}
                        timestamp={timestamp}
                        language={language}
                    />
                )}
            </div>
        </div>
    )
}

export default ChatMessage
