import { useState } from 'react';

export default function Auth({ onAuth }) {
  const [screen, setScreen]     = useState('login');
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');
  const actualScreen = token ? 'reset' : screen;

  const go = (s) => { setScreen(s); setError(''); setSuccess(''); };

  const api = async (endpoint, body) => {
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };

  const handle = (fn) => async () => {
    setLoading(true); setError(''); setSuccess('');
    try { await fn(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleLogin = handle(async () => {
    if (!email || !password) throw new Error('Fill in all fields');
    const data = await api('/auth/login', { email, password });
    onAuth({ username: data.username });
  });

  const handleRegister = handle(async () => {
    if (!username || !email || !password) throw new Error('Fill in all fields');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    await api('/auth/register', { username, email, password });
    setSuccess('Account created! Please login.');
    go('login');
  });

  const handleForgot = handle(async () => {
    if (!email) throw new Error('Enter your email');
    await api('/auth/forgot-password', { email });
    setSuccess('Reset link sent! Check your inbox.');
  });

  const handleReset = handle(async () => {
    if (!newPass || !confirm) throw new Error('Fill in all fields');
    if (newPass !== confirm) throw new Error('Passwords do not match');
    if (newPass.length < 6) throw new Error('Minimum 6 characters');
    await api('/auth/reset-password', { token, password: newPass });
    setSuccess('Password reset! Redirecting to login...');
    window.history.replaceState({}, '', '/');
    setTimeout(() => go('login'), 2000);
  });

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <span style={s.brandIcon}>💬</span>
          <h1 style={s.brandName}>ChatApp</h1>
          <p style={s.brandTag}>Real-time conversations,<br />built for everyone.</p>
        </div>
        <div style={s.features}>
          {['🔒 Secure accounts', '💾 Message history', '🏠 Multiple rooms', '⚡ Real-time'].map(f => (
            <div key={f} style={s.feature}>{f}</div>
          ))}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>

          {/* LOGIN */}
          {actualScreen === 'login' && (
            <>
              <h2 style={s.cardTitle}>Welcome back</h2>
              <p style={s.cardSub}>Sign in to your account</p>
              <div style={s.tabs}>
                <button style={{ ...s.tab, ...s.tabActive }}>Login</button>
                <button style={s.tab} onClick={() => go('register')}>Register</button>
              </div>
              <Field label="Email" type="email" value={email} onChange={setEmail} onEnter={handleLogin} placeholder="you@gmail.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} onEnter={handleLogin} placeholder="••••••••" />
              <div style={s.forgotRow}>
                <span style={s.link} onClick={() => go('forgot')}>Forgot password?</span>
              </div>
              <Feedback error={error} success={success} />
              <Btn onClick={handleLogin} loading={loading} label="Sign In" />
              <p style={s.switchText}>
                No account?{' '}
                <span style={s.link} onClick={() => go('register')}>Create one</span>
              </p>
            </>
          )}

          {/* REGISTER */}
          {actualScreen === 'register' && (
            <>
              <h2 style={s.cardTitle}>Create account</h2>
              <p style={s.cardSub}>Join the conversation</p>
              <div style={s.tabs}>
                <button style={s.tab} onClick={() => go('login')}>Login</button>
                <button style={{ ...s.tab, ...s.tabActive }}>Register</button>
              </div>
              <Field label="Username" type="text" value={username} onChange={setUsername} placeholder="cooluser123" />
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@gmail.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} onEnter={handleRegister} placeholder="Min 6 characters" />
              <Feedback error={error} success={success} />
              <Btn onClick={handleRegister} loading={loading} label="Create Account" />
              <p style={s.switchText}>
                Have an account?{' '}
                <span style={s.link} onClick={() => go('login')}>Sign in</span>
              </p>
            </>
          )}

          {/* FORGOT */}
          {actualScreen === 'forgot' && (
            <>
              <h2 style={s.cardTitle}>Reset password</h2>
              <p style={s.cardSub}>We'll send a reset link to your email</p>
              <Field label="Email" type="email" value={email} onChange={setEmail} onEnter={handleForgot} placeholder="you@gmail.com" />
              <Feedback error={error} success={success} />
              <Btn onClick={handleForgot} loading={loading} label="Send Reset Link" />
              <button style={s.backBtn} onClick={() => go('login')}>← Back to Login</button>
            </>
          )}

          {/* RESET */}
          {actualScreen === 'reset' && (
            <>
              <h2 style={s.cardTitle}>New password</h2>
              <p style={s.cardSub}>Choose a strong password</p>
              <Field label="New Password" type="password" value={newPass} onChange={setNewPass} placeholder="Min 6 characters" />
              <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} onEnter={handleReset} placeholder="Repeat password" />
              <Feedback error={error} success={success} />
              <Btn onClick={handleReset} loading={loading} label="Reset Password" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, onEnter, placeholder }) {
  return (
    <div style={{ marginBottom: '12px', width: '100%' }}>
      <label style={s.label}>{label}</label>
      <input
        style={s.input}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
    </div>
  );
}

function Feedback({ error, success }) {
  if (!error && !success) return null;
  return <p style={{ ...s.feedback, color: error ? '#f87171' : '#4ade80' }}>{error || success}</p>;
}

function Btn({ onClick, loading, label }) {
  return (
    <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={onClick} disabled={loading}>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

const s = {
  page: {
    display: 'flex', minHeight: '100vh',
    background: '#0d1117', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  left: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '60px',
    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    borderRight: '1px solid #21262d',
  },
  brand: { marginBottom: '48px' },
  brandIcon: { fontSize: '48px' },
  brandName: { color: '#fff', fontSize: '36px', fontWeight: '700', margin: '12px 0 8px' },
  brandTag: { color: '#8892b0', fontSize: '16px', lineHeight: '1.6', margin: 0 },
  features: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feature: {
    color: '#cdd6f4', fontSize: '14px', padding: '10px 16px',
    background: '#161b22', borderRadius: '8px',
    border: '1px solid #21262d', width: 'fit-content',
  },
  right: {
    width: '480px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px',
  },
  card: {
    width: '100%', background: '#161b22',
    borderRadius: '16px', padding: '36px',
    border: '1px solid #21262d',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  cardSub: { color: '#8892b0', fontSize: '14px', margin: '0 0 20px' },
  tabs: {
    display: 'flex', background: '#0d1117', borderRadius: '8px',
    padding: '4px', width: '100%', marginBottom: '20px',
  },
  tab: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
    background: 'transparent', color: '#8892b0',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  tabActive: { background: '#e94560', color: '#fff' },
  label: { display: 'block', color: '#8892b0', fontSize: '12px', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' },
  input: {
    width: '100%', padding: '11px 14px', fontSize: '14px',
    background: '#0d1117', border: '1px solid #30363d',
    borderRadius: '8px', color: '#fff', outline: 'none',
    boxSizing: 'border-box', transition: 'border 0.2s',
  },
  forgotRow: { display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '4px' },
  link: { color: '#e94560', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  feedback: { fontSize: '13px', textAlign: 'center', margin: '4px 0', width: '100%' },
  btn: {
    width: '100%', padding: '12px', fontSize: '15px', fontWeight: '700',
    background: '#e94560', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', marginTop: '8px',
  },
  backBtn: {
    width: '100%', padding: '10px', fontSize: '13px',
    background: 'transparent', color: '#8892b0',
    border: '1px solid #30363d', borderRadius: '8px',
    cursor: 'pointer', marginTop: '8px',
  },
  switchText: { color: '#8892b0', fontSize: '13px', marginTop: '16px' },
};