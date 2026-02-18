import { useState, useEffect } from 'react';

const useTheme = () => {
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark'; // Default to dark
        }
        return 'dark';
    });

    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkSystem = () => {
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return true;
        };

        const updateTheme = () => {
            let isDarkMode = false;
            if (themeMode === 'system') {
                isDarkMode = checkSystem();
            } else {
                isDarkMode = themeMode === 'dark';
            }
            setIsDark(isDarkMode);

            // Update Tailwind class on html element
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            localStorage.setItem('theme', themeMode);
        };

        updateTheme();

        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => { if (themeMode === 'system') updateTheme(); };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [themeMode]);

    return { themeMode, setThemeMode, isDark };
};

export default useTheme;
