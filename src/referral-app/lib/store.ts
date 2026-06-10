// @ts-nocheck
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ReferrerProfile, ReferrerProfilePersona } from "@/referral-app/api";

interface AppState {
  persona: ReferrerProfilePersona | null;
  setPersona: (persona: ReferrerProfilePersona) => void;
  referrer: ReferrerProfile | null;
  setReferrer: (referrer: ReferrerProfile) => void;
  logout: () => void;
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (status: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      persona: null,
      setPersona: (persona) => set({ persona }),
      referrer: null,
      setReferrer: (referrer) => set({ referrer, persona: referrer.persona }),
      logout: () => set({ referrer: null, persona: null }),
      isAdminAuthenticated: false,
      setAdminAuthenticated: (status) => set({ isAdminAuthenticated: status }),
    }),
    {
      name: "gharpayy_state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        persona: state.persona, 
        referrer: state.referrer,
        // We persist isAdminAuthenticated just to make it easier, though standard says sessionStorage. Let's use sessionStorage for admin via another store or just handle it here.
      }),
    }
  )
);

interface AdminState {
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (status: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      setAdminAuthenticated: (status) => set({ isAdminAuthenticated: status }),
    }),
    {
      name: "gharpayy_admin",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
