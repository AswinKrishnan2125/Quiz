// server.js (or app.js) - complete updated file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Add jsonwebtoken
const bcrypt = require('bcryptjs'); // Add bcryptjs

const Quiz = require('./models/Quiz'); // Your Quiz model
const User = require('./models/User'); // Your NEW User model
const chatRoutes = require('./routes/chat');

const auth = require('./middleware/auth');

const axios = require('axios');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', chatRoutes); 

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🍃 MongoDB connected successfully!'))
.catch(err => console.error('❌ MongoDB connection error:', err));
// --- End MongoDB Connection ---

// --- Authentication Middleware (Protect Routes) ---
// This function will be used on routes that require a logged-in user
// const authMiddleware = (req, res, next) => {
//   // Get token from header (e.g., "Bearer YOUR_TOKEN_HERE")
//   const authHeader = req.header('Authorization');
//   if (!authHeader) {
//     return res.status(401).json({ msg: 'No token, authorization denied' });
//   }

//   const token = authHeader.split(' ')[1]; // Extract the token part

//   if (!token) {
//     return res.status(401).json({ msg: 'No token, authorization denied' });
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded.user; // Attach the decoded user payload to the request
//     next(); // Proceed to the next middleware/route handler
//   } catch (err) {
//     res.status(401).json({ msg: 'Token is not valid' });
//   }
// };
// --- End Authentication Middleware ---


// --- User Registration Route ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password, // Password will be hashed by the pre-save middleware in the User model
    });

    await user.save();

    // Create and sign JWT
    const payload = {
      user: {
        id: user.id, // Mongoose creates an '_id' field, which 'id' refers to
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Registration successful' }); // Send token back to client
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during registration');
  }
});

// --- User Login Route ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await user.comparePassword(password); // Using the custom method from User model
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create and sign JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        console.log('Token signed with',process.env.JWT_SECRET);
        res.json({ token, msg: 'Login successful' }); // Send token back to client
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during login');
  }
});


// server.js (inside app.post('/api/generate-quiz') route)

// ... (previous imports and setup) ...

