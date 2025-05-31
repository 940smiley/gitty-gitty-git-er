/**
 * AI-Enhanced Code Editor Component
 * Provides a code editor with AI-powered suggestions
 */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { generateCode, completeCode, explainCode } from '../../services/ai';
import AIChat from './AIChat';

// Mock editor component - replace with a real code editor like Monaco or CodeMirror
const CodeEditor = ({ value, onChange, language }) => {
  return (
    <textarea
      className="code-editor-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
};

CodeEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  language: PropTypes.string,
};

/**
 * AI-Enhanced Code Editor Component
 * @param {Object} props - Component props
 * @param {string} props.initialCode - Initial code content
 * @param {string} props.language - Programming language
 * @param {string} props.filename - Filename
 * @param {string} props.repository - Repository name
 * @param {Function} props.onSave - Function called when code is saved
 */
const AIEditor = ({ initialCode = '', language = 'javascript', filename = '', repository = '', onSave }) => {
  const [code, setCode] = useState(initialCode);
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const editorRef = useRef(null);
  
  // Initialize editor with initial code
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);
  
  /**
   * Generate code with AI
   * @param {string} prompt - Text prompt for code generation
   */
  const handleGenerateCode = async (prompt) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const generatedCode = await generateCode(prompt, language, code);
      
      // Add to suggestions
      setSuggestions(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'generation',
          prompt,
          code: generatedCode,
        },
      ]);
      
      setSuccessMessage('Code generated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to generate code:', err);
      setError('Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Complete code with AI
   */
  const handleCompleteCode = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const completion = await completeCode(code, language);
      
      // Add to suggestions
      setSuggestions(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'completion',
          code: completion,
        },
      ]);
      
      setSuccessMessage('Code completion generated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to complete code:', err);
      setError('Failed to complete code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Explain code with AI
   */
  const handleExplainCode = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const explanation = await explainCode(code, language);
      
      // Add to suggestions
      setSuggestions(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'explanation',
          explanation,
        },
      ]);
      
      setSuccessMessage('Code explanation generated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to explain code:', err);
      setError('Failed to explain code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Apply a suggestion to the code
   * @param {Object} suggestion - Suggestion to apply
   */
  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'explanation') {
      // Do nothing for explanations
      return;
    }
    
    setCode(suggestion.code);
    setActiveSuggestion(suggestion.id);
  };
  
  /**
   * Apply a code suggestion from chat
   * @param {string} codeSnippet - Code snippet to apply
   */
  const handleChatSuggestion = (codeSnippet) => {
    setCode(codeSnippet);
    
    // Add to suggestions
    setSuggestions(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'chat',
        code: codeSnippet,
      },
    ]);
    
    setSuccessMessage('Code applied from chat');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  /**
   * Save the current code
   */
  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
  };
  
  /**
   * Clear all suggestions
   */
  const clearSuggestions = () => {
    setSuggestions([]);
    setActiveSuggestion(null);
  };
  
  return (
    <div className="ai-editor">
      <div className="editor-toolbar">
        <div className="file-info">
          <span className="filename">{filename}</span>
          {repository && <span className="repository">{repository}</span>}
          <span className="language">{language}</span>
        </div>
        
        <div className="editor-actions">
          <button
            className="toolbar-button generate-button"
            onClick={() => {
              const prompt = window.prompt('Enter a prompt to generate code:');
              if (prompt) {
                handleGenerateCode(prompt);
              }
            }}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
          
          <button
            className="toolbar-button complete-button"
            onClick={handleCompleteCode}
            disabled={isGenerating}
          >
            Complete Code
          </button>
          
          <button
            className="toolbar-button explain-button"
            onClick={handleExplainCode}
            disabled={isGenerating}
          >
            Explain Code
          </button>
          
          <button
            className="toolbar-button save-button"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      
      {error && (
        <div className="editor-error">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="editor-success">
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="editor-container">
        <div className="code-editor" ref={editorRef}>
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
          />
        </div>
        
        <div className="suggestions-panel">
          <div className="suggestions-header">
            <h3>AI Suggestions</h3>
            
            {suggestions.length > 0 && (
              <button
                className="clear-suggestions-button"
                onClick={clearSuggestions}
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="suggestions-list">
            {suggestions.length === 0 ? (
              <div className="no-suggestions">
                <p>No suggestions yet. Try generating some code!</p>
              </div>
            ) : (
              suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${activeSuggestion === suggestion.id ? 'active' : ''} ${suggestion.type}`}
                >
                  <div className="suggestion-header">
                    <span className="suggestion-type">
                      {suggestion.type === 'generation' && 'Generated Code'}
                      {suggestion.type === 'completion' && 'Code Completion'}
                      {suggestion.type === 'explanation' && 'Code Explanation'}
                      {suggestion.type === 'chat' && 'From Chat'}
                    </span>
                    
                    {suggestion.type !== 'explanation' && (
                      <button
                        className="apply-suggestion-button"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {activeSuggestion === suggestion.id ? 'Applied' : 'Apply'}
                      </button>
                    )}
                  </div>
                  
                  {suggestion.prompt && (
                    <div className="suggestion-prompt">
                      <strong>Prompt:</strong> {suggestion.prompt}
                    </div>
                  )}
                  
                  <div className="suggestion-content">
                    {suggestion.type === 'explanation' ? (
                      <div className="explanation-text">{suggestion.explanation}</div>
                    ) : (
                      <pre className="code-preview">
                        <code>{suggestion.code}</code>
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <AIChat
        initialContext={initialCode}
        language={language}
        repository={repository}
        onSuggestion={handleChatSuggestion}
      />
    </div>
  );
};

AIEditor.propTypes = {
  initialCode: PropTypes.string,
  language: PropTypes.string,
  filename: PropTypes.string,
  repository: PropTypes.string,
  onSave: PropTypes.func,
};

export default AIEditor;

