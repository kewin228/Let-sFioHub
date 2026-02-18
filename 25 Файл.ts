import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUpload, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Логотип */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="text-xl font-bold text-blue-600">Let'sFioHub</span>
            </Link>

            {/* Поиск */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск видео..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Правая часть */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <FaHome className="w-5 h-5" />
              </Link>
              
              <Link to="/upload" className="p-2 hover:bg-gray-100 rounded-lg">
                <FaUpload className="w-5 h-5" />
              </Link>

              {isLoggedIn ? (
                <>
                  <Link to={`/channel/${user.username}`} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="hidden md:inline">{user.display_name || user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaSignOutAlt className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    Войти
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Основное содержимое */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Подвал */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Let'sFioHub</h3>
              <p className="text-gray-400">Видеохостинг нового поколения</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-blue-400">О нас</a>
              <a href="#" className="hover:text-blue-400">Контакты</a>
              <a href="#" className="hover:text-blue-400">Правила</a>
              <a href="#" className="hover:text-blue-400">Помощь</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© 2024 Let'sFioHub. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;