app.post('/api/generate-quiz', auth, async (req, res) => {
  console.log('Backend received /generate-quiz request with body:', req.body);
  const { title, numQuestions, difficulty } = req.body;
  const userId = req.user.id;

  if (!title || !numQuestions || !difficulty) {
    return res.status(400).json({ error: 'Missing title or number of questions' });
  }

  try {
    const prompt = `Generate ${numQuestions} ${difficulty} level multiple-choice quiz questions on the topic: "${title}". Each question should have 4 options (a-d) and specify the correct answer.Please give output in this format, i dont need any explanation.
Format:
**1. Question?**
- a) ...
- b) ...
- c) ...
- d) ...
**Answer: a**`; // Adjusted format to match AI's output

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'AI Quiz Generator',
      },
    });

    const content = response.data.choices[0].message.content;
    console.log("Raw content from OpenRouter:\n", content);

    // --- CRUCIAL UPDATE: ROBUST SPLITTING LOGIC ---
    // This regex splits on a newline followed by optional whitespace, optional bolding (** or *), a number, a dot, and a space.
    const rawQuestionBlocks = content.split(/\n(?=\s*\**\d+\.\s)/);

    const questions = rawQuestionBlocks
      .map((block, index) => {
        console.log(`--- Processing Block ${index} ---`);
        console.log("Block content:\n", block);

        // --- CRUCIAL UPDATE: ROBUST FIRST BLOCK CHECK ---
        // This regex will be used to determine if a block starts with a question number pattern.
        const questionNumberPatternRegex = /^\s*\**\d+\.\s*(.*)/;

        if (index === 0) {
            // For the very first block, only skip if it *does NOT* start with a question number pattern.
            // This handles introductory text like "Here are 5 questions:".
            if (!block.match(questionNumberPatternRegex)) {
                console.log(`[Block ${index}] Skipping initial non-question intro block.`);
                return null;
            }
        } else {
            // For subsequent blocks, we assume they should be questions.
            // If they don't start with a question pattern (e.g., they are just "---" or empty),
            // then `questionStartIndex` will be -1, and the `if (questionStartIndex !== -1 ...)`
            // further down will handle returning null for malformed blocks.
            // We removed the simpler `!block.match(/^\s*\d+\.\s/)` check here.
        }

        const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        console.log(`[Block ${index}] Trimmed lines for parsing:`, lines);

        try {
            // --- 1. Extract Question (Robust Multi-line & Markdown Handling) ---
            let questionText = '';
            let questionStartIndex = -1;
            let optionsStartIndex = -1;

            // This regex is specifically for finding the question line within the block. It's the same as `questionNumberPatternRegex`.
            const questionStartRegex = questionNumberPatternRegex; // Use the same robust regex

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(questionStartRegex)) {
                    questionStartIndex = i;
                    break;
                }
            }

            for (let i = (questionStartIndex !== -1 ? questionStartIndex + 1 : 0); i < lines.length; i++) {
                // This regex handles options starting with `a)`, `- a)`, or `a)`.
                if (lines[i].trim().match(/^-?\s*[a-d]\)\s*(.*)/i)) {
                    optionsStartIndex = i;
                    break;
                }
            }

            // if (questionStartIndex !== -1 && optionsStartIndex !== -1) {
            //     const rawQuestionLines = lines.slice(questionStartIndex, optionsStartIndex);
            //     let fullQuestionContent = rawQuestionLines.join('\n');

            //     // ONLY remove the initial question number and potential bolding/whitespace from the very first line.
            //     fullQuestionContent = fullQuestionContent.replace(questionStartRegex, '$1').trim();

            //     // Clean up potential extra whitespace or empty lines
            //     questionText = fullQuestionContent
            //         .split('\n')
            //         .map(line => line.trim())
            //         .filter(line => line.length > 0)
            //         .join('\n');

            // } 
            if (questionStartIndex !== -1 && optionsStartIndex !== -1) {
                const rawQuestionLines = lines.slice(questionStartIndex, optionsStartIndex);
                let fullQuestionContent = rawQuestionLines.join('\n'); // Use 'let' for modification

                // 1. Remove the initial question number and potential bolding/whitespace from the very first line.
                fullQuestionContent = fullQuestionContent.replace(questionStartRegex, '$1').trim();

                // 2. Remove all instances of ** and * that are for bolding throughout the string
                //    This line should already be there from a previous fix.
                //    Ensure it handles all instances (the 'g' flag).
                fullQuestionContent = fullQuestionContent.replace(/\*\*/g, '').replace(/\*/g, '');

                // 3. Clean up potential extra whitespace or empty lines
                questionText = fullQuestionContent
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');

                // NEW: After all processing, ensure any stray ** are removed from the end of the questionText
                // This specifically targets ** at the very end of the final questionText string.
                questionText = questionText.replace(/\*\*$/, ''); // Remove ** only if it's at the very end

            }
            else {
                console.warn(`[Block ${index}] Validation failed: Could not find clear start or end for question text.`);
                console.warn(`[Block ${index}] Question start index: ${questionStartIndex}, Options start index: ${optionsStartIndex}`);
                console.warn(`[Block ${index}] Problematic block content for start/end detection:\n`, block);
                return null;
            }
            console.log(`[Block ${index}] Parsed question text: "${questionText}"`);

            // --- 2. Extract Options ---
            const options = { a: '', b: '', c: '', d: '' };
            lines.forEach(line => {
                const trimmedLine = line.trim();
                // Regex to handle "a) Option" or "- a) Option"
                const optionMatch = trimmedLine.match(/^-?\s*([a-d])\)\s*(.*)/i);
                if (optionMatch) {
                    options[optionMatch[1].toLowerCase()] = optionMatch[2].trim();
                }
            });
            console.log(`[Block ${index}] Parsed options:`, options);

            // --- 3. Extract Answer ---
            const answerMatchLine = lines.find(line => line.includes('**Answer:') || line.startsWith('Answer:'));
            let answer = null;
            if (answerMatchLine) {
                const regex = /(?:\*\*Answer:|\bAnswer:)\s*([abcd])(?:\*\*|\s|$)/i;
                const match = answerMatchLine.match(regex);
                if (match && match[1]) {
                    answer = match[1].toLowerCase();
                }
            }
            console.log(`[Block ${index}] Parsed answer: "${answer}"`);

            // --- Validation ---
            if (!questionText || !options.a || !options.b || !options.c || !options.d || !answer || !options[answer]) {
                console.warn(`[Block ${index}] Validation failed. Incomplete question/options/answer.`);
                console.warn(`[Block ${index}] Q: "${questionText}" (length: ${questionText.length}), A: "${answer}", Options:`, options);
                console.warn(`[Block ${index}] Full original block content:\n`, block);
                return null;
            }

            const parsedQuestion = {
                question: questionText,
                a: options.a,
                b: options.b,
                c: options.c,
                d: options.d,
                answer: answer
            };
            console.log(`[Block ${index}] Successfully parsed:`, parsedQuestion);
            return parsedQuestion;

        } catch (parseError) {
            console.error(`[Block ${index}] ERROR during parsing block:`, parseError.message);
            console.error(`[Block ${index}] Problematic block content:\n`, block);
            return null;
        }
      }).filter(Boolean);

    if (questions.length === 0) {
        console.error("Parsed questions array is empty. Not saving to DB. Raw content (truncated to 500 chars):", content.substring(0, 500) + "...");
        return res.status(500).json({ error: 'Failed to parse any questions from OpenRouter response.' });
    }

    const newQuiz = new Quiz({
        title,
        numQuestions,
        questions,
        userId: userId
    });

    const savedQuiz = await newQuiz.save();
    console.log('✅ Quiz saved to DB with ID:', savedQuiz._id);

    res.json({ quizId: savedQuiz._id, questions: savedQuiz.questions });

  } catch (err) {
    console.error("--- SERVER ERROR (API GENERATE QUIZ) ---");
    if (err.response) {
        console.error("OpenRouter Response Data:", JSON.stringify(err.response.data, null, 2));
    }
    console.error("Error Stack:", err.stack);
    res.status(500).json({ error: 'Failed to generate quiz due to an unexpected server error.' });
  }
});


