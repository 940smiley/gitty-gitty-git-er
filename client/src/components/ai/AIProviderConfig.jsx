/**
 * AI Provider Configuration Component
 * Allows users to configure different AI providers
 */
import { useState, useEffect, useRef } from 'react';
import { 
  getAIProviders, 
  setActiveAIProvider, 
  updateAIProviderConfig,
  checkLocalLLMAvailability,
  uploadModel,
  getUploadedModels,
  deleteUploadedModel,
  AI_PROVIDERS 
} from '../../services/ai';

// Provider icons
const providerIcons = {
  github: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  microsoft: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
    </svg>
  ),
  ollama: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9.5A1.5 1.5 0 019.5 8h5A1.5 1.5 0 0116 9.5v5a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 14.5v-5z" />
    </svg>
  ),
  lmstudio: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  anythingllm: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z" />
    </svg>
  ),
  chatall: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      <path d="M7 9h10M7 13h7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  pinokio: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2c-4.42 0-8 3.58-8 8 0 3.35 2.04 6.22 5 7.41V19c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-1.59c2.96-1.19 5-4.06 5-7.41 0-4.42-3.58-8-8-8zm-2 18v-1h4v1h-4z" />
    </svg>
  ),
  custom: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.92 3.32c-.12.22-.07.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  ),
};

/**
 * Model Upload Component
 * Handles uploading GGUF model files
 */
