/**
 * AI Chat Component
 * Provides a chat interface for interacting with AI
 */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { chatWithAI, getActiveAIProvider } from '../../services/ai';
import MarkdownRenderer from '../common/MarkdownRenderer';

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant specialized in helping with GitHub repositories and code. " +
  "You can provide code suggestions, explain code, and answer questions related to software development.";

/**
 * AI Chat Component
 * @param {Object} props - Component props
 * @param {string} props.initialContext - Initial context for the chat (e.g., file content)
 * @param {string} props.language - Programming language of the context
 * @param {string} props.repository - Repository name
 * @param {Function} props.onSuggestion - Function to handle code suggestions
 */
const AIChat = ({ initialContext = '', language = '', repository = '', onSuggestion }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Initialize chat with system message
  useEffect(() => {
    setMessages([
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ]);
    
    // Add initial context if provided
    if (initialContext) {
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Here is the current file content in ${language || 'code'} from the repository ${repository || 'current repository'}:\n\n\`\`\`${language}\n${initialContext}\n\`\`\``,
        },
      ]);
    }
    
    // Get active AI provider
    const loadActiveProvider = async () => {
      try {
        const provider = await getActiveAIProvider();
        setActiveProvider(provider);
      } catch (err) {
        console.error('Failed to get active AI provider:', err);
        setError('Failed to load AI provider. Some features may be limited.');
      }
    };
    
    loadActiveProvider();
  }, [initialContext, language, repository]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  /**
   * Send a message to the AI
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Filter out system messages for the API request
      const visibleMessages = messages.filter(msg => msg.role !== 'system');
      
      // Prepare the full message history
      const fullMessages = [
        ...messages, // Include system messages
        userMessage,
      ];
      
      const response = await chatWithAI(fullMessages, {
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If the message contains a code suggestion, extract it
      if (onSuggestion && response.message.includes('```')) {
        const codeBlocks = response.message.match(/```(?:\w+)?\n([\s\S]*?)```/g);
        
        if (codeBlocks && codeBlocks.length > 0) {
          // Extract code from the first code block
          const code = codeBlocks[0]
            .replace(/```(?:\w+)?\n/, '') // Remove opening ```language
            .replace(/```$/, ''); // Remove closing ```
          
          onSuggestion(code);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle keyboard shortcuts
   * @param {Event} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    // Send message on Enter (but not with Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  /**
   * Apply a code suggestion
   * @param {string} code - Code suggestion to apply
   */
  const applyCodeSuggestion = (code) => {
    if (onSuggestion) {
      onSuggestion(code);
    }
  };
  
  /**
   * Toggle expanded state
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ]);
    
    // Add initial context if provided
    if (initialContext) {
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Here is the current file content in ${language || 'code'} from the repository ${repository || 'current repository'}:\n\n\`\`\`${language}\n${initialContext}\n\`\`\``,
        },
      ]);
    }
  };
  
  return (
    <div className={`ai-chat ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="chat-header">
        <div className="chat-title">
          <span className="ai-icon">🤖</span>
          <h3>AI Assistant {activeProvider && `(${activeProvider.name})`}</h3>
        </div>
        
        <div className="chat-controls">
          <button
            className="clear-chat-button"
            onClick={clearChat}
            title="Clear chat history"
          >
            🗑️
          </button>
          <button
            className="toggle-chat-button"
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse chat' : 'Expand chat'}
          >
            {isExpanded ? '↓' : '↑'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <div className="chat-messages">
            {messages
              .filter(msg => msg.role !== 'system') // Hide system messages
              .map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <MarkdownRenderer content={msg.content} />
                    
                    {msg.role === 'assistant' && msg.content.includes('```') && (
                      <div className="message-actions">
                        <button
                          className="apply-code-button"
                          onClick={() => {
                            const codeBlock = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                            if (codeBlock && codeBlock[1]) {
                              applyCodeSuggestion(codeBlock[1]);
                            }
                          }}
                        >
                          Apply Code
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            
            {isLoading && (
              <div className="chat-message assistant-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="chat-error">
                <p>{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your code..."
              disabled={isLoading}
              rows={1}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

AIChat.propTypes = {
  initialContext: PropTypes.string,
  language: PropTypes.string,
  repository: PropTypes.string,
  onSuggestion: PropTypes.func,
};

export default AIChat;

