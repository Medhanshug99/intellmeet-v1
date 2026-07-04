import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Layout, UserCircle2, Clock, CheckCircle2, Circle, Calendar, Video, LayoutDashboard, CreditCard, BarChart3 } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingStates';
import { ThemeToggle } from '@/components/ThemeToggle';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Meetings', icon: Video, path: '/dashboard' },
  { id: 'board', label: 'Project Board', icon: LayoutDashboard, path: '/board' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'pricing', label: 'Upgrade to Pro', icon: CreditCard, path: '/pricing' },
];

const COLUMNS = [
  { 
    id: 'Todo', 
    title: 'To Do', 
    icon: Circle,
    color: 'text-muted-foreground'
  },
  { 
    id: 'InProgress', 
    title: 'In Progress', 
    icon: Clock,
    color: 'text-primary'
  },
  { 
    id: 'Done', 
    title: 'Completed', 
    icon: CheckCircle2,
    color: 'text-secondary-foreground'
  }
];

export default function ProjectBoard() {
  const { currentWorkspace } = useWorkspaceStore();
  const { tasks, fetchTasks, updateTaskStatus, isLoading: isTaskLoading } = useTaskStore();
  const navigate = useNavigate();
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchTasks(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchTasks]);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('taskId', id);
    setTimeout(() => setDraggedTaskId(id), 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    setDraggedTaskId(null);
    setDragOverCol(null);
    
    try {
      await updateTaskStatus(id, newStatus);
    } catch (err) {
      setErrorMsg('Network error: Task reverted to previous column.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-center p-6">
        <div className="max-w-md">
          <div className="mx-auto h-16 w-16 bg-muted rounded-lg flex items-center justify-center mb-6 border border-border">
            <Layout className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No Workspace</h2>
          <p className="text-sm text-muted-foreground mb-8">Select a workspace from your overview to view tasks.</p>
          <button onClick={() => navigate('/dashboard')} className="premium-button mx-auto">
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {}
      <header className="h-[72px] flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3 border-l border-border pl-4">
            <Layout className="h-5 w-5 text-primary" />
            <h1 className="text-base font-medium tracking-tight text-foreground">{currentWorkspace.name} / Board</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center px-4 py-2 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground">
            {isTaskLoading && tasks.length === 0 ? <InlineSpinner size="sm" className="mr-2" /> : null}
            {tasks.length} Tasks
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-sm font-medium px-4 py-2 flex items-center justify-center">
          {errorMsg}
        </div>
      )}

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8 z-10 bg-muted/10">
        <div className="flex items-start gap-6 h-full min-w-max pb-6 relative z-10">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const isDragOver = dragOverCol === col.id;
            const Icon = col.icon;
            
            return (
              <div 
                key={col.id}
                className={`flex flex-col w-[340px] max-h-full rounded-lg border transition-all duration-200 bg-card ${
                  isDragOver ? `border-primary shadow-sm bg-accent/50` : `border-border`
                }`}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
              >
                <div className={`p-4 flex items-center justify-between shrink-0 border-b border-border`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">{col.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      {isTaskLoading ? <InlineSpinner size="sm" /> : 'Drop tasks here'}
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div 
                        key={task.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-card border border-border rounded-md p-4 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-all ${
                          draggedTaskId === task.id ? 'opacity-50 !border-primary' : ''
                        }`}
                      >
                        <p className="text-sm font-medium leading-relaxed text-foreground break-words mb-4">
                          {task.content}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
                            <UserCircle2 className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">{task.owner?.name || 'Unassigned'}</span>
                          </div>
                          
                          {task.createdAt && (
                            <div className="flex items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
