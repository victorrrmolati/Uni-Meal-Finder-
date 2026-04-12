import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | 'vendor'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password, name, role)
        : await signIn(email, password);
      if (error) setError(error.message);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Hero image */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80"
          alt="food"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.55)' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, #f8fafc 100%)',
        }} />
        <div style={{ position: 'absolute', top: 24, left: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, background: '#16a34a',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-4.5-7-5-7.5-9.5H1.03c-.5 4.5 7.5 5 7.5 9.5H16.03z"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: -.5 }}>
              Uni Meal Finder
            </span>
          </div>
          <p style={{ color: '#bbf7d0', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            Fresh campus meals, your way
          </p>
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, padding: '0 20px 32px', marginTop: -32 }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,.08)',
          border: '0.5px solid #e2e8f0',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
            {isSignUp ? 'Join to start ordering' : 'Sign in to continue'}
          </p>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>
                  FULL NAME
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                    outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                  outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: isSignUp ? 14 : 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                  outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                }}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 8 }}>
                  I AM A
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['student', 'staff', 'vendor'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 12,
                        border: role === r ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                        background: role === r ? '#f0fdf4' : 'white',
                        color: role === r ? '#166534' : '#64748b',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2', color: '#dc2626', padding: '10px 14px',
                borderRadius: 10, fontSize: 13, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: loading ? '#86efac' : '#16a34a',
                color: 'white', border: 'none', fontSize: 15,
                fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: -.2,
              }}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94a3b8' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              style={{ color: '#16a34a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
