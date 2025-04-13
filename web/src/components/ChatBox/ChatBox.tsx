import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { MessageCircle, X, Send } from 'react-feather';

// Types
interface Message {
  role: 'user' | 'agent';
  content: string;
}

interface ChatBoxProps {
  agentName?: string;
  userId?: string;
}

interface EventPart {
  text?: string;
  functionCall?: unknown;
  functionResponse?: unknown;
}

interface EventContent {
  role: string;
  parts: EventPart[];
}

interface AgentEvent {
  content: EventContent;
  invocation_id: string;
  author: string;
  actions: Record<string, unknown>;
  id: string;
  timestamp: number;
}

// Styled Components
const ChatIcon = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #2563eb;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ChatWindow = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  height: 450px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 999;
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${(props) => (props.isOpen ? '1' : '0')};
  visibility: ${(props) => (props.isOpen ? 'visible' : 'hidden')};
  transform: ${(props) =>
    props.isOpen ? 'translateY(0)' : 'translateY(20px)'};
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #2563eb;
  color: white;
`;

const ChatTitle = styled.h3`
  margin: 0;
  font-size: 16px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 16px;
  background-color: ${(props) => (props.isUser ? '#2563eb' : '#f0f0f0')};
  color: ${(props) => (props.isUser ? 'white' : 'black')};
  align-self: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  word-wrap: break-word;
  font-size: 14px;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 12px;
  border-top: 1px solid #eaeaea;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #eaeaea;
  border-radius: 16px;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: #2563eb;
  }
`;

const SendButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0 8px;
`;

// Main Component
const ChatBox: React.FC<ChatBoxProps> = ({
  agentName = 'exchange_agent',
  userId = 'user',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a new session with the agent via the Next.js API
  const createSession = useCallback(async () => {
    try {
      // Add welcome message immediately
      setMessages([
        { role: 'agent', content: `Hello! How can I help you today?` },
      ]);

      const response = await fetch('/api/agent/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentName,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
      } else {
        console.error('Failed to create session:', await response.json());
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [agentName, userId]);

  // Create a session when the component mounts
  useEffect(() => {
    if (isOpen && !sessionId) {
      createSession();
    }
  }, [isOpen, sessionId, createSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send a message to the agent via the Next.js API
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          agentName,
          userId,
        }),
      });

      if (response.ok) {
        const { events } = await response.json();
        // Find the last text response from the model
        const agentResponses = events
          .filter(
            (event: AgentEvent) =>
              event.content?.role === 'model' &&
              event.content?.parts?.some((part: EventPart) => part.text)
          )
          .map((event: AgentEvent) => {
            const textPart = event.content.parts.find(
              (part: EventPart) => part.text
            );
            return textPart?.text || '';
          });

        if (agentResponses.length > 0) {
          // Use the last response
          const lastResponse = agentResponses[agentResponses.length - 1];
          setMessages((prev) => [
            ...prev,
            {
              role: 'agent',
              content: lastResponse,
            },
          ]);
        }
      } else {
        console.error('Failed to get response:', await response.json());
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            content: 'Sorry, I encountered an error. Please try again.',
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      <ChatIcon onClick={() => setIsOpen(!isOpen)}>
        <MessageCircle color="white" size={22} />
      </ChatIcon>

      <ChatWindow isOpen={isOpen}>
        <ChatHeader>
          <ChatTitle>{agentName}</ChatTitle>
          <CloseButton onClick={() => setIsOpen(false)}>
            <X size={18} />
          </CloseButton>
        </ChatHeader>

        <ChatMessages>
          {messages.map((message, index) => (
            <MessageBubble key={index} isUser={message.role === 'user'}>
              {message.content}
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </ChatMessages>

        <ChatInput>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <SendButton onClick={sendMessage} disabled={isLoading}>
            <Send size={18} />
          </SendButton>
        </ChatInput>
      </ChatWindow>
    </>
  );
};

export default ChatBox;
