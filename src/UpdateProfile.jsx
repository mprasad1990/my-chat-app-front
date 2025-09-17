import React, { useState, useContext, useEffect } from 'react';
import './UpdateProfile.css';
import { useNavigate } from 'react-router-dom';
import AlertContext from '../context/alert/AlertContext';
import axios from 'axios';

export default function UpdateProfile() {
    const [form, setForm] = useState({
        full_name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const navigate = useNavigate();
    const alertContext = useContext(AlertContext);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const user  = JSON.parse(localStorage.getItem('user') || '{}');
            const res   = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/fetch-profile`, 
                {
                    account_key: user.account_key || ''
                },
                {
                    headers: { Authorization: `Bearer ${token}` }   
                }
            );
            const userProfile = res.data;
            setForm({
                full_name: userProfile.full_name || '',
                username: userProfile.username || '',
                email: userProfile.email || '',
                password: '',
                confirmPassword: '',
            });
        } 
        catch (err) {
            alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to fetch profile. Please try again.' });
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (form.password && form.password !== form.confirmPassword) {
            return;
        }
        // TODO: Replace with your API endpoint
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/update-profile`,
            {
                full_name: form.full_name,
                username: form.username,
                email: form.email,
                password: form.password
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            });

            const user  = JSON.parse(localStorage.getItem('user') || '{}');
            user.full_name = form.full_name;
            user.username = form.username;
            localStorage.setItem('user', JSON.stringify(user));

            alertContext.setAlertMessage({ show:true, type: 'success', message: 'Profile updated successfully!' });
        } 
        catch (err) {
            alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to update profile. Please try again.' });
        }
    };

    const backToChat = () => {
        navigate('/chat');
    }

    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <div className="update-profile-container">
            <form className="update-profile-form" onSubmit={handleSubmit}>
                <h2>Update Profile</h2>
                <label>
                Full Name
                <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                />
                </label>
                <label>
                Username
                <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />
                </label>
                <label>
                Email
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                </label>
                <label>
                Password
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep unchanged"
                />
                </label>
                <label>
                Confirm Password
                <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Leave blank to keep unchanged"
                />
                </label>
                <div className="update-profile-actions">
                <button type="button" className="back-btn" onClick={backToChat}>
                    Back to Chat
                </button>
                <button type="submit" className="update-btn">
                    Update
                </button>
                </div>
            </form>
        </div>
    );
}