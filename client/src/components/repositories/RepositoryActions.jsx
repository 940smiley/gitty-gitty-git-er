/**
 * Repository Actions Component
 * Provides action buttons for a repository (star, fork, etc.)
 */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  starRepository, 
  unstarRepository, 
  isRepositoryStarred,
  deleteRepository
} from '../../services/github';

/**
 * Repository Actions Component
 * @param {Object} props - Component props
 * @param {Object} props.repository - Repository data
 * @param {Function} props.onRefresh - Function to refresh repositories after action
 */
const RepositoryActions = ({ repository, onRefresh }) => {
  const [isStarred, setIsStarred] = useState(false);
  const [isStarLoading, setIsStarLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { owner, name, full_name } = repository;
  const ownerLogin = owner.login;
  
  // Check if repository is starred on load
  useEffect(() => {
    const checkStarred = async () => {
      try {
        setIsStarLoading(true);
        const starred = await isRepositoryStarred(ownerLogin, name);
        setIsStarred(starred);
      } catch (error) {
        console.error('Failed to check if repository is starred:', error);
      } finally {
        setIsStarLoading(false);
      }
    };
    
    checkStarred();
  }, [ownerLogin, name]);
  
  /**
   * Toggle star status
   */
  const handleToggleStar = async () => {
    try {
      setIsStarLoading(true);
      
      if (isStarred) {
        await unstarRepository(ownerLogin, name);
      } else {
        await starRepository(ownerLogin, name);
      }
      
      setIsStarred(!isStarred);
      
      // Refresh repository list to update star count
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to toggle star status:', error);
    } finally {
      setIsStarLoading(false);
    }
  };
  
  /**
   * Open delete confirmation modal
   */
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  
  /**
   * Close delete confirmation modal
   */
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  
  /**
   * Delete repository
   */
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteRepository(ownerLogin, name);
      
      // Refresh repository list after deletion
      if (onRefresh) {
        onRefresh();
      }
      
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete repository:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  /**
   * Fork repository
   */
  const handleFork = () => {
    // Open GitHub fork page in new tab
    window.open(`https://github.com/${full_name}/fork`, '_blank');
  };
  
  /**
   * Clone repository
   */
  const handleClone = () => {
    // Copy clone URL to clipboard
    navigator.clipboard.writeText(`https://github.com/${full_name}.git`)
      .then(() => {
        // Show toast notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Clone URL copied to clipboard', {
            body: `git clone https://github.com/${full_name}.git`
          });
        } else {
          alert('Clone URL copied to clipboard');
        }
      })
      .catch(err => {
        console.error('Failed to copy clone URL:', err);
      });
  };
  
  return (
    <div className="repository-actions">
      <button
        className={`action-button star-button ${isStarred ? 'starred' : ''}`}
        onClick={handleToggleStar}
        disabled={isStarLoading}
        aria-label={isStarred ? 'Unstar repository' : 'Star repository'}
      >
        {isStarLoading ? (
          <span className="loading-spinner small"></span>
        ) : (
          <>
            <span className="star-icon">{isStarred ? '★' : '☆'}</span>
            <span className="action-text">{isStarred ? 'Starred' : 'Star'}</span>
          </>
        )}
      </button>
      
      <button
        className="action-button fork-button"
        onClick={handleFork}
        aria-label="Fork repository"
      >
        <span className="fork-icon">🍴</span>
        <span className="action-text">Fork</span>
      </button>
      
      <button
        className="action-button clone-button"
        onClick={handleClone}
        aria-label="Copy clone URL"
      >
        <span className="clone-icon">📋</span>
        <span className="action-text">Clone</span>
      </button>
      
      <div className="action-dropdown">
        <button className="action-dropdown-button" aria-label="More actions">
          ⋯
        </button>
        <div className="action-dropdown-content">
          <a href={`/repositories/edit/${full_name}`} className="dropdown-item">
            Edit Details
          </a>
          <a href={`/repositories/settings/${full_name}`} className="dropdown-item">
            Settings
          </a>
          <button
            className="dropdown-item danger"
            onClick={openDeleteModal}
          >
            Delete
          </button>
        </div>
      </div>
      
      {isDeleteModalOpen && (
        <div className="modal delete-modal">
          <div className="modal-content">
            <h3 className="modal-title">Delete Repository</h3>
            <p className="modal-message">
              Are you sure you want to delete <strong>{full_name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-button cancel"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-button delete"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RepositoryActions.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.shape({
      login: PropTypes.string.isRequired,
    }).isRequired,
    name: PropTypes.string.isRequired,
    full_name: PropTypes.string.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default RepositoryActions;

