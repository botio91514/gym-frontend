import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dumbbell, Calendar, CreditCard, Menu, X, LogOut } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import ThankYou from './components/ThankYou';
import { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Define API base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create a separate NavBar component that uses useLocation
function NavBar({ isAdminLoggedIn, onLogout }: { isAdminLoggedIn: boolean; onLogout: () => void }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-yellow-500" size={28} />
            <Link to="/" className="text-2xl font-bold text-yellow-500 hover:text-yellow-600">
              Gym
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-yellow-500 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop menu */}
          {isAdminLoggedIn && isAdminRoute && (
            <div className="hidden md:flex items-center">
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4">
            {isAdminLoggedIn && isAdminRoute && (
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all duration-300"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          setIsAdminLoggedIn(true);
        } else {
          console.error('Token verification failed:', response.status);
          localStorage.removeItem('token');
          setIsAdminLoggedIn(false);
        }
      })
      .catch((error) => {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        setIsAdminLoggedIn(false);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdminLoggedIn(false);
  };

  if (isLoadingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
          <NavBar isAdminLoggedIn={isAdminLoggedIn} onLogout={handleLogout} />

          <main className="container mx-auto px-4 py-8 flex-grow">
            <Routes>
              <Route path="/" element={<RegistrationForm />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route 
                path="/admin" 
                element={
                  isAdminLoggedIn ? (
                    <AdminPanel />
                  ) : (
                    <Navigate to="/admin" replace />
                  )
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-auto">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-yellow-500">
                    <Calendar className="mr-2" size={24} /> Opening Hours
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Monday - Saturday</p>
                    <p className="text-gray-300">Morning: 6:00 AM - 9:00 AM</p>
                    <p className="text-gray-300">Evening: 4:00 PM - 9:00 PM</p>
                  </div>
                </div>
                
                <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-yellow-500">
                    <CreditCard className="mr-2" size={24} /> Payment Methods
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Cash</p>
                    <p className="text-gray-300">Online Payment</p>
                  </div>
                </div>
                
                <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-500">Contact Us</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Email: gym0205@gmail.com</p>
                    <p className="text-gray-300">Phone: 9662460000</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Gym. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </>
  );
}

export default App;