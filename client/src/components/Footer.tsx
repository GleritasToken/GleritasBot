import React from 'react';
import Logo from '@/components/logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b1526] border-t border-[#2a4365] py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="h-8 w-8 flex items-center justify-center">
              <img 
                src="/images/gleritas-logo.jpg" 
                alt="Gleritas Logo" 
                className="h-8 w-8 rounded-full object-cover" 
              />
            </div>
            <span className="text-white font-medium">Gleritas Token © {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex space-x-5">
            <a 
              href="https://t.me/gleritaschat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200"
            >
              <i className="fab fa-telegram-plane"></i>
            </a>
            <a 
              href="https://twitter.com/GleritasToken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a 
              href="https://medium.com/@gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200"
            >
              <i className="fab fa-medium-m"></i>
            </a>
            <a 
              href="https://discord.gg/gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200"
            >
              <i className="fab fa-discord"></i>
            </a>
            <a 
              href="https://github.com/gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200"
            >
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#2a4365] text-center md:text-left">
          <div className="text-xs text-blue-200">
            Disclaimer: Participating in this airdrop does not guarantee tokens. Distribution is subject to verification and completion of all required tasks.
            By participating, you agree to the terms and conditions of the Gleritas Token Airdrop program.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
