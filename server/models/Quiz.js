// models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  numQuestions: { type: Number, required: true },
  questions: [ // Array of question objects
    {
      question: { type: String, required: true },
      a: { type: String, required: true },
      b: { type: String, required: true },
      c: { type: String, required: true },
      d: { type: String, required: true },
      answer: { type: String, required: true } // 'a', 'b', 'c', or 'd'
    }
  ],
  userId: { // <--- THIS IS THE KEY FIELD
    type: mongoose.Schema.Types.ObjectId, // It stores the MongoDB _id of the User
    ref: 'User', // It references the 'User' model
    required: true, // A quiz must belong to a user
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);