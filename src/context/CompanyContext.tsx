import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompanyContext as CompanyContextType } from '../services/api';

interface CompanyContextValue {
  companyContext: CompanyContextType | null;
  setCompanyContext: (context: CompanyContextType | null) => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export const useCompanyContext = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompanyContext must be used within CompanyContextProvider');
  return ctx;
};

export const CompanyContextProvider = ({ children }: { children: ReactNode }) => {
  const [companyContext, setCompanyContext] = useState<CompanyContextType | null>(null);
  return (
    <CompanyContext.Provider value={{ companyContext, setCompanyContext }}>
      {children}
    </CompanyContext.Provider>
  );
};
