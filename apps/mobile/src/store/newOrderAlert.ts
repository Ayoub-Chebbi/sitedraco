import { create } from "zustand";

export interface OrderAlert {
  orderNumber: string;
  clientLabel: string;
  items: string;
  total: number;
}

interface NewOrderAlertState {
  alert: OrderAlert | null;
  show: (alert: OrderAlert) => void;
  dismiss: () => void;
}

export const useNewOrderAlertStore = create<NewOrderAlertState>((set) => ({
  alert: null,
  show: (alert) => set({ alert }),
  dismiss: () => set({ alert: null }),
}));