// server.js (inside app.post('/api/generate-quiz') route)

// ... (previous imports and setup) ...
//working aanneeeeeeeeeeee

// app.post('/api/generate-quiz', authMiddleware, async (req, res) => {
//   const { title, numQuestions } = req.body;
//   const userId = req.user.id;

//   if (!title || !numQuestions) {
//     return res.status(400).json({ error: 'Missing title or number of questions' });
//   }

//   try {
//     const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${title}". Each question should have 4 options (a-d) and specify the correct answer.
// Format:
// 1. Question?
// a) ...
// b) ...
// c) ...
// d) ...
// Answer: a`;

//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'HTTP-Referer': 'http://localhost:5000',
//         'X-Title': 'AI Quiz Generator',
//       },
//     });

//     const content = response.data.choices[0].message.content;
//     console.log("Raw content from OpenRouter:\n", content);

//     const rawQuestionBlocks = content.split(/\n(?=\d+\.\s)/);

//     const questions = rawQuestionBlocks
//       .map((block, index) => {
//         console.log(`--- Processing Block ${index} ---`);
//         console.log("Block content:\n", block);

//         if (!block.match(/^\s*\d+\.\s/) && (index === 0 || block.trim() === '---' || block.trim() === '' || block.includes('###'))) {
//             console.log(`[Block ${index}] Skipping non-question block.`);
//             return null;
//         }

//         const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
//         console.log(`[Block ${index}] Trimmed lines for parsing:`, lines);

//         try {
//             // --- 1. Extract Question (Robust Multi-line & Markdown Handling) ---
//             let questionText = '';
//             let questionStartIndex = -1;
//             let optionsStartIndex = -1;

//             const questionStartRegex = /^\s*\*?\*?\d+\.\s*(.*)/; // Matches "1. ", "*1. ", "**1. " after optional leading spaces

//             for (let i = 0; i < lines.length; i++) {
//                 if (lines[i].match(questionStartRegex)) {
//                     questionStartIndex = i;
//                     break;
//                 }
//             }

//             for (let i = (questionStartIndex !== -1 ? questionStartIndex + 1 : 0); i < lines.length; i++) {
//                 if (lines[i].trim().startsWith('a)')) {
//                     optionsStartIndex = i;
//                     break;
//                 }
//             }


//             if (questionStartIndex !== -1 && optionsStartIndex !== -1) {
//                 const rawQuestionLines = lines.slice(questionStartIndex, optionsStartIndex);
//                 let fullQuestionContent = rawQuestionLines.join('\n'); // Keep as 'let' for modification

//                 // ONLY remove the initial question number and potential bolding/whitespace from the very first line.
//                 // We are preserving other markdown like `**`, `*`, and ``` for frontend rendering.
//                 fullQuestionContent = fullQuestionContent.replace(questionStartRegex, '$1').trim();

//                 // Clean up potential extra whitespace or empty lines that might result from initial stripping.
//                 // This ensures clean newlines are passed to the frontend for markdown rendering.
//                 questionText = fullQuestionContent
//                     .split('\n')
//                     .map(line => line.trim()) // Trim each individual line
//                     .filter(line => line.length > 0) // Remove empty lines
//                     .join('\n'); // Join back with single newlines

