import { create } from 'zustand';
import { api } from './authStore';

export const useMeetingStore = create((set) => ({
  meetings: [],
  currentMeeting: null,
  isLoading: false,

  fetchMeetings: async (workspaceId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/meetings?workspaceId=${workspaceId}`);
      set({ meetings: res.data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  },

  fetchMeetingById: async (meetingId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/meetings/${meetingId}`);
      set({ currentMeeting: res.data.data, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
      return null;
    }
  },

  createMeeting: async (meetingData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/meetings', meetingData);
      set((state) => ({ meetings: [...state.meetings, res.data.data], isLoading: false }));
      return res.data.data;
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
      return null;
    }
  },

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),

  processMeetingAI: async (meetingId, transcript) => {
    try {
      set({ isLoading: true });
      const res = await api.post(`/meetings/${meetingId}/process-ai`, { transcript });
      set({ currentMeeting: res.data.data.meeting, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ isLoading: false });
      console.error('Failed to process AI', err);
      return null;
    }
  }
}));
