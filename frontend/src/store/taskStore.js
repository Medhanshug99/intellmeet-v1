import { create } from 'zustand';
import { api } from './authStore';

export const useTaskStore = create((set) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (workspaceId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/tasks?workspace=${workspaceId}`);
      set({ tasks: res.data.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error('Failed to fetch tasks', err);
    }
  },

  updateTaskStatus: async (taskId, status) => {
    
    let previousTasks;
    try {
      set(state => {
        previousTasks = state.tasks;
        return { tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t) };
      });

      await api.patch(`/tasks/${taskId}`, { status });
    } catch (err) {
      
      if (previousTasks) set({ tasks: previousTasks });
      console.error('Failed to update task status', err);
      throw err;
    }
  }
}));
