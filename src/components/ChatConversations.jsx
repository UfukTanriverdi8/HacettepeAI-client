import {useRef, useEffect} from 'react';
import ChatMessage from './ChatMessage';


const ChatConversations = ({ chatHistory, language, apiVersion }) => {

    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; // Scroll to bottom
        }
      }, [chatHistory]);

    const greetingMsg = language === 'EN' ? 'Hello! How can I help you today?' : 'Merhaba! Bugün size nasıl yardımcı olabilirim?';
  return (
    
    <div ref={chatContainerRef} className='flex flex-col items-center p-4 overflow-y-auto h-full scroll-container'>
        <ChatMessage sender='AI' message={greetingMsg} isPlaceholder={false} />
      {chatHistory.map((chat, index) => (
        <ChatMessage key={index} sender={chat.sender} message={chat.message} isPlaceholder={chat.isPlaceholder} skipTypewriter={chat.skipTypewriter} timestamp={chat.timestamp} apiVersion={apiVersion}/>
      ))}
    </div>
  );
};

export default ChatConversations;