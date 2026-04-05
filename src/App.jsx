import Header from './components/Header'
import ChatConversations from './components/ChatConversations'
import ChatInput from './components/ChatInput'
import Footer from './components/Footer'
import InfoModal from './components/InfoModal'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

const App =  () => {
    const [openModal, setOpenModal] = useState(false)
    const toggleModal = () => {
        setOpenModal(!openModal)  // Toggle the modal's open state
    };

    const [chatHistory, setChatHistory] = useState(() => {
        // Retrieve chat history from localStorage or default to []
        const savedChatHistory = localStorage.getItem('chatHistory')
        if (savedChatHistory) {
            const parsed = JSON.parse(savedChatHistory)
            // Mark all loaded messages to skip typewriter effect
            return parsed.map(msg => ({ ...msg, skipTypewriter: true }))
        }
        return []
    })
    
    useEffect(() => {
        // Store chat history in localStorage when it changes
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
    }, [chatHistory])

    const [language, setLanguage] = useState(() => {
        // Retrieve language from localStorage or default to 'TR'
        const savedLanguage = localStorage.getItem('language')
        return savedLanguage ? savedLanguage : 'TR'
      })
    
      useEffect(() => {
        // Store language preference in localStorage when it changes
        localStorage.setItem('language', language)
      }, [language])

    const [apiVersion, setApiVersion] = useState(() => {
        // Retrieve API version from localStorage or default to 'v2'
        const savedApiVersion = localStorage.getItem('apiVersion')
        return savedApiVersion ? savedApiVersion : 'v2'
      })
    
      useEffect(() => {
        // Store API version preference in localStorage when it changes
        localStorage.setItem('apiVersion', apiVersion)
      }, [apiVersion])

    const handleApiVersionChange = () => {
        const newVersion = apiVersion === 'v1' ? 'v2' : 'v1'
        setApiVersion(newVersion)
        
        // Clear session_id when switching API versions
        localStorage.removeItem('v2_session_id')
        
        toast.dismiss()
        toast.success(`API version changed to ${newVersion.toUpperCase()}!`, {
          position: "top-left",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          draggable: true,
          pauseOnHover: false,
          progress: undefined,
          className: 'custom-toast'
        })
    }

    const enLangChange = "Language changed to English! Chat will be in English too!"
    const trLangChange = "Dil Türkçeye değiştirildi! Cevaplar Türkçe olacak."
    const langChangeInfoMsgEN = "Are you sure you want to change the language? This action will clear your chat history."
    const langChangeInfoMsgTR = "Dili değiştirmek istediğinizden emin misiniz? Bu eylem sohbet geçmişinizi silecek."
    const handleLanguageChange = () => {
        const langChangeInfoMsg = language === 'EN' ? langChangeInfoMsgEN : langChangeInfoMsgTR
        if(chatHistory.length > 0){
            if(confirm(langChangeInfoMsg) == true){
                changeLanguage()
            } else {
                return
            }
        }else{
            changeLanguage()
        }

      }

      const changeLanguage = () => {
        setChatHistory([]) // Clear the chat history
        localStorage.removeItem('v2_session_id') // Clear session_id
        const newLang = language === 'EN' ? 'TR' : 'EN'
            setLanguage(newLang)
    
            toast.dismiss()
            // Show a toast notification
            toast.success(`${newLang === 'EN' ? enLangChange : trLangChange}`, {
              position: "top-left",
              autoClose: 3000,  // auto-close the toast after 3 seconds
              hideProgressBar: false,
              closeOnClick: true,
              draggable: true,
              pauseOnHover: false,
              progress: undefined,
              className: 'custom-toast'
            })
        }
      
    return (
    <div className="flex flex-col h-screen bg-primary text-tertiary">
        <Header className="fixed top-0 left-0 right-0" language={language} handleLanguageChange={handleLanguageChange} apiVersion={apiVersion} handleApiVersionChange={handleApiVersionChange}/>
        <div className="flex-grow overflow-auto scrollable max-h-full">
        <ChatConversations chatHistory={chatHistory} language={language} apiVersion={apiVersion} />
        </div>
        <ChatInput className="fixed" language={language} chatHistory={chatHistory} setChatHistory={setChatHistory} apiVersion={apiVersion} />
        {openModal && <InfoModal language={language} onClose={toggleModal} />}
        <Footer className="fixed bottom-0 left-0 right-0" onInfoClick={toggleModal} />
        <ToastContainer />
    </div>
    )
}

export default App
