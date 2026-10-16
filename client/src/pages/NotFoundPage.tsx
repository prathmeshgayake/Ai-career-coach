import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 20px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <Compass size={36} />
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: '8px' }}>
        404
      </h1>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-gray-800)', marginBottom: '12px' }}>
        Page Not Found
      </h2>

      <p style={{ color: 'var(--color-gray-600)', maxWidth: '440px', marginBottom: '28px' }}>
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link to="/" className="btn btn-primary btn-lg">
        <Home size={18} /> Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
