import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import readmeContent from '../../../../README.md?raw';
import styles from './WelcomePopup.module.scss';

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(() => {
    return !localStorage.getItem('hasSeenReadme');
  });

  const handleClose = () => {
    localStorage.setItem('hasSeenReadme', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.welcomePopup__overlay}>
      <div className={styles.welcomePopup__popup}>
        <div className={styles.welcomePopup__header}>
          <h2>Welcome</h2>
          <button className={styles.welcomePopup__closeBtn} onClick={handleClose}>×</button>
        </div>
        <div className={styles.welcomePopup__content}>
          <ReactMarkdown>{readmeContent}</ReactMarkdown>
        </div>
        <div className={styles.welcomePopup__footer}>
          <button className={styles.welcomePopup__primaryBtn} onClick={handleClose}>Get Started</button>
        </div>
      </div>
    </div>
  );
};
