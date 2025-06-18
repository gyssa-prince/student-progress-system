    import React, { useState, useEffect } from 'react';
    import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
    import StudentList from './StudentList';
    import StudentProfile from './StudentProfile';
    import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'; // Assuming you install @heroicons/react

    function App() {
      const [darkMode, setDarkMode] = useState(() => {
        // Initialize dark mode from localStorage or default to false
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true' ? true : false;
      });

      useEffect(() => {
        // Apply or remove 'dark' class to the html element
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        // Save dark mode preference to localStorage
        localStorage.setItem('darkMode', darkMode);
      }, [darkMode]);

      return (
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <header className="bg-white dark:bg-gray-800 shadow-md py-4 flex justify-between items-center px-4 md:px-24">
              <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Student Progress System
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </header>
            <main className="container mx-auto p-4">
              <Routes>
                <Route path="/" element={<StudentList />} />
                <Route path="/student/:id" element={<StudentProfile />} />
              </Routes>
            </main>
          </div>
        </Router>
      );
    }

    export default App;
    