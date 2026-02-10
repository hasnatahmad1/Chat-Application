import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Search, Menu, X, LogOut, Plus, Users, MessageSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/ChatArea/ChatArea';
import CreateGroupModal from '../components/CreateGroupModal/CreateGroupModal';
import SearchUsersModal from '../components/SearchUsersModal/SearchUsersModal';
import { useSocketIO } from '../../hooks/useSocketIO';
import './Home.css';

export function Home() {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    // ✅ Socket.IO Hook
    const {
        isConnected,
        messages: socketMessages,
        typingUsers,
        joinGroup,
        leaveGroup,
        joinDirectChat,
        leaveDirectChat,
        sendGroupMessage,
        sendDirectMessage,
        socket,
    } = useSocketIO('http://127.0.0.1:8001', token);

    // ✅ States
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [groups, setGroups] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showSearchUsersModal, setShowSearchUsersModal] = useState(false);

    // ✅ Check authentication
    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }
    }, [token, navigate]);

    // ✅ Fetch groups and conversations on mount
    useEffect(() => {
        if (token) {
            fetchGroups();
            fetchConversations();
        }
    }, [token]);

    // ✅ Fetch groups from API
    const fetchGroups = async () => {
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/groups/',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const groupsData = Array.isArray(response.data) ? response.data : [];
            setGroups(groupsData);

            // Auto-select first group if nothing is selected
            if (groupsData.length > 0 && !selectedGroup && !selectedUser) {
                setSelectedGroup(groupsData[0]);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Fetch conversations from API
    const fetchConversations = async () => {
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/direct-messages/',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const conversationsData = Array.isArray(response.data) ? response.data : [];

            // Extract other_user from conversations
            const formattedConversations = conversationsData.map(conv => ({
                ...conv.other_user,
                last_message: conv.last_message
            }));

            setConversations(formattedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setConversations([]);
        }
    };

    // ✅ Get safe avatar URL
    const getAvatarUrl = () => {
        if (user?.profile?.profile_image) {
            return user.profile.profile_image;
        }
        if (user?.profile_image) {
            return user.profile_image;
        }

        const firstName = user?.first_name || 'U';
        const lastName = user?.last_name || '';
        const initials = `${firstName[0]}${lastName[0] || ''}`;
        return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
    };

    // ✅ Handle logout
    const handleLogout = async () => {
        try {
            await axios.post(
                'http://127.0.0.1:8000/api/auth/logout/',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            navigate('/');
        }
    };

    // ✅ Handle group selection
    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setSelectedUser(null);
    };

    // ✅ Handle user selection (DM)
    const handleSelectUser = (conversation) => {
        setSelectedUser(conversation);
        setSelectedGroup(null);
    };

    // ✅ Handle refresh
    const handleRefresh = () => {
        setIsLoading(true);
        fetchGroups();
        fetchConversations();
    };

    // ✅ Handle join room
    const handleJoinRoom = (type, id) => {
        if (type === 'group') {
            joinGroup(id);
        } else if (type === 'direct') {
            joinDirectChat(id);
        }
    };

    // ✅ Handle leave room
    const handleLeaveRoom = (type, id) => {
        if (type === 'group') {
            leaveGroup(id);
        } else if (type === 'direct') {
            leaveDirectChat(id);
        }
    };

    // ✅ Handle send message
    const handleSendMessage = (type, id, message) => {
        if (type === 'group') {
            return sendGroupMessage(id, message);
        } else if (type === 'direct') {
            return sendDirectMessage(id, message);
        }
        return false;
    };

    // ✅ Handle create group success
    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateGroupModal(false);
        setSelectedGroup(newGroup);
        setSelectedUser(null);
    };

    // ✅ Handle start conversation
    const handleStartConversation = (otherUser) => {
        // Check if conversation already exists
        const existingConv = conversations.find(c => c.id === otherUser.id);

        if (existingConv) {
            setSelectedUser(existingConv);
        } else {
            // Add to conversations list
            setConversations(prev => [otherUser, ...prev]);
            setSelectedUser(otherUser);
        }

        setSelectedGroup(null);
        setShowSearchUsersModal(false);
    };

    const avatarUrl = getAvatarUrl();

    return (
        <div className="home-container">
            {/* ===== HEADER ===== */}
            <header className="home-header">
                <div className="home-header-left">
                    <button
                        className="home-menu-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <h1 className="home-brand">💬 Chat App</h1>

                    {/* Connection Status */}
                    <div className={`home-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">
                            {isConnected ? 'Connected' : 'Connecting...'}
                        </span>
                    </div>
                </div>

                <div className="home-header-right">
                    {/* Action Buttons */}
                    <button
                        className="home-action-btn"
                        onClick={() => setShowCreateGroupModal(true)}
                        title="Create Group"
                    >
                        <Users size={20} />
                    </button>

                    <button
                        className="home-action-btn"
                        onClick={() => setShowSearchUsersModal(true)}
                        title="New Message"
                    >
                        <MessageSquare size={20} />
                    </button>

                    {/* User Menu */}
                    <div className="home-user-menu">
                        <button
                            className="home-user-button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            title="User menu"
                        >
                            <img
                                src={avatarUrl}
                                alt={user?.username || 'User'}
                                className="home-user-avatar"
                                onError={(e) => {
                                    const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`;
                                    e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
                                }}
                            />
                        </button>

                        {menuOpen && (
                            <>
                                <div
                                    className="home-menu-overlay"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="home-dropdown-menu">
                                    <div className="home-menu-header">
                                        <img
                                            src={avatarUrl}
                                            alt={user?.username || 'User'}
                                            className="home-menu-avatar"
                                            onError={(e) => {
                                                const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`;
                                                e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
                                            }}
                                        />
                                        <div>
                                            <p className="home-menu-name">
                                                {user?.first_name || 'User'} {user?.last_name || ''}
                                            </p>
                                            <p className="home-menu-email">{user?.email || 'No email'}</p>
                                        </div>
                                    </div>

                                    <div className="home-menu-divider"></div>

                                    <button
                                        className="home-menu-item home-menu-logout"
                                        onClick={handleLogout}
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <div className="home-main">
                {/* Sidebar */}
                <Sidebar
                    open={sidebarOpen}
                    groups={groups}
                    conversations={conversations}
                    selectedGroup={selectedGroup}
                    selectedUser={selectedUser}
                    onSelectGroup={handleSelectGroup}
                    onSelectUser={handleSelectUser}
                    onRefresh={handleRefresh}
                    searchQuery={searchQuery}
                    onCreateGroup={() => setShowCreateGroupModal(true)}
                    onNewMessage={() => setShowSearchUsersModal(true)}
                />

                {/* Chat Area */}
                {selectedGroup ? (
                    <ChatArea
                        type="group"
                        data={selectedGroup}
                        token={token}
                        currentUser={user}
                        socket={socket}
                        isConnected={isConnected}
                        onJoinRoom={handleJoinRoom}
                        onLeaveRoom={handleLeaveRoom}
                        onSendMessage={handleSendMessage}
                        socketMessages={socketMessages}
                        typingUsers={typingUsers}
                    />
                ) : selectedUser ? (
                    <ChatArea
                        type="direct"
                        data={selectedUser}
                        token={token}
                        currentUser={user}
                        socket={socket}
                        isConnected={isConnected}
                        onJoinRoom={handleJoinRoom}
                        onLeaveRoom={handleLeaveRoom}
                        onSendMessage={handleSendMessage}
                        socketMessages={socketMessages}
                        typingUsers={typingUsers}
                    />
                ) : (
                    <div className="home-empty-state">
                        <div className="empty-icon">💬</div>
                        <h2>Welcome to Chat App</h2>
                        <p>Select a chat or start a new conversation</p>
                        <div className="empty-actions">
                            <button
                                className="home-start-btn"
                                onClick={() => setShowCreateGroupModal(true)}
                            >
                                <Users size={20} />
                                Create Group
                            </button>
                            <button
                                className="home-start-btn"
                                onClick={() => setShowSearchUsersModal(true)}
                            >
                                <MessageSquare size={20} />
                                New Message
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateGroupModal && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowCreateGroupModal(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}

            {showSearchUsersModal && (
                <SearchUsersModal
                    token={token}
                    currentUserId={user?.id}
                    onClose={() => setShowSearchUsersModal(false)}
                    onUserSelected={handleStartConversation}
                />
            )}
        </div>
    );
}