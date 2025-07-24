// D:\React\Quiz\server\routes\chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth'); // THIS LINE WILL NOW FIND THE FILE!

// POST /api/chat - Now protected by 'auth' middleware
router.post('/chat', auth, async (req, res) => { // <-- 'auth' added here
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ msg: 'No messages provided for chat.' });
  }

  try {
    // ... (rest of your chat AI logic) ...
    const conversation = [{ role: 'system', content: 'You are a helpful AI assistant focused on providing clear and concise answers related to quiz topics. Be polite and informative.' }];
    conversation.push(...messages);

    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: conversation,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const replyContent = aiResponse.data.choices[0].message.content;
    res.json({ reply: replyContent });

  } catch (err) {
    console.error('Error in chat AI endpoint:', err.message);
    if (err.response) {
      console.error('AI API response error details:', err.response.data);
      if (err.response.status === 401) {
          return res.status(500).json({ msg: 'AI API authentication failed. Check your API key.' });
      }
      return res.status(500).json({ msg: 'AI model failed to generate a response. Please try again or rephrase.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;