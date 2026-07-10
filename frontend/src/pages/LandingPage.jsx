import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import {
  Video, Users, BarChart3, ShieldCheck, Zap, Globe,
  ArrowRight, ChevronDown, Star, CheckCircle2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function OrbBackground() {
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 600);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const spring = { damping: 90, stiffness: 50, mass: 2 };
  const smX = useSpring(mouseX, spring);
  const smY = useSpring(mouseY, spring);
  const orb1X = useTransform(smX, [0, window.innerWidth], [-25, 25]);
  const orb1Y = useTransform(smY, [0, window.innerHeight], [-25, 25]);
  const orb2X = useTransform(smX, [0, window.innerWidth], [30, -30]);
  const orb2Y = useTransform(smY, [0, window.innerHeight], [20, -20]);

  const rafId = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
        rafId.current = null;
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      <motion.div
        style={{ x: orb1X, y: orb1Y, background: 'hsl(174 72% 34%)' }}
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20 dark:opacity-15 blur-[120px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ x: orb2X, y: orb2Y, background: 'hsl(38 92% 60%)' }}
        className="absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-10 blur-[100px]"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 dark:opacity-8 blur-[80px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{ background: 'hsl(174 65% 48%)' }}
      />
    </div>
  );
}

function FadeInSection({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <FadeInSection delay={delay}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="saas-card p-7 group cursor-default relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
          style={{ background: 'radial-gradient(circle at 50% 0%, hsl(174 72% 34% / 0.07), transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: 'hsl(174 72% 34% / 0.1)', color: 'hsl(var(--primary))' }}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </motion.div>
    </FadeInSection>
  );
}

function StatItem({ value, label, delay }) {
  return (
    <FadeInSection delay={delay} className="text-center">
      <div className="text-4xl font-bold text-foreground mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </FadeInSection>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: Video,
      title: 'Crystal-Clear HD Meetings',
      description: 'One-click video meetings with noise cancellation, virtual backgrounds, and adaptive quality for any connection.',
    },
    {
      icon: Users,
      title: 'Real-Time Collaboration',
      description: 'Shared whiteboards, live document editing, and project boards — all in the same space as your meeting.',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics',
      description: 'Understand engagement, track time, and surface insights that help your team work smarter.',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      description: 'End-to-end encryption, SSO support, and SOC-2 compliant infrastructure keep your data safe.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant meeting start, sub-100ms latency, and a global edge network so lag is never on the agenda.',
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Browser, desktop, and mobile — no plugins, no installs. Just send a link and meet.',
    },
  ];

  const testimonials = [
    { name: 'Priya S.', role: 'Engineering Lead', quote: 'Finally a meeting tool that doesn\'t get in the way. The project board integration is 🔥' },
    { name: 'Marcus T.', role: 'Product Manager', quote: 'Analytics alone saved us hours of manual reporting every week.' },
    { name: 'Aiko M.', role: 'Startup Founder', quote: 'Set up in minutes, runs like butter. Our remote team finally feels like one room.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-border/50 backdrop-blur-md"
        style={{ background: 'hsl(var(--background) / 0.8)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'hsl(var(--primary))' }}>
            <Video className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-foreground tracking-tight text-sm">IntellMeet</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate('/login', { state: { startSignup: false } })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login', { state: { startSignup: true } })}
            className="premium-button h-9 px-4 text-xs"
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
        <OrbBackground />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground mb-8 backdrop-blur-sm"
            style={{ background: 'hsl(var(--muted) / 0.5)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'hsl(var(--primary))' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'hsl(var(--primary))' }} />
            </span>
            New — AI meeting summaries are here
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.05]"
          >
            Meet.{' '}
            <span style={{ color: 'hsl(var(--primary))' }}>Collaborate.</span>
            <br />
            Ship faster.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            IntellMeet brings HD video meetings, real-time project boards, and deep analytics into one beautiful workspace — so your team spends less time switching tabs and more time doing great work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login', { state: { startSignup: true } })}
              className="premium-button h-12 px-8 text-base gap-2"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login', { state: { startSignup: false } })}
              className="h-12 px-8 text-base rounded-lg border border-border text-foreground hover:bg-muted transition-all duration-150 font-medium"
            >
              Sign in →
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-1.5 mt-8 text-xs text-muted-foreground"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" style={{ color: 'hsl(38 92% 55%)' }} />
            ))}
            <span className="ml-1">Loved by 10,000+ teams worldwide</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-20 w-full max-w-3xl mx-auto"
        >
          <div className="saas-card overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 40px 80px -20px hsl(174 72% 34% / 0.25)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: 'hsl(var(--muted))' }}>
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
              <div className="flex-1 mx-4 h-6 rounded-md border border-border flex items-center px-3 text-xs text-muted-foreground"
                style={{ background: 'hsl(var(--background))' }}>
                app.intellmeet.io/dashboard
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4" style={{ background: 'hsl(var(--card))' }}>
              <div className="col-span-1 space-y-2">
                {['Dashboard', 'Meetings', 'Project Board', 'Analytics'].map((item, i) => (
                  <div key={i} className={`h-8 rounded-lg px-3 flex items-center text-xs font-medium transition-all ${i === 0 ? 'text-white' : 'text-muted-foreground'}`}
                    style={{ background: i === 0 ? 'hsl(var(--primary))' : 'transparent' }}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Meetings Today', value: '4' }, { label: 'Team Members', value: '12' }].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 border border-border" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                      <div className="text-2xl font-bold text-foreground">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="text-xs text-muted-foreground mb-3">Upcoming</div>
                  {['Design Sync', 'Sprint Planning'].map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
                      <span className="text-xs text-foreground">{m}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{i === 0 ? '2:00 PM' : '4:30 PM'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.button
          onClick={scrollToFeatures}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </section>

      <section className="py-20 px-6 border-y border-border" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatItem value="10k+" label="Teams worldwide" delay={0} />
          <StatItem value="99.9%" label="Uptime SLA" delay={0.1} />
          <StatItem value="< 80ms" label="Global latency" delay={0.2} />
          <StatItem value="SOC-2" label="Certified security" delay={0.3} />
        </div>
      </section>

      <section ref={featuresRef} className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--primary))' }}>
              Everything you need
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Built for teams that move fast
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Not just another video call tool. IntellMeet is a full async + sync collaboration platform.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-y border-border" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeInSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Trusted by teams who ship
            </h2>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeInSection key={t.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="saas-card p-6 flex flex-col gap-4"
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 fill-current" style={{ color: 'hsl(38 92% 55%)' }} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[100px] opacity-15"
            style={{ background: 'hsl(174 72% 40%)' }} />
        </div>
        <FadeInSection className="max-w-2xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            No credit card required · Free forever plan · Cancel anytime
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-5">
            Ready to meet better?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join thousands of teams who've already made the switch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login', { state: { startSignup: true } })}
              className="premium-button h-13 px-10 text-base gap-2"
            >
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login', { state: { startSignup: false } })}
              className="h-12 px-8 text-base rounded-lg border border-border text-foreground hover:bg-muted transition-all duration-150 font-medium"
            >
              Sign in →
            </motion.button>
          </div>
        </FadeInSection>
      </section>

      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'hsl(var(--primary))' }}>
              <Video className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">IntellMeet</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} IntellMeet. Built with ❤️ for modern teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
