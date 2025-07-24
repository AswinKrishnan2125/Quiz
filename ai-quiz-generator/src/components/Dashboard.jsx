import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-10">AI Quiz Generator</h1>
      <div className="space-x-6">
        <button
          onClick={() => navigate('/create')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Create Quiz
        </button>
        <button
          onClick={() => navigate('/join')}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Join Quiz
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
