import { Outlet } from 'react-router-dom';
import { Header } from '../widgets/Header';
import { useEffect } from 'react';
import { useTheme } from '../features/ThemeSwitcher/model/store';

export const App = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};
