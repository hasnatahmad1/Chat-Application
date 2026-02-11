import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import { Mail, Lock, User, Upload, Loader, Eye, EyeOff } from 'lucide-react';
import './SignUpPage.css';

export function SignUpPage() {
    const navigate = useNavigate();

    // ✅ Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
        profile_image: null,
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

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

    // ✅ Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                setErrors((prev) => ({
                    ...prev,
                    profile_image: 'File size must be less than 3MB',
                }));
                return;
            }

            if (!file.type.startsWith('image/')) {
                setErrors((prev) => ({
                    ...prev,
                    profile_image: 'Please upload an image file',
                }));
                return;
            }

            setFormData((prev) => ({
                ...prev,
                profile_image: file,
            }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            setErrors((prev) => ({
                ...prev,
                profile_image: '',
            }));
        }
    };

    // ✅ Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.password2) {
            newErrors.password2 = 'Please confirm your password';
        } else if (formData.password !== formData.password2) {
            newErrors.password2 = 'Passwords do not match';
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
            const submitData = new FormData();
            submitData.append('username', formData.username);
            submitData.append('email', formData.email);
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('password', formData.password);
            submitData.append('password2', formData.password2);

            if (formData.profile_image) {
                submitData.append('profile_image', formData.profile_image);
            }

            const response = await axios.post(
                `http://localhost:8000/api/auth/signup/`,
                submitData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const { access, refresh, user } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('Signup successful:', user);

            navigate('/home');
        } catch (error) {
            console.error('Signup error:', error);

            if (error.response?.data) {
                const data = error.response.data;

                if (typeof data === 'object') {
                    const fieldErrors = {};
                    Object.keys(data).forEach((key) => {
                        fieldErrors[key] = Array.isArray(data[key])
                            ? data[key][0]
                            : data[key];
                    });
                    setErrors(fieldErrors);
                }
            } else if (error.message === 'Network Error') {
                setApiError('Cannot connect to server. Is backend running?');
            } else {
                setApiError('Signup failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page">
            {/* Header */}
            <div className="signup-header-bar">
                <div className="signup-header-content">
                    <Link to="/" className="signup-back-link">
                        ← Back to Login
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="signup-main">
                <div className="signup-form-container">
                    <div className="signup-form-header">
                        <h1>Create Your Account</h1>
                        <p>Join Chat App and start messaging instantly</p>
                    </div>

                    <form onSubmit={handleSubmit} className="signup-form">
                        {/* API Error */}
                        {apiError && (
                            <div className="signup-alert signup-alert-error">
                                <span>⚠️</span>
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Profile Image Section */}
                        <div className="signup-section">
                            <h3 className="signup-section-title">Profile Picture</h3>
                            <div className="signup-image-upload">
                                {imagePreview ? (
                                    <div className="signup-image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button
                                            type="button"
                                            className="signup-remove-image"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    profile_image: null,
                                                }));
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="signup-upload-label">
                                        <Upload size={32} />
                                        <span>Click to upload photo</span>
                                        <small>(Max 3MB, Optional)</small>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isLoading}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                            {errors.profile_image && (
                                <span className="signup-field-error">{errors.profile_image}</span>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="signup-section">
                            <h3 className="signup-section-title">Personal Information</h3>
                            <div className="signup-form-row">
                                <div className="signup-form-group">
                                    <label htmlFor="first_name" className="signup-label">
                                        First Name *
                                    </label>
                                    <div className="signup-input-wrapper">
                                        <User size={18} className="signup-input-icon" />
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            placeholder="John"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={`signup-input ${errors.first_name ? 'error' : ''}`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.first_name && (
                                        <span className="signup-field-error">{errors.first_name}</span>
                                    )}
                                </div>

                                <div className="signup-form-group">
                                    <label htmlFor="last_name" className="signup-label">
                                        Last Name *
                                    </label>
                                    <div className="signup-input-wrapper">
                                        <User size={18} className="signup-input-icon" />
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            placeholder="Doe"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={`signup-input ${errors.last_name ? 'error' : ''}`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.last_name && (
                                        <span className="signup-field-error">{errors.last_name}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="signup-section">
                            <h3 className="signup-section-title">Account Information</h3>

                            <div className="signup-form-group">
                                <label htmlFor="username" className="signup-label">
                                    Username *
                                </label>
                                <div className="signup-input-wrapper">
                                    <User size={18} className="signup-input-icon" />
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`signup-input ${errors.username ? 'error' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <span className="signup-field-error">{errors.username}</span>
                                )}
                            </div>

                            <div className="signup-form-group">
                                <label htmlFor="email" className="signup-label">
                                    Email *
                                </label>
                                <div className="signup-input-wrapper">
                                    <Mail size={18} className="signup-input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`signup-input ${errors.email ? 'error' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && (
                                    <span className="signup-field-error">{errors.email}</span>
                                )}
                            </div>
                        </div>

                        {/* Security */}
                        <div className="signup-section">
                            <h3 className="signup-section-title">Security</h3>

                            <div className="signup-form-group">
                                <label htmlFor="password" className="signup-label">
                                    Password *
                                </label>
                                <div className="signup-input-wrapper">
                                    <Lock size={18} className="signup-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        placeholder="At least 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`signup-input ${errors.password ? 'error' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="signup-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="signup-field-error">{errors.password}</span>
                                )}
                            </div>

                            <div className="signup-form-group">
                                <label htmlFor="password2" className="signup-label">
                                    Confirm Password *
                                </label>
                                <div className="signup-input-wrapper">
                                    <Lock size={18} className="signup-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password2"
                                        name="password2"
                                        placeholder="Re-enter your password"
                                        value={formData.password2}
                                        onChange={handleChange}
                                        className={`signup-input ${errors.password2 ? 'error' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {errors.password2 && (
                                    <span className="signup-field-error">{errors.password2}</span>
                                )}
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="signup-terms">
                            By creating an account, you agree to our Terms of Service and Privacy Policy
                        </p>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="signup-button-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="signup-footer">
                        <span>Already have an account? </span>
                        <Link to="/" className="signup-login-link">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}