import React from 'react';
import Logo from '@/components/logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-2 flex items-center justify-center">
              <Logo />
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-medium">Gleritas Token © {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex space-x-5">
            <a 
              href="https://t.me/gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className="fab fa-telegram-plane"></i>
            </a>
            <a 
              href="https://twitter.com/GleritasToken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a 
              href="https://medium.com/@gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className="fab fa-medium-m"></i>
            </a>
            <a 
              href="https://discord.gg/gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className="fab fa-discord"></i>
            </a>
            <a 
              href="https://github.com/gleritastoken" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center md:text-left">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Disclaimer: Participating in this airdrop does not guarantee tokens. Distribution is subject to verification and completion of all required tasks.
            By participating, you agree to the terms and conditions of the Gleritas Token Airdrop program.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
