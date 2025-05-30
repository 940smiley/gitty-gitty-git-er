/**
 * Repository List Component
 * Displays a list of repositories with filtering and pagination
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserRepositories } from '../../services/github';
import RepositoryCard from './RepositoryCard';

/**
 * Repository List Component
 */
const RepositoryList = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('updated');
  const [direction, setDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const perPage = 10;
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  /**
   * Fetch repositories based on current filters and pagination
   */
  const fetchRepositories = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset to page 1 if refreshing or changing filters
      const currentPage = refresh ? 1 : page;
      if (refresh) setPage(1);
      
      const queryParams = {
        page: currentPage,
        per_page: perPage,
        sort,
        direction,
        type: filter,
        q: searchQuery
      };
      
      const data = await getUserRepositories(queryParams);
      
      // Update repositories (append if loading more, replace if refreshing)
      setRepositories(prev => {
        if (refresh || currentPage === 1) return data;
        return [...prev, ...data];
      });
      
      // Check if there are more repositories to load
      setHasMore(data.length === perPage);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError('Failed to load repositories. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sort, direction, filter, searchQuery]);
  
  // Fetch repositories on initial load and when filters change
  useEffect(() => {
    fetchRepositories(true);
  }, [sort, direction, filter]);
  
  /**
   * Load more repositories
   */
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  /**
   * Handle search form submission
   */
  const handleSearch = (e) => {
    e.preventDefault();
    fetchRepositories(true);
  };
  
  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setSort('updated');
    setDirection('desc');
    fetchRepositories(true);
  };
  
  return (
    <div className="repository-list-container">
      <div className="repository-list-header">
        <h2 className="repository-list-title">My Repositories</h2>
        
        <Link to="/repositories/new" className="new-repository-button">
          New Repository
        </Link>
      </div>
      
      {!isOnline && (
        <div className="offline-notice">
          <span className="offline-icon">⚠️</span>
          <span>You are currently offline. Some features may be limited.</span>
        </div>
      )}
      
      <div className="repository-filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Find a repository..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="filter-type">Type:</label>
            <select
              id="filter-type"
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="owner">Owned</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="member">Member</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="filter-sort">Sort:</label>
            <select
              id="filter-sort"
              className="filter-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="updated">Last updated</option>
              <option value="created">Created date</option>
              <option value="pushed">Last pushed</option>
              <option value="full_name">Name</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="filter-direction">Order:</label>
            <select
              id="filter-direction"
              className="filter-select"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <button
            className="reset-filters-button"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => fetchRepositories(true)}
          >
            Retry
          </button>
        </div>
      )}
      
      {loading && page === 1 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading repositories...</p>
        </div>
      ) : repositories.length === 0 ? (
        <div className="empty-state">
          <h3>No repositories found</h3>
          <p>
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first repository to get started'}
          </p>
          {(searchQuery || filter !== 'all' || sort !== 'updated' || direction !== 'desc') && (
            <button
              className="reset-filters-button"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          )}
          <Link to="/repositories/new" className="create-repository-button">
            Create Repository
          </Link>
        </div>
      ) : (
        <>
          <div className="repository-grid">
            {repositories.map(repo => (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                onRefresh={() => fetchRepositories(true)}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="load-more-container">
              <button
                className="load-more-button"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RepositoryList;

