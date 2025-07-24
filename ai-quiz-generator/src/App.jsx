// src/App.jsx
import React, { useState } from 'react'; // Import useState
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateQuiz from './components/CreateQuiz';
import SharedQuizPlayer from './components/SharedQuizPlayer';
import Login from './components/Login';
import Register from './components/Register';
import MyQuizzes from './components/MyQuizzes';
import ChatWithAI from './components/ChatWithAI.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// A simple PrivateRoute component (remains the same)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="text-center mt-20 text-gray-700">Loading authentication...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* AuthProvider wraps AppContent */}
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

// Separate component to use useAuth hook inside Router
const AppContent = () => {
  const { isAuthenticated, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for mobile menu

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <nav className="bg-gray-800 p-4 text-white shadow-md relative"> {/* Added 'relative' for absolute positioning of menu */}
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
            AI Quiz Gen
          </Link>

          {/* Hamburger menu button for small screens */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>

          {/* Navigation links - hidden by default on small screens, flex on medium and up */}
          <div className={`
            md:flex md:items-center md:space-x-4
            ${isMenuOpen ? 'block absolute top-full left-0 w-full bg-gray-700 py-2 shadow-lg z-10' : 'hidden'}
          `}>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 px-4 md:px-0">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-quiz"
                    className="block hover:text-gray-300 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)} // Close menu on click
                  >
                    Create Quiz
                  </Link>
                  <Link
                    to="/my-quizzes"
                    className="block hover:text-gray-300 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)} // Close menu on click
                  >
                    My Quizzes
                  </Link>
                   {/* --- NEW: Link to Chat with AI --- */}
                  <Link to="/chat" className="block hover:text-gray-300 transition-colors py-2 md:py-0" onClick={() => setIsMenuOpen(false)}>Chat with AI</Link>
                  {/* --- END NEW --- */}
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false); // Close menu on logout
                    }}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium transition-colors w-full md:w-auto"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block hover:text-gray-300 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)} // Close menu on click
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block hover:text-gray-300 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)} // Close menu on click
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/create-quiz" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quiz/:id" element={<SharedQuizPlayer />} />

        {/* Protected routes */}
        <Route path="/create-quiz" element={<PrivateRoute><CreateQuiz /></PrivateRoute>} />
        <Route path="/my-quizzes" element={<PrivateRoute><MyQuizzes /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatWithAI /></PrivateRoute>} />
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;









// // src/App.jsx
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
// import CreateQuiz from './components/CreateQuiz';
// import SharedQuizPlayer from './components/SharedQuizPlayer';
// import Login from './components/Login'; // Import Login component
// import Register from './components/Register'; // Import Register component
// import MyQuizzes from './components/MyQuizzes'; // We'll create this next
// import { useAuth } from './context/AuthContext.jsx'; // Import useAuth hook

// // A simple PrivateRoute component
// const PrivateRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
//   if (loading) return <div>Loading authentication...</div>; // Or a spinner
//   return isAuthenticated ? children : <Navigate to="/login" />;
// };

// const App = () => {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// };

// // Separate component to use useAuth hook inside Router
// const AppContent = () => {
//   const { isAuthenticated, logout, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <p className="text-lg text-gray-700">Loading application...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 pb-10">
//       <nav className="bg-gray-800 p-4 text-white shadow-md">
//         <div className="container mx-auto flex justify-between items-center">
//           <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
//             AI Quiz Gen
//           </Link>
//           <div className="space-x-4">
//             {isAuthenticated ? (
//               <>
//                 <Link to="/create-quiz" className="hover:text-gray-300 transition-colors">Create Quiz</Link>
//                 <Link to="/my-quizzes" className="hover:text-gray-300 transition-colors">My Quizzes</Link> {/* Link to new component */}
//                 <button
//                   onClick={logout}
//                   className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
//                 >
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link to="/login" className="hover:text-gray-300 transition-colors">Login</Link>
//                 <Link to="/register" className="hover:text-gray-300 transition-colors">Register</Link>
//               </>
//             )}
//           </div>
//         </div>
//       </nav>

//       <Routes>
//         {/* Public routes */}
//         <Route path="/" element={isAuthenticated ? <Navigate to="/create-quiz" /> : <Login />} /> {/* Redirect if already logged in */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/quiz/:id" element={<SharedQuizPlayer />} /> {/* Public quiz viewing */}

//         {/* Protected routes */}
//         <Route path="/create-quiz" element={<PrivateRoute><CreateQuiz /></PrivateRoute>} />
//         <Route path="/my-quizzes" element={<PrivateRoute><MyQuizzes /></PrivateRoute>} /> New Protected Route

//         {/* Fallback for unknown routes */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </div>
//   );
// };

// export default App;































// // import React from 'react'
// // import ReactDOM from 'react-dom/client'
// // import { BrowserRouter, Routes, Route } from 'react-router-dom'
// // import './App.css'
// // import Dashboard from './components/Dashboard'
// // import CreateQuiz from './components/CreateQuiz'
// // import JoinQuiz from './components/JoinQuiz'
// // import QuizPlayer from './components/QuizPlayer'
// // import SharedQuizPlayer from './components/SharedQuizPlayer'

// // function App() {
  

// //   return (
// //     <>
// //       <BrowserRouter>
// //       <Routes>
// //         <Route path="/" element={<Dashboard />} />
// //         <Route path="/create" element={<CreateQuiz />} />
// //         <Route path="/play-quiz" element={<QuizPlayer />} />
// //         <Route path="/quiz/:id" element={<SharedQuizPlayer />} />

// //         <Route path="/join" element={<JoinQuiz />} />
// //       </Routes>
// //     </BrowserRouter>
// //     </>
// //   )
// // }

// // export default App
