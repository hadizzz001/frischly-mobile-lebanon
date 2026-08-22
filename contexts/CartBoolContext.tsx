import { createContext, useContext, useState, type ReactNode } from 'react';

import type { CartBoolContextValue } from '@/types/contexts/CartBoolContext.types';

// Create Context
const CartBoolContext = createContext<CartBoolContextValue | undefined>(undefined);

// Provider Component
export const BooleanProvider = ({ children }: { children: ReactNode }) => {
  const [isBooleanValue, setBooleanValue] = useState(false);

  return (
    <CartBoolContext.Provider value={{ isBooleanValue, setBooleanValue }}>
      {children}
    </CartBoolContext.Provider>
  );
};

// Custom Hook for using context
export const useBooleanValue = (): CartBoolContextValue => {
  const context = useContext(CartBoolContext);
  if (!context)
    throw new Error("useBooleanValue must be used within a BooleanProvider");
  return context;
};
