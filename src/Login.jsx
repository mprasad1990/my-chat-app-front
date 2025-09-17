import { useState, useContext } from 'react';
import axios from 'axios';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import LoginContext from '../context/login/LoginContext';
import AlertContext from '../context/alert/AlertContext';

export default function Login() {

  const loginContext = useContext(LoginContext);
  const alertContext = useContext(AlertContext);

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, form);
      console.log(res);
      loginContext.updateLoginState(true, res.data.token, res.data.user); // Update login state in context
      navigate('/chat'); // Redirect to chat page after login
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Chat Login</h2>
        <input
          placeholder="Username"
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button onClick={login}>Login</button>
        <p className="signup-link">
          Don’t have an account?{' '}
          <span onClick={() => navigate('/signup')}>Click here to sign up</span>
        </p>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
