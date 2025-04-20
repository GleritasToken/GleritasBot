import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add FontAwesome for icons
const fontAwesomeScript = document.createElement('link');
fontAwesomeScript.rel = 'stylesheet';
fontAwesomeScript.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesomeScript);

// Add Inter font
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(interFont);

// Set page title
const titleElement = document.createElement('title');
titleElement.textContent = 'Gleritas Token Airdrop';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
