import { sendChatMessage } from '../utils/chatUtils.js';

/**
 * POST /chat - Send a chat message and get AI response
 * The AI's system prompt handles filtering intelligently - we trust it to determine 
 * if questions are study-related rather than using simplistic keyword matching
 */
export const chat = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    // Only students can use the chat feature
    if (user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can use the chat feature',
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    const trimmedMessage = message.trim();
    
    // Send all questions to AI - let the intelligent system prompt handle filtering
    // This is more accurate than keyword-based filtering which can incorrectly
    // block legitimate study questions (e.g., "Who was India's first PM?" is clearly academic)
    const response = await sendChatMessage(trimmedMessage, user.id);
    
    res.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error('Error in chat controller:', error);
    res.status(500).json({
      error: 'Failed to get chat response',
      message: error.message,
    });
  }
};
