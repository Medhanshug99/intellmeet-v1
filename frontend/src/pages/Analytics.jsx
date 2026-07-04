import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { useAuthStore, api } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Video, LayoutDashboard, CreditCard, LogOut, Sun, Moon,
  BarChart3, Activity, CheckCircle, Users
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Meetings', icon: Video, path: '/dashboard' },
  { id: 'board', label: 'Project Board', icon: LayoutDashboard, path: '/board' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'pricing', label: 'Upgrade to Pro', icon: CreditCard, path: '/pricing' },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
      title={isDark ? 'Switch to light' : 'Switch to dark'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentWorkspace?.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/workspaces/${currentWorkspace.id}/analytics`);
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [currentWorkspace]);

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const pieData = (data && data.totalTasks > 0) ? [
    { name: 'Completed Tasks', value: data.completedTasks, color: '#10b981' },
    { name: 'Pending Tasks', value: data.totalTasks - data.completedTasks, color: '#ef4444' }
  ] : [];

  const barData = data ? [
    { name: 'Meetings', value: data.totalMeetings },
    { name: 'Tasks', value: data.totalTasks },
    { name: 'Members', value: data.memberCount }
  ] : [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {}
      <div className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">IntellMeet</span>
          </div>

          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 md:p-12 lg:px-24 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Team Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Visualize your team's productivity and engagement.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <InlineSpinner size="lg" />
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-muted-foreground">No data available. Join a workspace first.</div>
          ) : (
            <>
              {}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="saas-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Meetings</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{data.totalMeetings}</p>
                </div>
                <div className="saas-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-muted-foreground">Tasks Done</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{data.completedTasks}</p>
                </div>
                <div className="saas-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-medium text-muted-foreground">Tasks Pending</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{data.totalTasks - data.completedTasks}</p>
                </div>
                <div className="saas-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-sky-500" />
                    <span className="text-sm font-medium text-muted-foreground">Members</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{data.memberCount}</p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {}
                <div className="saas-card p-6">
                  <h3 className="text-base font-semibold mb-6">Workspace Overview</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} />
                        <RechartsTooltip cursor={{fill: '#ffffff10'}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px'}} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {}
                <div className="saas-card p-6">
                  <h3 className="text-base font-semibold mb-6">Task Completion Rate</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
