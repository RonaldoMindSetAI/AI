
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message } from './types';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { CortexLumaLogo } from './components/Icons';

// IMPORTANT: Do not expose this key publicly.
// Use environment variables for production.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A simple check and alert for the development environment.
  // In a real app, you would handle this more gracefully.
  alert("API_KEY is not set. Please provide your Gemini API key.");
}

// FIX: The GoogleGenAI constructor requires a configuration object with the apiKey.
const ai = new GoogleGenAI({ apiKey: API_KEY });

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm CortexLuma, your AI assistant. How can I help you solve anything today?",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);

  const handleSendMessage = async (userInput: string) => {
    setIsLoading(true);
    setError(null);

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(updatedMessages);

    try {
        if (!chatRef.current) {
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are CortexLuma, a powerful and helpful AI assistant created by Vamshi V. Your goal is to be insightful, accurate, and provide comprehensive answers. Format your responses using markdown for readability, including code snippets when appropriate.',
                },
            });
        }

        const stream = await chatRef.current.sendMessageStream({ message: userInput });

        let modelResponse = '';
        let firstChunk = true;

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            modelResponse += chunkText;

            if (firstChunk) {
                setMessages(prev => [...prev, { role: 'model', content: modelResponse }]);
                firstChunk = false;
            } else {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        }
    } catch (e: any) {
        const errorMessage = `Error: ${e.message || 'An unexpected error occurred.'}`;
        setError(errorMessage);
        setMessages(prev => [...prev, { role: 'model', content: `Sorry, I encountered an issue. ${errorMessage}` }]);
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="h-screen w-screen bg-brand-bg text-brand-text-light flex flex-col font-sans">
        <header className="p-4 border-b border-brand-surface/50 shadow-md">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CortexLumaLogo />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-brand-secondary to-brand-primary text-transparent bg-clip-text">
                        CortexLuma
                    </h1>
                </div>
                <div className="text-sm text-brand-text-dark">by Vamshi V</div>
            </div>
        </header>

        <ChatWindow messages={messages} isLoading={isLoading} />
        
        {error && (
            <div className="py-2 px-4 bg-red-900/50 text-red-300 text-center text-sm">
                {error}
            </div>
        )}

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
