import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './SettingsPage.module.scss';
import { exportData, importData } from '../../features/DataManagement/api/dataManager';

export const SettingsPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setSuccessMsg(null);
      await exportData();
      setSuccessMsg('Данные успешно экспортированы.');
    } catch (err) {
      console.error(err);
      setError('Ошибка при экспорте данных.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccessMsg(null);
      await importData(file);
      
      setSuccessMsg('Данные успешно импортированы. Перезагрузка...');
      
      // Даем IndexedDB время на гарантированное завершение всех фоновых процессов перед перезагрузкой
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      setError('Ошибка при импорте данных. Убедитесь, что выбран правильный файл.');
      setIsImporting(false);
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.settingsPage__container}>
      <h1 className={styles.settingsPage__title}>Настройки</h1>
      
      <div className={styles.settingsPage__section}>
        <h2 className={styles.settingsPage__sectionTitle}>Управление данными</h2>
        <p className={styles.settingsPage__sectionDescription}>
          Здесь вы можете экспортировать все свои пользовательские данные (словари, прогресс, статистику и настройки) 
          в файл резервной копии, а также импортировать их на другом устройстве.
        </p>

        {error && (
          <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className={styles.settingsPage__actions}>
          <button 
            className={styles.settingsPage__button}
            onClick={handleExport}
            disabled={isExporting || isImporting}
          >
            <Download size={18} />
            {isExporting ? 'Экспорт...' : 'Экспорт данных'}
          </button>
          
          <button 
            className={`${styles.settingsPage__button} ${styles.settingsPage__button_secondary}`}
            onClick={handleImportClick}
            disabled={isExporting || isImporting}
          >
            <Upload size={18} />
            {isImporting ? 'Импорт...' : 'Импорт данных'}
          </button>
          
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
