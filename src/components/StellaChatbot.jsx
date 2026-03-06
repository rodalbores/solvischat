import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, Languages } from 'lucide-react';

// Detect language from text
const detectLanguage = (text) => {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  const spanishIndicators = /[áéíóúüñ¿¡]|(\b(hola|qué|cómo|dónde|cuándo|por qué|gracias|ayuda|necesito|quiero|tengo|puedo|hay)\b)/i;
  
  if (koreanRegex.test(text)) {
    return 'ko';
  }
  if (spanishIndicators.test(text)) {
    return 'es';
  }
  return 'en';
};

// Strip markdown emphasis markers so chat reads naturally.
const sanitizeAssistantText = (text) => String(text || '').replace(/\*\*/g, '');

export default function StellaChatbot() {
  const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === '1';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey there! 👋 I\'m Stella from Casa de la Familia.\n\nFeel free to chat with me in English, Spanish, or Korean - whatever\'s most comfortable for you. I\'m here to help with anything you need, whether it\'s finding services, learning about our programs, or just figuring out where to start.\n\nWhat brings you here today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stellaSystemPrompt = `You are Stella, a warm and caring support companion at Casa de la Familia. You talk like a real person - friendly, genuine, and conversational.

PERSONALITY & COMMUNICATION STYLE:
- Talk naturally like you're having a real conversation with someone, not reading from a script
- Use casual, warm language - contractions, natural phrases, and a friendly voice
- Show genuine empathy - acknowledge feelings before jumping to information
- Ask follow-up questions to understand what the person really needs
- Vary your responses - don't repeat the same phrases or structures
- Be concise - real people don't give lengthy bullet-point lists in casual conversation
- Use occasional gentle humor when appropriate (but be sensitive to serious topics)
- Say things like "I hear you", "That sounds really tough", "I'm glad you reached out"
- Avoid sounding like a FAQ bot or customer service script

LANGUAGE (VERY IMPORTANT):
- You're fluent in English, Spanish, and Korean
- ALWAYS detect the language the user writes in and respond in that SAME language
- Match their casual/formal tone too
- If they write in Spanish, respond entirely in Spanish (naturally, not translated-sounding)
- If they write in Korean, respond entirely in Korean (한국어) 
- If they mix languages, go with their dominant language

ABOUT CASA DE LA FAMILIA:
A non-profit founded in 1996 by Dr. Ana Nogales that helps trauma survivors with mental health services. Services are low-cost or free.

Services: Counseling (individual & family), crisis intervention (DART team), immigration evaluations (48-hr expedited available), domestic violence support, sexual assault support, trauma services.

Programs: Amor Sin Violencia, DART, Latina Power!, CalVCB, Immigration Evaluations, and more.

Offices: Santa Ana (1650 East 4th St), East LA (4609 E Cesar Chavez Ave), San Juan Capistrano (27221 D Ortega HWY). Also offer virtual services throughout California.

Phone: (877) 611-2272
Website: casadelafamilia.org

HOW TO RESPOND:
- If someone shares something difficult, acknowledge their feelings FIRST before offering help
- Don't dump all information at once - have a conversation, ask what they need
- When giving info, weave it naturally into conversation instead of listing bullets
- If someone seems in crisis, be gentle but clear about resources (911 for emergencies)
- Remember people might be scared, confused, or hurting - meet them where they are
- End with an open invitation to continue talking, not a formal sign-off

WHAT NOT TO DO:
- Don't use corporate/formal language like "I'd be happy to assist you with that"
- Don't give long formatted lists unless specifically asked
- Don't use markdown styling markers like **bold** or __underline__
- Don't repeat the phone number in every single response
- Don't start every response with "Thank you for reaching out"
- Don't sound like a chatbot - sound like a caring person
- Don't answer from memory when KB snippets are available from the server; prioritize KB-grounded facts

You're not a therapist - you're a friendly guide helping people find the right support at Casa de la Familia.`;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const animateAssistantResponse = async (fullText) => {
    const messageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const text = fullText || '';
    const hasSpaces = /\s/.test(text.trim());
    const tokens = hasSpaces
      ? (text.match(/\S+\s*/g) || [text])
      : Array.from(text);

    setMessages(prev => [
      ...prev,
      {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
    ]);

    let assembled = '';
    for (const token of tokens) {
      assembled += token;

      setMessages(prev => prev.map(msg => (
        msg.id === messageId ? { ...msg, content: assembled } : msg
      )));

      let delay = hasSpaces ? 68 : 42;
      if (/[.!?]\s*$/.test(token)) delay += 220;
      else if (/[,;:]\s*$/.test(token)) delay += 120;

      await sleep(delay);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    const detectedLanguage = detectLanguage(userInput);
    if (detectedLanguage !== language) {
      setLanguage(detectedLanguage);
    }
    const userMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: stellaSystemPrompt,
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userInput
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content.length > 0) {
        await animateAssistantResponse(sanitizeAssistantText(data.content[0].text));
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('API unavailable, unable to retrieve KB response:', error);
      const fallbackByLanguage = {
        en: "I'm having trouble reaching the knowledge base right now, so I don't want to give you an unreliable answer. Please try again in a moment, or call Casa de la Familia at (877) 611-2272 for immediate help.",
        es: "Ahora mismo tengo problemas para conectarme a la base de conocimiento, así que no quiero darte una respuesta poco confiable. Inténtalo de nuevo en un momento, o llama a Casa de la Familia al (877) 611-2272 para ayuda inmediata.",
        ko: "지금 지식베이스에 연결하는 데 문제가 있어 부정확한 답변을 드리고 싶지 않아요. 잠시 후 다시 시도하시거나, 즉시 도움이 필요하면 Casa de la Familia (877) 611-2272로 연락해 주세요."
      };
      const lang = detectLanguage(userInput);
      await animateAssistantResponse(sanitizeAssistantText(fallbackByLanguage[lang] || fallbackByLanguage.en));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      if (prev === 'en') return 'es';
      if (prev === 'es') return 'ko';
      return 'en';
    });
    
    const langMessages = {
      en: 'Switching to English! What\'s on your mind?',
      es: '¡Listo, hablemos en español! ¿Qué necesitas?',
      ko: '한국어로 대화할게요! 무엇이 궁금하세요?'
    };
    
    const nextLang = language === 'en' ? 'es' : language === 'es' ? 'ko' : 'en';
    
    const langMessage = {
      role: 'assistant',
      content: langMessages[nextLang],
      timestamp: new Date()
    };
    setMessages(prev => [...prev, langMessage]);
  };

  const languageMeta = {
    en: { flag: '🇺🇸', label: 'EN' },
    es: { flag: '🇪🇸', label: 'ES' },
    ko: { flag: '🇰🇷', label: 'KO' }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isEmbedMode ? 'transparent' : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
      fontFamily: '"Literata", "Georgia", serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isEmbedMode ? '0' : '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!isEmbedMode && (
        <>
          {/* Background decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.14) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }} />
        </>
      )}

      {/* Main chat container */}
      <div style={{
        width: '100%',
        maxWidth: isEmbedMode ? 'none' : '800px',
        height: isEmbedMode ? '100vh' : '85vh',
        maxHeight: isEmbedMode ? 'none' : '700px',
        background: isEmbedMode ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: isEmbedMode ? 'none' : 'blur(20px)',
        borderRadius: isEmbedMode ? '0' : '24px',
        boxShadow: isEmbedMode ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isEmbedMode ? 'none' : '1px solid rgba(139, 92, 246, 0.24)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          padding: isEmbedMode ? '16px 20px' : '24px 28px',
          borderBottom: '3px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0L0 20l20 20 20-20z\' fill=\'rgba(255,255,255,0.05)\'/%3E%3C/svg%3E")',
            backgroundSize: '40px 40px',
            opacity: 0.4,
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {!isEmbedMode && (
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #fff 0%, #fff9f0 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '3px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <Heart style={{ color: '#7c3aed', fill: '#7c3aed' }} size={28} />
                </div>
              )}
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: isEmbedMode ? '22px' : '26px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  Stella
                </h1>
                {!isEmbedMode && (
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                    Casa dela Familia Support
                  </p>
                )}
              </div>
            </div>
            {isEmbedMode ? (
              <button
                onClick={toggleLanguage}
                title={`Language: ${languageMeta[language].label}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: 1,
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.34)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                }}
              >
                <span aria-hidden="true">{languageMeta[language].flag}</span>
                <span>{languageMeta[language].label}</span>
              </button>
            ) : (
              <button
                onClick={toggleLanguage}
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Languages size={18} />
                {language === 'en' ? 'ES' : language === 'es' ? '한' : 'EN'}
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: isEmbedMode
              ? 'transparent'
              : 'linear-gradient(to bottom, rgba(255, 245, 231, 0.3) 0%, rgba(255, 248, 225, 0.5) 100%)'
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'slideIn 0.4s ease-out',
                animationDelay: `${index * 0.05}s`,
                animationFillMode: 'both'
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '16px 20px',
                  borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)',
                  color: message.role === 'user' ? '#ffffff' : '#2d2d2d',
                  boxShadow: message.role === 'user'
                    ? '0 4px 16px rgba(109, 40, 217, 0.32)'
                    : '0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: message.role === 'user' ? 'none' : '1px solid rgba(139, 92, 246, 0.18)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontFamily: '"Inter", sans-serif',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '16px 20px',
                borderRadius: '20px 20px 20px 4px',
                background: 'linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)',
                border: '1px solid rgba(139, 92, 246, 0.18)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  animation: 'typing 1.4s infinite'
                }} />
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  animation: 'typing 1.4s infinite 0.2s'
                }} />
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  animation: 'typing 1.4s infinite 0.4s'
                }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '20px 24px',
          background: isEmbedMode
            ? 'transparent'
            : 'linear-gradient(to top, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderTop: '1px solid rgba(139, 92, 246, 0.18)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'en' ? "Type your message here..." : language === 'es' ? "Escribe tu mensaje aquí..." : "메시지를 입력하세요..."}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '16px',
                border: '2px solid rgba(139, 92, 246, 0.28)',
                fontSize: '15px',
                fontFamily: '"Inter", sans-serif',
                resize: 'none',
                minHeight: '52px',
                maxHeight: '120px',
                outline: 'none',
                background: '#ffffff',
                color: '#2d2d2d',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.28)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim()
                  ? 'linear-gradient(135deg, #cccccc 0%, #b0b0b0 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 20px',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: isLoading || !input.trim()
                  ? 'none'
                  : '0 4px 16px rgba(109, 40, 217, 0.35)',
                minWidth: '52px',
                minHeight: '52px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 40, 217, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isLoading || !input.trim()
                  ? 'none'
                  : '0 4px 16px rgba(109, 40, 217, 0.35)';
              }}
            >
              <Send style={{ color: '#ffffff' }} size={20} />
            </button>
          </div>
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            fontFamily: '"Inter", sans-serif'
          }}>
            {language === 'en'
              ? 'For immediate crisis support, call 911'
              : language === 'es'
              ? 'Para apoyo inmediato en crisis, llama al 911'
              : '긴급 위기 지원이 필요하시면 911에 전화하세요'}
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Literata:wght@400;700&family=Inter:wght@400;600;700&display=swap');
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        textarea::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.08);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
        }
      `}</style>
    </div>
  );
}
