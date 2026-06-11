import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';
import { Keyboard, Book, BarChart2, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../features/ThemeSwitcher/model/store';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        Keyboard Vocabulary
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <nav className={styles.nav}>
          <NavLink 
            to="/" 
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
          >
            <Keyboard size={18} />
            Training
          </NavLink>
          <NavLink 
            to="/dictionaries" 
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
          >
            <Book size={18} />
            Dictionaries
          </NavLink>
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
          >
            <BarChart2 size={18} />
            Analytics
          </NavLink>
        </nav>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};
