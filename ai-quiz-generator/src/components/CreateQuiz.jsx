// src/components/CreateQuiz.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth hook

const CreateQuiz = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5); // Make this dynamic too, or keep fixed
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // For displaying errors
  const [quizLink, setQuizLink] = useState('');
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth(); // Get token and auth status from context

  // If not authenticated, maybe redirect or disable functionality
  // This is handled by PrivateRoute in App.jsx, but good to keep in mind.
  if (!isAuthenticated && !loading) {
    // This component should ideally only be reachable if isAuthenticated is true
    // due to PrivateRoute. However, a client-side check can be added if needed.
    // navigate('/login'); // Example: redirect if suddenly unauthenticated
  }

  const handleGenerateQuiz = async () => {
    setError(''); // Clear previous errors
    setQuizLink(''); // Clear previous link
     console.log('Sending quiz generation request with:', {
    title: topic,
    numQuestions: numQuestions,
    difficulty: difficulty,
  });
    if (!topic.trim()) {
      setError('Please enter a quiz topic.');
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post(import.meta.env.VITE_API_BASE_URL + '/generate-quiz', {
        title: topic,
        numQuestions: numQuestions, // Send selected number of questions
        difficulty: difficulty,

      }, {
        headers: {
          'Authorization': `Bearer ${token}` // <--- ATTACH JWT TO HEADERS
        }
      });

      const { quizId, questions } = response.data;
      
      const newQuizLink = `${window.location.origin}/quiz/${quizId}`;
      setQuizLink(newQuizLink); // Display the link on this page

      // Optional: Add a button to navigate to play, instead of immediate redirect
      // navigate('/play-quiz', { state: { questions, quizId } }); // KEEP THIS COMMENTED FOR NOW to see the link

    } catch (err) {
      console.error("Error generating quiz:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 sm:mt-20 p-4 sm:p-6 bg-white shadow-md rounded-md"> {/* Adjusted mt and p for small screens */}
  <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">Create a New Quiz</h2> {/* Adjusted text size for small screens */}
  <div className="space-y-4">
    <div>
      <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Quiz Topic</label>
      <input
        type="text"
        id="topic"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors text-base" /* Adjusted px/py and text-base for consistency */
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., Data Structures, React Hooks, World History"
        required
      />
    </div>
    <div>
      <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
      <select
        id="difficulty"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
        value={difficulty} // This will be the state variable
        onChange={(e) => setDifficulty(e.target.value)} // This will update the state
        required
      >
        {/* <option value=""></option> Default/placeholder option */}
        <option value="">Difficulty</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
    <div>
      <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
      <input
        id="numQuestions"
        type="number"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors text-base" /* Adjusted px/py and text-base for consistency */
        value={numQuestions} // This should be controlled by your state
        onChange={(e) => {
          const inputString = e.target.value;
          const minAllowed = 1;
          const maxAllowed = 50;

          if (inputString === '') {
            setNumQuestions('');
            return;
          }

          let numValue = Number(inputString);

          if (isNaN(numValue)) {
            setNumQuestions(minAllowed);
            return;
          }

          if (numValue < minAllowed) {
            numValue = minAllowed;
          } else if (numValue > maxAllowed) {
            numValue = maxAllowed;
          }

          setNumQuestions(numValue);
        }}
        min="1"
        max="50"
        placeholder="Enter a number between 1 and 50"
      />
    </div>

    {error && <p className="text-red-600 text-sm">{error}</p>}

    <button
      onClick={handleGenerateQuiz}
      disabled={loading}
      className={`w-full py-2 px-4 rounded-md font-semibold transition duration-200 ease-in-out ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {loading ? 'Generating...' : 'Generate Quiz'}
    </button>
  </div>

  {quizLink && (
    <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-md text-center text-sm sm:text-base"> {/* Adjusted text size */}
      <p className="font-semibold mb-2">Quiz Created! Share this link:</p>
      <a
        href={quizLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all block mb-2 sm:mb-0" // Added 'block mb-2 sm:mb-0' for better mobile layout
      >
        {quizLink}
      </a>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2"> {/* Added flex controls for buttons */}
        <button
          onClick={() => navigator.clipboard.writeText(quizLink)}
          className="w-full sm:w-auto px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
        >
          Copy Link
        </button>
        <button
          onClick={() => navigate(`/quiz/${quizLink.split('/').pop()}`)}
          className="w-full sm:w-auto px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Play Quiz Now
        </button>
      </div>
    </div>
  )}
</div>
  );
};

export default CreateQuiz;


























// // CreateQuiz.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const CreateQuiz = () => {
//   const [topic, setTopic] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [quizLink, setQuizLink] = useState(''); // New state for the link
//   const navigate = useNavigate();

//   // Your parseQuestions function is no longer needed here, backend handles it
//   // You can remove it to keep your frontend leaner.

//   const handleGenerateQuiz = async () => {
//     if (!topic) return alert("Enter a topic");

//     setLoading(true);
//     setQuizLink(''); // Clear previous link
//     try {
//       const response = await axios.post("http://localhost:5000/api/generate-quiz", {
//         title: topic,
//         numQuestions: 5
//       });

//       const { quizId, questions } = response.data; // Get quizId and questions from backend
      
//       if (!quizId || !questions || questions.length === 0) {
//         throw new Error("Invalid response from backend: missing quiz ID or questions.");
//       }

//       // Construct the shareable link
//       const newQuizLink = `${window.location.origin}/quiz/${quizId}`; // Use window.location.origin for robustness
//       setQuizLink(newQuizLink); // Set the link to display

//       // Optionally, navigate directly to play the quiz:
//       // navigate(`/play-quiz/${quizId}`); // Or just navigate('/play-quiz', { state: { questions } }); if you prefer old way
//       // For now, we'll just display the link. If you want to automatically play, adjust this.

//       // If you still want to immediately navigate to play without a shareable link first:
//       // navigate('/play-quiz', { state: { questions, quizId } }); // Pass quizId too if needed later
      

//     } catch (err) {
//       console.error("Error generating quiz from backend:", err.response?.data || err.message);
//       alert("Failed to generate quiz. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto mt-20 p-6 bg-white shadow-md rounded-md">
//       <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>
//       <input
//         value={topic}
//         onChange={(e) => setTopic(e.target.value)}
//         placeholder="Enter quiz topic"
//         className="w-full p-2 border rounded mb-4"
//       />
//       <button
//         onClick={handleGenerateQuiz}
//         disabled={loading}
//         className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
//       >
//         {loading ? 'Generating...' : 'Generate Quiz'}
//       </button>

//       {quizLink && ( // Display the link if it exists
//         <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-md text-center">
//           <p className="font-semibold mb-2">Quiz Created! Share this link:</p>
//           <a
//             href={quizLink}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-blue-600 hover:underline break-all"
//           >
//             {quizLink}
//           </a>
//           <button
//             onClick={() => navigator.clipboard.writeText(quizLink)}
//             className="ml-4 px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
//           >
//             Copy Link
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CreateQuiz;