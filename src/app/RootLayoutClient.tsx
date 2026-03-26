'use client';

import { ReactNode } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { Providers } from '@/components/Providers';
import NavBar from '@/components/NavBar';

import { usePathname } from 'next/navigation';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isCustomLandingPage = pathname === '/' || pathname === '/register' || pathname === '/signin';

    return (
        <Providers>
            {!isCustomLandingPage && <NavBar />}
            <ThemeToggle />
            {children}
        </Providers>
    );
}
