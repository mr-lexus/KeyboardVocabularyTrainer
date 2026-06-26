import { createHashRouter } from 'react-router-dom';
import { App } from '../App';
import { TrainingPage } from '../../pages/TrainingPage';
import { DictionariesPage } from '../../pages/DictionariesPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { SettingsPage } from '../../pages/SettingsPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <TrainingPage /> },
      { path: '/dictionaries', element: <DictionariesPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]);