//             } else {
//                 console.warn(`[Block ${index}] Validation failed: Could not find clear start or end for question text.`);
//                 console.warn(`[Block ${index}] Question start index: ${questionStartIndex}, Options start index: ${optionsStartIndex}`);
//                 console.warn(`[Block ${index}] Problematic block content for start/end detection:\n`, block);
//                 return null;
//             }

//             // if (questionStartIndex !== -1 && optionsStartIndex !== -1) {
//             //     const rawQuestionLines = lines.slice(questionStartIndex, optionsStartIndex);
//             //     let fullQuestionContent = rawQuestionLines.join('\n');

//             //     // 1. Remove the initial question number and potential bolding/whitespace from the very first line
//             //     fullQuestionContent = fullQuestionContent.replace(questionStartRegex, '$1').trim();

//             //     // 2. Remove all instances of ** and * that are for bolding throughout the string
//             //     fullQuestionContent = fullQuestionContent.replace(/\*\*/g, '').replace(/\*/g, '');

//             //     // 3. Clean up potential extra whitespace or empty lines
//             //     questionText = fullQuestionContent
//             //         .split('\n')
//             //         .map(line => line.trim())
//             //         .filter(line => line.length > 0)
//             //         .join('\n');

//             // } else {
//             //     console.warn(`[Block ${index}] Validation failed: Could not find clear start or end for question text.`);
//             //     console.warn(`[Block ${index}] Question start index: ${questionStartIndex}, Options start index: ${optionsStartIndex}`);
//             //     console.warn(`[Block ${index}] Problematic block content for start/end detection:\n`, block);
//             //     return null;
//             // }
//             console.log(`[Block ${index}] Parsed question text: "${questionText}"`);

//             // --- 2. Extract Options (Ensure `options` is declared here!) ---
//             const options = { a: '', b: '', c: '', d: '' }; // <--- THIS LINE IS CRUCIAL AND MUST BE PRESENT
//             lines.forEach(line => {
//                 const trimmedLine = line.trim();
//                 if (trimmedLine.startsWith('a)')) options.a = trimmedLine.replace(/^a\)\s*/, '').trim();
//                 else if (trimmedLine.startsWith('b)')) options.b = trimmedLine.replace(/^b\)\s*/, '').trim();
//                 else if (trimmedLine.startsWith('c)')) options.c = trimmedLine.replace(/^c\)\s*/, '').trim();
//                 else if (trimmedLine.startsWith('d)')) options.d = trimmedLine.replace(/^d\)\s*/, '').trim();
//             });
//             console.log(`[Block ${index}] Parsed options:`, options);

//             // --- 3. Extract Answer ---
//             const answerMatchLine = lines.find(line => line.includes('**Answer:') || line.startsWith('Answer:'));
//             let answer = null;
//             if (answerMatchLine) {
//                 const regex = /(?:\*\*Answer:|\bAnswer:)\s*([abcd])(?:\*\*|\s|$)/i;
//                 const match = answerMatchLine.match(regex);
//                 if (match && match[1]) {
//                     answer = match[1].toLowerCase();
//                 }
//             }
//             console.log(`[Block ${index}] Parsed answer: "${answer}"`);

//             // --- Validation ---
//             if (!questionText || !options.a || !options.b || !options.c || !options.d || !answer || !options[answer]) {
//                 console.warn(`[Block ${index}] Validation failed. Incomplete question/options/answer.`);
//                 console.warn(`[Block ${index}] Q: "${questionText}" (length: ${questionText.length}), A: "${answer}", Options:`, options);
//                 console.warn(`[Block ${index}] Full original block content:\n`, block);
//                 return null;
//             }

//             const parsedQuestion = {
//                 question: questionText,
//                 a: options.a,
//                 b: options.b,
//                 c: options.c,
//                 d: options.d,
//                 answer: answer
//             };
//             console.log(`[Block ${index}] Successfully parsed:`, parsedQuestion);
//             return parsedQuestion;

//         } catch (parseError) {
//             console.error(`[Block ${index}] ERROR during parsing block:`, parseError.message);
//             console.error(`[Block ${index}] Problematic block content:\n`, block);
//             return null;
//         }
//       }).filter(Boolean);

//     if (questions.length === 0) {
//         console.error("Parsed questions array is empty. Not saving to DB. Raw content (truncated to 500 chars):", content.substring(0, 500) + "...");
//         return res.status(500).json({ error: 'Failed to parse any questions from OpenRouter response.' });
//     }

//     const newQuiz = new Quiz({
//         title,
//         numQuestions,
//         questions,
//         userId: userId
//     });

