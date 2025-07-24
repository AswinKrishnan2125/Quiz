// // components/SharedQuizPlayer.jsx
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const SharedQuizPlayer = () => {
//   const { id } = useParams(); // Get the quiz ID from the URL
//   const navigate = useNavigate();

//   const [questions, setQuestions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedOptions, setSelectedOptions] = useState({});
//   const [submitted, setSubmitted] = useState(false);

//   useEffect(() => {
//     const fetchQuiz = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await axios.get(`http://localhost:5000/api/quiz/${id}`);
//         setQuestions(response.data.questions); // Assuming your backend sends { questions: [...] }
//       } catch (err) {
//         console.error("Error fetching quiz:", err);
//         setError("Failed to load quiz. It might not exist or there was a network error.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       fetchQuiz();
//     } else {
//       setError("No quiz ID provided in the URL.");
//       setLoading(false);
//       // Optional: Redirect if no ID
//       // navigate('/');
//     }
//   }, [id]); // Re-run effect if ID changes (though unlikely for a quiz link)

//   if (loading) return <div className="text-center mt-20 text-lg">Loading Quiz...</div>;
//   if (error) return <div className="text-center mt-20 text-red-600 text-lg">Error: {error}</div>;
//   if (!questions || questions.length === 0) return <div className="text-center mt-20 text-lg">No questions found for this quiz.</div>;

//   const currentQuestion = questions[currentIndex];

//   const handleOptionSelect = (option) => {
//     setSelectedOptions(prev => ({
//       ...prev,
//       [currentIndex]: option
//     }));
//   };

//   const handleNext = () => {
//     if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
//   };

//   const handlePrevious = () => {
//     if (currentIndex > 0) setCurrentIndex(i => i - 1);
//   };

//   const handleSubmit = () => {
//     setSubmitted(true);
//   };

//   const calculateScore = () => {
//     return questions.reduce((score, q, i) => (
//       selectedOptions[i] === q.answer ? score + 1 : score
//     ), 0);
//   };

//   const handleGoToDashboard = () => {
//     navigate('/'); // Assuming '/dashboard' is your dashboard route
//   };

//   return (
//     <div className="max-w-2xl mx-auto mt-12 p-6 bg-white shadow-xl rounded-xl">
//       {!submitted ? (
//         <>
//           <h2 className="text-xl font-semibold mb-4">Question {currentIndex + 1} of {questions.length}</h2>
//           <p className="mb-4 font-medium">{currentQuestion.question}</p>

//           {['a', 'b', 'c', 'd'].map(opt => (
//             <div key={opt} className="mb-2">
//               <label className="flex items-center space-x-2">
//                 <input
//                   type="radio"
//                   name={`q-${currentIndex}`}
//                   value={opt}
//                   checked={selectedOptions[currentIndex] === opt}
//                   onChange={() => handleOptionSelect(opt)}
//                   className="form-radio h-4 w-4 text-blue-600"
//                 />
//                 <span>{currentQuestion[opt]}</span>
//               </label>
//             </div>
//           ))}

//           <div className="flex justify-between mt-6">
//             <button
//               onClick={handlePrevious}
//               disabled={currentIndex === 0}
//               className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
//             >
//               Previous
//             </button>
//             {currentIndex < questions.length - 1 ? (
//               <button
//                 onClick={handleNext}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//               >
//                 Next
//               </button>
//             ) : (
//               <button
//                 onClick={handleSubmit}
//                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//               >
//                 Submit Quiz
//               </button>
//             )}
//           </div>
//         </>
//       ) : (
//         <div className="mt-6">
//           <h3 className="text-xl font-bold text-green-700 mb-4">
//             Your Score: {calculateScore()} / {questions.length}
//           </h3>
//           {questions.map((q, i) => {
//             const userAns = selectedOptions[i];
//             const isCorrect = userAns === q.answer;
//             return (
//               <div key={i} className={`p-4 mb-3 rounded border ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
//                 <p className="font-semibold">{i + 1}. {q.question}</p>
//                 <p className="text-sm">Your Answer: <strong>{q[userAns] || 'Not answered'}</strong></p>
//                 {!isCorrect && (
//                   <p className="text-sm text-red-700">Correct Answer: <strong>{q[q.answer]}</strong></p>
//                 )}
//               </div>
//             );
//           })}
//           <div className="mt-6 text-center">
//             <button
//               onClick={handleGoToDashboard}
//               className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out shadow-lg"
//             >
//               Go to Dashboard
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SharedQuizPlayer;










// src/components/SharedQuizPlayer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // Add this
import remarkGfm from 'remark-gfm';       // Add this

const SharedQuizPlayer = () => {
  const { id } = useParams(); // This is your quizId!
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizLink, setQuizLink] = useState(''); // State for the shareable link

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // Stores answers: {qIndex: 'a', qIndex: 'b'}
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false); // New state to track if quiz is submitted

  // Fetch quiz questions from the backend
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
       const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quiz/${id}`);
        setQuestions(response.data.questions);

        // Construct and set the shareable link here
        const generatedLink = `${window.location.origin}/quiz/${id}`;
        setQuizLink(generatedLink);

      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz. It might not exist or there was a network error.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    } else {
      setError("No quiz ID provided in the URL.");
      setLoading(false);
    }
  }, [id]);

  // Handle option selection
  const handleOptionSelect = (questionIndex, optionKey) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionIndex]: optionKey,
    }));
  };

  // Handle next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Calculate and display score
  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (selectedOptions[index] === q.answer) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true); // Set submitted to true to show results
  };

  // --- NEW: Handle Re-attempt Quiz ---
  const handleReattempt = () => {
    setCurrentIndex(0);
    setSelectedOptions({});
    setScore(0);
    setSubmitted(false); // Reset submitted state to show questions again
    setError(null); // Clear any previous errors if needed
    // You might want to refetch questions if they could change,
    // but for static quizzes, resetting state is enough.
  };

  const handleGoToDashboard = () => {
    navigate('/my-quizzes');
  };

  if (loading) {
    return <div className="text-center mt-12 text-gray-700">Loading quiz...</div>;
  }

  if (error) {
    return <div className="text-center mt-12 text-red-600">Error: {error}</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center mt-12 text-gray-700">No questions found for this quiz.</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 sm:mt-12 sm:p-6 bg-white shadow-xl rounded-xl"> {/* Adjusted max-w, mt, and p */}
  <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">Quiz Time!</h1> {/* Adjusted text size */}

  {submitted ? (
    // --- Display Score and Re-attempt Button (Responsive) ---
    <div className="text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-green-700 mb-3 sm:mb-4">Quiz Completed!</h2> {/* Adjusted text size */}
      <p className="text-xl sm:text-2xl text-gray-800 mb-4 sm:mb-6">Your Score: <span className="font-bold">{score} / {questions.length}</span></p> {/* Adjusted text size */}

      <div className="flex flex-col space-y-3 sm:space-y-4"> {/* Changed to flex-col for stacking */}
        <button
          onClick={handleReattempt}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 text-base sm:text-lg" /* Adjusted py, px, and text size */
        >
          Re-attempt Quiz
        </button>
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 text-base sm:text-lg" /* Adjusted py, px, and text size */
        >
          Go to My Quizzes
        </button>
      </div>

      {/* Review Your Answers Section (Responsive) */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Review Your Answers:</h3>
        <div className="space-y-3 sm:space-y-4 text-left">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="p-3 border rounded-md"
              style={{ borderColor: selectedOptions[qIndex] === q.answer ? 'green' : 'red' }}
            >
              <p className="font-medium text-base sm:text-lg text-gray-800 break-words">{qIndex + 1}. {q.question}</p> {/* break-words for long questions */}
              <ul className="mt-2 space-y-1 text-sm sm:text-base"> {/* Adjusted text size */}
                {['a', 'b', 'c', 'd'].map(optionKey => (
                  <li
                    key={optionKey}
                    className={`
                      ${optionKey === q.answer ? 'text-green-700 font-bold' : ''}
                      ${selectedOptions[qIndex] === optionKey && optionKey !== q.answer ? 'text-red-600 font-bold' : ''}
                      ${selectedOptions[qIndex] === optionKey && optionKey === q.answer ? 'bg-green-100 rounded-sm px-1 py-0.5' : ''} {/* Adjusted padding */}
                    `}
                  >
                    {optionKey}) {q[optionKey]}
                  </li>
                ))}
              </ul>
              <p className="text-xs sm:text-sm mt-2">Your choice: <span className="font-bold">{selectedOptions[qIndex] || 'N/A'}</span></p> {/* Adjusted text size */}
              <p className="text-xs sm:text-sm">Correct answer: <span className="font-bold">{q.answer}</span></p> {/* Adjusted text size */}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    // --- Display Current Question (Responsive) ---
    <div>
      <div className="mb-4 sm:mb-6"> {/* Adjusted margin */}
        <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Question {currentIndex + 1} of {questions.length}</p> {/* Adjusted text size */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentQuestion.question}
          </ReactMarkdown>
        </h2>
      </div>

      <div className="space-y-3 sm:space-y-4"> {/* Adjusted spacing */}
        {['a', 'b', 'c', 'd'].map(optionKey => (
          <button
            key={optionKey}
            onClick={() => handleOptionSelect(currentIndex, optionKey)}
            className={`w-full text-left p-3 border rounded-md text-base sm:text-lg transition-all duration-200
              ${selectedOptions[currentIndex] === optionKey
                ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
              }`}
          >
            {optionKey}) {currentQuestion[optionKey]}
          </button>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0"> {/* Changed to flex-col on small, flex-row on larger */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`w-full sm:w-auto px-4 py-2 rounded-md font-semibold transition duration-200 text-base sm:text-lg ${ /* w-full for mobile, w-auto for desktop */
            currentIndex === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          Previous
        </button>
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOptions.hasOwnProperty(currentIndex)}
            className={`w-full sm:w-auto px-4 py-2 rounded-md font-semibold transition duration-200 text-base sm:text-lg ${ /* w-full for mobile, w-auto for desktop */
              !selectedOptions.hasOwnProperty(currentIndex) ? 'bg-green-300 text-green-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!selectedOptions.hasOwnProperty(currentIndex)}
            className={`w-full sm:w-auto px-4 py-2 rounded-md font-semibold transition duration-200 text-base sm:text-lg ${ /* w-full for mobile, w-auto for desktop */
              !selectedOptions.hasOwnProperty(currentIndex) ? 'bg-blue-300 text-blue-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )}

  {/* Share Quiz Link Section (Responsive) */}
  {quizLink && (
    <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md text-center text-sm sm:text-base"> {/* Adjusted mt, p, and text size */}
      <p className="font-semibold mb-2 text-blue-800">Share this Quiz!</p>
      <a
        href={quizLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all block" // Ensured link is block for better wrapping
      >
        {quizLink}
      </a>
      <button
        onClick={() => navigator.clipboard.writeText(quizLink)}
        className="mt-3 px-3 py-1 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 text-xs sm:text-sm" /* Adjusted mt and text size */
      >
        Copy Link
      </button>
    </div>
  )}
</div>
  );
};

export default SharedQuizPlayer;