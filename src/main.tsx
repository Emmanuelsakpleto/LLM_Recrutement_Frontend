import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CompanyContextProvider } from './context/CompanyContext';

createRoot(document.getElementById("root")!).render(
  <CompanyContextProvider>
    <App />
  </CompanyContextProvider>
);
