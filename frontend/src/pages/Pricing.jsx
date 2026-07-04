import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, api } from '../store/authStore';
import { Check, Zap, ArrowRight, ArrowLeft, Crown, Sparkles, X, CheckCircle2, AlertCircle, Video, LayoutDashboard, CreditCard, BarChart3 } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { motion, AnimatePresence } from 'framer-motion';


function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border max-w-sm text-sm font-medium backdrop-blur-sm ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-card border-border text-foreground'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : null}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}


const MENU_ITEMS = [
  { id: 'dashboard', label: 'Meetings', icon: Video, path: '/dashboard' },
  { id: 'board', label: 'Project Board', icon: LayoutDashboard, path: '/board' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'pricing', label: 'Upgrade to Pro', icon: CreditCard, path: '/pricing' },
];

const FREE_FEATURES = [
  'Up to 40 min meeting duration',
  'Basic AI Summaries',
  'Standard Quality Video',
  'Up to 100 participants',
  '1 Workspace',
];

const PRO_FEATURES = [
  'Unlimited meeting duration',
  'Advanced AI Summaries & Actions',
  'Unlimited Cloud Recording',
  'Custom Workspace Branding',
  'Priority 24/7 Support',
  'Up to 500 participants',
  'Unlimited Workspaces',
];


export default function Pricing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isYearly, setIsYearly] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const monthlyPrice = 999;
  const yearlyPrice = 9990;
  const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
  const perMonth = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const savings = isYearly ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100) : 0;

  const waitForRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Razorpay) { clearInterval(interval); resolve(); }
        else if (attempts > 20) { clearInterval(interval); reject(new Error('Razorpay SDK failed to load')); }
      }, 250);
    });

  const handleSubscribe = async () => {
    const plan = isYearly ? 'pro_yearly' : 'pro_monthly';
    setLoadingPlan(plan);

    try {
      
      await waitForRazorpay();

      const { data } = await api.post('/payments/create-order', { plan });
      const { orderId, amount, currency } = data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'IntellMeet',
        description: `Pro Plan – ${isYearly ? 'Yearly' : 'Monthly'}`,
        image: '/logo.png',
        order_id: orderId,

        
        
        config: {
          display: {
            blocks: {
              upi_block: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi', flows: ['qr', 'collect', 'intent'] }
                ],
              },
              card_block: {
                name: 'Pay via Card',
                instruments: [{ method: 'card' }],
              },
              netbanking_block: {
                name: 'Pay via Netbanking',
                instruments: [{ method: 'netbanking' }],
              },
              wallet_block: {
                name: 'Pay via Wallet',
                instruments: [{ method: 'wallet' }],
              },
            },
            sequence: ['block.upi_block', 'block.card_block', 'block.netbanking_block', 'block.wallet_block'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },

        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            addToast('Payment successful! You are now a Pro member.', 'success', 6000);
            setTimeout(() => navigate('/dashboard'), 2500);
          } catch (err) {
            addToast('Payment verification failed. Please contact support.', 'error');
            console.error(err);
          }
        },

        prefill: {
          name: user?.user_metadata?.name || user?.name || '',
          email: user?.email || '',
          contact: '',
        },

        notes: {
          plan,
          userId: user?.id || '',
        },

        theme: {
          color: '#16a085',
          hide_topbar: false,
        },

        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
          animation: true,
          escape: true,
          backdropclose: false,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        addToast(`Payment failed: ${response.error?.description || 'Unknown error'}`, 'error');
        console.error('[Razorpay] Payment failed:', response.error);
      });

      rzp.open();
    } catch (err) {
      console.error('Failed to create order:', err);
      addToast(err.message || 'Failed to initiate checkout. Please try again.', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Toast toasts={toasts} removeToast={removeToast} />

      {}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-primary/8 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-amber-400/8 dark:bg-amber-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 py-16 px-6 flex flex-col items-center">
        {}
        <div className="w-full max-w-5xl mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
        </div>

        {}
        <div className="text-center mb-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Simple Pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight"
          >
            Upgrade your workspace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            Unlock unlimited recordings, advanced AI summaries, and custom branding.
          </motion.p>

          {}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              id="billing-toggle"
              onClick={() => setIsYearly(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-primary' : 'bg-border'
              }`}
            >
              <motion.div
                animate={{ x: isYearly ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
            <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
              <AnimatePresence>
                {isYearly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -5 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -5 }}
                    className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/20"
                  >
                    Save {savings}%
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="saas-card p-8 border border-border/60 flex flex-col"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Free</h2>
              <p className="text-sm text-muted-foreground">Perfect for small teams getting started.</p>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground text-sm mb-1.5">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Always free, no credit card required</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button className="w-full h-11 rounded-xl border border-border font-medium text-muted-foreground text-sm cursor-default">
              Current Plan
            </button>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative saas-card p-8 border-2 border-primary/40 ring-1 ring-primary/10 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col"
          >
            {}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            {}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-[11px] font-bold rounded-full uppercase tracking-wide shadow-lg">
              <Crown className="h-3 w-3" />
              Most Popular
            </div>

            <div className="mb-6 relative">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">Pro</h2>
                <Zap className="h-4 w-4 text-primary fill-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Everything you need for serious collaboration.</p>
            </div>

            <div className="mb-8 relative">
              <div className="flex items-end gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayPrice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="text-4xl font-bold"
                  >
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </motion.span>
                </AnimatePresence>
                <span className="text-muted-foreground text-sm mb-1.5">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
              {isYearly && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground mt-1"
                >
                  Just ₹{perMonth.toLocaleString('en-IN')}/month — billed annually
                </motion.p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1 relative">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button
              id="upgrade-to-pro-btn"
              onClick={handleSubscribe}
              disabled={loadingPlan !== null}
              className="relative w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 active:scale-[0.98] text-[15px]"
            >
              {loadingPlan ? (
                <><InlineSpinner className="mr-1" /> Processing...</>
              ) : (
                <>Upgrade to Pro <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Powered by Razorpay · Supports UPI, Cards, Netbanking &amp; Wallets
            </p>
          </motion.div>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
        >
          {['Secure payments via Razorpay', 'UPI, Cards & Wallets supported', 'Cancel anytime', 'Priority support included'].map((item, i) => (
            <span key={i} className="flex items-center gap-1">{item}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
