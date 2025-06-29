import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ToastContainer from '../dashboard/ToastContainer';
import { useToast } from '../../hooks/useToast';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Layout; 