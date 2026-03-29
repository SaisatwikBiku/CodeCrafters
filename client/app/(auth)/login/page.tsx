'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH } from '@/lib/auth';
import { SERVER_URL } from '@/app/CONSTANT';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginUsername || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed.');
        return;
      }
      AUTH.setAuth(data.token, data.username);
      router.push('/lobby');
    } catch {
      setLoginError('Could not connect to server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regUsername || !regPassword) {
      setRegError('Please fill in all fields.');
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Registration failed.');
        return;
      }
      AUTH.setAuth(data.token, data.username);
      router.push('/lobby');
    } catch {
      setRegError('Could not connect to server.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="landing-split">
      {/* LEFT: Hero image side */}
      <div className="hero-side" />

      {/* RIGHT: Dark purple auth panel */}
      <div className="auth-side">
        {/* Branding + feature list */}
        <div className="hero-inner" style={{ width: '100%', maxWidth: 380 }}>
          <h1 className="hero-title">
            Code<span>Crafters!</span>
          </h1>
          <p className="hero-sub">Collaborate. Code. Build Your Campus together.</p>
          <div className="hero-blocks">
            <div className="hero-block">🧱 Play as Architect or Builder</div>
            <div className="hero-block">🐍 Learn Python step by step</div>
            <div className="hero-block">🏆 5 stages · 500 points</div>
            <div className="hero-block">💬 Chat with your partner</div>
          </div>
          <div className="hero-roles" style={{ marginBottom: '1.5rem' }}>
            <div className="role-chip yellow">🧱 Architect</div>
            <div className="role-chip purple">🔨 Builder</div>
          </div>
        </div>

        {/* Auth box */}
        <div className="auth-box" style={{ width: '100%', maxWidth: 380 }}>
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setLoginError(''); }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setRegError(''); }}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <div>
              <p className="form-welcome">Ready to play? 🎮</p>
              <p className="form-sub">Login to jump back in!</p>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="👤  Username"
                  maxLength={24}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="🔒  Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loginLoading}
                onClick={handleLogin}
              >
                {loginLoading ? 'Logging in...' : '▶ PLAY NOW!'}
              </button>
              {loginError && <div className="auth-error">{loginError}</div>}
            </div>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <div>
              <p className="form-welcome">Join the fun! 🎉</p>
              <p className="form-sub">Create your free account!</p>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="👤  Username"
                  maxLength={24}
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="🔒  Password (min 6 chars)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={regLoading}
                onClick={handleRegister}
              >
                {regLoading ? 'Registering...' : "🚀 Let's Go!"}
              </button>
              {regError && <div className="auth-error">{regError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
