/**
 * AI Routes
 * Defines routes for AI-related API endpoints
 */

const express = require('express');
const aiController = require('../controllers/ai.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limiter');

const router = express.Router();

// AI provider management routes
router.get('/providers', verifyToken, aiController.getProviders);
router.get('/provider/active', verifyToken, aiController.getActiveProvider);
router.post('/provider/active', verifyToken, aiController.setActiveProvider);
router.put('/provider/:providerId', verifyToken, aiController.updateProviderConfig);

// AI operation routes (with rate limiting)
router.post('/generate/code', verifyToken, rateLimiter('ai'), aiController.generateCode);
router.post('/complete/code', verifyToken, rateLimiter('ai'), aiController.completeCode);
router.post('/explain/code', verifyToken, rateLimiter('ai'), aiController.explainCode);
router.post('/chat', verifyToken, rateLimiter('ai'), aiController.chat);

module.exports = router;