//     const savedQuiz = await newQuiz.save();
//     console.log('✅ Quiz saved to DB with ID:', savedQuiz._id);

//     res.json({ quizId: savedQuiz._id, questions: savedQuiz.questions });

//   } catch (err) {
//     console.error("--- SERVER ERROR (API GENERATE QUIZ) ---");
//     if (err.response) {
//         console.error("OpenRouter Response Data:", JSON.stringify(err.response.data, null, 2));
//     }
//     console.error("Error Stack:", err.stack);
//     res.status(500).json({ error: 'Failed to generate quiz due to an unexpected server error.' });
//   }
// });




// --- Protect the /api/generate-quiz route (IMPORTANT CHANGE HERE) ---
// Now, only authenticated users can generate quizzes
// app.post('/api/generate-quiz', authMiddleware, async (req, res) => {
//   const { title, numQuestions } = req.body;
//   const userId = req.user.id; // Get userId from the authenticated request

//   if (!title || !numQuestions) {
//     return res.status(400).json({ error: 'Missing title or number of questions' });
//   }

//   try {
//     const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${title}". Each question should have 4 options (a-d) and specify the correct answer.
// Format:
// 1. Question?
// a) ...
// b) ...
// c) ...
// d) ...
// Answer: a`;

//     // ... (OpenRouter API call remains the same) ...

//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'HTTP-Referer': 'http://localhost:5000',
//         'X-Title': 'AI Quiz Generator',
//       },
//     });

//     const content = response.data.choices[0].message.content;
//     console.log("Raw content from OpenRouter:\n", content); // Keep this for future debugging!

//     const rawQuestionBlocks = content.split(/\n(?=\d+\.\s)/);

//     const questions = rawQuestionBlocks
//       .map((block, index) => {
//         // --- DEBUGGING LOGS (can remove after verification) ---
//         console.log(`--- Processing Block ${index} ---`);
//         console.log("Block content:\n", block);
//         // --- END DEBUGGING LOGS ---

//         // Handle the introductory text block and the '---' separator or empty blocks
//         if (!block.match(/^\s*\d+\.\s/) && (index === 0 || block.trim() === '---' || block.trim() === '' || block.includes('###'))) {
//             console.log(`[Block ${index}] Skipping non-question block.`);
//             return null;
//         }

//         // Split block into lines, trim each, and filter out empty lines.
//         const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
//         console.log(`[Block ${index}] Trimmed lines for parsing:`, lines); // Debugging


           

//         // try {
//         //     // 1. Extract Question
//         //     let questionText = '';
//         //     const questionLine = lines.find(line => line.match(/^\d+\.\s*(.*)/));
//         //     if (questionLine) {
//         //         questionText = questionLine
//         //             .replace(/^\d+\.\s*/, '') // Remove the "X. " prefix
//         //             .replace(/^\*\*Question:\*\*\s*/i, '') // Remove explicit "**Question:**"
//         //             .replace(/^Question:\s*/i, '') // Remove explicit "Question:"
//         //             .replace(/^\*\*(.*?)\*\*$/, '$1') // NEW: Remove **bolding** from entire question
//         //             .trim();
//         //     }
//         //     console.log(`[Block ${index}] Parsed question text: "${questionText}"`);

//         //     // 2. Extract Options - FIX: Trim line before checking startsWith
//         //     const options = { a: '', b: '', c: '', d: '' };
//         //     lines.forEach(line => {
//         //         const trimmedLine = line.trim(); // Trim here
//         //         if (trimmedLine.startsWith('a)')) options.a = trimmedLine.replace(/^a\)\s*/, '').trim();
//         //         else if (trimmedLine.startsWith('b)')) options.b = trimmedLine.replace(/^b\)\s*/, '').trim();
//         //         else if (trimmedLine.startsWith('c)')) options.c = trimmedLine.replace(/^c\)\s*/, '').trim();
//         //         else if (trimmedLine.startsWith('d)')) options.d = trimmedLine.replace(/^d\)\s*/, '').trim();
//         //     });
//         //     console.log(`[Block ${index}] Parsed options:`, options);

//         //     // 3. Extract Answer - FIX: Adjust regex for **Answer: c** format
//         //     const answerMatchLine = lines.find(line => line.includes('**Answer:') || line.startsWith('Answer:'));
//         //     let answer = null;
//         //     if (answerMatchLine) {
//         //         // Look for **Answer: [a-d]** or Answer: [a-d]
//         //         const regex = /(?:\*\*Answer:|\bAnswer:)\s*([abcd])(?:\*\*|\s|$)/i; // Changed last part to match ** or end of line/space
//         //         const match = answerMatchLine.match(regex);
//         //         if (match && match[1]) {
//         //             answer = match[1].toLowerCase();
//         //         }
//         //     }
//         //     console.log(`[Block ${index}] Parsed answer: "${answer}"`);

