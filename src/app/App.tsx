import { Outlet } from 'react-router-dom';
import { Header } from '../widgets/Header';
import { useEffect } from 'react';
import { useTheme } from '../features/ThemeSwitcher/model/store';
import { WelcomePopup } from '../widgets/WelcomePopup';

export const App = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <WelcomePopup />
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
