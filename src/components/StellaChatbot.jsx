import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, Languages } from 'lucide-react';

// FAQ Knowledge Base for offline responses
const faqData = [
  {
    keywords: ['what is', 'about', 'casa de la familia', 'cdlf', 'organization', 'who are you'],
    response: "Casa de la Familia (CDLF) is a 501(c)(3) non-profit organization dedicated to transforming victims of psychological trauma into survivors through mental health services. We were founded in 1996 by clinical psychologist Dr. Ana Nogales, and we're committed to providing compassionate, culturally sensitive care to those who need it most."
  },
  {
    keywords: ['founder', 'who founded', 'started', 'dr. nogales', 'ana nogales'],
    response: "Casa de la Familia was founded in 1996 by Dr. Ana Nogales, a clinical psychologist dedicated to serving trauma survivors. Under her leadership, we've grown to serve all of California with comprehensive mental health services."
  },
  {
    keywords: ['mission', 'purpose', 'goal'],
    response: "Our mission is to provide comprehensive, culturally sensitive psychological and psychiatric services to trauma survivors, particularly those in underserved communities. We believe everyone deserves access to quality mental health care, regardless of their financial situation."
  },
  {
    keywords: ['cost', 'price', 'how much', 'fee', 'payment', 'afford', 'expensive', 'free'],
    response: "Our services are offered at little to no cost, depending on the specifics of your case. We believe that financial barriers should never prevent someone from getting the help they need. Please call us at (877) 611-2272 to discuss your situation - we're here to help."
  },
  {
    keywords: ['language', 'spanish', 'español', 'english', 'bilingual'],
    response: "All of our services are available in both English and Spanish. Our entire staff is bilingual and bicultural, ensuring that language is never a barrier to receiving care. ¡Estamos aquí para ayudarte!"
  },
  {
    keywords: ['area', 'serve', 'location', 'where', 'california', 'region'],
    response: "After nearly 30 years of growth, Casa de la Familia now serves all of California! We have physical offices in Santa Ana, East Los Angeles, and San Juan Capistrano, and we also offer virtual services so you can receive care from anywhere in the state."
  },
  {
    keywords: ['virtual', 'online', 'remote', 'telehealth', 'in person', 'visit'],
    response: "We offer both in-person and virtual services to meet your needs. You can visit one of our offices in Santa Ana, East Los Angeles, or San Juan Capistrano, or receive care through our secure telehealth platform from the comfort of your home."
  },
  {
    keywords: ['office', 'address', 'santa ana', 'los angeles', 'san juan capistrano'],
    response: "We have three convenient locations:\n\n📍 Santa Ana: 1650 East 4th Street, Santa Ana, CA 92701\n📍 East Los Angeles: 4609 East Cesar Chavez Ave, Los Angeles, CA 90022\n📍 San Juan Capistrano: 27221 D Ortega HWY, San Juan Capistrano, CA 92675\n\nCall (877) 611-2272 to schedule an appointment at any location."
  },
  {
    keywords: ['age', 'children', 'kids', 'youth', 'teens', 'adults', 'family', 'who can'],
    response: "We provide counseling services for all ages - children, youth, adults, and families. Our therapists specialize in working with people at every stage of life, and we offer both individual and family therapy options."
  },
  {
    keywords: ['type', 'counseling', 'therapy', 'services', 'what do you offer'],
    response: "We offer a range of services including:\n\n• Individual therapy\n• Family therapy\n• Empowering support groups\n• Crisis intervention\n• Trauma-focused care\n• Domestic violence support\n• Sexual assault services\n• Immigration evaluations\n\nAll services are provided by licensed professionals in English and Spanish."
  },
  {
    keywords: ['domestic violence', 'abuse', 'dart', 'violent', 'partner'],
    response: "Yes, we offer specialized support for domestic violence survivors. Our DART (Domestic Abuse Response Team) program pairs certified counselors with specially trained police units for immediate crisis intervention. We provide safe, confidential support to help you through this difficult time. If you're in immediate danger, please call 911. Otherwise, reach us at (877) 611-2272."
  },
  {
    keywords: ['trauma', 'ptsd', 'traumatic'],
    response: "Trauma recovery is at the heart of what we do. We provide specialized, trauma-informed care for survivors of various traumatic experiences, including domestic violence, sexual assault, and other psychological trauma. Our compassionate therapists are here to support your healing journey."
  },
  {
    keywords: ['sexual assault', 'rape', 'sexual abuse'],
    response: "We provide specialized, compassionate care for survivors of sexual assault. Our trained counselors offer a safe, confidential space for healing. You are not alone, and what happened is not your fault. Please call us at (877) 611-2272 - we're here to support you."
  },
  {
    keywords: ['immigration', 'evaluation', 'legal', 'visa', 'asylum'],
    response: "Yes, we provide legal counseling and immigration evaluation reports. These psychological evaluations can support your immigration case. We also offer expedited reports that can be delivered within 48 hours for an additional fee. Call (877) 611-2272 to learn more about this service."
  },
  {
    keywords: ['48 hour', 'expedited', 'fast', 'urgent', 'quick evaluation'],
    response: "Yes! We offer expedited immigration evaluation reports that can be delivered within 48 hours for an additional fee. This service is available for those who have urgent deadlines for their immigration cases. Call (877) 611-2272 to arrange an expedited evaluation."
  },
  {
    keywords: ['amor sin violencia', 'latina power', '13 reasons', 'program'],
    response: "We offer several specialized programs including:\n\n• Amor Sin Violencia - Domestic violence support\n• Latina Power! - Empowerment program\n• 13 Reasons Why - Youth mental health\n• DART - Crisis intervention team\n• CalVCB - Victim compensation assistance\n\nCall (877) 611-2272 to learn which program is right for you."
  },
  {
    keywords: ['training', 'professional', 'certification', 'domestic violence training'],
    response: "Yes! We offer professional training programs including:\n\n• 40-Hour Domestic Violence Training\n• 12-Hour Domestic Violence Training\n\nThese certifications are valuable for professionals working in related fields. Contact us at (877) 611-2272 for training schedules and registration."
  },
  {
    keywords: ['contact', 'phone', 'call', 'reach', 'number', 'help'],
    response: "You can reach Casa de la Familia at (877) 611-2272. Our caring staff is ready to help you access the services you need. Don't hesitate to call - taking this step is an act of courage, and we're here to support you."
  },
  {
    keywords: ['patient portal', 'manage', 'account', 'login'],
    response: "Yes! Current patients can manage their care through our Patient Portal on our website at casadelafamilia.org. The portal allows you to access your information and stay connected with your care team."
  },
  {
    keywords: ['donate', 'support', 'give', 'contribution', 'help organization'],
    response: "Thank you for wanting to support our mission! You can help by making a donation, which funds emergency assistance and therapy for those in need. You can also volunteer your time. Visit casadelafamilia.org or call (877) 611-2272 to learn about ways to give back."
  },
  {
    keywords: ['volunteer', 'career', 'job', 'work', 'intern', 'summer'],
    response: "We offer opportunities for counseling careers and summer volunteer positions! If you're passionate about helping trauma survivors and want to make a difference, we'd love to hear from you. Visit our website at casadelafamilia.org or call (877) 611-2272 to learn about current opportunities."
  },
  {
    keywords: ['crisis', 'emergency', 'immediate', 'urgent', 'danger', 'suicide', 'harm'],
    response: "If you're in immediate danger, please call 911 right away.\n\nFor crisis support, you can reach Casa de la Familia at (877) 611-2272.\n\nNational Suicide Prevention Lifeline: 988\n\nYou matter, and help is available. Please reach out - you don't have to face this alone."
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'hola'],
    response: "Hello! I'm Stella, your virtual support companion from Casa de la Familia. I'm here to help you learn about our services and connect you with the support you need. What can I help you with today?"
  },
  {
    keywords: ['thank', 'thanks', 'gracias', 'appreciate'],
    response: "You're very welcome! Remember, reaching out takes courage, and we're honored to support you. If you have any other questions or need to speak with someone, please call us at (877) 611-2272. Take care of yourself. 💜"
  },
  // Detailed Service Information
  {
    keywords: ['immigration service', 'immigration help', 'legal immigration', 'immigration support', 'immigration counseling', 'deportation', 'undocumented'],
    response: "Our Immigration Services include:\n\n📋 **Legal Counseling** - Professional guidance for your immigration case\n\n📝 **Immigration Evaluation Reports** - Psychological evaluations critical for legal proceedings, including asylum cases, VAWA, U-Visa, and more\n\n⚡ **Expedited Service** - Need it fast? We offer 48-hour delivery for an additional fee\n\nThese services are part of our commitment to supporting underserved communities with culturally sensitive assistance. Our bilingual staff understands the unique challenges immigrants face.\n\nCall (877) 611-2272 to schedule your evaluation."
  },
  {
    keywords: ['domestic violence service', 'dv support', 'abuse help', 'abusive relationship', 'domestic abuse', 'partner violence', 'spouse abuse'],
    response: "We provide comprehensive support for domestic violence survivors:\n\n🚨 **DART (Domestic Abuse Response Team)**\nSpecially-trained officers paired with certified domestic violence counselors for immediate crisis intervention during emergencies.\n\n💪 **Specialized Programs**\n• Amor Sin Violencia (Love Without Violence)\n• Latina Power! - Empowerment program\n\n🤝 **Ongoing Support**\n• Advocacy services\n• Case management\n• Long-term mental health care\n• Safety planning\n\nYou don't have to face this alone. If you're in immediate danger, call 911. For support, call us at (877) 611-2272 - our services are confidential."
  },
  {
    keywords: ['dv training', 'domestic violence certification', 'counselor training', 'dv certification', 'become counselor', 'advocacy training', '40 hour', '12 hour'],
    response: "We offer professional Domestic Violence Training programs:\n\n📚 **40-Hour Domestic Violence Training**\nComprehensive certification for professionals working with DV survivors\n\n📖 **12-Hour Domestic Violence Training**\nFocused training for those needing foundational knowledge\n\nThese trainings cover crisis intervention, trauma-informed care, advocacy, and cultural sensitivity.\n\n⚠️ **Note:** Please contact us at (877) 611-2272 to verify current delivery formats (in-person vs. virtual) and upcoming training schedules."
  },
  {
    keywords: ['low cost therapy', 'affordable therapy', 'cheap counseling', 'sliding scale', 'therapy cost', 'can\'t afford', 'no insurance', 'payment options'],
    response: "Mental health care should be accessible to everyone. Here's what we offer:\n\n💰 **Cost Structure**\nServices at little to no cost - fees determined by your individual situation\n\n🧠 **Therapy Types**\n• Individual therapy (all ages)\n• Family therapy\n• Empowering support groups\n• Trauma-focused care\n\n🌐 **How to Access**\n• In-person at our Santa Ana, East LA, or San Juan Capistrano offices\n• Virtual services available throughout California\n\n🗣️ **Language**\nAll services in English and Spanish by bilingual/bicultural staff\n\nDon't let finances stop you from getting help. Call (877) 611-2272 to discuss your options."
  },
  {
    keywords: ['therapy types', 'what therapy', 'individual therapy', 'family therapy', 'group therapy', 'support group'],
    response: "We offer several types of therapeutic services:\n\n👤 **Individual Therapy**\nOne-on-one sessions with a licensed therapist, available for children, teens, and adults\n\n👨‍👩‍👧‍👦 **Family Therapy**\nHealing together - sessions designed to strengthen family bonds and improve communication\n\n👥 **Support Groups**\nEmpowering group sessions that foster healthy community bonding and shared healing\n\nAll therapy is:\n• Trauma-informed and culturally sensitive\n• Available in English and Spanish\n• Offered in-person or virtually\n• Provided at little to no cost\n\nCall (877) 611-2272 to find the right fit for you."
  },
  {
    keywords: ['dart program', 'dart team', 'crisis team', 'emergency response', 'police counselor'],
    response: "**DART - Domestic Abuse Response Team**\n\nDART is our specialized crisis intervention program that pairs:\n\n👮 Specially-trained police officers\n+\n💜 Certified domestic violence counselors\n\n**What DART Does:**\n• Responds to domestic violence emergencies\n• Provides immediate on-scene crisis intervention\n• Offers emotional support during traumatic moments\n• Connects survivors with ongoing resources\n• Ensures safety planning\n\nThis unique partnership ensures that survivors receive both protection and compassionate support when they need it most.\n\nIf you're in immediate danger, call 911. For ongoing support, call (877) 611-2272."
  },
  {
    keywords: ['amor sin violencia', 'love without violence'],
    response: "**Amor Sin Violencia (Love Without Violence)**\n\nThis is one of our specialized programs designed to support domestic violence survivors. The program provides:\n\n• Culturally sensitive counseling\n• Education about healthy relationships\n• Empowerment and healing support\n• Community connection\n\nThe program recognizes that everyone deserves love without fear, control, or violence. Our bilingual staff provides compassionate care in a safe environment.\n\nCall (877) 611-2272 to learn more about this program."
  },
  {
    keywords: ['latina power', 'women empowerment', 'latina program'],
    response: "**Latina Power!**\n\nThis empowerment program is specifically designed to support Latina women on their healing journey. The program focuses on:\n\n💪 Building strength and self-confidence\n🌟 Reclaiming personal power\n👭 Creating supportive community connections\n🌱 Personal growth and development\n\nOur bicultural staff understands the unique cultural experiences and challenges that Latina women face. All services are available in Spanish.\n\nCall (877) 611-2272 to join the Latina Power! program."
  },
  {
    keywords: ['virtual therapy', 'online therapy', 'telehealth', 'remote counseling', 'video therapy'],
    response: "**Virtual Services - Therapy From Anywhere in California**\n\nWe offer comprehensive telehealth options:\n\n💻 **What's Available Virtually:**\n• Individual therapy\n• Family therapy\n• Support groups\n• Initial consultations\n\n✅ **Benefits:**\n• Access care from home\n• No travel required\n• Same quality, licensed therapists\n• Flexible scheduling\n• Available throughout California\n\n🔒 **Secure & Confidential**\nOur virtual platform protects your privacy\n\nWhether you prefer in-person or virtual, we're here for you. Call (877) 611-2272 to schedule."
  },
  {
    keywords: ['case management', 'advocacy', 'long term', 'ongoing support'],
    response: "Beyond immediate crisis care, we provide ongoing support:\n\n📋 **Case Management**\n• Personalized care coordination\n• Help navigating systems and resources\n• Regular check-ins and progress support\n\n🗣️ **Advocacy Services**\n• Support with legal processes\n• Help accessing community resources\n• Assistance with housing, employment referrals\n\n🧠 **Long-Term Mental Health Care**\n• Continued therapy as needed\n• Support groups for ongoing healing\n• Family counseling services\n\nWe're committed to your long-term stability and well-being, not just crisis intervention. Call (877) 611-2272 to learn more."
  }
];