//         //     // --- Validation ---
//         //     if (!questionText || !options.a || !options.b || !options.c || !options.d || !answer || !options[answer]) {
//         //         console.warn(`[Block ${index}] Validation failed. Incomplete question/options/answer. Returning null.`);
//         //         console.warn(`[Block ${index}] Q: "${questionText}", A: "${answer}", Options:`, options);
//         //         return null;
//         //     }

//         //     const parsedQuestion = {
//         //         question: questionText,
//         //         a: options.a,
//         //         b: options.b,
//         //         c: options.c,
//         //         d: options.d,
//         //         answer: answer
//         //     };
//         //     console.log(`[Block ${index}] Successfully parsed:`, parsedQuestion);
//         //     return parsedQuestion;

//         // } catch (parseError) {
//         //     console.error(`[Block ${index}] ERROR during parsing block:`, parseError.message);
//         //     console.error(`[Block ${index}] Problematic block content:\n`, block);
//         //     return null;
//         // }
//       }).filter(Boolean); // Filter out any null entries

//     // ... (rest of the code for saving to DB and sending response remains the same) ...

//     if (questions.length === 0) {
//         console.error("Parsed questions array is empty. Not saving to DB. Raw content (truncated to 500 chars):", content.substring(0, 500) + "...");
//         return res.status(500).json({ error: 'Failed to parse any questions from OpenRouter response.' });
//     }

//     const newQuiz = new Quiz({
//         title,
//         numQuestions,
//         questions,
//         userId: userId
//     });

//     const savedQuiz = await newQuiz.save();
//     console.log('✅ Quiz saved to DB with ID:', savedQuiz._id);

//     res.json({ quizId: savedQuiz._id, questions: savedQuiz.questions });

//   } catch (err) {
//     // ... (error handling remains the same) ...
//     console.error("--- SERVER ERROR (API GENERATE QUIZ) ---");
//     if (err.response) { // Axios error from OpenRouter API
//         console.error("OpenRouter Response Data:", JSON.stringify(err.response.data, null, 2));
//     }
//     console.error("Error Stack:", err.stack);
//     res.status(500).json({ error: 'Failed to generate quiz due to an unexpected server error.' });
//   }
// });

// --- NEW: Endpoint to get quizzes for the authenticated user ---
app.get('/api/my-quizzes', auth, async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from the authenticated request
        console.log('Fetching quizzes for user:', req.user.id); // For debugging
        const myQuizzes = await Quiz.find({ userId }).sort({ createdAt: -1 }); // Find quizzes owned by this user, sort by latest
        res.json(myQuizzes);
    } catch (error) {
        console.error('Error fetching user quizzes:', error.message);
        res.status(500).send('Server error fetching user quizzes');
    }
});



// --- Endpoint to get a quiz by ID (can remain public for sharing) ---
app.get('/api/quiz/:id', async (req, res) => {
  try {
    console.log('Fetching quiz by ID:', req.params.id);
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid Quiz ID format.' });
    }
    res.status(500).json({ error: 'Failed to retrieve quiz' });
  }
});




// server.js (or app.js) - somewhere after your existing routes

// --- NEW: Endpoint to delete a quiz by ID (Protected) ---
app.delete('/api/quiz/:id', auth, async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user.id; // Get user ID from authenticated request

        // Find the quiz AND ensure it belongs to the authenticated user
        const quiz = await Quiz.findOneAndDelete({ _id: quizId, userId: userId });

        if (!quiz) {
            // Quiz not found OR user is not the owner
            return res.status(404).json({ msg: 'Quiz not found or you do not have permission to delete it.' });
        }

        res.json({ msg: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz:', error.message);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid Quiz ID format.' });
        }
        res.status(500).send('Server error during quiz deletion');
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));



























// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const dotenv = require('dotenv');
// const mongoose = require('mongoose');
// const Quiz = require('./models/Quiz'); // Make sure this path is correct, e.g., './models/Quiz' or './models/model'

// dotenv.config();

// const axios = require('axios');

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // --- MongoDB Connection ---
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('🍃 MongoDB connected successfully!'))
// .catch(err => console.error('❌ MongoDB connection error:', err));
// // --- End MongoDB Connection ---

// app.post('/api/generate-quiz', async (req, res) => {
//   const { title, numQuestions } = req.body;

