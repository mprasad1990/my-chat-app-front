import { useState, useContext } from 'react';
import axios from 'axios';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import AlertContext from '../context/alert/AlertContext';

export default function Signup({ setUser, setToken }) {

  const alertContext = useContext(AlertContext);

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();

  const signup = async () => {

    if (form.password !== form.confirmPassword) {
      alertContext.setAlertMessage({show:true, type: "error", message: "Passwords do not match!"});
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/signup`, form);
      if (res.data.user) {
        alertContext.setAlertMessage({show:true, type: "success", message: "Signup successful"});
        setForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } 
      else {
        alertContext.setAlertMessage({show:true, type: "error", message: "Signup failed!"});
      }
    } 
    catch (err) {
      alertContext.setAlertMessage({show:true, type: "error", message: "Signup failed. Try a different username!"});
    }
  };

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Create Account</h2>

        <input
          placeholder="Full Name"
          value={form.fullName}
          onChange={e => update('fullName', e.target.value)}
        />
        <input
          placeholder="Username"
          value={form.username}
          onChange={e => update('username', e.target.value)}
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => update('email', e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => update('password', e.target.value)}
        />
        <input
          placeholder="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={e => update('confirmPassword', e.target.value)}
        />
        {/*error && <p className="error-text">{error}</p>*/}

        <button onClick={signup}>Sign Up</button>
        <p className="signup-link">
          Already have an account?{' '}
          <span onClick={() => navigate('/')}>Click here to login</span>
        </p>
      </div>
    </div>
  );
}
