// src/pages/Auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../../contexts/AuthContext';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

import logoImg from '../../assets/logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Added new credentials for Estimation and Payments teams
    const dummyUsers: Record<string, User> = {
      'admin@metrixtax.com': { id: '1', name: 'Admin Boss', role: 'ADMIN', team: 'NONE' },
      'lead.prep@metrixtax.com': { id: '2', name: 'Prep Lead', role: 'TEAMLEAD', team: 'PREPARATION' },
      'emp.doc@metrixtax.com': { id: '3', name: 'Doc Employee', role: 'EMPLOYEE', team: 'DOCUMENTATION' },
      'emp.prep@metrixtax.com': { id: '5', name: 'Prep Employee', role: 'EMPLOYEE', team: 'PREPARATION' },
      'emp.efile@metrixtax.com': { id: '4', name: 'Filing Employee', role: 'EMPLOYEE', team: 'E-FILING' },
      'emp.est@metrixtax.com': { id: '6', name: 'Estimation Employee', role: 'EMPLOYEE', team: 'ESTIMATION' },
      'emp.pay@metrixtax.com': { id: '7', name: 'Payments Employee', role: 'EMPLOYEE', team: 'PAYMENTS' }
    };

    const selectedUser = dummyUsers[email];

    if (selectedUser) {
      login(selectedUser);
      navigate('/dashboard', { replace: true }); 
    } else {
      alert("Invalid test email! Use admin@metrixtax.com, lead.prep@metrixtax.com, emp.doc@metrixtax.com, emp.prep@metrixtax.com, emp.est@metrixtax.com, emp.pay@metrixtax.com, or emp.efile@metrixtax.com");
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col font-sans bg-gray-50 overflow-hidden relative select-none">
      <header className="relative z-20 flex justify-between items-center px-6 lg:px-16 h-16 bg-white shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Metrix Tax Filing Logo" className="h-20 md:h-22 w-auto object-contain" />
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          INTERNAL CRM
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 relative flex min-h-0 overflow-hidden">
        
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 flex flex-col">
          <div className="flex-[2] bg-[#1a3a44]"></div>
          <div className="flex-[1] bg-white"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 lg:px-16 py-4 gap-6 lg:gap-10 min-h-0 h-full">
          
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-end gap-6 lg:gap-10 w-full">
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white text-center lg:text-right leading-[1.15]">
              Welcome<br/>to<br/>CRM Portal
            </h2>

            {/* CSS Phone Mockup */}
            <div className="hidden lg:flex w-[280px] h-[550px] bg-white rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl flex-col relative overflow-hidden shrink-0">
              <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-xl w-32 mx-auto"></div>
              
              <div className="flex-1 px-5 pt-12 pb-6 flex flex-col items-center text-center">
                <div className="text-blue-900 font-bold text-xl mb-6 leading-tight">
                  METRIX<br/><span className="text-[10px] text-gray-500 font-bold tracking-widest">WORKSPACE</span>
                </div>
                
                <div className="w-full aspect-square bg-blue-50 rounded-lg mb-6 flex items-center justify-center overflow-hidden border border-blue-100 relative">
                  <img 
                    src="https://img.magnific.com/premium-photo/tax-return-business-person-using-laptop-tax-season-is-approac_36325-5564.jpg?semt=ais_hybrid&w=740&q=80" 
                    alt="US Tax Dashboard" 
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-blue-900/10"></div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight">
                  Secure Access to<br/>Tax Filing Operations
                </h3>
                
                <button className="mt-auto bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-full w-full opacity-50 cursor-not-allowed">
                  System Active
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[420px] lg:ml-10 shrink-0">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 lg:p-10 relative">
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Employee Login</h2>
              <p className="text-sm text-gray-500 mb-8">
                Enter your credentials to access the workspace.
              </p>

              {/* Login Form with Password */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-gray-400"
                    placeholder="name@metrixtaxfiling.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-gray-400 pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-base py-3.5 rounded-lg transition-colors mt-2"
                >
                  Access Portal
                </button>
              </form>

              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Protected by Metrix Security</span>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Login;