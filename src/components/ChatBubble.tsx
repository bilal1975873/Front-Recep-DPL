import React from 'react';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  className?: string;
  onSelect?: (text: string) => void;
}

interface Option {
  display: string;
  value: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, className = '', onSelect }) => {
  const isBot = message.type === 'bot';
  // Extract numbered options and main prompt
  const lines = message.content.split('\n');
  const options = lines.filter(line => line.match(/^\d+\./));
  
  // Handle employee selection differently
  const isEmployeeSelection = lines[0]?.toLowerCase().includes('found') && lines[0]?.toLowerCase().includes('match');
  
  // Convert employee names into numbered options internally
  let counter = 1;
  const employeeNames: Option[] = isEmployeeSelection ? 
    lines.filter(line => 
      !line.toLowerCase().includes('found') && 
      !line.toLowerCase().includes('none of these') && 
      line.trim()
    ).map(name => ({
      display: name.trim(),
      value: String(counter++)
    }))
    : [];
  
  const nonEmployeeLines: Option[] = isEmployeeSelection ? 
    [{
      display: "None of these / Enter a different name",
      value: "0"
    }]
    : [];
  
  const prompt = isEmployeeSelection ?
    lines[0] :
    lines.filter(line => !line.match(/^\d+\./) && line.trim() !== '').join(' ');
  
  // Check if this is a confirmation message
  const isConfirmation = isBot && prompt.toLowerCase().includes('please review') && prompt.toLowerCase().includes('confirm');
  const showButtons = isBot && (options.length > 0 || isConfirmation || isEmployeeSelection);

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} ${className}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isBot
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white mr-auto chat-shadow'
            : 'bg-gradient-to-br from-red-600 to-red-700 text-white ml-auto glow-effect'
        }`}
      >
        {showButtons ? (
          <>
            <div className="font-semibold text-base md:text-lg mb-2">{prompt}</div>
            <div className="flex flex-col gap-3 mt-2">
              {isConfirmation ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => onSelect?.('confirm')}
                    className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => onSelect?.('edit')}
                    className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Edit
                  </button>
                </div>
              ) : isEmployeeSelection ? (
                <>
                  {employeeNames.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSelect?.(option.value)}
                      className="w-full text-left px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      {option.display}
                    </button>
                  ))}
                  {nonEmployeeLines.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSelect?.(option.value)}
                      className="w-full text-left px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {option.display}
                    </button>
                  ))}
                </>
              ) : (
                options.map((option, index) => {
                  const match = option.match(/^(\d+)\./);
                  const valueToSend = match ? match[1] : option;
                  return (
                    <button
                      key={index}
                      onClick={() => onSelect?.(valueToSend)}
                      className="w-full text-left px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      {option.replace(/^\d+\.\s*/, '')}
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
        )}
        <span className="text-xs opacity-50 mt-3 block text-right">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
