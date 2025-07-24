// src/components/MyQuizzes.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && token) {
        const fetchMyQuizzes = async () => {
            setLoading(true);
            setError('');
            try {
                // Make sure VITE_API_BASE_URL is correctly defined in your .env files
                // For development: VITE_API_BASE_URL=http://localhost:5000/api
                // For production (after deployment): VITE_API_BASE_URL=https://your-deployed-app.vercel.app/api

                const response = await axios.get(import.meta.env.VITE_API_BASE_URL + '/my-quizzes', { // <--- USE ENVIRONMENT VARIABLE
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setQuizzes(response.data);
            } catch (err) {
                console.error('Frontend Error fetching my quizzes:', err.response?.data?.msg || err.message);
                setError(err.response?.data?.msg || 'Failed to fetch quizzes.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyQuizzes();
    } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setQuizzes([]);
        setError("Please log in to view your quizzes.");
    }
  }, [token, isAuthenticated, authLoading]);

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        await axios.delete(`http://localhost:5000/api/quiz/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
        alert('Quiz deleted successfully!');
      } catch (err) {
        console.error('Error deleting quiz:', err.response?.data?.msg || err.message);
        setError(err.response?.data?.msg || 'Failed to delete quiz.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-8">
        <p>Loading your quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-8 text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 sm:p-6 bg-white shadow-md rounded-md"> {/* Adjusted padding for smaller screens */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">My Quizzes</h2> {/* Adjusted text size for smaller screens */}
      {quizzes.length === 0 ? (
        <p className="text-center text-gray-600 text-base sm:text-lg">You haven't created any quizzes yet. Go to <Link to="/create-quiz" className="text-blue-600 hover:underline">Create Quiz</Link> to make one!</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => (
            <li key={quiz._id} className="
              flex flex-col sm:flex-row sm:justify-between sm:items-center
              p-4 border border-gray-200 rounded-md bg-gray-50
              space-y-2 sm:space-y-0
            ">
              <div className="flex-1 min-w-0 pr-0 sm:pr-4"> {/* flex-1 to allow text to grow, min-w-0 to prevent overflow */}
                <Link to={`/quiz/${quiz._id}`} className="text-lg sm:text-xl font-semibold text-blue-600 hover:underline block truncate"> {/* block and truncate for long titles */}
                  {quiz.title}
                </Link>
                <p className="text-gray-500 text-sm">{quiz.numQuestions} Questions</p>
                <p className="text-gray-500 text-xs">Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleDeleteQuiz(quiz._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0" /* flex-shrink-0 to prevent shrinking, w-full for mobile, mt for mobile */
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyQuizzes;




// // src/components/MyQuizzes.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext.jsx';
// import { Link } from 'react-router-dom';

// const MyQuizzes = () => {
//   const [quizzes, setQuizzes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const { token, isAuthenticated, loading: authLoading } = useAuth(); // Get token from AuthContext

//   useEffect(() => {
//     // Only fetch if authentication is not loading AND user is authenticated AND token exists
//     if (!authLoading && isAuthenticated && token) {
//         const fetchMyQuizzes = async () => {
//             setLoading(true);
//             setError('');
//             console.log("Attempting to fetch quizzes with token:", token); // Frontend: Is token available?
//             try {
//                 const response = await axios.get('http://localhost:5000/api/my-quizzes', {
//                     headers: {
//                         'Authorization': `Bearer ${token}` // Send the token for authentication
//                     }
//                 });
//                 console.log("Frontend received quizzes response data:", response.data); // What did backend send?
//                 setQuizzes(response.data);
//             } catch (err) {
//                 console.error('Frontend Error fetching my quizzes:', err.response?.data?.msg || err.message);
//                 setError(err.response?.data?.msg || 'Failed to fetch quizzes.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchMyQuizzes();
//     } else if (!authLoading && !isAuthenticated) {
//         // User is not authenticated, no token available
//         setLoading(false);
//         setQuizzes([]); // Ensure quizzes are empty if not authenticated
//         setError("Please log in to view your quizzes.");
//         console.log("User not authenticated, skipping quiz fetch.");
//     }
//   }, [token, isAuthenticated, authLoading]); // Re-run effect if token changes (e.g., after login/logout)

//   const handleDeleteQuiz = async (quizId) => {
//     if (window.confirm("Are you sure you want to delete this quiz?")) {
//       try {
//         await axios.delete(`http://localhost:5000/api/quiz/${quizId}`, {
//           headers: {
//             'Authorization': `Bearer ${token}` // Authenticate delete request
//           }
//         });
//         setQuizzes(quizzes.filter(quiz => quiz._id !== quizId)); // Remove from UI
//         alert('Quiz deleted successfully!');
//       } catch (err) {
//         console.error('Error deleting quiz:', err.response?.data?.msg || err.message);
//         setError(err.response?.data?.msg || 'Failed to delete quiz.');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="text-center mt-8">
//         <p>Loading your quizzes...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center mt-8 text-red-600">
//         <p>Error: {error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
//       <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">My Quizzes</h2>
//       {quizzes.length === 0 ? (
//         <p className="text-center text-gray-600">You haven't created any quizzes yet. Go to <Link to="/create-quiz" className="text-blue-600 hover:underline">Create Quiz</Link> to make one!</p>
//       ) : (
//         <ul className="space-y-4">
//           {quizzes.map((quiz) => (
//             <li key={quiz._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-md bg-gray-50">
//               <div>
//                 <Link to={`/quiz/${quiz._id}`} className="text-xl font-semibold text-blue-600 hover:underline">
//                   {quiz.title}
//                 </Link>
//                 <p className="text-gray-500 text-sm">{quiz.numQuestions} Questions</p>
//                 <p className="text-gray-500 text-xs">Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
//               </div>
//               <button
//                 onClick={() => handleDeleteQuiz(quiz._id)}
//                 className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
//               >
//                 Delete
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default MyQuizzes;