//   if (!title || !numQuestions) {
//     return res.status(400).json({ error: 'Missing title or number of questions' });
//   }

//   try {
//     const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${title}". Each question should have 4 options (a-d) and specify the correct answer.
// Format:
// 1. Question?
// a) ...
// b) ...
// c) ...
// d) ...
// Answer: a`; // Keep this format, the parsing will adapt to actual output

//     console.log("OpenRouter API Key (first 8 chars):", process.env.OPENROUTER_API_KEY?.slice(0, 8));
//     console.log("Full OpenRouter API Key Length:", process.env.OPENROUTER_API_KEY?.length);

//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'HTTP-Referer': 'http://localhost:5000', // your frontend origin
//         'X-Title': 'AI Quiz Generator', // optional, for OpenRouter UI
//       },
//     });

//     const content = response.data.choices[0].message.content;
//     console.log("Raw content from OpenRouter:\n", content); // Always log raw content

//     // Split the content into potential question blocks.
//     const rawQuestionBlocks = content.split(/\n(?=\d+\.\s)/);

//     const questions = rawQuestionBlocks
//       .map((block, index) => {
//         // --- DEBUGGING LOGS (keep for now, remove later if everything works) ---
//         console.log(`--- Processing Block ${index} ---`);
//         console.log("Block content:\n", block);
//         console.log("-----------------------");
//         // --- END DEBUGGING LOGS ---

//         // Handle the introductory text block and the '---' separator or empty blocks
//         // This is robust to various intro formats from the LLM
//         if (!block.match(/^\s*\d+\.\s/) && (index === 0 || block.trim() === '---' || block.trim() === '' || block.includes('###'))) {
//             console.log(`[Block ${index}] Skipping non-question block (intro/separator/empty): "${block.substring(0, Math.min(block.length, 50))}"...`);
//             return null;
//         }

//         // Split block into lines, trim each, and filter out empty lines.
//         const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
//         console.log(`[Block ${index}] Trimmed lines:`, lines); // Debugging

//         try {
//             // 1. Extract Question
//             let questionText = '';
//             // Find the line that starts with a number and period, then extract text after it.
//             const questionLine = lines.find(line => line.match(/^\d+\.\s*(.*)/));
//             if (questionLine) {
//                 // Remove the "X. " prefix and also "**Question:** " or "Question:" if present
//                 questionText = questionLine
//                     .replace(/^\d+\.\s*/, '')
//                     .replace(/^\*\*Question:\*\*\s*/i, '') // Case-insensitive, handles bolding
//                     .replace(/^Question:\s*/i, '') // Handles non-bolded "Question:"
//                     .trim();
//             }
//             console.log(`[Block ${index}] Parsed question text: "${questionText}"`); // Debugging

//             // 2. Extract Options
//             const options = { a: '', b: '', c: '', d: '' };
//             lines.forEach(line => {
//                 if (line.startsWith('a)')) options.a = line.replace(/^a\)\s*/, '').trim();
//                 else if (line.startsWith('b)')) options.b = line.replace(/^b\)\s*/, '').trim();
//                 else if (line.startsWith('c)')) options.c = line.replace(/^c\)\s*/, '').trim();
//                 else if (line.startsWith('d)')) options.d = line.replace(/^d\)\s*/, '').trim();
//             });
//             console.log(`[Block ${index}] Parsed options:`, options); // Debugging

//             // 3. Extract Answer (Revised to handle "**Answer: c) Full text**" format)
//             const answerMatchLine = lines.find(line => line.includes('**Answer:') || line.startsWith('Answer:')); // Find the line that contains "**Answer:" or "Answer:"
//             let answer = null;
//             if (answerMatchLine) {
//                 // Regex to capture 'a', 'b', 'c', or 'd' that follows "**Answer:" or "Answer:" and is potentially followed by ')'
//                 // It looks for "Answer:", then optional spaces, then the letter, then potentially a closing parenthesis.
//                 const regex = /(?:\*\*Answer:|\bAnswer:)\s*([abcd])(?:\)|\s|$)/i;
//                 const match = answerMatchLine.match(regex);
//                 if (match && match[1]) {
//                     answer = match[1].toLowerCase(); // Capture the letter (group 1)
//                 }
//             }
//             console.log(`[Block ${index}] Parsed answer: "${answer}"`); // Debugging

