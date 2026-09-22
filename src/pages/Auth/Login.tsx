// src/pages/Auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  forgotPassword,
  resetPassword,
  clearAuthError,
  resetForgotPasswordState,
} from '../../store/slices/authSlice';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Mail,
  KeyRound,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
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
  const dispatch = useDispatch<AppDispatch>();

  // ✅ Forgot Password Redux state
  const {
    loading: fpLoading,
    error: fpError,
    forgotPasswordSuccess,
    resetPasswordSuccess,
  } = useSelector((state: RootState) => state.auth);

  // ✅ Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState<1 | 2>(1); // 1 = email, 2 = otp + new pwd
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpShowPassword, setFpShowPassword] = useState(false);
  const [fpLocalError, setFpLocalError] = useState<string | null>(null);

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

  // ============================================================
  // ✅ FORGOT PASSWORD HANDLERS
  // ============================================================
  const openForgotModal = () => {
    dispatch(resetForgotPasswordState());
    setShowForgotModal(true);
    setFpStep(1);
    setFpEmail('');
    setFpOtp('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpLocalError(null);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setFpStep(1);
    setFpEmail('');
    setFpOtp('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpLocalError(null);
    dispatch(resetForgotPasswordState());
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpLocalError(null);

    if (!fpEmail.trim()) {
      setFpLocalError('Email is required');
      return;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(fpEmail.trim())) {
      setFpLocalError('Enter a valid email address');
      return;
    }

    try {
      await dispatch(forgotPassword({ email: fpEmail.trim() })).unwrap();
      showToast('OTP sent to your email!', 'success');
      setFpStep(2);
    } catch (err: any) {
      setFpLocalError(err || 'Failed to send OTP');
    }
  };

  // Step 2: Reset password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpLocalError(null);

    if (!fpOtp.trim()) {
      setFpLocalError('OTP is required');
      return;
    }
    if (!fpNewPassword) {
      setFpLocalError('New password is required');
      return;
    }
    if (fpNewPassword.length < 8) {
      setFpLocalError('Password must be at least 8 characters');
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpLocalError('Passwords do not match');
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email: fpEmail.trim(),
          otp: fpOtp.trim(),
          newPassword: fpNewPassword,
        })
      ).unwrap();

      showToast('Password reset successfully! Please login.', 'success');
      closeForgotModal();
    } catch (err: any) {
      setFpLocalError(err || 'Failed to reset password');
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
                    {/* ✅ Forgot Password Trigger */}
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      Forgot Password?
                    </button>
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

      {/* ============================================================ */}
      {/* ✅ FORGOT PASSWORD MODAL                                      */}
      {/* ============================================================ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-700 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  {fpStep === 1 ? (
                    <Mail className="w-5 h-5 text-blue-700" />
                  ) : (
                    <KeyRound className="w-5 h-5 text-blue-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {fpStep === 1 ? 'Forgot Password' : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {fpStep === 1
                      ? 'Enter your registered email to receive OTP'
                      : 'Enter OTP and set a new password'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeForgotModal}
                disabled={fpLoading}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 pb-4 flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full ${fpStep >= 1 ? 'bg-blue-700' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${fpStep >= 2 ? 'bg-blue-700' : 'bg-gray-200'}`} />
            </div>

            {/* Error */}
            {(fpLocalError || fpError) && (
              <div className="mx-6 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{fpLocalError || fpError}</span>
              </div>
            )}

            {/* ✅ STEP 1: Email */}
            {fpStep === 1 && (
              <form onSubmit={handleSendOtp} className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="your.email@company.com"
                      disabled={fpLoading}
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    We'll send a 6-digit OTP to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading || !fpEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95"
                >
                  {fpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ✅ STEP 2: OTP + New Password */}
            {fpStep === 2 && (
              <form onSubmit={handleResetPassword} className="px-6 pb-6 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setFpStep(1);
                    setFpLocalError(null);
                    dispatch(clearAuthError());
                  }}
                  disabled={fpLoading}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Email
                </button>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-800">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>OTP sent to <span className="font-bold">{fpEmail}</span></span>
                </div>

                {/* OTP */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    OTP <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono tracking-widest text-center text-lg"
                      placeholder="123456"
                      maxLength={6}
                      disabled={fpLoading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={fpShowPassword ? 'text' : 'password'}
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Min 8 characters"
                      disabled={fpLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowPassword(!fpShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {fpShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={fpShowPassword ? 'text' : 'password'}
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                        fpConfirmPassword && fpConfirmPassword !== fpNewPassword
                          ? 'border-rose-400'
                          : 'border-gray-300'
                      }`}
                      placeholder="Re-enter password"
                      disabled={fpLoading}
                    />
                  </div>
                  {fpConfirmPassword && fpConfirmPassword !== fpNewPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    fpLoading ||
                    !fpOtp.trim() ||
                    !fpNewPassword ||
                    fpNewPassword !== fpConfirmPassword
                  }
                  className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95"
                >
                  {fpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;