import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalConfigState {
  allowAllVendedoresAllCourses: boolean;
  setAllowAllVendedoresAllCourses: (allow: boolean) => void;
}

export const useGlobalConfigStore = create<GlobalConfigState>()(
  persist(
    (set) => ({
      allowAllVendedoresAllCourses: false,
      setAllowAllVendedoresAllCourses: (allow: boolean) => 
        set({ allowAllVendedoresAllCourses: allow }),
    }),
    {
      name: 'global-config-storage',
    }
  )
);