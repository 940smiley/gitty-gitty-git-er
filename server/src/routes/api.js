/**
 * API Routes Module
 * Defines all API endpoints for the application
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Controllers
const aiController = require('../controllers/ai.controller');
// Add other controllers as needed

// AI Routes
router.get('/ai/providers', authMiddleware.requireAuth, aiController.getProviders);
router.get('/ai/providers/active', authMiddleware.requireAuth, aiController.getActiveProvider);
router.post('/ai/providers/active', authMiddleware.requireAuth, aiController.setActiveProvider);
router.patch('/ai/providers/:providerId', authMiddleware.requireAuth, aiController.updateProviderConfig);
router.post('/ai/code/generate', authMiddleware.requireAuth, aiController.generateCode);
router.post('/ai/code/complete', authMiddleware.requireAuth, aiController.completeCode);
router.post('/ai/code/explain', authMiddleware.requireAuth, aiController.explainCode);
router.post('/ai/chat', authMiddleware.requireAuth, aiController.chat);
router.post('/ai/repository', authMiddleware.requireAuth, aiController.createRepository);

module.exports = router;

