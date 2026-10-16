import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <p>AI Career Coach — Hackathon Project &copy; {new Date().getFullYear()}</p>
        <p style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>
          Continuous assessment of GitHub repository evidence against real job requirements
        </p>
      </footer>
    </div>
  );
};

export default Layout;
