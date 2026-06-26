import { NavLink } from 'react-router-dom';
import styles from './Header.module.scss';
import { Keyboard, Book, BarChart2, Settings, Sun, Moon, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../features/ThemeSwitcher/model/store';
import { useState } from 'react';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header__container}>
      <div className={styles.header__logo}>
        Keyboard Vocabulary
      </div>
      
      <div className={styles.header__controls}>
        <nav className={clsx(styles.header__nav, isMenuOpen && styles.header__nav_open)}>
          <NavLink 
            to="/" 
            onClick={closeMenu}
            className={({ isActive }) => clsx(styles.header__link, isActive && styles.header__link_active)}
          >
            <Keyboard size={18} />
            Training
          </NavLink>
          <NavLink 
            to="/dictionaries" 
            onClick={closeMenu}
            className={({ isActive }) => clsx(styles.header__link, isActive && styles.header__link_active)}
          >
            <Book size={18} />
            Dictionaries
          </NavLink>
          <NavLink 
            to="/analytics" 
            onClick={closeMenu}
            className={({ isActive }) => clsx(styles.header__link, isActive && styles.header__link_active)}
          >
            <BarChart2 size={18} />
            Analytics
          </NavLink>
          <NavLink 
            to="/settings" 
            onClick={closeMenu}
            className={({ isActive }) => clsx(styles.header__link, isActive && styles.header__link_active)}
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </nav>
        
        <div className={styles.header__actions}>
          <button className={styles.header__themeToggle} onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            className={styles.header__burger} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};