// Function to find the best matching FAQ response
const findFaqResponse = (userInput) => {
  const input = userInput.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const faq of faqData) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keyword matches are weighted higher
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch.response;
  }

  // Default response if no match found
  return "Thank you for reaching out. While I may not have the specific information you're looking for, I'd encourage you to call Casa de la Familia directly at (877) 611-2272. Our caring staff can answer your questions and help connect you with the right services.\n\nYou can also ask me about:\n• Our services and programs\n• Office locations\n• Cost of services\n• Immigration evaluations\n• Domestic violence support\n• How to get started";
};

export default function StellaChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! I\'m Stella, your virtual support companion from Casa de la Familia. I\'m here to help you learn about our services, programs, and resources. How can I assist you today?',
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

  const stellaSystemPrompt = `You are Stella, a compassionate and knowledgeable AI assistant for Casa de la Familia, a non-profit organization dedicated to helping trauma survivors and families in Southern California.

ORGANIZATION OVERVIEW:
Casa dela Familia (CDLF) is a 501(c)(3) non-profit founded in 1996 by Dr. Ana Nogales. They provide comprehensive, culturally sensitive psychological and psychiatric services to individuals and families affected by trauma, particularly in underserved communities.

KEY SERVICES:
1. Free and Low-Cost Counseling - Individual and family therapy for all ages in English and Spanish
2. Crisis Intervention - DART (Domestic Abuse Response Team) with specially trained officers and counselors
3. Legal Counseling - Immigration evaluation reports (48-hour expedited available)
4. Domestic Violence Support
5. Sexual Assault Support
6. Trauma Services
7. Enhanced Care Management

PROGRAMS:
- Amor Sin Violencia
- CalVCB (California Victim Compensation Board)
- DART (Domestic Abuse Response Team)
- De Sabios y Locos
- Immigration Evaluations
- Latina Power!
- Low Cost Counseling
- SSA (Sexual Assault Services)
- 13 Reasons Why

LOCATIONS:
- Santa Ana Office: 1650 East 4th Street, Santa Ana, CA 92701
- East Los Angeles Office: 4609 East Cesar Chavez Ave, Los Angeles, CA 90022
- San Juan Capistrano Office: 27221 D Ortega HWY, San Juan Capistrano, CA 92675

CONTACT:
- Phone: (877) 611-2272
- Website: https://casadelafamilia.org
- Spanish site: http://esp.casadelafamilia.org/

TRAININGS OFFERED:
- 40 Hour Domestic Violence Training
- 12 Hour Domestic Violence Training

YOUR ROLE AS STELLA:
- Be warm, empathetic, and supportive in all interactions
- Recognize that people reaching out may be in crisis or dealing with trauma
- Provide accurate information about services and programs
- Be bilingual-friendly and culturally sensitive
- Never minimize someone's experiences or concerns
- Offer resources and next steps for getting help
- Encourage people to call (877) 611-2272 for immediate assistance or crisis situations
- Remind people that services are available at little to no cost regardless of financial situation
- Emphasize confidentiality and safety
- Be respectful of privacy - don't ask intrusive questions
- If someone is in immediate danger, urge them to call 911 or the crisis hotline

TONE:
- Compassionate and understanding
- Professional but warm
- Culturally sensitive
- Hopeful and empowering
- Non-judgmental
- Trauma-informed

Remember: You're not a therapist or counselor - you're an informational support assistant helping people access the right resources at Casa dela Familia.`;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
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
        const assistantMessage = {
          role: 'assistant',
          content: data.content[0].text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('API unavailable, using local FAQ:', error);
      // Use local FAQ knowledge base as fallback
      const faqResponse = findFaqResponse(userInput);
      const assistantMessage = {
        role: 'assistant',
        content: faqResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
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
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
    const langMessage = {
      role: 'assistant',
      content: language === 'en' 
        ? '¡Perfecto! Ahora puedo ayudarte en español. ¿En qué puedo asistirte hoy?'
        : 'Great! I\'m back to English. How can I help you today?',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, langMessage]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef5e7 0%, #fff8e1 50%, #fff3e0 100%)',
      fontFamily: '"Literata", "Georgia", serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 138, 101, 0.15) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(255, 183, 77, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Main chat container */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '85vh',
        maxHeight: '700px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 138, 101, 0.2)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)',
          padding: '24px 28px',
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
                <Heart style={{ color: '#ff6f47', fill: '#ff6f47' }} size={28} />
              </div>
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  Stella
                </h1>
                <p style={{
                  margin: '2px 0 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontFamily: '"Inter", sans-serif'
                }}>
                  Casa dela Familia Support
                </p>
              </div>
            </div>
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
              {language === 'en' ? 'ES' : 'EN'}
            </button>
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
            background: 'linear-gradient(to bottom, rgba(255, 245, 231, 0.3) 0%, rgba(255, 248, 225, 0.5) 100%)'
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
                    ? 'linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)',
                  color: message.role === 'user' ? '#ffffff' : '#2d2d2d',
                  boxShadow: message.role === 'user'
                    ? '0 4px 16px rgba(255, 112, 67, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: message.role === 'user' ? 'none' : '1px solid rgba(255, 138, 101, 0.15)',
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
                border: '1px solid rgba(255, 138, 101, 0.15)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff8a65',
                  animation: 'typing 1.4s infinite'
                }} />
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff8a65',
                  animation: 'typing 1.4s infinite 0.2s'
                }} />
                <div className="typing-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff8a65',
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
          background: 'linear-gradient(to top, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderTop: '1px solid rgba(255, 138, 101, 0.15)',
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
              placeholder={language === 'en' ? "Type your message here..." : "Escribe tu mensaje aquí..."}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '16px',
                border: '2px solid rgba(255, 138, 101, 0.25)',
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
                e.target.style.borderColor = '#ff8a65';
                e.target.style.boxShadow = '0 4px 16px rgba(255, 138, 101, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 138, 101, 0.25)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim()
                  ? 'linear-gradient(135deg, #cccccc 0%, #b0b0b0 100%)'
                  : 'linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)',
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
                  : '0 4px 16px rgba(255, 112, 67, 0.3)',
                minWidth: '52px',
                minHeight: '52px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 112, 67, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isLoading || !input.trim()
                  ? 'none'
                  : '0 4px 16px rgba(255, 112, 67, 0.3)';
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
              : 'Para apoyo inmediato en crisis, llama al 911'}
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
          background: rgba(255, 138, 101, 0.05);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #ff8a65 0%, #ff7043 100%);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%);
        }
      `}</style>
    </div>
  );
}
