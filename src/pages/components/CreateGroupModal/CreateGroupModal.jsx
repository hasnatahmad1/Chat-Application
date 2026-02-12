import { useState, useEffect } from 'react';
import { X, Users, Search, Loader } from 'lucide-react';
import axios from 'axios';
import './CreateGroupModal.css';

export default function CreateGroupModal({ token, onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

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
                    `https://yousef-frizzliest-myah.ngrok-free.dev/api/users/search_users/?q=${searchQuery}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            "ngrok-skip-browser-warning": "true"
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

    // ✅ Toggle member selection
    const toggleMember = (user) => {
        setSelectedMembers(prev => {
            const exists = prev.find(m => m.id === user.id);
            if (exists) {
                return prev.filter(m => m.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    };

    // ✅ Create group
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');

        if (!groupName.trim()) {
            setError('Please enter a group name');
            return;
        }

        if (selectedMembers.length < 1) {
            setError('Please select at least 1 member');
            return;
        }

        setIsCreating(true);

        try {
            const response = await axios.post(
                'https://yousef-frizzliest-myah.ngrok-free.dev/api/groups/',
                {
                    name: groupName.trim(),
                    member_ids: selectedMembers.map(m => m.id)
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        "ngrok-skip-browser-warning": "true"
                    }
                }
            );

            onGroupCreated(response.data);
        } catch (error) {
            console.error('Create group error:', error);
            setError(error.response?.data?.message || 'Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    // ✅ Get user display name
    const getUserDisplayName = (user) => {
        if (user.first_name || user.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        return user.username;
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-container">
                <div className="modal-header">
                    <div className="modal-header-left">
                        <Users size={24} />
                        <h2>Create Group</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleCreateGroup} className="modal-content">
                    {/* Group Name */}
                    <div className="modal-form-group">
                        <label htmlFor="groupName">Group Name</label>
                        <input
                            type="text"
                            id="groupName"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="modal-input"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Search Members */}
                    <div className="modal-form-group">
                        <label htmlFor="searchMembers">Add Members</label>
                        <div className="modal-search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                id="searchMembers"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="modal-search-input"
                                disabled={isCreating}
                            />
                        </div>
                    </div>

                    {/* Selected Members */}
                    {selectedMembers.length > 0 && (
                        <div className="modal-selected-members">
                            <p className="modal-label">Selected Members ({selectedMembers.length})</p>
                            <div className="modal-member-chips">
                                {selectedMembers.map(member => (
                                    <div key={member.id} className="modal-member-chip">
                                        <span>{getUserDisplayName(member)}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleMember(member)}
                                            className="modal-chip-remove"
                                            disabled={isCreating}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchQuery.trim().length >= 2 && (
                        <div className="modal-search-results">
                            {isSearching ? (
                                <div className="modal-search-loading">
                                    <Loader size={20} className="spinner" />
                                    <span>Searching...</span>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="modal-search-empty">
                                    No users found
                                </div>
                            ) : (
                                <div className="modal-user-list">
                                    {searchResults.map(user => {
                                        const isSelected = selectedMembers.find(m => m.id === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleMember(user)}
                                                className={`modal-user-item ${isSelected ? 'selected' : ''}`}
                                                disabled={isCreating}
                                            >
                                                <div className="modal-user-avatar">
                                                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="modal-user-info">
                                                    <p className="modal-user-name">{getUserDisplayName(user)}</p>
                                                    <p className="modal-user-username">@{user.username}</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="modal-user-check">✓</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="modal-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-btn modal-btn-cancel"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="modal-btn modal-btn-primary"
                            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
                        >
                            {isCreating ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}