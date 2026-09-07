import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UploadedDataset, ChatMessage, FinancialDataPoint, AnalysisResult } from '@/types';

interface AppState {
  user: any | null;
  datasets: UploadedDataset[];
  currentDataset: UploadedDataset | null;
  analysis: AnalysisResult | null;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  setUser: (user: any) => void;
  setDatasets: (datasets: UploadedDataset[]) => void;
  addDataset: (dataset: UploadedDataset) => void;
  removeDataset: (id: string) => void;
  setCurrentDataset: (dataset: UploadedDataset | null) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      datasets: [],
      currentDataset: null,
      analysis: null,
      chatMessages: [],
      isLoading: false,
      setUser: (user) => set({ user }),
      setDatasets: (datasets) => set({ datasets }),
      addDataset: (dataset) => set((state) => ({ datasets: [dataset, ...state.datasets] })),
      removeDataset: (id) => set((state) => ({
        datasets: state.datasets.filter((d) => d.id !== id),
        currentDataset: state.currentDataset?.id === id ? null : state.currentDataset,
      })),
      setCurrentDataset: (dataset) => set({ currentDataset: dataset }),
      setAnalysis: (analysis) => set({ analysis }),
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
      setChatMessages: (messages) => set({ chatMessages: messages }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearAll: () => set({
        datasets: [],
        currentDataset: null,
        analysis: null,
        chatMessages: [],
      }),
    }),
    {
      name: 'x-financial-storage',
      partialize: (state) => ({
        datasets: state.datasets,
        currentDataset: state.currentDataset,
        chatMessages: state.chatMessages,
      }),
    }
  )
);