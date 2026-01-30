import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, Languages } from 'lucide-react';

// FAQ Knowledge Base for offline responses - English
const faqDataEn = [
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

// FAQ Knowledge Base - Spanish
const faqDataEs = [
  {
    keywords: ['qué es', 'sobre', 'casa de la familia', 'cdlf', 'organización', 'quién eres', 'quiénes son'],
    response: "Casa de la Familia (CDLF) es una organización sin fines de lucro 501(c)(3) dedicada a transformar víctimas de trauma psicológico en sobrevivientes a través de servicios de salud mental. Fuimos fundados en 1996 por la psicóloga clínica Dra. Ana Nogales, y estamos comprometidos a brindar atención compasiva y culturalmente sensible a quienes más lo necesitan."
  },
  {
    keywords: ['fundadora', 'quién fundó', 'empezó', 'dr. nogales', 'dra. nogales', 'ana nogales'],
    response: "Casa de la Familia fue fundada en 1996 por la Dra. Ana Nogales, una psicóloga clínica dedicada a servir a sobrevivientes de trauma. Bajo su liderazgo, hemos crecido para servir a todo California con servicios integrales de salud mental."
  },
  {
    keywords: ['misión', 'propósito', 'objetivo', 'meta'],
    response: "Nuestra misión es proporcionar servicios psicológicos y psiquiátricos integrales y culturalmente sensibles a sobrevivientes de trauma, particularmente en comunidades desatendidas. Creemos que todos merecen acceso a atención de salud mental de calidad, sin importar su situación financiera."
  },
  {
    keywords: ['costo', 'precio', 'cuánto', 'tarifa', 'pago', 'costear', 'caro', 'gratis', 'gratuito'],
    response: "Nuestros servicios se ofrecen a bajo costo o sin costo, dependiendo de tu situación. Creemos que las barreras financieras nunca deben impedir que alguien obtenga la ayuda que necesita. Por favor llámanos al (877) 611-2272 para hablar sobre tu situación - estamos aquí para ayudarte."
  },
  {
    keywords: ['idioma', 'español', 'inglés', 'bilingüe', 'coreano'],
    response: "Todos nuestros servicios están disponibles en inglés y español. Todo nuestro personal es bilingüe y bicultural, asegurando que el idioma nunca sea una barrera para recibir atención. ¡Estamos aquí para ayudarte!"
  },
  {
    keywords: ['área', 'servir', 'ubicación', 'dónde', 'california', 'región'],
    response: "Después de casi 30 años de crecimiento, ¡Casa de la Familia ahora sirve a todo California! Tenemos oficinas físicas en Santa Ana, Este de Los Ángeles y San Juan Capistrano, y también ofrecemos servicios virtuales para que puedas recibir atención desde cualquier parte del estado."
  },
  {
    keywords: ['virtual', 'en línea', 'remoto', 'telesalud', 'en persona', 'visita'],
    response: "Ofrecemos servicios tanto en persona como virtuales para satisfacer tus necesidades. Puedes visitar una de nuestras oficinas en Santa Ana, Este de Los Ángeles o San Juan Capistrano, o recibir atención a través de nuestra plataforma de telesalud segura desde la comodidad de tu hogar."
  },
  {
    keywords: ['oficina', 'dirección', 'santa ana', 'los angeles', 'san juan capistrano'],
    response: "Tenemos tres ubicaciones convenientes:\n\n📍 Santa Ana: 1650 East 4th Street, Santa Ana, CA 92701\n📍 Este de Los Ángeles: 4609 East Cesar Chavez Ave, Los Angeles, CA 90022\n📍 San Juan Capistrano: 27221 D Ortega HWY, San Juan Capistrano, CA 92675\n\nLlama al (877) 611-2272 para programar una cita en cualquier ubicación."
  },
  {
    keywords: ['edad', 'niños', 'jóvenes', 'adolescentes', 'adultos', 'familia', 'quién puede'],
    response: "Proporcionamos servicios de consejería para todas las edades - niños, jóvenes, adultos y familias. Nuestros terapeutas se especializan en trabajar con personas en cada etapa de la vida, y ofrecemos opciones de terapia individual y familiar."
  },
  {
    keywords: ['tipo', 'consejería', 'terapia', 'servicios', 'qué ofrecen'],
    response: "Ofrecemos una variedad de servicios incluyendo:\n\n• Terapia individual\n• Terapia familiar\n• Grupos de apoyo empoderadores\n• Intervención en crisis\n• Atención enfocada en trauma\n• Apoyo para violencia doméstica\n• Servicios para agresión sexual\n• Evaluaciones de inmigración\n\nTodos los servicios son proporcionados por profesionales licenciados en inglés y español."
  },
  {
    keywords: ['violencia doméstica', 'abuso', 'dart', 'violento', 'pareja'],
    response: "Sí, ofrecemos apoyo especializado para sobrevivientes de violencia doméstica. Nuestro programa DART (Equipo de Respuesta al Abuso Doméstico) empareja consejeros certificados con unidades policiales especialmente entrenadas para intervención inmediata en crisis. Proporcionamos apoyo seguro y confidencial para ayudarte en este momento difícil. Si estás en peligro inmediato, por favor llama al 911. De lo contrario, contáctanos al (877) 611-2272."
  },
  {
    keywords: ['trauma', 'tept', 'traumático'],
    response: "La recuperación del trauma está en el corazón de lo que hacemos. Proporcionamos atención especializada e informada sobre trauma para sobrevivientes de diversas experiencias traumáticas, incluyendo violencia doméstica, agresión sexual y otros traumas psicológicos. Nuestros terapeutas compasivos están aquí para apoyar tu camino de sanación."
  },
  {
    keywords: ['agresión sexual', 'violación', 'abuso sexual'],
    response: "Proporcionamos atención especializada y compasiva para sobrevivientes de agresión sexual. Nuestros consejeros capacitados ofrecen un espacio seguro y confidencial para la sanación. No estás solo/a, y lo que pasó no es tu culpa. Por favor llámanos al (877) 611-2272 - estamos aquí para apoyarte."
  },
  {
    keywords: ['inmigración', 'evaluación', 'legal', 'visa', 'asilo'],
    response: "Sí, proporcionamos consejería legal e informes de evaluación de inmigración. Estas evaluaciones psicológicas pueden apoyar tu caso de inmigración. También ofrecemos informes expeditos que se pueden entregar dentro de 48 horas por una tarifa adicional. Llama al (877) 611-2272 para obtener más información sobre este servicio."
  },
  {
    keywords: ['48 horas', 'expedito', 'rápido', 'urgente', 'evaluación rápida'],
    response: "¡Sí! Ofrecemos informes de evaluación de inmigración expeditos que se pueden entregar dentro de 48 horas por una tarifa adicional. Este servicio está disponible para quienes tienen plazos urgentes para sus casos de inmigración. Llama al (877) 611-2272 para coordinar una evaluación expedita."
  },
  {
    keywords: ['amor sin violencia', 'latina power', '13 razones', 'programa'],
    response: "Ofrecemos varios programas especializados incluyendo:\n\n• Amor Sin Violencia - Apoyo para violencia doméstica\n• Latina Power! - Programa de empoderamiento\n• 13 Reasons Why - Salud mental juvenil\n• DART - Equipo de intervención en crisis\n• CalVCB - Asistencia de compensación a víctimas\n\nLlama al (877) 611-2272 para saber qué programa es adecuado para ti."
  },
  {
    keywords: ['capacitación', 'profesional', 'certificación', 'entrenamiento violencia doméstica'],
    response: "¡Sí! Ofrecemos programas de capacitación profesional incluyendo:\n\n• Capacitación de 40 horas en Violencia Doméstica\n• Capacitación de 12 horas en Violencia Doméstica\n\nEstas certificaciones son valiosas para profesionales que trabajan en campos relacionados. Contáctanos al (877) 611-2272 para horarios de capacitación e inscripción."
  },
  {
    keywords: ['contacto', 'teléfono', 'llamar', 'comunicarse', 'número', 'ayuda'],
    response: "Puedes comunicarte con Casa de la Familia al (877) 611-2272. Nuestro personal está listo para ayudarte a acceder a los servicios que necesitas. No dudes en llamar - dar este paso es un acto de valentía, y estamos aquí para apoyarte."
  },
  {
    keywords: ['portal del paciente', 'administrar', 'cuenta', 'iniciar sesión'],
    response: "¡Sí! Los pacientes actuales pueden administrar su atención a través de nuestro Portal del Paciente en nuestro sitio web casadelafamilia.org. El portal te permite acceder a tu información y mantenerte conectado con tu equipo de atención."
  },
  {
    keywords: ['donar', 'apoyar', 'dar', 'contribución', 'ayudar organización'],
    response: "¡Gracias por querer apoyar nuestra misión! Puedes ayudar haciendo una donación, que financia asistencia de emergencia y terapia para quienes lo necesitan. También puedes ofrecer tu tiempo como voluntario. Visita casadelafamilia.org o llama al (877) 611-2272 para conocer formas de contribuir."
  },
  {
    keywords: ['voluntario', 'carrera', 'trabajo', 'empleo', 'pasante', 'verano'],
    response: "¡Ofrecemos oportunidades para carreras en consejería y posiciones de voluntariado de verano! Si te apasiona ayudar a sobrevivientes de trauma y quieres hacer una diferencia, nos encantaría saber de ti. Visita nuestro sitio web casadelafamilia.org o llama al (877) 611-2272 para conocer las oportunidades actuales."
  },
  {
    keywords: ['crisis', 'emergencia', 'inmediato', 'urgente', 'peligro', 'suicidio', 'daño'],
    response: "Si estás en peligro inmediato, por favor llama al 911 de inmediato.\n\nPara apoyo en crisis, puedes comunicarte con Casa de la Familia al (877) 611-2272.\n\nLínea Nacional de Prevención del Suicidio: 988\n\nTú importas, y hay ayuda disponible. Por favor comunícate - no tienes que enfrentar esto solo/a."
  },
  {
    keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos'],
    response: "¡Hola! Soy Stella, tu compañera de apoyo virtual de Casa de la Familia. Estoy aquí para ayudarte a conocer nuestros servicios y conectarte con el apoyo que necesitas. ¿En qué puedo ayudarte hoy?"
  },
  {
    keywords: ['gracias', 'agradezco', 'te lo agradezco'],
    response: "¡De nada! Recuerda, comunicarse requiere valentía, y es un honor poder apoyarte. Si tienes otras preguntas o necesitas hablar con alguien, por favor llámanos al (877) 611-2272. Cuídate mucho. 💜"
  }
];

// FAQ Knowledge Base - Korean
const faqDataKo = [
  {
    keywords: ['무엇', '에 대해', 'casa de la familia', 'cdlf', '단체', '누구', '소개'],
    response: "Casa de la Familia (CDLF)는 정신건강 서비스를 통해 심리적 트라우마 피해자를 생존자로 변화시키는 데 전념하는 501(c)(3) 비영리 단체입니다. 1996년 임상 심리학자 Ana Nogales 박사에 의해 설립되었으며, 도움이 가장 필요한 분들에게 따뜻하고 문화적으로 민감한 케어를 제공하기 위해 최선을 다하고 있습니다."
  },
  {
    keywords: ['설립자', '누가 설립', '시작', 'nogales 박사', 'ana nogales'],
    response: "Casa de la Familia는 1996년 트라우마 생존자를 돕는 데 헌신한 임상 심리학자 Ana Nogales 박사에 의해 설립되었습니다. 그녀의 리더십 아래, 우리는 캘리포니아 전역에 종합적인 정신건강 서비스를 제공하도록 성장했습니다."
  },
  {
    keywords: ['사명', '목적', '목표'],
    response: "우리의 사명은 트라우마 생존자, 특히 소외된 지역사회의 분들에게 종합적이고 문화적으로 민감한 심리 및 정신과 서비스를 제공하는 것입니다. 우리는 재정 상황에 관계없이 모든 사람이 양질의 정신건강 케어를 받을 자격이 있다고 믿습니다."
  },
  {
    keywords: ['비용', '가격', '얼마', '요금', '지불', '부담', '비싼', '무료'],
    response: "우리의 서비스는 상황에 따라 저렴하거나 무료로 제공됩니다. 우리는 재정적 장벽이 도움을 받는 것을 막아서는 안 된다고 믿습니다. (877) 611-2272로 전화하여 상황을 상담해 주세요 - 도와드리겠습니다."
  },
  {
    keywords: ['언어', '스페인어', '영어', '이중 언어', '한국어'],
    response: "모든 서비스는 영어와 스페인어로 제공됩니다. 우리 직원 전원이 이중 언어와 이중 문화를 갖추고 있어 언어가 케어를 받는 데 장벽이 되지 않습니다. 한국어로 상담이 필요하시면 (877) 611-2272로 연락해 주세요!"
  },
  {
    keywords: ['지역', '서비스', '위치', '어디', '캘리포니아'],
    response: "거의 30년간의 성장 끝에 Casa de la Familia는 이제 캘리포니아 전역을 서비스합니다! Santa Ana, East Los Angeles, San Juan Capistrano에 사무실이 있으며, 주 어디서나 케어를 받을 수 있는 화상 서비스도 제공합니다."
  },
  {
    keywords: ['화상', '온라인', '원격', '원격의료', '대면', '방문'],
    response: "귀하의 필요에 맞게 대면 및 화상 서비스를 모두 제공합니다. Santa Ana, East Los Angeles 또는 San Juan Capistrano 사무실을 방문하시거나, 안전한 원격의료 플랫폼을 통해 집에서 편안하게 케어를 받으실 수 있습니다."
  },
  {
    keywords: ['사무실', '주소', 'santa ana', 'los angeles', 'san juan capistrano'],
    response: "편리한 세 곳에 위치해 있습니다:\n\n📍 Santa Ana: 1650 East 4th Street, Santa Ana, CA 92701\n📍 East Los Angeles: 4609 East Cesar Chavez Ave, Los Angeles, CA 90022\n📍 San Juan Capistrano: 27221 D Ortega HWY, San Juan Capistrano, CA 92675\n\n(877) 611-2272로 전화하여 예약하세요."
  },
  {
    keywords: ['나이', '아이', '청소년', '성인', '가족', '누가'],
    response: "모든 연령대 - 아이, 청소년, 성인, 가족을 위한 상담 서비스를 제공합니다. 우리 치료사들은 삶의 모든 단계에서 사람들과 함께 일하는 것을 전문으로 하며, 개인 및 가족 치료 옵션을 모두 제공합니다."
  },
  {
    keywords: ['유형', '상담', '치료', '서비스', '제공'],
    response: "다양한 서비스를 제공합니다:\n\n• 개인 치료\n• 가족 치료\n• 지지 그룹\n• 위기 개입\n• 트라우마 중심 케어\n• 가정폭력 지원\n• 성폭력 서비스\n• 이민 평가\n\n모든 서비스는 면허를 가진 전문가가 영어와 스페인어로 제공합니다."
  },
  {
    keywords: ['가정폭력', '학대', 'dart', '폭력', '파트너'],
    response: "네, 가정폭력 생존자를 위한 전문 지원을 제공합니다. DART(가정폭력 대응팀) 프로그램은 인증된 상담사와 특별 훈련된 경찰 부대를 짝지어 즉각적인 위기 개입을 제공합니다. 이 어려운 시기에 안전하고 비밀이 보장된 지원을 제공합니다. 즉각적인 위험에 처해 있다면 911에 전화하세요. 그렇지 않으면 (877) 611-2272로 연락하세요."
  },
  {
    keywords: ['트라우마', 'ptsd', '외상'],
    response: "트라우마 회복은 우리가 하는 일의 핵심입니다. 가정폭력, 성폭력 및 기타 심리적 트라우마를 포함한 다양한 트라우마 경험의 생존자들을 위해 전문적이고 트라우마 정보에 기반한 케어를 제공합니다. 우리의 따뜻한 치료사들이 당신의 치유 여정을 지원합니다."
  },
  {
    keywords: ['성폭력', '강간', '성적 학대'],
    response: "성폭력 생존자를 위한 전문적이고 따뜻한 케어를 제공합니다. 훈련된 상담사들이 치유를 위한 안전하고 비밀이 보장된 공간을 제공합니다. 당신은 혼자가 아니며, 일어난 일은 당신의 잘못이 아닙니다. (877) 611-2272로 전화해 주세요 - 지원해 드리겠습니다."
  },
  {
    keywords: ['이민', '평가', '법률', '비자', '망명'],
    response: "네, 법률 상담과 이민 평가 보고서를 제공합니다. 이 심리 평가는 이민 케이스를 지원할 수 있습니다. 추가 비용으로 48시간 이내에 전달 가능한 신속 보고서도 제공합니다. 이 서비스에 대해 자세히 알아보려면 (877) 611-2272로 전화하세요."
  },
  {
    keywords: ['48시간', '신속', '빠른', '긴급', '빠른 평가'],
    response: "네! 추가 비용으로 48시간 이내에 전달되는 신속 이민 평가 보고서를 제공합니다. 이 서비스는 이민 케이스에 긴급한 마감 기한이 있는 분들을 위해 제공됩니다. 신속 평가를 예약하려면 (877) 611-2272로 전화하세요."
  },
  {
    keywords: ['프로그램', 'amor sin violencia', 'latina power'],
    response: "여러 전문 프로그램을 제공합니다:\n\n• Amor Sin Violencia - 가정폭력 지원\n• Latina Power! - 역량 강화 프로그램\n• 13 Reasons Why - 청소년 정신건강\n• DART - 위기 개입 팀\n• CalVCB - 피해자 보상 지원\n\n어떤 프로그램이 적합한지 알아보려면 (877) 611-2272로 전화하세요."
  },
  {
    keywords: ['교육', '전문가', '자격증', '가정폭력 교육'],
    response: "네! 전문 교육 프로그램을 제공합니다:\n\n• 40시간 가정폭력 교육\n• 12시간 가정폭력 교육\n\n이 자격증은 관련 분야에서 일하는 전문가들에게 유용합니다. 교육 일정 및 등록에 대해 (877) 611-2272로 문의하세요."
  },
  {
    keywords: ['연락', '전화', '번호', '도움'],
    response: "(877) 611-2272로 Casa de la Familia에 연락하실 수 있습니다. 필요한 서비스에 접근할 수 있도록 도와드릴 준비가 되어 있습니다. 전화하는 것을 주저하지 마세요 - 이 한 걸음은 용기 있는 행동이며, 지원해 드리겠습니다."
  },
  {
    keywords: ['환자 포털', '관리', '계정', '로그인'],
    response: "네! 현재 환자들은 casadelafamilia.org 웹사이트의 환자 포털을 통해 케어를 관리할 수 있습니다. 포털을 통해 정보에 접근하고 케어 팀과 연결 상태를 유지할 수 있습니다."
  },
  {
    keywords: ['기부', '지원', '후원', '기여', '단체 돕기'],
    response: "우리의 사명을 지원해 주셔서 감사합니다! 기부를 통해 도움이 필요한 분들에게 긴급 지원과 치료를 제공할 수 있습니다. 자원봉사로 시간을 기부할 수도 있습니다. casadelafamilia.org를 방문하거나 (877) 611-2272로 전화하여 기부 방법을 알아보세요."
  },
  {
    keywords: ['자원봉사', '직업', '일자리', '취업', '인턴', '여름'],
    response: "상담 직업과 여름 자원봉사 기회를 제공합니다! 트라우마 생존자를 돕는 것에 열정이 있고 변화를 만들고 싶다면, 연락해 주세요. casadelafamilia.org 웹사이트를 방문하거나 (877) 611-2272로 전화하여 현재 기회에 대해 알아보세요."
  },
  {
    keywords: ['위기', '응급', '즉각', '긴급', '위험', '자살', '해', '다치'],
    response: "즉각적인 위험에 처해 있다면 즉시 911에 전화하세요.\n\n위기 지원을 위해 Casa de la Familia (877) 611-2272로 연락하세요.\n\n전국 자살예방 상담전화: 988\n\n당신은 소중합니다. 도움이 있습니다. 연락해 주세요 - 혼자 직면할 필요 없습니다."
  },
  {
    keywords: ['안녕', '안녕하세요', '좋은 아침', '좋은 오후', '좋은 저녁'],
    response: "안녕하세요! 저는 Casa de la Familia의 가상 지원 동반자 Stella입니다. 우리의 서비스에 대해 알아보고 필요한 지원과 연결해 드리기 위해 여기 있습니다. 오늘 무엇을 도와드릴까요?"
  },
  {
    keywords: ['감사', '고마워', '고맙습니다'],
    response: "천만에요! 연락하는 것은 용기가 필요한 일이며, 지원해 드릴 수 있어 영광입니다. 다른 질문이 있거나 누군가와 이야기해야 한다면 (877) 611-2272로 전화해 주세요. 자신을 잘 돌보세요. 💜"
  }
];

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

// Function to find the best matching FAQ response
const findFaqResponse = (userInput) => {
  const input = userInput.toLowerCase();
  const detectedLang = detectLanguage(userInput);
  
  // Select appropriate FAQ data based on language
  let faqData;
  let defaultResponse;
  
  if (detectedLang === 'ko') {
    faqData = faqDataKo;
    defaultResponse = "연락해 주셔서 감사합니다. 찾고 계신 정보가 없을 수 있지만, Casa de la Familia에 직접 (877) 611-2272로 전화하시기를 권합니다. 우리 직원이 질문에 답하고 적합한 서비스와 연결해 드릴 수 있습니다.\n\n다음에 대해서도 물어보실 수 있습니다:\n• 서비스 및 프로그램\n• 사무실 위치\n• 서비스 비용\n• 이민 평가\n• 가정폭력 지원\n• 시작하는 방법";
  } else if (detectedLang === 'es') {
    faqData = faqDataEs;
    defaultResponse = "Gracias por comunicarte. Aunque quizás no tenga la información específica que buscas, te animo a llamar directamente a Casa de la Familia al (877) 611-2272. Nuestro personal puede responder tus preguntas y ayudarte a conectar con los servicios adecuados.\n\nTambién puedes preguntarme sobre:\n• Nuestros servicios y programas\n• Ubicaciones de oficinas\n• Costo de servicios\n• Evaluaciones de inmigración\n• Apoyo para violencia doméstica\n• Cómo empezar";
  } else {
    faqData = faqDataEn;
    defaultResponse = "Thank you for reaching out. While I may not have the specific information you're looking for, I'd encourage you to call Casa de la Familia directly at (877) 611-2272. Our caring staff can answer your questions and help connect you with the right services.\n\nYou can also ask me about:\n• Our services and programs\n• Office locations\n• Cost of services\n• Immigration evaluations\n• Domestic violence support\n• How to get started";
  }
  
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
  return defaultResponse;
};

export default function StellaChatbot() {
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
- Don't repeat the phone number in every single response
- Don't start every response with "Thank you for reaching out"
- Don't sound like a chatbot - sound like a caring person

You're not a therapist - you're a friendly guide helping people find the right support at Casa de la Familia.`;

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
              {language === 'en' ? 'ES' : language === 'es' ? '한' : 'EN'}
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
              placeholder={language === 'en' ? "Type your message here..." : language === 'es' ? "Escribe tu mensaje aquí..." : "메시지를 입력하세요..."}
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
