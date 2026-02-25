'use client';

import { ReactNode } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
    return (
        <>
            <ThemeToggle />
            {children}
        </>
    );
}
