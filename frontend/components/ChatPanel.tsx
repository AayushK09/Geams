import React, { useState, useRef, useEffect } from 'react';

interface ChatPanelProps {
  messages: { user: string; text: string; timestamp: Date }[];
  username: string;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export default function ChatPanel({ messages, username, onSendMessage, onClose }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-semibold">Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No messages yet</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-blue-400 min-w-fit">
                  {msg.user === username ? 'You' : msg.user}
                </span>
              </div>
              <p className="text-gray-200 ml-0 break-words">{msg.text}</p>
              <p className="text-gray-500 text-xs mt-1">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-700 p-3 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type message..."
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
