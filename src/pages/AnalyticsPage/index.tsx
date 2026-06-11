import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../shared/api/db';
import styles from './AnalyticsPage.module.css';

export const AnalyticsPage = () => {
  const sessions = useLiveQuery(() => db.trainingSessions.toArray());
  const keyStats = useLiveQuery(() => db.keyStats.toArray());
  const fingerStats = useLiveQuery(() => db.fingerStats.toArray());

  if (!sessions || !keyStats || !fingerStats) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const totalSessions = sessions.length;
  const totalTimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalTimeMinutes = Math.round(totalTimeSeconds / 60);
  
  const avgWpm = totalSessions > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / totalSessions) 
    : 0;
    
  const bestWpm = totalSessions > 0 
    ? Math.max(...sessions.map(s => s.wpm)) 
    : 0;

  const avgAccuracy = totalSessions > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions) 
    : 0;

  const problematicKeys = [...keyStats]
    .filter(k => k.incorrectPresses > 0)
    .sort((a, b) => b.incorrectPresses - a.incorrectPresses)
    .slice(0, 5);

  const problematicFingers = [...fingerStats]
    .filter(f => f.incorrectPresses > 0)
    .sort((a, b) => b.incorrectPresses - a.incorrectPresses)
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Analytics Dashboard</h1>
      
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Total Sessions</span>
          <span className={styles.cardValue}>{totalSessions}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Total Time</span>
          <span className={styles.cardValue}>{totalTimeMinutes} min</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Average WPM</span>
          <span className={styles.cardValue}>{avgWpm}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Best WPM</span>
          <span className={styles.cardValue}>{bestWpm}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Avg Accuracy</span>
          <span className={styles.cardValue}>{avgAccuracy}%</span>
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Most Problematic Keys</h2>
          <div className={styles.list}>
            {problematicKeys.map(k => (
              <div key={k.keyId} className={styles.listItem}>
                <span>Key: <strong style={{ textTransform: 'uppercase' }}>{k.keyId}</strong></span>
                <span className={styles.errorRate}>{k.incorrectPresses} errors</span>
              </div>
            ))}
            {problematicKeys.length === 0 && <span style={{ color: 'var(--color-text-secondary)' }}>No data yet.</span>}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Most Problematic Fingers</h2>
          <div className={styles.list}>
            {problematicFingers.map(f => (
              <div key={f.fingerId} className={styles.listItem}>
                <span>Finger: <strong>{f.fingerId}</strong></span>
                <span className={styles.errorRate}>{f.incorrectPresses} errors</span>
              </div>
            ))}
            {problematicFingers.length === 0 && <span style={{ color: 'var(--color-text-secondary)' }}>No data yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