const ModelUpload = ({ onModelUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection and validation
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.gguf')) {
      setUploadError('Only GGUF files are supported');
      return;
    }

    // Validate file size (max 4GB)
    const maxSize = 4 * 1024 * 1024 * 1024; // 4GB in bytes
    if (file.size > maxSize) {
      setUploadError(`File size exceeds the maximum limit of 4GB`);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('model', file);

      // Upload the model with progress tracking
      await uploadModel(formData, (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onModelUploaded) {
        onModelUploaded();
      }
    } catch (error) {
      console.error('Failed to upload model:', error);
      setUploadError(`Failed to upload model: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="model-upload-container">
      <h3 className="upload-title">Upload GGUF Model</h3>
      
      <div className="upload-form">
        <input
          type="file"
          accept=".gguf"
          onChange={handleFileSelect}
          disabled={uploading}
          ref={fileInputRef}
          className="file-input"
        />
        
        <div className="upload-info">
          <p>Supported format: <strong>.gguf</strong></p>
          <p>Maximum file size: <strong>4GB</strong></p>
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
        
        {uploadError && (
          <div className="upload-error">
            <p>{uploadError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Model Management Component
 * Displays and manages uploaded models
 */
const ModelManagement = ({ onModelDeleted, selectedModels, onSelectModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load models on mount and when models are deleted
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const modelsData = await getUploadedModels();
        setModels(modelsData);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load models. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadModels();
  }, []);

  /**
   * Handle model deletion
   */
  const handleDeleteModel = async (modelId) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }
    
    try {
      setDeleting(true);
      await deleteUploadedModel(modelId);
      
      // Update models list
      setModels(models.filter(model => model.id !== modelId));
      
      // Notify parent component
      if (onModelDeleted) {
        onModelDeleted();
      }
    } catch (err) {
      console.error('Failed to delete model:', err);
      alert('Failed to delete model. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle model selection
   */
  const handleSelectModel = (providerId, modelId) => {
    if (onSelectModel) {
      onSelectModel(providerId, modelId);
    }
  };

  // Format file size in human-readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="model-loading">
        <div className="loading-spinner"></div>
        <p>Loading models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="model-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="no-models">
        <p>No models uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="model-management">
      <h3 className="models-title">Uploaded Models</h3>
      
      <div className="models-list">
        {models.map(model => (
          <div key={model.id} className="model-item">
            <div className="model-info">
              <h4 className="model-name">{model.name}</h4>
              <div className="model-details">
                <span className="model-size">{formatFileSize(model.size)}</span>
                <span className="model-type">{model.quantization || 'Unknown quantization'}</span>
                <span className="model-date">Uploaded: {new Date(model.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="model-actions">
              <div className="model-provider-selection">
                <label>Use with:</label>
                <div className="provider-checkboxes">
                  {Object.entries(AI_PROVIDERS).map(([key, providerId]) => (
                    // Only show for local LLM providers
                    (providerId === AI_PROVIDERS.OLLAMA ||
                     providerId === AI_PROVIDERS.LM_STUDIO ||
                     providerId === AI_PROVIDERS.ANYTHING_LLM) && (
                      <div key={providerId} className="provider-checkbox">
                        <input
                          type="radio"
                          id={`model-${model.id}-provider-${providerId}`}
                          name={`model-provider-${model.id}`}
                          checked={selectedModels[providerId] === model.id}
                          onChange={() => handleSelectModel(providerId, model.id)}
                        />
                        <label htmlFor={`model-${model.id}-provider-${providerId}`}>
                          {providerId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              <button
                className="delete-model-button"
                onClick={() => handleDeleteModel(model.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AI Provider Configuration Component
 */
const AIProviderConfig = () => {
  const [providers, setProviders] = useState({});
  const [activeProviderId, setActiveProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedModels, setSelectedModels] = useState({});
  const [showModelUpload, setShowModelUpload] = useState(false);
  
  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const providersData = await getAIProviders();
        setProviders(providersData);
        
        // Determine active provider
        const activeProvider = Object.entries(providersData).find(
          ([_, config]) => config.enabled
        );
        
        if (activeProvider) {
          setActiveProviderId(activeProvider[0]);
        } else {
          // Default to GitHub Copilot if no active provider
          setActiveProviderId(AI_PROVIDERS.GITHUB_COPILOT);
        }
        
        // Load selected models for each provider
        const models = {};
        Object.entries(providersData).forEach(([providerId, config]) => {
          if (config.modelId) {
            models[providerId] = config.modelId;
          }
        });
        setSelectedModels(models);
      } catch (err) {
        console.error('Failed to load AI providers:', err);
        setError('Failed to load AI providers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProviders();
  }, []);
  
  // Check availability of local LLM providers
  useEffect(() => {
    const checkAvailability = async () => {
      const statuses = {};
      
      for (const providerId of Object.values(AI_PROVIDERS)) {
        // Only check local LLM providers
        if (
          providerId === AI_PROVIDERS.OLLAMA ||
          providerId === AI_PROVIDERS.LM_STUDIO ||
          providerId === AI_PROVIDERS.ANYTHING_LLM ||
          providerId === AI_PROVIDERS.CHATALL ||
          providerId === AI_PROVIDERS.PINOKIO
        ) {
          const isAvailable = await checkLocalLLMAvailability(providerId);
          statuses[providerId] = isAvailable;
        }
      }
      
      setAvailabilityStatus(statuses);
    };
    
    if (!loading && Object.keys(providers).length > 0) {
      checkAvailability();
    }
  }, [loading, providers]);
  
  /**
   * Set the active AI provider
   * @param {string} providerId - Provider ID to set as active
   */
  const handleSetActiveProvider = async (providerId) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await setActiveAIProvider(providerId);
      
      // Update local state
      setActiveProviderId(providerId);
      
      // Update providers state
      setProviders(prev => {
        const updated = { ...prev };
        
        // Disable all providers
        Object.keys(updated).forEach(id => {
          updated[id] = { ...updated[id], enabled: id === providerId };
        });
        
        return updated;
      });
      
      setSuccessMessage(`${providers[providerId]?.name || 'Provider'} set as active`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to set active provider:', err);
      setError('Failed to set active provider. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Update a provider configuration
   * @param {string} providerId - Provider ID to update
   * @param {Object} updates - Configuration updates
   */
  const handleUpdateProvider = async (providerId, updates) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedConfig = { ...providers[providerId], ...updates };
      await updateAIProviderConfig(providerId, updatedConfig);
      
      // Update local state
      setProviders(prev => ({
        ...prev,
        [providerId]: updatedConfig,
      }));
      
      setSuccessMessage(`${updatedConfig.name} configuration updated`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update provider config:', err);
      setError('Failed to update provider configuration. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Test connection to a local LLM provider
   * @param {string} providerId - Provider ID to test
   */
  const handleTestConnection = async (providerId) => {
    try {
      setIsTesting(true);
      setError(null);
      
      const isAvailable = await checkLocalLLMAvailability(providerId);
      
      setAvailabilityStatus(prev => ({
        ...prev,
        [providerId]: isAvailable,
      }));
      
      if (isAvailable) {
        setSuccessMessage(`Successfully connected to ${providers[providerId]?.name}`);
      } else {
        setError(`Could not connect to ${providers[providerId]?.name}. Please check your configuration.`);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to test connection:', err);
      setError(`Failed to connect to ${providers[providerId]?.name}. ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  /**
   * Handle model selection for a provider
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   */
  const handleSelectModel = async (providerId, modelId) => {
    try {
      setIsUpdating(true);
      
      // Update selected models state
      setSelectedModels(prev => ({
        ...prev,
        [providerId]: modelId,
      }));
      
      // Update provider configuration
      await handleUpdateProvider(providerId, { modelId });
      
      setSuccessMessage(`Model updated for ${providers[providerId]?.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to select model:', err);
      setError(`Failed to select model. ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Handle model upload completion
   */
  const handleModelUploaded = () => {
    setSuccessMessage('Model uploaded successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    // Toggle model upload view
    setShowModelUpload(false);
  };
  
  /**
   * Handle model deletion
   */
  const handleModelDeleted = () => {
    setSuccessMessage('Model deleted successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  if (loading) {
    return (
      <div className="ai-provider-loading">
        <div className="loading-spinner"></div>
        <p>Loading AI providers...</p>
      </div>
    );
  }
  
  return (
    <div className="ai-provider-config">
      <h2 className="config-title">AI Provider Settings</h2>
      
      {error && (
        <div className="config-error">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="config-success">
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="model-management-section">
        <div className="model-management-header">
          <h3>Model Management</h3>
          <button 
            className="toggle-upload-button"
            onClick={() => setShowModelUpload(!showModelUpload)}
          >
            {showModelUpload ? 'Hide Upload Form' : 'Upload New Model'}
          </button>
        </div>
        
        {showModelUpload && (
          <ModelUpload onModelUploaded={handleModelUploaded} />
        )}
        
        <ModelManagement 
          onModelDeleted={handleModelDeleted}
          selectedModels={selectedModels}
          onSelectModel={handleSelectModel}
        />
      </div>
      
      <div className="provider-cards">
        {Object.entries(providers).map(([providerId, config]) => (
          <div 
            key={providerId}
            className={`provider-card ${activeProviderId === providerId ? 'active' : ''}`}
          >
            <div className="provider-header">
              <div className="provider-icon">
                {providerIcons[config.icon] || providerIcons.custom}
              </div>
              
              <div className="provider-info">
                <h3 className="provider-name">{config.name}</h3>
                <p className="provider-description">{config.description}</p>
              </div>
              
              <div className="provider-status">
                {
                  // Only show status for local LLM providers
                  (providerId === AI_PROVIDERS.OLLAMA ||
                   providerId === AI_PROVIDERS.LM_STUDIO ||
                   providerId === AI_PROVIDERS.ANYTHING_LLM ||
                   providerId === AI_PROVIDERS.CHATALL ||
                   providerId === AI_PROVIDERS.PINOKIO) && (
                    <span className={`status-indicator ${availabilityStatus[providerId] ? 'available' : 'unavailable'}`}>
                      {availabilityStatus[providerId] ? 'Available' : 'Unavailable'}
                    </span>
                  )
                }
              </div>
            </div>
            
            <div className="provider-form">
              {config.requiresEndpoint && (
                <div className="form-field">
                  <label htmlFor={`endpoint-${providerId}`}>Endpoint URL:</label>
                  <input
                    id={`endpoint-${providerId}`}
                    type="url"
                    value={config.endpoint || ''}
                    onChange={(e) => handleUpdateProvider(providerId, { endpoint: e.target.value })}
                    placeholder="Enter API endpoint URL"
                  />
                </div>
              )}
              
              {config.requiresApiKey && (
                <div className="form-field">
                  <label htmlFor={`apikey-${providerId}`}>API Key:</label>
                  <input
                    id={`apikey-${providerId}`}
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => handleUpdateProvider(providerId, { apiKey: e.target.value })}
                    placeholder="Enter API key"
                  />
                </div>
              )}
              
              {providerId === AI_PROVIDERS.OLLAMA && (
                <div className="form-field">
                  <label htmlFor={`model-${providerId}`}>Default Model:</label>
                  <select
                    id={`model-${providerId}`}
                    value={config.model || 'codellama'}
                    onChange={(e) => handleUpdateProvider(providerId, { model: e.target.value })}
                  >
                    <option value="codellama">CodeLlama</option>
                    <option value="llama2">Llama 2</option>
                    <option value="mistral">Mistral</option>
                    <option value="gemma">Gemma</option>
                    <option value="phi">Phi</option>
                    <option value="custom">Custom (uploaded model)</option>
                  </select>
                  
                  {config.model === 'custom' && (
                    <div className="custom-model-notice">
                      <p>Please select an uploaded model from the Model Management section above</p>
                    </div>
                  )}
                </div>
              )}
              
              {providerId === AI_PROVIDERS.LM_STUDIO && (
                <div className="form-field">
                  <label htmlFor={`model-${providerId}`}>Model Configuration:</label>
                  <div className="model-options">
                    <select
                      id={`model-source-${providerId}`}
                      value={config.modelSource || 'builtin'}
                      onChange={(e) => handleUpdateProvider(providerId, { modelSource: e.target.value })}
                    >
                      <option value="builtin">Built-in Model</option>
                      <option value="custom">Custom (uploaded model)</option>
                    </select>
                    
                    {config.modelSource === 'builtin' ? (
                      <input
                        id={`model-${providerId}`}
                        type="text"
                        value={config.model || ''}
                        onChange={(e) => handleUpdateProvider(providerId, { model: e.target.value })}
                        placeholder="Model name in LM Studio"
                      />
                    ) : (
                      <div className="custom-model-notice">
                        <p>Please select an uploaded model from the Model Management section above</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="provider-actions">
              {
                // Show test connection button for local LLM providers
                (providerId === AI_PROVIDERS.OLLAMA ||
                 providerId === AI_PROVIDERS.LM_STUDIO ||
                 providerId === AI_PROVIDERS.ANYTHING_LLM ||
                 providerId === AI_PROVIDERS.CHATALL ||
                 providerId === AI_PROVIDERS.PINOKIO) && (
                  <button
                    className="test-connection-button"
                    onClick={() => handleTestConnection(providerId)}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                )
              }
              
              <button
                className={`set-active-button ${activeProviderId === providerId ? 'active' : ''}`}
                onClick={() => handleSetActiveProvider(providerId)}
                disabled={isUpdating || activeProviderId === providerId}
              >
                {activeProviderId === providerId ? 'Active Provider' : 'Set as Active'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIProviderConfig;

/* Add this CSS to your stylesheet */
/*
.model-upload-container {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.upload-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.upload-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex-grow: 1;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s;
}

.progress-text {
  font-weight: 600;
  color: #3b82f6;
}

.upload-error {
  color: #ef4444;
  font-size: 0.875rem;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 0.375rem;
}

.model-management {
  margin-bottom: 2rem;
}

.models-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
}

.model-info {
  flex-grow: 1;
}

.model-name {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.model-details {
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.model-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.delete-model-button {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #ef4444;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-model-button:hover:not(:disabled) {
  background-color: #dc2626;
}

.delete-model-button:disabled {
  background-color: #f87171;
  cursor: not-allowed;
}

.model-provider-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.provider-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.provider-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.model-management-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.model-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.toggle-upload-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-upload-button:hover {
  background-color: #2563eb;
}

.custom-model-notice {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #eff6ff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.model-options {
  display: flex;
  gap: 0.5rem;
}
*/

