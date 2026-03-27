import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [mode,     setMode]     = useState('password'); // 'password' | 'magic'
  const [loading,  setLoading]  = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email);
        setMagicSent(true);
        toast.success('Check your email for a sign-in link!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>DocVault</div>
        <div style={styles.tagline}>Secure fractional finance document portal</div>

        {magicSent ? (
          <div style={styles.magicSent}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={styles.magicTitle}>Check your inbox</div>
            <div style={styles.magicSub}>
              We sent a sign-in link to <strong>{email}</strong>.<br />
              Click it to log in — no password needed.
            </div>
            <button style={styles.btnGhost} onClick={() => setMagicSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div style={styles.modeRow}>
              <button
                style={mode === 'password' ? styles.modeOn : styles.modeOff}
                onClick={() => setMode('password')}
              >Password</button>
              <button
                style={mode === 'magic' ? styles.modeOn : styles.modeOff}
                onClick={() => setMode('magic')}
              >Magic Link</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Email address</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />

              {mode === 'password' && (
                <>
                  <label style={styles.label}>Password</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </>
              )}

              <button style={styles.btnPrimary} type="submit" disabled={loading}>
                {loading ? 'Signing in…' :
                 mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
              </button>
            </form>

            <div style={styles.divider}><span>or</span></div>

            <button style={styles.ssoBtn} onClick={signInWithGoogle}>
              <img src="https://www.google.com/favicon.ico" alt="" width={16} height={16} />
              Continue with Google
            </button>

            <div style={styles.helpText}>
              Need portal access?{' '}
              <a href="mailto:your@cfo-firm.com" style={{ color: '#0E7C6E' }}>
                Contact your CFO team
              </a>
            </div>
          </>
        )}

        {/* Security badges */}
        <div style={styles.badges}>
          <span style={styles.badge}>🔒 256-bit encryption</span>
          <span style={styles.badge}>✓ MFA ready</span>
          <span style={styles.badge}>SOC 2 aligned</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#F2F4F7',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  },
  card: {
    background: '#fff', borderRadius: 14, border: '1px solid #E4E8EE',
    padding: '32px 28px', width: '100%', maxWidth: 380
  },
  brand:   { fontSize: 22, fontWeight: 700, color: '#C9A84C', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 12, color: '#4A6070', textAlign: 'center', marginBottom: 24 },
  modeRow: { display: 'flex', background: '#F2F4F7', borderRadius: 8, padding: 3, marginBottom: 18, gap: 3 },
  modeOn:  { flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, background: '#fff',
             color: '#0D1B2A', fontWeight: 700, fontSize: 13, cursor: 'pointer',
             boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  modeOff: { flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, background: 'transparent',
             color: '#4A6070', fontWeight: 500, fontSize: 13, cursor: 'pointer' },
  label:   { display: 'block', fontSize: 11, fontWeight: 600, color: '#2A3F55', marginBottom: 5 },
  input:   { width: '100%', border: '1px solid #E4E8EE', borderRadius: 8, padding: '9px 12px',
             fontSize: 14, color: '#0D1B2A', outline: 'none', marginBottom: 14,
             fontFamily: 'inherit', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', background: '#0D1B2A', color: '#fff', border: 'none',
               borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700,
               cursor: 'pointer', marginTop: 2 },
  divider: { textAlign: 'center', fontSize: 12, color: '#4A6070', margin: '16px 0',
             position: 'relative', borderTop: '1px solid #E4E8EE', paddingTop: 10 },
  ssoBtn:  { width: '100%', background: '#F2F4F7', border: '1px solid #E4E8EE',
             borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600,
             cursor: 'pointer', display: 'flex', alignItems: 'center',
             justifyContent: 'center', gap: 8, marginBottom: 8 },
  helpText:{ textAlign: 'center', fontSize: 12, color: '#4A6070', marginTop: 14 },
  badges:  { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20, justifyContent: 'center' },
  badge:   { fontSize: 10, padding: '3px 9px', borderRadius: 20,
             background: '#EAF3DE', color: '#27500A', fontWeight: 600 },
  magicSent:  { textAlign: 'center', padding: '10px 0' },
  magicTitle: { fontSize: 16, fontWeight: 700, color: '#0D1B2A', marginBottom: 8 },
  magicSub:   { fontSize: 13, color: '#4A6070', lineHeight: 1.6, marginBottom: 20 },
  btnGhost:   { background: 'transparent', border: '1px solid #E4E8EE', borderRadius: 8,
               padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#0D1B2A' }
};
