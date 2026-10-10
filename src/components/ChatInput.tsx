import { ArrowUp } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import type { Language, Message, StreamEvent } from '../types';

export interface ChatInputHandle {
    setValueAndFocus: (value: string) => void
}

const ERROR_MESSAGE = {
    EN: 'Sorry, something went wrong. Please try again.',
    TR: 'Üzgünüm, bir şeyler ters gitti. Lütfen tekrar deneyin.',
}

interface ChatInputProps {
    chatHistory: Message[]
    setChatHistory: Dispatch<SetStateAction<Message[]>>
    sessionId: string | null
    setSessionId: (sessionId: string | null) => void
    language: Language
    chatUrl: string
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
    ({ chatHistory, setChatHistory, sessionId, setSessionId, language, chatUrl }, ref) => {
        const [inputValue, setInputValue] = useState('')
        const [loading, setLoading] = useState(false)
        const inputRef = useRef<HTMLInputElement>(null)

        useImperativeHandle(ref, () => ({
            setValueAndFocus: (value: string) => {
                setInputValue(value)
                requestAnimationFrame(() => {
                    const input = inputRef.current
                    if (input) {
                        input.focus()
                        input.setSelectionRange(value.length, value.length)
                    }
                })
            }
        }))

        const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            if (loading) return
            if (inputValue.trim() === '') return

            const currentQuestion = inputValue
            setInputValue('')
            setLoading(true)

            if (chatHistory.length >= 30) {
                const maxLimitEN = 'This chat has reached its message limit. Start a new chat to keep asking.'
                const maxLimitTR = 'Bu sohbet mesaj sınırına ulaştı. Sormaya devam etmek için yeni bir sohbet başlatın.'
                toast.info(language === 'EN' ? maxLimitEN : maxLimitTR, {
                    position: 'top-center',
                    className: 'custom-toast'
                })
                setInputValue(currentQuestion)
                setLoading(false)
                return
            }

            setChatHistory(prevHistory => [
                ...prevHistory,
                { sender: 'Human', message: currentQuestion }
            ])

            const aiMessageId = Date.now()
            setChatHistory(prevHistory => [
                ...prevHistory,
                {
                    id: aiMessageId,
                    sender: 'AI',
                    message: language === 'EN' ? 'Thinking...🤔' : 'Hmm...🤔',
                    isPlaceholder: true
                }
            ])

            const patchAiMessage = (patch: Partial<Message>) =>
                setChatHistory(prevHistory => prevHistory.map(message =>
                    message.id === aiMessageId ? { ...message, ...patch } : message
                ))

            let activeSessionId = sessionId
            let answer = ''
            let lastStatus: string | null = null
            let errorShown = false

            const handleEvent = (event: StreamEvent) => {
                switch (event.type) {
                    case 'session':
                        activeSessionId = event.session_id
                        setSessionId(event.session_id)
                        localStorage.setItem('session_id', event.session_id)
                        break
                    case 'status':
                        lastStatus = event.message
                        patchAiMessage({ status: lastStatus })
                        break
                    case 'token':
                        answer += event.text
                        patchAiMessage({ message: answer, isPlaceholder: false, status: null })
                        break
                    case 'discard':
                        answer = ''
                        patchAiMessage({ message: '', isPlaceholder: true, status: lastStatus })
                        break
                    case 'sources':
                        patchAiMessage({ sources: event.sources, citations: event.citations })
                        break
                    case 'done':
                        patchAiMessage({ timestamp: event.timestamp, session_id: activeSessionId })
                        break
                    case 'error':
                        errorShown = true
                        console.error(event.message)
                        patchAiMessage({
                            message: ERROR_MESSAGE[language],
                            isPlaceholder: false,
                            status: null
                        })
                        break
                }
            }

            try {
                const response = await fetch(chatUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: currentQuestion,
                        ...(activeSessionId && { session_id: activeSessionId })
                    })
                })

                if (!response.ok || !response.body) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() ?? ''

                    for (const line of lines) {
                        if (line.trim()) handleEvent(JSON.parse(line) as StreamEvent)
                    }
                }

                buffer += decoder.decode()
                if (buffer.trim()) handleEvent(JSON.parse(buffer) as StreamEvent)
            } catch (error) {
                console.error('Error:', error)
                if (!errorShown) {
                    patchAiMessage({
                        message: ERROR_MESSAGE[language],
                        isPlaceholder: false,
                        status: null
                    })
                }
            } finally {
                setLoading(false)
            }
        }

        const label = language === 'EN'
            ? 'What would you like to know about Hacettepe?'
            : 'Hacettepe hakkında ne öğrenmek istersiniz?'

        return (
            <form
                onSubmit={sendPrompt}
                className="flex items-center gap-2 rounded-[22px] border bg-muted py-1.5 pr-1.5 pl-4 transition-colors focus-within:border-primary/50"
            >
                <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    aria-label={label}
                    placeholder={label}
                    autoComplete="off"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none sm:text-[15px]"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={loading || inputValue.trim() === ''}
                    aria-label={language === 'EN' ? 'Send' : 'Gönder'}
                    className="size-9 rounded-full"
                >
                    <ArrowUp className="size-[18px]" strokeWidth={2.2} />
                </Button>
            </form>
        )
    },
)

ChatInput.displayName = 'ChatInput'

export default ChatInput
