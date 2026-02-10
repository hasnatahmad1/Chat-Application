import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import { Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

export function LoginPage() {
    const navigate = useNavigate();

    // ✅ Form states
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
        setApiError('');
    };

    // ✅ Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 5) {
            newErrors.password = 'Password must be at least 5 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(
                `http://localhost:8000/api/auth/login/`,
                {
                    username: formData.username,
                    password: formData.password,
                }
            );

            const { access, refresh, user } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('Login successful:', user);

            navigate('/home');
        } catch (error) {
            console.error('Login error:', error);

            if (error.response?.status === 401) {
                setApiError('Invalid username or password');
            } else if (error.response?.data?.detail) {
                setApiError(error.response.data.detail);
            } else if (error.message === 'Network Error') {
                setApiError('Cannot connect to server. Is backend running?');
            } else {
                setApiError('Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left side - Brand info */}
            <div className="login-left-section">
                <div className="login-brand-container">
                    <div className="login-brand-logo">
                        <div className="logo-emoji">💬</div>
                        <div>
                            <h1 className="login-brand-title">Chat App</h1>
                            <p className="login-brand-tagline">Real-time Messaging Made Simple</p>
                        </div>
                    </div>

                    <div className="login-features">
                        <div className="login-feature-item">
                            <span className="feature-icon">✨</span>
                            <span>Instant Messaging</span>
                        </div>
                        <div className="login-feature-item">
                            <span className="feature-icon">👥</span>
                            <span>Group Chats</span>
                        </div>
                        <div className="login-feature-item">
                            <span className="feature-icon">🔔</span>
                            <span>Real-time Notifications</span>
                        </div>
                        <div className="login-feature-item">
                            <span className="feature-icon">🔒</span>
                            <span>Secure & Private</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="login-right-section">
                <div className="login-form-container">
                    <div className="login-form-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to your account to continue chatting</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {/* API Error */}
                        {apiError && (
                            <div className="login-alert login-alert-error">
                                <span className="alert-icon">⚠️</span>
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="login-form-group">
                            <label htmlFor="username" className="login-label">
                                Username
                            </label>
                            <div className="login-input-wrapper">
                                <Mail size={18} className="login-input-icon" />
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`login-input ${errors.username ? 'error' : ''}`}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                            {errors.username && (
                                <span className="login-field-error">{errors.username}</span>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="login-form-group">
                            <label htmlFor="password" className="login-label">
                                Password
                            </label>
                            <div className="login-input-wrapper">
                                <Lock size={18} className="login-input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`login-input ${errors.password ? 'error' : ''}`}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="login-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="login-field-error">{errors.password}</span>
                            )}
                        </div>


                        {/* Login Button */}
                        <button
                            type="submit"
                            className="login-button-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="login-divider">or</div>

                        {/* Sign Up Link */}
                        <Link to="/signup" className="login-button-signup">
                            Create New Account
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}