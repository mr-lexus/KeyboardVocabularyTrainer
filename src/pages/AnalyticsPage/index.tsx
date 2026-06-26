import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../shared/api/db';
import styles from './AnalyticsPage.module.scss';

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
    <div className={styles.analyticsPage__container}>
      <h1 className={styles.analyticsPage__title}>Analytics Dashboard</h1>
      
      <div className={styles.analyticsPage__grid}>
        <div className={styles.analyticsPage__card}>
          <span className={styles.analyticsPage__cardTitle}>Total Sessions</span>
          <span className={styles.analyticsPage__cardValue}>{totalSessions}</span>
        </div>
        <div className={styles.analyticsPage__card}>
          <span className={styles.analyticsPage__cardTitle}>Total Time</span>
          <span className={styles.analyticsPage__cardValue}>{totalTimeMinutes} min</span>
        </div>
        <div className={styles.analyticsPage__card}>
          <span className={styles.analyticsPage__cardTitle}>Average WPM</span>
          <span className={styles.analyticsPage__cardValue}>{avgWpm}</span>
        </div>
        <div className={styles.analyticsPage__card}>
          <span className={styles.analyticsPage__cardTitle}>Best WPM</span>
          <span className={styles.analyticsPage__cardValue}>{bestWpm}</span>
        </div>
        <div className={styles.analyticsPage__card}>
          <span className={styles.analyticsPage__cardTitle}>Avg Accuracy</span>
          <span className={styles.analyticsPage__cardValue}>{avgAccuracy}%</span>
        </div>
      </div>

      <div className={styles.analyticsPage__grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
        <div className={styles.analyticsPage__section}>
          <h2 className={styles.analyticsPage__sectionTitle}>Most Problematic Keys</h2>
          <div className={styles.analyticsPage__list}>
            {problematicKeys.map(k => (
              <div key={k.keyId} className={styles.analyticsPage__listItem}>
                <span>Key: <strong style={{ textTransform: 'uppercase' }}>{k.keyId}</strong></span>
                <span className={styles.analyticsPage__errorRate}>{k.incorrectPresses} errors</span>
              </div>
            ))}
            {problematicKeys.length === 0 && <span style={{ color: 'var(--color-text-secondary)' }}>No data yet.</span>}
          </div>
        </div>

        <div className={styles.analyticsPage__section}>
          <h2 className={styles.analyticsPage__sectionTitle}>Most Problematic Fingers</h2>
          <div className={styles.analyticsPage__list}>
            {problematicFingers.map(f => (
              <div key={f.fingerId} className={styles.analyticsPage__listItem}>
                <span>Finger: <strong>{f.fingerId}</strong></span>
                <span className={styles.analyticsPage__errorRate}>{f.incorrectPresses} errors</span>
              </div>
            ))}
            {problematicFingers.length === 0 && <span style={{ color: 'var(--color-text-secondary)' }}>No data yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
