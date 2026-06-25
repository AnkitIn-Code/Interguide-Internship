const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

// Free-tier compatible Gemini models (in priority order — tries each until one works)
// Updated June 2026: gemini-2.0-flash discontinued; current models are 2.5 series
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-preview-05-20',
  'gemini-1.5-flash-8b',
  'gemini-pro',
];

// @route   POST /api/chat
// @desc    Send a message to the AI Chat Assistant
router.post('/', protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Format history for Gemini
    const formattedHistory = Array.isArray(history)
      ? history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }))
      : [];

    const systemContext = `You are InternGuide AI, a helpful career assistant. You are talking to ${user.name || 'a student'}. They have the following technical skills: ${(user.technicalSkills || []).join(', ') || 'none listed yet'}. Keep your answers concise, encouraging, and focused on helping them land an internship.`;

    // Try models in order until one works
    let lastError = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: systemContext }],
            },
            {
              role: 'model',
              parts: [{ text: 'Understood. I am ready to help you land your dream internship!' }],
            },
            ...formattedHistory,
          ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return res.json({ reply: text, model: modelName });
      } catch (err) {
        // If model not found (404) or not supported, try next model
        const isModelError =
          err.status === 404 ||
          (err.message || '').includes('not found') ||
          (err.message || '').includes('not supported');

        if (isModelError) {
          console.warn(`Model ${modelName} not available, trying next...`);
          lastError = err;
          continue;
        }

        // For other errors (auth, network, etc.), fail immediately
        throw err;
      }
    }

    // All models failed
    console.error('All Gemini models failed:', lastError?.message);
    res.status(503).json({
      message: 'AI Chat is temporarily unavailable. Please check your Gemini API key and try again.',
      error: lastError?.message,
    });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({
      message: 'Error communicating with AI Assistant',
      error: err.message,
    });
  }
});

module.exports = router;
