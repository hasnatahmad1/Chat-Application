import { useState, useEffect } from 'react';
import { X, Search, MessageSquare, Loader } from 'lucide-react';
import axios from 'axios';
import './SearchUsersModal.css';

export default function SearchUsersModal({ token, currentUserId, onClose, onUserSelected }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ✅ Search users
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await axios.get(
                    `http://127.0.0.1:8000/api/users/search_users/?q=${searchQuery}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                setSearchResults(response.data || []);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, token]);

    // ✅ Get user display name
    const getUserDisplayName = (user) => {
        if (user.first_name || user.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        return user.username;
    };

    // ✅ Get user avatar
    const getUserAvatar = (user) => {
        if (user.profile?.profile_image) {
            return user.profile.profile_image;
        }
        const initials = getUserDisplayName(user).charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-container">
                <div className="modal-header">
                    <div className="modal-header-left">
                        <MessageSquare size={24} />
                        <h2>New Message</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-content">
                    {/* Search */}
                    <div className="modal-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search users by name or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="modal-search-input"
                            autoFocus
                        />
                    </div>

                    {/* Search Results */}
                    <div className="modal-search-results">
                        {searchQuery.trim().length < 2 ? (
                            <div className="modal-search-hint">
                                <Search size={48} />
                                <p>Type at least 2 characters to search</p>
                            </div>
                        ) : isSearching ? (
                            <div className="modal-search-loading">
                                <Loader size={32} className="spinner" />
                                <p>Searching users...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="modal-search-empty">
                                <p>No users found</p>
                                <span>Try a different search term</span>
                            </div>
                        ) : (
                            <div className="modal-user-list">
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => onUserSelected(user)}
                                        className="modal-user-item"
                                    >
                                        <img
                                            src={getUserAvatar(user)}
                                            alt={getUserDisplayName(user)}
                                            className="modal-user-avatar-img"
                                            onError={(e) => {
                                                const initials = getUserDisplayName(user).charAt(0).toUpperCase();
                                                e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
                                            }}
                                        />
                                        <div className="modal-user-info">
                                            <p className="modal-user-name">{getUserDisplayName(user)}</p>
                                            <p className="modal-user-username">@{user.username}</p>
                                            {user.email && (
                                                <p className="modal-user-email">{user.email}</p>
                                            )}
                                        </div>
                                        <div className="modal-user-action">
                                            <MessageSquare size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}