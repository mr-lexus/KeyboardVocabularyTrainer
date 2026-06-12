import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-expect-error - Vite raw import
import readmeContent from '../../../../README.md?raw';
import styles from './WelcomePopup.module.css';

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenReadme');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenReadme', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>Welcome</h2>
          <button className={styles.closeBtn} onClick={handleClose}>×</button>
        </div>
        <div className={styles.content}>
          <ReactMarkdown>{readmeContent}</ReactMarkdown>
        </div>
        <div className={styles.footer}>
          <button className={styles.primaryBtn} onClick={handleClose}>Get Started</button>
        </div>
      </div>
    </div>
  );
};
