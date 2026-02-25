'use client';

import { ReactNode } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { Providers } from '@/components/Providers';
import NavBar from '@/components/NavBar';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
    return (
        <Providers>
            <NavBar />
            <ThemeToggle />
            {children}
        </Providers>
    );
}
