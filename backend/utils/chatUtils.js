import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Send a message to OpenAI and get a response
 * @param {string} userMessage - User's message
 * @param {string} userId - User ID for context (not used for history, kept for future use)
 * @returns {Promise<string>} AI response
 */
export const sendChatMessage = async (userMessage, userId) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an educational assistant for students preparing for exams. Your role is STRICTLY limited to:

1. Answering academic questions related to studies, subjects, and exam preparation
2. Explaining concepts, formulas, theories, and educational topics
3. Providing study tips, exam strategies, and learning guidance
4. Helping with homework, assignments, and academic problems
5. Answering questions about HISTORY (including political history, historical figures, events, dates, facts)
6. Answering questions in Hindi, English, or mixed languages when they are academic

IMPORTANT RULES:
- ONLY respond to questions related to studies, academics, exam preparation, or educational topics
- ALLOW questions about historical facts, figures, events, dates (e.g., "Who was India's first Prime Minister?", "Bharat ke pratham prdhanmantri kaun the?")
- ALLOW questions about political history when asked in educational context (e.g., questions about past leaders, historical elections, independence movement)
- If a question is NOT related to studies (e.g., general chat, entertainment, personal advice, CURRENT politics/opinions, etc.), politely decline and redirect: "I'm designed to help with your studies and exam preparation. Please ask me questions related to your subjects, concepts, or exam preparation."
- Keep responses focused, clear, and educational
- Provide accurate, study-relevant information only
- Do not engage in casual conversation or non-academic topics
- You can answer in the same language the question is asked (Hindi, English, or mixed)`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return response;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
};

