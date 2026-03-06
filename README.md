# Stella - Casa dela Familia AI Chatbot

A compassionate AI support companion for Casa dela Familia, providing information about trauma support services, counseling, and community resources in Southern California.

## Features

- 🤖 AI-powered chatbot using Google Gemini
- 🌐 Bilingual support (English/Spanish)
- 💜 Warm, trauma-informed responses
- 📱 Responsive, modern UI
- 🔒 Secure API handling (server-side)

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Project Structure

```
solvischat/
├── public/
│   └── favicon.svg
├── server/
│   └── index.js          # Express backend server
├── src/
│   ├── components/
│   │   └── StellaChatbot.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start only the Vite frontend
- `npm run dev:server` - Start only the Express backend
- `npm run build` - Build for production
- `npm start` - Run production server

## Production Deployment

1. Build the frontend:

```bash
npm run build
```

2. Set environment variables on your server:

```bash
export GEMINI_API_KEY=your_gemini_api_key
export NODE_ENV=production
export PORT=3001
```

3. Start the server:

```bash
npm start
```

## About Casa dela Familia

Casa dela Familia is a 501(c)(3) non-profit organization founded in 1996 by Dr. Ana Nogales. They provide comprehensive, culturally sensitive psychological and psychiatric services to individuals and families affected by trauma.

### Contact Information

- **Phone:** (877) 611-2272
- **Website:** [casadelafamilia.org](https://casadelafamilia.org)

### Locations

- **Santa Ana:** 1650 East 4th Street, Santa Ana, CA 92701
- **East Los Angeles:** 4609 East Cesar Chavez Ave, Los Angeles, CA 90022
- **San Juan Capistrano:** 27221 D Ortega HWY, San Juan Capistrano, CA 92675

## License

This project is created for Casa dela Familia.

#iFrame

<iframe
  src="https://stella-chat.pages.dev/"
  width="400"
  height="600"
  style="border: none; border-radius: 12px;"
  title="Stella Chat"
></iframe>


#Script
<script>
(() => {
  const CHAT_URL = 'https://stella-chat.pages.dev/';
  const toggle = document.getElementById('stellaToggle');
  const window_ = document.getElementById('stellaWindow');
  const frame = document.getElementById('stellaFrame');
  const loader = document.getElementById('stellaLoader');
  const greeting = document.getElementById('stellaGreeting');
  const headerClose = document.getElementById('stellaHeaderClose');

  let isOpen = false;
  let loaded = false;

  // Show greeting after 2s
  setTimeout(() => {
    if (!isOpen) greeting.classList.add('show');
  }, 2000);

  // Auto-hide greeting after 8s
  setTimeout(() => {
    greeting.classList.remove('show');
  }, 10000);

  function openChat() {
    isOpen = true;
    greeting.classList.remove('show');
    toggle.classList.add('active');
    window_.classList.add('open');

    // Lazy-load iframe on first open
    if (!loaded) {
      frame.src = CHAT_URL;
      frame.onload = () => {
        setTimeout(() => loader.classList.add('hidden'), 400);
      };
      loaded = true;
    }
  }

  function closeChat() {
    isOpen = false;
    toggle.classList.remove('active');
    window_.classList.remove('open');
  }

  function toggleChat() {
    isOpen ? closeChat() : openChat();
  }

  toggle.addEventListener('click', toggleChat);
  headerClose.addEventListener('click', closeChat);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });
})();
</script>
