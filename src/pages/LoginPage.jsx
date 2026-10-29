import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

 useEffect(() => {
  setUsername('');
  setPassword('');
    const t = setTimeout(() => {
    setUsername('');
    setPassword('');
  }, 100);
  return () => clearTimeout(t);
}, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    setIsBusy(true);
    try {
      await login(username, password);
      // Redirect happens automatically in App.jsx based on auth state
    } catch (err) {
      setError(err.message || 'Incorrect username or password.');
      setPassword('');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="page active" aria-label="Sign in">
      <div className="login-wrap">
        <div className="login-box">
          <h1>Expense Tracker</h1>
          <img className="login-logo" src="/login-logo.png" alt="Expense Tracker logo" />
          <p className="login-sub">Sign in to submit and review expenses</p>

          <form onSubmit={handleSubmit} autoComplete="off">
  <div className="form-group">
    <label htmlFor="username">Username</label>
    <input
      type="text"
      id="username"
      name="username"
      required
      placeholder="e.g. emp1"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      autoComplete="off"          /* was "username" */
      autoCapitalize="off"
      spellCheck={false}
    />
  </div>

  <div className="form-group">
    <label htmlFor="password">Password</label>
    <div className="pw-wrap">
      <input
        type={showPassword ? 'text' : 'password'}
        id="password"
        name="password"
        required
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"   /* was "current-password" — this is the key change */
      />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg className="icon" aria-hidden="true">
                    <use href={showPassword ? '#i-eye-off' : '#i-eye'} />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="form-banner banner-error" role="alert">
                <svg className="icon" aria-hidden="true"><use href="#i-alert" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-block ${isBusy ? 'is-busy' : ''}`}
              disabled={isBusy}
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}