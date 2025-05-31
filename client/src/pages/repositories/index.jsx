/**
 * Repositories Page
 * Main page for repository management
 */
import { Helmet } from 'react-helmet-async';
import RepositoryList from '../../components/repositories/RepositoryList';

/**
 * Repositories Page Component
 */
const RepositoriesPage = () => {
  return (
    <div className="repositories-page">
      <Helmet>
        <title>My Repositories - Gitty-Gitty-Git-Er</title>
        <meta name="description" content="Manage your GitHub repositories" />
      </Helmet>
      
      <RepositoryList />
    </div>
  );
};

export default RepositoriesPage;

