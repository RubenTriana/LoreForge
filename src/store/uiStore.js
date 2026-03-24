import { create } from 'zustand';

export const useUiStore = create((set) => ({
  activeUniverseId: null,
  currentView: 'Escritorio',
  isSettingsModalOpen: false,

  setActiveUniverseId: (id) => set({ activeUniverseId: id }),
  setView: (view) => set({ currentView: view }),
  setSettingsModalOpen: (isOpen) => set({ isSettingsModalOpen: isOpen }),
  toggleSettingsModal: () => set((state) => ({ isSettingsModalOpen: !state.isSettingsModalOpen })),
}));
