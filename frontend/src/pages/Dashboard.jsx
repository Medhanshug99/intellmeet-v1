import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useMeetingStore } from '../store/meetingStore';
import { 
  Video, 
  Keyboard, 
  LayoutDashboard,
  LogOut,
  Folder,
  Sun,
  Moon,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CalendarPlus,
  Activity,
  X,
  Clock,
  UserX,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

function DeleteConfirmModal({ onConfirm, onCancel, isDeleting }) {
  const [confirmed, setConfirmed] = useState(false);
  const [typed, setTyped] = useState('');
  const CONFIRM_PHRASE = 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-destructive/40 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Delete Account & All Data</h2>
            <p className="text-xs text-destructive font-medium">Permanent — cannot be undone</p>
          </div>
        </div>

        <div className="mb-5 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The following will be <span className="text-foreground font-medium">permanently deleted</span> from our servers:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-4">
            <li className="flex items-center gap-2"><span className="text-destructive">•</span> Your account &amp; profile</li>
            <li className="flex items-center gap-2"><span className="text-destructive">•</span> All workspaces you own</li>
            <li className="flex items-center gap-2"><span className="text-destructive">•</span> All meetings, recordings &amp; transcripts</li>
            <li className="flex items-center gap-2"><span className="text-destructive">•</span> All tasks and AI summaries</li>
          </ul>
        </div>

        <div className="mb-5">
          <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
            Type <span className="text-destructive font-mono font-bold">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value.toUpperCase())}
            placeholder={CONFIRM_PHRASE}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || typed !== CONFIRM_PHRASE}
            className="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? <><InlineSpinner size="sm" className="mr-1" /> Deleting...</> : <><UserX className="h-4 w-4" /> Delete Everything</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const CAROUSEL_SLIDES = [
  {
    image: '/hero-illustration.png',
    title: 'Connect with anyone',
    description: 'Click New meeting to get a link you can send to people you want to meet with.',
  },
  {
    image: '/slide-plan-ahead.png',
    title: 'Plan ahead',
    description: 'Click New meeting to schedule meetings in advance and keep your team aligned.',
  },
  {
    image: '/slide-your-meeting.png',
    title: 'Your meeting is safe',
    description: 'No one can join a meeting unless invited or admitted by the host.',
  },
];

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Meetings', icon: Video, path: '/dashboard' },
  { id: 'board', label: 'Project Board', icon: LayoutDashboard, path: '/board' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'pricing', label: 'Upgrade to Pro', icon: CreditCard, path: '/pricing' },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(i => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  const next = () => setCurrent(i => (i + 1) % CAROUSEL_SLIDES.length);

  const slide = CAROUSEL_SLIDES[current];

  return (
    <div className="hidden lg:flex flex-col items-center w-[460px] shrink-0">
      {}
      <div className="relative w-full flex items-center justify-center">
        <button
          onClick={prev}
          className="absolute left-0 z-10 h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="w-[340px] h-[340px] flex items-center justify-center overflow-hidden">
          <img
            key={current}
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-contain transition-opacity duration-300 dark:brightness-75"
          />
        </div>

        <button
          onClick={next}
          className="absolute right-0 z-10 h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {}
      <div className="text-center mt-6 px-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{slide.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
      </div>

      {}
      <div className="flex items-center gap-2 mt-5">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-200 ${
              i === current ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-border hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
      title={isDark ? 'Switch to light' : 'Switch to dark'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function NewMeetingModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    await onCreate(title.trim());
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">New Meeting</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Meeting Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Standup, Product Review..."
              className="premium-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className="flex-1 premium-button rounded-lg"
            >
              {isCreating ? <><InlineSpinner className="mr-2" /> Creating...</> : <>Start Meeting</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout, deleteAccount } = useAuthStore();
  const { workspaces, currentWorkspace, fetchWorkspaces, setCurrentWorkspace, createWorkspace, isLoading: isWorkspaceLoading } = useWorkspaceStore();
  const { meetings, fetchMeetings, createMeeting, isLoading: isMeetingLoading } = useMeetingStore();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [joinCode, setJoinCode] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (dashboardError) {
      const timer = setTimeout(() => setDashboardError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [dashboardError]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace?.id) fetchMeetings(currentWorkspace.id);
  }, [currentWorkspace?.id, fetchMeetings]);

  const handleCreateMeeting = useCallback(async (title) => {
    if (!currentWorkspace) return;
    const newMeeting = await createMeeting({
      title,
      workspace: currentWorkspace.id,
      scheduledStartTime: new Date().toISOString()
    });
    if (newMeeting?.id) navigate(`/meeting/${newMeeting.id}`);
  }, [currentWorkspace, createMeeting, navigate]);

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    const input = joinCode.trim();
    if (input) {
      let finalCode = input;
      try {
        if (input.includes('http')) {
          const url = new URL(input);
          const parts = url.pathname.split('/');
          finalCode = parts[parts.length - 1];
        }
      } catch (err) {
        
      }
      navigate(`/meeting/${finalCode}`);
    }
  };

  const handleCreateWorkspace = useCallback(async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    if (newWorkspaceName.trim().length < 3) {
      setDashboardError('Workspace name must be at least 3 characters');
      return;
    }
    const newWs = await createWorkspace(newWorkspaceName.trim());
    if (newWs) {
      setNewWorkspaceName('');
    } else {
      setDashboardError('Failed to create workspace. Please try again.');
    }
  }, [newWorkspaceName, createWorkspace]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDashboardError('');
    const { success, error } = await deleteAccount();
    setIsDeleting(false);
    if (success) {
      navigate('/login');
    } else {
      setDashboardError(error || 'Failed to delete account');
    }
  };

  const downloadICS = (e, meeting) => {
    e.stopPropagation();
    const pad = n => n < 10 ? '0' + n : n;
    const formatDate = (date) => {
      const d = new Date(date);
      return d.getUTCFullYear() + pad(d.getUTCMonth()+1) + pad(d.getUTCDate()) + 'T' + 
             pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
    };
    
    const start = formatDate(meeting.scheduledStartTime);
    const end = formatDate(new Date(meeting.scheduledStartTime).getTime() + 60*60*1000);
    const meetingUrl = `${window.location.origin}/meeting/${meeting.id}`;
    
    const ics = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//IntellMeet//NONSGML v1.0//EN\r
BEGIN:VEVENT\r
UID:${meeting.id}@intellmeet\r
DTSTAMP:${start}\r
DTSTART:${start}\r
DTEND:${end}\r
SUMMARY:${meeting.title}\r
DESCRIPTION:${meeting.description || 'IntellMeet Video Call'}\\n\\nJoin here: ${meetingUrl}\r
URL:${meetingUrl}\r
END:VEVENT\r
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${meeting.title.replace(/\\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userInitial = (user?.displayName || user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const upcomingCount = meetings?.filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE').length ?? 0;
  const completedCount = meetings?.filter(m => m.status === 'COMPLETED').length ?? 0;

  return (
    <>
      {showNewMeetingModal && (
        <NewMeetingModal
          onClose={() => setShowNewMeetingModal(false)}
          onCreate={handleCreateMeeting}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          isDeleting={isDeleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteModal(false); setDashboardError(''); }}
        />
      )}

      {dashboardError && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl shadow-xl text-sm font-medium max-w-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{dashboardError}</span>
          <button onClick={() => setDashboardError('')} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">

        {}
        <aside className="hidden md:flex w-72 shrink-0 flex-col bg-card border-r border-border">
          
          <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
            <div className="h-8 w-8 mr-3 drop-shadow-sm">
              <img src="/logo.png" alt="IntellMeet Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="text-lg font-semibold tracking-tight">IntellMeet</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar py-4">
            <nav className="px-3 space-y-0.5">
              {MENU_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveMenu(item.id); navigate(item.path); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 px-3">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Workspaces
              </p>
              {isWorkspaceLoading ? (
                <div className="px-4 py-2"><InlineSpinner size="sm" /></div>
              ) : (
                <div className="space-y-0.5">
                  {workspaces.length === 0 && (
                    <p className="px-4 py-2 text-xs text-muted-foreground italic">No workspaces yet</p>
                  )}
                  {workspaces.map(ws => {
                    const isActive = currentWorkspace?.id === ws.id;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => setCurrentWorkspace(ws)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Folder className="h-4 w-4 shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </button>
                    );
                  })}

                  <form onSubmit={handleCreateWorkspace} className="flex items-center gap-2 mt-2 px-4">
                    <input
                      value={newWorkspaceName}
                      onChange={e => setNewWorkspaceName(e.target.value)}
                      placeholder="New workspace..."
                      className="flex-1 h-8 text-sm bg-transparent border-b border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newWorkspaceName.trim()}
                      className="h-7 w-7 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border p-3 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer group" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {}
        <div className="flex-1 flex flex-col overflow-hidden">

          <header className="relative z-50 h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
            <div className="text-sm font-medium text-muted-foreground">
              {timeString} <span className="opacity-40">•</span> {dateString}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/board')}
                className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Project Board"
              >
                <LayoutDashboard className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowNewMeetingModal(true)}
                className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="New Meeting"
              >
                <Video className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <div className="w-px h-5 bg-border mx-2" />
              <div className="relative">
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity select-none"
                >
                  {userInitial}
                </div>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-2">
                      <div className="px-3 py-2 border-b border-border mb-2">
                        <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); setShowDeleteModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-1"
                      >
                        <UserX className="h-4 w-4" /> Delete Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            
            {}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 px-8 md:px-16 lg:px-24 pt-16 pb-12 max-w-7xl mx-auto">
              <div className="flex-1 max-w-xl">
                <h1 className="text-4xl md:text-[2.75rem] font-semibold tracking-tight leading-[1.2] text-foreground mb-5">
                  Video calls and meetings<br/>for everyone
                </h1>
                <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                  Connect, collaborate, and ship faster from anywhere with IntellMeet.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      if (!currentWorkspace) {
                        setDashboardError('Please create or select a workspace first.');
                        setTimeout(() => setDashboardError(''), 4000);
                        return;
                      }
                      setShowNewMeetingModal(true);
                    }}
                    disabled={isMeetingLoading}
                    className="h-12 px-7 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isMeetingLoading ? <InlineSpinner size="sm" /> : <Video className="h-5 w-5" />}
                    New meeting
                  </button>

                  <form onSubmit={handleJoinMeeting} className="relative flex items-center">
                    <Keyboard className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value)}
                      placeholder="Enter a code or link"
                      className="h-12 pl-11 pr-20 rounded-full border border-border bg-card text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all w-64"
                    />
                    <button
                      type="submit"
                      disabled={!joinCode.trim()}
                      className="absolute right-3 px-3 h-7 text-sm font-semibold text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Join
                    </button>
                  </form>
                </div>

                <div className="mt-10 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span
                      onClick={() => navigate('/board')}
                      className="text-primary cursor-pointer hover:underline font-medium"
                    >
                      View Project Board
                    </span>
                    {' '}to manage tasks generated from your meetings.
                  </p>
                </div>
              </div>

              {}
              <HeroCarousel />
            </div>

            {}
            <div className="px-8 md:px-16 lg:px-24 pb-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Upcoming', value: upcomingCount, icon: Clock, sub: 'Scheduled meetings', action: null },
                  { label: 'Completed', value: completedCount, icon: Activity, sub: 'Past sessions', action: null },
                  { label: 'Workspace', value: currentWorkspace?.name || 'None selected', icon: Folder, sub: 'Active workspace', isText: true, action: null },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className={`saas-card p-5 flex items-center gap-4 ${stat.action ? 'cursor-pointer hover:border-primary/30' : ''}`}
                    onClick={stat.action}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className={`font-semibold text-foreground truncate ${stat.isText ? 'text-base mt-0.5' : 'text-2xl'}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="px-8 md:px-16 lg:px-24 pb-12 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  {currentWorkspace ? `Meetings · ${currentWorkspace.name}` : 'Recent Meetings'}
                </h2>
                <button
                  onClick={() => setShowNewMeetingModal(true)}
                  className="h-8 px-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
              </div>

              <div className="saas-card overflow-hidden">
                {isMeetingLoading && meetings.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <InlineSpinner size="lg" className="text-muted-foreground" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Video className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">No meetings yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {currentWorkspace ? 'Start your first meeting in this workspace.' : 'Create a workspace first, then schedule a meeting.'}
                    </p>
                    <button
                      onClick={() => currentWorkspace ? setShowNewMeetingModal(true) : null}
                      disabled={!currentWorkspace}
                      className="premium-button rounded-lg disabled:opacity-40"
                    >
                      <Video className="h-4 w-4 mr-2" /> Start a Meeting
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {meetings.slice(0, 10).map(m => {
                      const isLive = m.status === 'In Progress';
                      const isDone = m.status === 'Completed';
                      return (
                        <div
                          key={m.id}
                          onClick={() => navigate(`/meeting/${m.id}`)}
                          className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isLive ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              <Video className={`h-4 w-4 ${isLive ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{m.title}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {new Date(m.scheduledStartTime).toLocaleString(undefined, {
                                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.status === 'Scheduled' && (
                              <button 
                                onClick={(e) => downloadICS(e, m)}
                                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Add to Calendar"
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </button>
                            )}
                            <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isLive ? 'bg-primary/20 text-primary' :
                              isDone ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-muted-foreground/10 text-muted-foreground'
                            }`}>
                              {m.status}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
