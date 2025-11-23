'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';
import { CartProvider } from '../contexts/CartContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
        {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}


