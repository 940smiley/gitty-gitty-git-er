/**
 * Unit tests for repository-creator.js
 * Tests the repository creation with AI, retry mechanisms, and recovery paths
 */

// Mock dependencies
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: jest.fn(),
        getContent: jest.fn(),
        createOrUpdateFileContents: jest.fn(),
        update: jest.fn()
      }
    }))
  };
});

jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock sleep to avoid waiting in tests
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn().mockImplementation((fn) => {
    if (fn === setTimeout) {
      return jest.fn().mockResolvedValue();
    }
    return jest.requireActual('util').promisify(fn);
  })
}));

const { Octokit } = require('@octokit/rest');
const logger = require('../../../../src/utils/logger');
const repositoryCreator = require('../../../../src/services/ai/providers/repository-creator');

describe('Repository Creator', () => {
  let mockOctokit;
  let mockAiProvider;
  let mockProviderConfig;
  let accessToken;
  let repositoryOptions;
  let sampleGuidelines;
  let mockRepositoryData;
  let mockAiResponse;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize mock data
    accessToken = 'test-token';
    repositoryOptions = {
      name: 'test-repo',
      description: 'Test repository',
      private: false
    };
    sampleGuidelines = 'Create a Node.js API with Express and MongoDB';
    
    // Mock AI provider
    mockAiProvider = {
      chat: jest.fn()
    };

    // Mock provider config
    mockProviderConfig = {
      name: 'Test Provider',
      model: 'test-model'
    };

    // Sample repository data returned by GitHub
    mockRepositoryData = {
      name: 'test-repo',
      full_name: 'testuser/test-repo',
      owner: {
        login: 'testuser'
      },
      description: 'Test repository',
      html_url: 'https://github.com/testuser/test-repo'
    };

    // Sample AI response
    mockAiResponse = {
      files: [
        {
          path: 'index.js',
          content: 'console.log("Hello, World!");',
          description: 'Main entry point'
        },
        {
          path: 'package.json',
          content: '{"name":"test-repo","version":"1.0.0"}',
          description: 'Package configuration'
        }
      ],
      description: 'A Node.js API project with Express and MongoDB'
    };

    // Configure Octokit mock implementation
    mockOctokit = {
      repos: {
        createForAuthenticatedUser: jest.fn().mockResolvedValue({ data: mockRepositoryData }),
        getContent: jest.fn().mockRejectedValue({ status: 404 }), // Files don't exist by default
        createOrUpdateFileContents: jest.fn().mockResolvedValue({ data: { content: {} } }),
        update: jest.fn().mockResolvedValue({ data: mockRepositoryData })
      }
    };

    Octokit.mockImplementation(() => mockOctokit);

    // Configure AI provider mock
    mockAiProvider.chat.mockResolvedValue(JSON.stringify(mockAiResponse));
  });

  describe('createRepositoryWithAI', () => {
    test('should successfully create a repository with AI-generated files', async () => {
      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(Octokit).toHaveBeenCalledWith({
        auth: accessToken,
        userAgent: 'Gitty-Gitty-Git-Er-Server',
        baseUrl: 'https://api.github.com',
        previews: ['machine-man-preview']
      });
      
      // Verify repository creation
      expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
        name: repositoryOptions.name,
        description: repositoryOptions.description,
        private: repositoryOptions.private,
        auto_init: true
      });

      // Verify AI processing
      expect(mockAiProvider.chat).toHaveBeenCalled();
      
      // Verify file creation (2 files in the mock response)
      expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(2);
      
      // Verify result structure
      expect(result).toEqual({
        ...mockRepositoryData,
        ai_status: 'success',
        files: ['index.js', 'package.json'],
        failed_files: []
      });
    });

    test('should throw error for missing guidelines', async () => {
      // Act & Assert
      await expect(
        repositoryCreator.createRepositoryWithAI(
          '',
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        )
      ).rejects.toThrow('Repository creation guidelines are required');
    });

    test('should throw error for missing repository name', async () => {
      // Act & Assert
      await expect(
        repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          { description: 'Test' },
          mockProviderConfig,
          accessToken,
          mockAiProvider
        )
      ).rejects.toThrow('Repository name is required');
    });

    test('should handle 422 error (repository already exists)', async () => {
      // Arrange
      const error = new Error('Repository already exists');
      error.status = 422;
      mockOctokit.repos.createForAuthenticatedUser.mockRejectedValueOnce(error);

      // Act & Assert
      const resultPromise = repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      await expect(resultPromise).rejects.toThrow('Repository name may already exist or contain invalid characters');
      
      // Verify error code
      await resultPromise.catch(err => {
        expect(err.code).toBe('REPOSITORY_NAME_EXISTS');
      });
    });
  });

  describe('Retry Logic', () => {
    test('should retry repository creation on network error', async () => {
      // Arrange
      const networkError = new Error('Network error');
      networkError.status = 503;
      
      // Fail twice, succeed on third attempt
      mockOctokit.repos.createForAuthenticatedUser
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: mockRepositoryData });

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledTimes(3);
      expect(result.ai_status).toBe('success');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Retry attempt 1/3'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Retry attempt 2/3'));
    });

    test('should not retry on 422 error (repository exists)', async () => {
      // Arrange
      const error = new Error('Repository already exists');
      error.status = 422;
      mockOctokit.repos.createForAuthenticatedUser.mockRejectedValueOnce(error);

      // Act & Assert
      try {
        await repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
        fail('Should have thrown an error');
      } catch (err) {
        expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledTimes(1);
        expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Retry attempt'));
      }
    });
    
    test('should retry AI processing on error', async () => {
      // Arrange
      const aiError = new Error('AI processing error');
      
      // Fail twice, succeed on third attempt
      mockAiProvider.chat
        .mockRejectedValueOnce(aiError)
        .mockRejectedValueOnce(aiError)
        .mockResolvedValueOnce(JSON.stringify(mockAiResponse));

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(mockAiProvider.chat).toHaveBeenCalledTimes(3);
      expect(result.ai_status).toBe('success');
    });
  });

  describe('Recovery Mechanisms', () => {
    test('should recover from AI processing failure with fallback prompt', async () => {
      // Arrange
      const aiError = new Error('AI processing failed');
      
      // Main prompt fails, fallback succeeds
      mockAiProvider.chat
        .mockRejectedValueOnce(aiError) // Initial call fails
        .mockRejectedValueOnce(aiError) // Retry 1 fails
        .mockRejectedValueOnce(aiError) // Retry 2 fails
        .mockRejectedValueOnce(aiError) // Retry 3 fails
        .mockResolvedValueOnce(JSON.stringify(mockAiResponse)); // Fallback prompt succeeds

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(mockAiProvider.chat).toHaveBeenCalledTimes(5); // 4 attempts with original prompt + 1 with fallback
      expect(result.ai_status).toBe('success');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Fallback AI processing succeeded'));
    });

    test('should return partial success when AI processing completely fails', async () => {
      // Arrange
      const aiError = new Error('AI processing failed');
      
      // All AI attempts fail
      mockAiProvider.chat.mockRejectedValue(aiError);

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(result.ai_status).toBe('failed');
      expect(result.ai_error).toBe(aiError.message);
      expect(result.files).toEqual([]);
    });

    test('should create fallback README when file creation fails', async () => {
      // Arrange
      const fileError = new Error('File creation failed');
      fileError.status = 500;
      
      // Mock successful AI processing
      mockAiProvider.chat.mockResolvedValue(JSON.stringify(mockAiResponse));
      
      // Mock file creation failure but README success
      mockOctokit.repos.createOrUpdateFileContents
        .mockRejectedValue(fileError) // Regular file creation fails
        .mockResolvedValueOnce({ data: { content: {} } }); // README succeeds

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(result.ai_status).toBe('partial');
      expect(result.ai_error).toBe(fileError.message);
      expect(result.files).toEqual(['README.md']);
      expect(result.recovered).toBe(true);
    });

    test('should handle transaction state and partial repository creation', async () => {
      // Arrange
      const aiError = new Error('Catastrophic failure');
      
      // Repository is created but everything else fails
      mockAiProvider.chat.mockRejectedValue(aiError);
      mockOctokit.repos.update.mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(result.ai_status).toBe('failed');
      expect(result.ai_error).toBe(aiError.message);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process guidelines with AI'));
    });
  });

  describe('Transaction State Tracking', () => {
    test('should track transaction state through the process', async () => {
      // Arrange
      mockOctokit.repos.createForAuthenticatedUser.mockImplementation(() => {
        // Log current state before resolving
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Starting AI repository creation'));
        return Promise.resolve({ data: mockRepositoryData });
      });

      mockAiProvider.chat.mockImplementation(() => {
        // Verify state is processing_ai
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Processing repository guidelines'));
        return Promise.resolve(JSON.stringify(mockAiResponse));
      });

      mockOctokit.repos.createOrUpdateFileContents.mockImplementation(() => {
        // Verify state is creating_files
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Creating repository files'));
        return Promise.resolve({ data: { content: {} } });
      });

      // Act
      const result = await repositoryCreator.createRepositoryWithAI(
        sampleGuidelines,
        repositoryOptions,
        mockProviderConfig,
        accessToken,
        mockAiProvider
      );

      // Assert
      expect(result.ai_status).toBe('success');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully created AI repository'));
    });

    test('should return error with transaction state when failure occurs', async () => {
      // Arrange
      const processingError = new Error('Processing error');
      mockAiProvider.chat.mockRejectedValue(processingError);
      
      // Mock fallback also failing
      mockAiProvider.chat.mockRejectedValue(processingError);

      // Act
      try {
        await repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
      } catch (error) {
        // Assert
        expect(error.code).toContain('TRANSACTION_FAILED_');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('processing_ai'));
      }
    });
  });

  describe('Error Classification', () => {
    test('should classify 422 errors as REPOSITORY_NAME_EXISTS', async () => {
      // Arrange
      const error = new Error('Repository already exists');
      error.status = 422;
      mockOctokit.repos.createForAuthenticatedUser.mockRejectedValue(error);

      // Act & Assert
      try {
        await repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.code).toBe('REPOSITORY_NAME_EXISTS');
      }
    });

    test('should classify invalid guidelines errors', async () => {
      // Act & Assert
      try {
        await repositoryCreator.createRepositoryWithAI(
          '', // Empty guidelines
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.code).toBe('INVALID_GUIDELINES');
      }
    });

    test('should classify AI provider errors', async () => {
      // Arrange
      mockAiProvider.chat = undefined; // Invalid AI provider

      // Act & Assert
      try {
        await repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.code).toBe('PROVIDER_ERROR');
      }
    });

    test('should identify recoverable errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      networkError.status = 500;
      networkError.headers = { 'retry-after': '10' };
      
      // Fail all attempts
      mockOctokit.repos.createForAuthenticatedUser.mockRejectedValue(networkError);

      // Act & Assert
      try {
        await repositoryCreator.createRepositoryWithAI(
          sampleGuidelines,
          repositoryOptions,
          mockProviderConfig,
          accessToken,
          mockAiProvider
        );
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.status).toBe(500);
        expect(err.recoverable).toBe(true);
        expect(err.retryAfter).toBe('10');
      }
    });
  });
});

