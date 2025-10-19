
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { chatWithGemini } from './services/geminiService';
import { Message, Sender } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-ai-message',
      text: 'Welcome to CortexLuma. How can I illuminate your ideas today?',
      sender: Sender.AI,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      sender: Sender.User,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiResponseText = await chatWithGemini(text);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: Sender.AI,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (err) {
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      const errorMessageObj: Message = {
          id: `error-${Date.now()}`,
          text: errorMessage,
          sender: Sender.AI
      }
      setMessages((prevMessages) => [...prevMessages, errorMessageObj]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-primary text-text-primary overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner />
          </div>
        )}
         {error && (
          <div className="flex justify-center text-red-400 p-4">
            <p>Error: {error}</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>
      <div className="p-4 md:p-6 bg-primary border-t border-secondary">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
