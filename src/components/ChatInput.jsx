import { FaArrowUp, FaTrashCan } from "react-icons/fa6";
import { useState} from 'react';

const ACTIVE_BACKEND = import.meta.env.VITE_ACTIVE_BACKEND || 'institutional'
const TUNCAHOCA_API_URL = import.meta.env.VITE_TUNCAHOCA_API_URL
const TUNCAHOCA_API_KEY = import.meta.env.VITE_TUNCAHOCA_API_KEY
const INSTITUTIONAL_API_URL = import.meta.env.VITE_INSTITUTIONAL_API_URL
const INSTITUTIONAL_API_KEY = import.meta.env.VITE_INSTITUTIONAL_API_KEY

const ChatInput = ({chatHistory, setChatHistory, language}) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        // Retrieve session_id from localStorage or default to null (tunca-hoca only)
        const savedSessionId = localStorage.getItem('v2_session_id');
        return savedSessionId ? savedSessionId : null;
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          sendPrompt()
        }
      }

      const sendPrompt = async () => {
        if(loading) return
        if (inputValue === '') return

        const currentQuestion = inputValue
        setInputValue('')
        setLoading(true)

        if(chatHistory.length >= 30){
            let maxLimitEN = "You have reached the maximum chat history limit. Please clear the chat history to continue."
            let maxLimitTR = "Maksimum mesaj sınırına ulaştınız. Devam etmek için lütfen sohbet geçmişini temizleyin."
            alert(language === 'EN' ? maxLimitEN : maxLimitTR)
            setLoading(false)
            return
        }

        // Add the human message
        setChatHistory(prevHistory => [...prevHistory, { sender: 'Human', message: currentQuestion }])

        // Add a placeholder for the AI response
        const aiMessageId = Date.now();
        setChatHistory(prevHistory => [
            ...prevHistory,
            {
                id: aiMessageId,
                sender: 'AI',
                message: language === 'EN' ? 'Thinking...🤔' : 'Hmm...🤔',
                isPlaceholder: true
            }
        ])

        try {
            let responseText
            let timestamp
            let response

            if (ACTIVE_BACKEND === 'institutional') {
                response = await fetch(INSTITUTIONAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': INSTITUTIONAL_API_KEY,
                    },
                    body: JSON.stringify({ question: currentQuestion })
                })

                if (!response.ok) {
                    alert("We're sorry, but something went wrong. Please try again later.")
                    throw new Error('Network response was not ok')
                }

                const data = await response.json()
                // Triple-unwrap nested response from Bedrock Flow
                const outer = JSON.parse(data.result.body)
                const inner = JSON.parse(outer.result.body)
                const agentKey = Object.keys(inner.responses)[0]
                responseText = inner.responses[agentKey]
                timestamp = new Date().toISOString()

            } else {
                // tunca-hoca backend
                if (sessionId) {
                    console.log('Using existing session_id:', sessionId)
                } else {
                    console.log('No session_id found. A new session will be created.')
                }

                const requestBody = { prompt: currentQuestion }
                if (sessionId) requestBody.session_id = sessionId

                response = await fetch(TUNCAHOCA_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': TUNCAHOCA_API_KEY,
                    },
                    body: JSON.stringify(requestBody)
                })

                if (!response.ok) {
                    alert("We're sorry, but something went wrong. Please try again later.")
                    throw new Error('Network response was not ok')
                }

                const data = await response.json()
                responseText = data.response
                timestamp = data.timestamp

                if (data.session_id) {
                    setSessionId(data.session_id)
                    localStorage.setItem('v2_session_id', data.session_id)
                }
            }

            setChatHistory(prevHistory => prevHistory.map(message =>
                message.id === aiMessageId
                    ? { ...message, message: responseText, isPlaceholder: false, skipTypewriter: true, timestamp, question: currentQuestion }
                    : message
            ))

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    const clearChat = () => {
        if (confirm("Sohbet geçmişini temizlemek istediğine emin misiniz?") == true) {
            setChatHistory([])
            setSessionId(null)
            localStorage.removeItem('v2_session_id')
        }
      }

    return (
        <div className="flex justify-center items-center p-2 pt-0">
          <div className="flex items-center w-full max-w-3xl">
            <div className="flex-grow h-14">
              <input
                type="text"
                placeholder={language === 'EN' ? 'What would you like to know about Hacettepe?' : 'Hacettepe hakkında ne öğrenmek istersiniz?'}
                autoComplete='off'
                value={inputValue}
                onKeyDown={handleKeyDown}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full h-14 px-4 text-tertiary bg-black rounded-lg border-2 border-primary transition-colors duration-300 focus:border-secondary focus:outline-none"
              />
            </div>
            <div className="flex-shrink-0 ml-2 text-2xl">
              <button
              onClick={sendPrompt}
              className={`transition-all duration-300 p-2 rounded-md focus:outline-none focus:ring-2 ${loading ? 'bg-black text-secondary' : 'bg-secondary text-tertiary hover:bg-secondary-red '} `}>
                <FaArrowUp />
              </button>
            </div>
            <div className="flex-shrink-0 ml-2 text-2xl">
              <button
              onClick={clearChat}
              className="bg-black text-tertiary p-2 rounded-md transition-all hover:bg-opacity-20 duration-300 focus:outline-none focus:ring-2">
                <FaTrashCan />
              </button>
            </div>
          </div>
        </div>
      )
}

export default ChatInput
