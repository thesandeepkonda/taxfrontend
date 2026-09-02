// src/pages/Auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import api from '../../services/api';

interface LoginFormData {
  employeeCode: string;
  password: string;
}

interface LoginErrors {
  employeeCode?: string;
  password?: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    employeeCode: '',
    password: '',
  });
  const [touched, setTouched] = useState<{ employeeCode: boolean; password: boolean }>({
    employeeCode: false,
    password: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // ---------- Validation Functions ----------
  const validateField = (name: keyof LoginFormData, value: string): string | undefined => {
    if (name === 'employeeCode') {
      if (!value.trim()) return 'Employee code is required';
      if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Only alphanumeric characters allowed';
      if (value.length > 20) return 'Maximum 20 characters allowed';
      return undefined;
    }

    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Minimum 6 characters required';
      if (value.length > 20) return 'Maximum 20 characters allowed';
      return undefined;
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {
      employeeCode: validateField('employeeCode', formData.employeeCode),
      password: validateField('password', formData.password),
    };
    setErrors(newErrors);
    setTouched({ employeeCode: true, password: true });
    return !newErrors.employeeCode && !newErrors.password;
  };

  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name as keyof typeof touched]) {
      const error = validateField(name as keyof LoginFormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof LoginFormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show validation summary via toast (optional)
      showToast('Please fix the errors before submitting.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        employeeCode: formData.employeeCode.trim(),
        password: formData.password,
      });

      const data = response.data;

      const userData: User = {
        id: String(data.userId),
        employeeCode: data.employeeCode,
        name: data.employeeCode,
        role: data.role as 'ADMIN' | 'TEAMLEAD' | 'EMPLOYEE',
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        teamId: data.teamId,
        teamName: data.teamName,
        permissions: data.permissions || [],
        team: (data.teamName || data.departmentName || 'NONE') as any,
      };

      login(userData, data.accessToken, data.refreshToken);
      // Show success toast (optional)
      showToast('Login successful! Redirecting...', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Invalid employee code or password';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      !!formData.employeeCode.trim() &&
      !!formData.password &&
      !errors.employeeCode &&
      !errors.password
    );
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

      <main className="flex-1 relative flex min-h-0 overflow-hidden">
        <div className="absolute inset-0 z-0 flex flex-col">
          <div className="flex-[2] bg-[#1a3a44]"></div>
          <div className="flex-[1] bg-white"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 lg:px-16 py-4 gap-6 lg:gap-10 min-h-0 h-full">
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-end gap-6 lg:gap-10 w-full">
            <h2 className="text-4xl lg:text-5xl font-bold text-white text-center lg:text-right leading-[1.15]">
              Welcome<br/>to<br/>CRM Portal
            </h2>

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
              <p className="text-sm text-gray-500 mb-8">Enter your credentials to access the workspace.</p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Employee Code Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-gray-400 ${
                      touched.employeeCode && errors.employeeCode
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="ADMIN001"
                    disabled={loading}
                    required
                  />
                  {touched.employeeCode && errors.employeeCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeCode}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-gray-400 pr-12 ${
                        touched.password && errors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-base py-3.5 rounded-lg transition-colors mt-2"
                >
                  {loading ? 'Logging in...' : 'Access Portal'}
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