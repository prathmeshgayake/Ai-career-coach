import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, GitBranch, RefreshCw, ShieldCheck, Code2, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [systemOnline, setSystemOnline] = useState<null | boolean>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);

  useEffect(() => {
    apiClient.getHealth()
      .then((res: any) => {
        const raw = res.data;
        setSystemOnline(raw?.status === 'ok');
        setMonitoringActive(Boolean(raw?.monitoring?.isRunning));
      })
      .catch(() => setSystemOnline(false));
  }, []);

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#0f172a', fontFamily: 'inherit' }}>
      {/* System Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '8px 24px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.8rem',
        color: '#64748b',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: systemOnline === null ? '#94a3b8' : systemOnline ? '#22c55e' : '#f59e0b',
            display: 'inline-block',
          }} />
          {systemOnline === null ? 'Checking server...' : systemOnline ? 'Server online' : 'Server offline'}
        </span>
        {monitoringActive && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} />
            Background monitor active
          </span>
        )}
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            color: '#2563eb',
            fontWeight: 600,
            marginBottom: '28px',
            letterSpacing: '0.02em',
          }}>
            <Code2 size={13} />
            For students & junior developers · W-PS-2
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
          }}>
            Know what your GitHub<br />portfolio proves.
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#475569',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Compare your actual project code with real job requirements,
            discover evidence-backed skill gaps, and track how your portfolio
            improves when you push new commits.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 32px',
                    background: '#4f46e5',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textDecoration: 'none',
                  }}
                >
                  Go to Your Dashboard <ArrowRight size={18} />
                </Link>
                <Link
                  to="/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    background: '#f1f5f9',
                    color: '#334155',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textDecoration: 'none',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  Analyze New Repository
                </Link>
              </>
            ) : (
              <Link
                to="/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                Analyze a Job <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
            textAlign: 'center',
          }}>How it works</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '0.95rem' }}>
            Three steps to evidence-backed career insights.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              {
                num: '1',
                title: 'Select a real job',
                desc: 'Paste a job posting URL or the description text. We extract actual skill requirements — no hardcoded lists.',
              },
              {
                num: '2',
                title: 'Connect a GitHub repository',
                desc: 'Enter any public repository. We fetch the actual source files at the latest commit SHA.',
              },
              {
                num: '3',
                title: 'Get evidence-backed results',
                desc: 'Each assessed skill is backed by real code excerpts. Push new commits and the server reassesses automatically.',
              },
            ].map((step) => (
              <div key={step.num} style={{
                padding: '28px 24px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fafafa',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  marginBottom: '14px',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '1rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Illustrative Preview */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>What a result looks like</h2>
            <span style={{
              padding: '3px 10px',
              background: '#fef9c3',
              border: '1px solid #fde047',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              color: '#854d0e',
              fontWeight: 600,
            }}>Illustrative example — sample data</span>
          </div>

          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#ffffff',
          }}>
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitBranch size={16} color='#2563eb' />
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>RESTful API development with Node.js</span>
              </div>
              <span style={{
                padding: '3px 10px',
                background: '#dcfce7',
                color: '#16a34a',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>Demonstrated</span>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '12px' }}>
                Found implementation of REST endpoints using Express.js with proper route handlers and middleware.
              </p>
              <div style={{
                background: '#0f172a',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}>
                <div style={{ color: '#94a3b8', marginBottom: '6px', fontSize: '0.72rem' }}>src/routes/api.js</div>
                <span style={{ color: '#7dd3fc' }}>app</span><span style={{ color: '#e2e8f0' }}>.</span><span style={{ color: '#86efac' }}>get</span><span style={{ color: '#e2e8f0' }}>('/users', authenticate, async (req, res) =&gt; {'{'}</span><br />
                <span style={{ color: '#e2e8f0' }}>{'  '}const users = await User.findAll();</span><br />
                <span style={{ color: '#e2e8f0' }}>{'  '}res.json({'{'} data: users {'}'});</span><br />
                <span style={{ color: '#e2e8f0' }}>{'}'});</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
                This is illustrative sample output. Real assessments use your actual repository code.
              </p>
            </div>
          </div>
        </div>

        {/* Honesty section */}
        <div style={{
          marginBottom: '80px',
          padding: '28px 32px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <ShieldCheck size={22} color='#2563eb' style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Privacy &amp; Honest limitations</h3>
              <ul style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={15} color='#22c55e' style={{ flexShrink: 0, marginTop: '3px' }} /> Only public repositories are supported. No private repo access required.</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={15} color='#22c55e' style={{ flexShrink: 0, marginTop: '3px' }} /> We never execute your code — only read source files.</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={15} color='#22c55e' style={{ flexShrink: 0, marginTop: '3px' }} /> Evidence is cited from real files at a specific commit SHA.</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={15} color='#22c55e' style={{ flexShrink: 0, marginTop: '3px' }} /> &ldquo;Not demonstrated in this scope&rdquo; means we did not find evidence in the inspected files — not that you lack the skill.</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={15} color='#22c55e' style={{ flexShrink: 0, marginTop: '3px' }} /> Continuous monitoring runs on the server, independently of your browser.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
            Ready to see what your code proves?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '28px' }}>Takes under 2 minutes. No sign-up required.</p>
          <Link
            to="/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              background: '#1d4ed8',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Analyze a Job <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
