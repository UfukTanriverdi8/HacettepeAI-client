import { FaArrowUp, FaTrashCan } from "react-icons/fa6";
import { useState} from 'react';


const ChatInput = ({chatHistory, setChatHistory, language, apiVersion}) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        // Retrieve session_id from localStorage or default to null
        const savedSessionId = localStorage.getItem('v2_session_id');
        return savedSessionId ? savedSessionId : null;
    });
    // use environment variables for API key and URL
    const API_KEY = import.meta.env.VITE_API_KEY;
    const API_URL = import.meta.env.VITE_API_URL;
    const V2_API_URL = import.meta.env.VITE_V2_API_URL;
    const V2_API_KEY = import.meta.env.VITE_V2_API_KEY;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault() // Prevent the default behavior (e.g., form submission)
          sendPrompt()
        }
      }
      const sendPrompt = async () => {
        if(loading){
            return
        }
        //console.log('Send button clicked')
        if (inputValue === '') {
            //console.log("No message to send")
            return
        }
        //console.log('Message:', inputValue)
        
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
        setChatHistory(prevHistory => [...prevHistory, { sender: 'Human', message: inputValue }])
        
        // Add a placeholder for the AI response
        const aiMessageId = Date.now(); // Unique ID for the placeholder
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
            //console.log(chatHistory)
            
            let response;
            if (apiVersion === 'v2') {
                // V2 API: Send prompt with session_id for memory
                if (sessionId) {
                    console.log('Using existing session_id:', sessionId);
                } else {
                    console.log('No session_id found. A new session will be created.');
                }
                
                // Build request body - only include session_id if it exists
                const requestBody = { prompt: inputValue };
                if (sessionId) {
                    requestBody.session_id = sessionId;
                }
                
                console.log('V2 API Request body:', requestBody);
                
                response = await fetch(V2_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': V2_API_KEY,
                        
                    },
                    body: JSON.stringify(requestBody)
                });
            } else {
                // V1 API: Original logic with chat history and API key
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': API_KEY
                    },
                    body: JSON.stringify({ "query": inputValue, "college_name": "hacettepe", "lang": language, "context": chatHistory  })
                });
            }
            
            if (!response.ok) {
                alert("We're sorry, but something went wrong. Please try again later.");
                throw new Error('Network response was not ok');
            }
    
            const data = await response.json()
    
            // Update the placeholder with the actual response
            // Handle different response formats for v1 and v2
            const responseText = apiVersion === 'v2' ? data.response : data.response.output.text;
            
            // Save session_id for v2 API
            if (apiVersion === 'v2' && data.session_id) {
                setSessionId(data.session_id);
                localStorage.setItem('v2_session_id', data.session_id);
            }
            
            setChatHistory(prevHistory => prevHistory.map(message =>
                message.id === aiMessageId
                    ? { ...message, message: responseText, isPlaceholder: false, skipTypewriter: true, timestamp: apiVersion === 'v2' ? data.timestamp : undefined }
                    : message
            ));
            
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }
    const clearChat = () => {
        //console.log('Clear button clicked')
        if (confirm("Sohbet geçmişini temizlemek istediğine emin misiniz?") == true) {
            setChatHistory([]) // Clear the chat history
            // Clear session_id for v2 API to start a new session
            setSessionId(null);
            localStorage.removeItem('v2_session_id');
        } else {
            //console.log("User cancelled the clear chat operation.")
            return
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