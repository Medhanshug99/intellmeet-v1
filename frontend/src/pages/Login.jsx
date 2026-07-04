import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Sun, Moon, ShieldAlert, XCircle } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { useTheme } from '@/components/ThemeProvider';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

const calculateStrength = (pass) => {
  let score = 0;
  if (!pass) return score;
  if (pass.length > 7) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  return score;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    signup, verifySignupOtp,
    login, sendLoginCode, verifyLoginCode,
    isLoading, isSignupOtpSent, isLoginOtpSent,
    emailInFlow, resetFlow, checkEmailExists
  } = useAuthStore();

  const navigate = useNavigate();

  const handleEmailChange = useCallback(async (value) => {
    setEmail(value);
    setEmailExists(false);
    if (isSignUp && isValidEmail(value)) {
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(value);
      setEmailExists(exists);
      setIsCheckingEmail(false);
    }
  }, [isSignUp, checkEmailExists]);

  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  const springConfig = { damping: 80, stiffness: 60, mass: 1.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const orb1X = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-15, 15]);
  const orb1Y = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [-15, 15]);
  const orb2X = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [20, -20]);
  const orb2Y = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [20, -20]);

  const rafId = { current: null };
  const handleMouseMove = (e) => {
    if (rafId.current) return;
    const { clientX, clientY } = e;
    rafId.current = requestAnimationFrame(() => {
      mouseX.set(clientX);
      mouseY.set(clientY);
      rafId.current = null;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Please provide an email'); return; }

    if (isSignUp && emailExists) {
      setError('This email is already registered. Please sign in instead.');
      return;
    }

    let res;
    if (isSignUp) {
      if (!name) { setError('Please provide your name'); return; }
      if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
      res = await signup(email, password, name);
    } else {
      if (loginMethod === 'password') {
        if (!password) { setError('Please enter your password'); return; }
        res = await login(email, password);
        if (res.success) {
          navigate('/dashboard');
          return;
        }
      } else {
        res = await sendLoginCode(email);
      }
    }

    if (!res.success) {
      setError(res.error);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.trim().length < 4) { setError('Please enter the verification code from your email'); return; }

    const res = isSignupOtpSent
      ? await verifySignupOtp(emailInFlow || email, otp)
      : await verifyLoginCode(emailInFlow || email, otp);

    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-muted', 'bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthTextColors = ['', 'text-destructive', 'text-orange-500', 'text-yellow-500', 'text-emerald-500'];

  const showOtpScreen = isSignupOtpSent || isLoginOtpSent;

  return (
    <div
      className="flex min-h-screen bg-background text-foreground font-sans relative overflow-hidden items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Orbs — stronger opacity */}
      <div className="absolute inset-0 pointer-events-none opacity-90 dark:opacity-50 transition-opacity duration-500">
        <motion.div
          style={{ x: orb1X, y: orb1Y, willChange: 'transform' }}
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-teal-500/40 rounded-full blur-[120px]"
        />
        <motion.div
          style={{ x: orb2X, y: orb2Y, willChange: 'transform' }}
          className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] max-w-[550px] max-h-[550px] bg-amber-400/35 rounded-full blur-[120px]"
        />
        <motion.div
          style={{ x: orb1Y, y: orb2X, willChange: 'transform' }}
          className="absolute bottom-[-20%] left-[10%] w-[65vw] h-[65vw] max-w-[750px] max-h-[750px] bg-rose-400/30 rounded-full blur-[140px]"
        />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] px-6 z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="h-12 w-12 mb-6">
            <img src="/logo.png" alt="IntellMeet Logo" className="w-full h-full object-contain rounded-lg shadow-sm border border-border/50 bg-background/50 backdrop-blur-sm" />
          </div>
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-foreground leading-tight">
            {showOtpScreen ? 'Check your email' : (isSignUp ? 'Create an account' : 'Sign in to IntellMeet')}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2 text-center">
            {showOtpScreen
              ? <><span className="text-foreground font-medium">We sent a 6-digit code to </span>{emailInFlow}</>
              : (isSignUp ? 'Join your team and start collaborating.' : 'Welcome back! Please enter your details.')}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="saas-card p-8 bg-card/90 backdrop-blur-2xl border border-border shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.35)]"
        >
          {!showOtpScreen ? (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name — sign up only */}
              {isSignUp && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[13px] font-medium text-foreground">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="premium-input"
                    autoFocus
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5 relative">
                <label htmlFor="email" className="text-[13px] font-medium text-foreground">Work Email</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    className={`premium-input pr-10 ${emailExists ? 'border-destructive focus:ring-destructive/30' : ''}`}
                    autoFocus={!isSignUp}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <InlineSpinner size="xs" />
                    </div>
                  )}
                  {!isCheckingEmail && email && isValidEmail(email) && !emailExists && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  {!isCheckingEmail && emailExists && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                {isSignUp && emailExists && !isCheckingEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[12px] text-destructive flex items-center gap-1 mt-1"
                  >
                    <XCircle className="h-3 w-3" />
                    This email is already registered.
                    <button type="button" onClick={() => { setIsSignUp(false); setEmailExists(false); }} className="underline font-semibold">Sign in instead?</button>
                  </motion.p>
                )}
              </div>

              {/* Password — for sign up or password login */}
              {(isSignUp || (!isSignUp && loginMethod === 'password')) && (
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[13px] font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="premium-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1.5"
                    >
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-muted'}`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium ${strengthTextColors[strength] || 'text-muted-foreground'}`}>
                        {strengthLabels[strength] || 'Enter a password'} {strength > 0 && 'password'}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Login Method Toggle */}
              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod(prev => prev === 'password' ? 'otp' : 'password');
                      setError('');
                    }}
                    className="text-[12px] text-primary hover:underline font-medium"
                  >
                    {loginMethod === 'password' ? 'Login with a code instead' : 'Login with password instead'}
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ x: -10 }}
                  animate={{ x: [-10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="text-[13px] text-destructive p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                className="premium-button w-full mt-2"
                disabled={isLoading || emailExists || isCheckingEmail || (!isValidEmail(email) && email.length > 0)}
              >
                {isLoading ? (
                  <><InlineSpinner className="mr-2" /> Processing...</>
                ) : (
                  <>{isSignUp ? 'Sign Up' : (loginMethod === 'password' ? 'Sign In' : 'Send Login Code')} <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </button>

              <div className="flex flex-col gap-3 text-center pt-5 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setPassword(''); setEmailExists(false); }}
                  className="text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          ) : (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-[13px] font-medium text-foreground text-center block">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="• • • • • •"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="premium-input text-center text-2xl tracking-[0.3em] font-mono h-16"
                  autoFocus
                />
                <p className="text-[12px] text-muted-foreground text-center mt-2">
                  Can't find it? Check your{' '}
                  <span className="text-amber-500 font-semibold">Spam / Junk</span>{' '}folder.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ x: -10 }}
                  animate={{ x: [-10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="text-[13px] text-destructive p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button type="submit" className="premium-button w-full mt-2" disabled={isLoading || otp.trim().length < 4}>
                {isLoading
                  ? <><InlineSpinner className="mr-2" /> Verifying...</>
                  : <>Verify Code <CheckCircle2 className="h-4 w-4 ml-2" /></>}
              </button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => { resetFlow(); setOtp(''); setError(''); }}
                  className="text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </motion.form>
          )}
        </motion.div>

        <p className="text-center text-[12px] text-muted-foreground mt-8">
          By continuing, you agree to our{' '}
          <span className="text-foreground hover:underline cursor-pointer font-medium">Terms of Service</span>
          {' '}and{' '}
          <span className="text-foreground hover:underline cursor-pointer font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
