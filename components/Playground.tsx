import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface PlaygroundProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
}

const examplePrompts = [
  "Identify top 3 delivery zones causing delays this quarter.",
  "Recommend ops actions to improve route efficiency.",
  "Show task success rate trend and anomaly alerts.",
  "Which region had the best On-Time Delivery in the most recent week?",
];

const Playground: React.FC<PlaygroundProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleExampleClick = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt);
    }
  };

  const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
      .replace(/^- (.*$)/gm, '<li style="margin-left: 20px; list-style-type: disc;">$1</li>') // List items
    
    return <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\n/g, '<br />') }} />;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-white">AI Playground</h3>
      <div className="bg-gray-900 rounded-lg h-96 flex flex-col p-4">
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {messages.length === 0 && (
            <div className="text-center h-full flex flex-col justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <p className="font-semibold mb-2">Ask me anything about your data.</p>
                <div className="space-y-2">
                    {examplePrompts.map((prompt, i) => (
                        <button key={i} onClick={() => handleExampleClick(prompt)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition text-cyan-300 disabled:opacity-50" disabled={isLoading}>
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <MarkdownContent content={msg.content} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about trends, anomalies, or recommendations..."
            className="flex-grow bg-gray-700 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
            aria-label="Chat input for AI Playground"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold p-2 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Playground;
