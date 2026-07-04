import { create } from 'zustand';
import { api } from './authStore';

export const useWorkspaceStore = create((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/workspaces');
      set({ workspaces: res.data.data || [], isLoading: false });


            if (res.data.data && res.data.data.length > 0) {
        set(state => {
          if (!state.currentWorkspace) {
            return { currentWorkspace: res.data.data[0] };
          }
          return {};
        });
      }
    } catch (err) {
      set({ isLoading: false });
      console.error('Failed to fetch workspaces', err);
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  createWorkspace: async (name) => {
    try {
      const res = await api.post('/workspaces', { name });
      const newWorkspace = res.data.data;
      set((state) => ({ 
        workspaces: [...state.workspaces, newWorkspace], 
        currentWorkspace: newWorkspace
      }));
      return newWorkspace;
    } catch (err) {
      console.error('Failed to create workspace', err);
      return null;
    }
  }
}));
