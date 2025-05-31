/**
 * Repository Card Component
 * Displays a single repository with key information and actions
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import RepositoryActions from './RepositoryActions';
import { useAIContext } from '../../context/AIContext';

/**
 * Format a date in a user-friendly format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Repository Card Component
 * @param {Object} props - Component props
 * @param {Object} props.repository - Repository data
 * @param {Function} props.onRefresh - Function to refresh repositories after action
 */
const RepositoryCard = ({ repository, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();
  const { isAIEnabled, processWithAI } = useAIContext();
  
  // Extract repository data
  const {
    name,
    full_name,
    description,
    html_url,
    owner,
    stargazers_count,
    forks_count,
    open_issues_count,
    language,
    updated_at,
    private: isPrivate,
    fork
  } = repository;
  
  /**
   * Toggle expanded state
   */
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  /**
   * Handle edit with AI button click
   */
  const handleEditWithAI = async () => {
    try {
      setAiLoading(true);
      await processWithAI(repository.full_name);
      navigate(`/repositories/edit/${repository.full_name}?ai=true`);
    } catch (error) {
      console.error('Failed to process repository with AI:', error);
      alert('Failed to process repository with AI. Please try again later.');
    } finally {
      setAiLoading(false);
    }
  };
  
  /**
   * Handle edit button click
   */
  const handleEdit = () => {
    navigate(`/repositories/edit/${repository.full_name}`);
  };
  
  return (
    <div className="repository-card">
      <div className="repository-card-header">
        <div className="repository-info">
          <h3 className="repository-name">
            <a href={html_url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            {isPrivate && <span className="repository-private-badge">Private</span>}
            {fork && <span className="repository-fork-badge">Fork</span>}
          </h3>
          <div className="repository-owner">
            <img 
              src={owner.avatar_url} 
              alt={`${owner.login}'s avatar`} 
              className="owner-avatar" 
            />
            <span>{owner.login}</span>
          </div>
        </div>
        
        <button 
          className="repository-expand-button"
          onClick={toggleExpanded}
          aria-label={expanded ? 'Collapse repository details' : 'Expand repository details'}
        >
          {expanded ? '↑' : '↓'}
        </button>
      </div>
      
      {description && (
        <p className="repository-description">{description}</p>
      )}
      
      <div className="repository-stats">
        <div className="repository-stat">
          <span className="stat-icon">★</span>
          <span className="stat-count">{stargazers_count}</span>
        </div>
        <div className="repository-stat">
          <span className="stat-icon">🍴</span>
          <span className="stat-count">{forks_count}</span>
        </div>
        <div className="repository-stat">
          <span className="stat-icon">⚠️</span>
          <span className="stat-count">{open_issues_count}</span>
        </div>
        {language && (
          <div className="repository-language">
            <span className="language-dot" style={{ backgroundColor: getLanguageColor(language) }}></span>
            <span className="language-name">{language}</span>
          </div>
        )}
      </div>
      
      <div className="repository-footer">
        <span className="repository-updated">
          Updated on {formatDate(updated_at)}
        </span>
        
        <RepositoryActions
          repository={repository}
          onRefresh={onRefresh}
        />
      </div>
      
      {expanded && (
        <div className="repository-expanded-content">
          <div className="repository-actions-expanded">
            <a href={`${html_url}/issues`} target="_blank" rel="noopener noreferrer" className="repository-action-link">
              View Issues
            </a>
            <a href={`${html_url}/pulls`} target="_blank" rel="noopener noreferrer" className="repository-action-link">
              Pull Requests
            </a>
            <a href={`${html_url}/commits`} target="_blank" rel="noopener noreferrer" className="repository-action-link">
              Commits
            </a>
            <a href={`${html_url}/branches`} target="_blank" rel="noopener noreferrer" className="repository-action-link">
              Branches
            </a>
            <button onClick={handleEdit} className="repository-action-link">
              Edit
            </button>
            {isAIEnabled && (
              <button 
                onClick={handleEditWithAI} 
                className="repository-action-link ai-button"
                disabled={aiLoading}
              >
                {aiLoading ? 'Processing...' : 'Edit with AI'}
              </button>
            )}
          </div>
          
          <div className="repository-links">
            <a href={html_url} target="_blank" rel="noopener noreferrer" className="repository-button primary">
              View on GitHub
            </a>
            <a href={`/repositories/code/${full_name}`} className="repository-button secondary">
              Browse Code
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get color for a programming language
 * @param {string} language - Programming language
 * @returns {string} Color hex code
 */
const getLanguageColor = (language) => {
  const colors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Go: '#00ADD8',
    Ruby: '#701516',
    PHP: '#4F5D95',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Rust: '#dea584',
  };
  
  return colors[language] || '#858585';
};

RepositoryCard.propTypes = {
  repository: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    full_name: PropTypes.string.isRequired,
    description: PropTypes.string,
    html_url: PropTypes.string.isRequired,
    owner: PropTypes.shape({
      login: PropTypes.string.isRequired,
      avatar_url: PropTypes.string.isRequired,
    }).isRequired,
    stargazers_count: PropTypes.number.isRequired,
    forks_count: PropTypes.number.isRequired,
    open_issues_count: PropTypes.number.isRequired,
    language: PropTypes.string,
    updated_at: PropTypes.string.isRequired,
    private: PropTypes.bool.isRequired,
    fork: PropTypes.bool.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default RepositoryCard;

/* Add this CSS to your stylesheet */
/*
.ai-button {
  background-color: #6366f1;
  color: white;
  border: none;
  transition: background-color 0.2s;
}

.repository-actions-expanded .ai-button {
  color: white;
  background-color: #6366f1;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
}

.ai-button:hover:not(:disabled) {
  background-color: #4f46e5;
}

.ai-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
*/