//             // --- Validation ---
//             // Ensure questionText is not empty, and all 4 options are non-empty, and a valid answer letter is found, AND the answer option text exists.
//             if (!questionText || !options.a || !options.b || !options.c || !options.d || !answer || !options[answer]) {
//                 console.warn(`[Block ${index}] Validation failed. Incomplete question/options/answer. Returning null.`);
//                 console.warn(`[Block ${index}] Q: "${questionText}", A: "${answer}", Options:`, options);
//                 return null; // Return null if invalid, will be filtered by .filter(Boolean)
//             }

//             const parsedQuestion = {
//                 question: questionText,
//                 a: options.a,
//                 b: options.b,
//                 c: options.c,
//                 d: options.d,
//                 answer: answer
//             };
//             console.log(`[Block ${index}] Successfully parsed:`, parsedQuestion); // Debugging
//             return parsedQuestion;

//         } catch (parseError) {
//             console.error(`[Block ${index}] ERROR during parsing block:`, parseError.message);
//             console.error(`[Block ${index}] Error stack:`, parseError.stack);
//             console.error(`[Block ${index}] Problematic block content:\n`, block);
//             return null;
//         }
//       }).filter(Boolean); // Filter out any null entries

//     // --- FINAL PARSED QUESTIONS ARRAY (Debugging logs) ---
//     console.log("--- FINAL PARSED QUESTIONS ARRAY ---");
//     console.log("Parsed questions array (backend):", JSON.stringify(questions, null, 2));
//     console.log("Number of parsed questions (backend):", questions.length);
//     console.log("--- END FINAL PARSED QUESTIONS ARRAY ---");

//     if (questions.length === 0) {
//         console.error("Parsed questions array is empty. Not saving to DB. Raw content (truncated to 500 chars):", content.substring(0, 500) + "...");
//         return res.status(500).json({ error: 'Failed to parse any questions from OpenRouter response.' });
//     }

//     // --- Save the quiz to the database ---
//     const newQuiz = new Quiz({
//         title,
//         numQuestions,
//         questions
//     });

//     const savedQuiz = await newQuiz.save();
//     console.log('✅ Quiz saved to DB with ID:', savedQuiz._id);

//     // Send the quiz ID and questions back to the frontend
//     res.json({ quizId: savedQuiz._id, questions: savedQuiz.questions });

//   } catch (err) {
//     console.error("--- SERVER ERROR (API GENERATE QUIZ) ---");
//     if (err.name === 'MongoError' || err.name === 'MongooseError') {
//         console.error("MongoDB/Mongoose Error Name:", err.name);
//         console.error("MongoDB/Mongoose Error Message:", err.message);
//         console.error("MongoDB/Mongoose Error Code:", err.code);
//         if (err.errors) {
//             console.error("Mongoose Validation Errors:", err.errors);
//         }
//     } else if (err.response) {
//         // Error from Axios (OpenRouter API)
//         console.error("HTTP Status Code (err.response.status):", err.response.status);
//         console.error("Response Headers (err.response.headers):", err.response.headers);
//         console.error("Response Data (err.response.data):", JSON.stringify(err.response.data, null, 2));
//     } else if (err.request) {
//         // Request made but no response received
//         console.error("No response received from OpenRouter. Request details (err.request):", err.request);
//     } else {
//         // Generic error (e.g., parsing error within the catch block itself, or an uncaught error)
//         console.error("General Error Message:", err.message);
//     }
//     console.error("Error Stack:", err.stack);
//     console.error("--- END SERVER ERROR (API GENERATE QUIZ) ---");

//     // Provide a more informative error to the client based on common scenarios
//     if (err.response && err.response.status === 401) {
//         res.status(401).json({ error: 'Authentication failed with OpenRouter. Check API key or referrer restrictions.' });
//     } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
//         res.status(500).json({ error: 'Database error occurred during quiz save.' });
//     } else {
//         res.status(500).json({ error: 'Failed to generate quiz due to an unexpected server error.' });
//     }
//   }
// });

// // --- Endpoint to get a quiz by ID ---
// app.get('/api/quiz/:id', async (req, res) => {
//   try {
//     const quizId = req.params.id;
//     const quiz = await Quiz.findById(quizId); // Using the Quiz model

//     if (!quiz) {
//       return res.status(404).json({ error: 'Quiz not found' });
//     }

//     res.json(quiz); // Send the entire quiz object including questions
//   } catch (error) {
//     console.error('Error fetching quiz by ID:', error);
//     if (error.name === 'CastError' && error.kind === 'ObjectId') {
//         return res.status(400).json({ error: 'Invalid Quiz ID format.' });
//     }
//     res.status(500).json({ error: 'Failed to retrieve quiz' });
//   }
// });
// // --- End NEW ---

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));