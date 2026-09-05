import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, AuthProvider } from '@/context';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>,
);
