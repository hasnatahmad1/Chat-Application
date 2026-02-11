import { useState } from 'react';
import { Plus, MessageSquare, Users, Search, RefreshCw } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
    open,
    groups,
    conversations,
    selectedGroup,
    selectedUser,
    onSelectGroup,
    onSelectUser,
    onRefresh,
    searchQuery = '',
    onCreateGroup,
    onNewMessage,
    onlineUsers,
}) {
    const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'dms'
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // ✅ Filter groups based on search
    const filteredGroups = groups.filter((g) => {
        if (!g) return false;
        const searchLower = localSearch.toLowerCase();
        return (
            g?.name?.toLowerCase().includes(searchLower) ||
            g?.members?.some(m =>
                m?.user?.username?.toLowerCase().includes(searchLower) ||
                m?.user?.first_name?.toLowerCase().includes(searchLower) ||
                m?.user?.last_name?.toLowerCase().includes(searchLower)
            )
        );
    });

    // ✅ Filter conversations based on search
    const filteredConversations = conversations.filter((c) => {
        if (!c) return false;
        const searchLower = localSearch.toLowerCase();
        return (
            c?.username?.toLowerCase().includes(searchLower) ||
            c?.email?.toLowerCase().includes(searchLower) ||
            c?.first_name?.toLowerCase().includes(searchLower) ||
            c?.last_name?.toLowerCase().includes(searchLower) ||
            `${c?.first_name} ${c?.last_name}`.toLowerCase().includes(searchLower)
        );
    });

    // ✅ Get safe conversation name
    const getConversationName = (conv) => {
        if (!conv) return 'User';
        if (conv.first_name || conv.last_name) {
            return `${conv.first_name || ''} ${conv.last_name || ''}`.trim();
        }
        return conv.username || conv.email?.split('@')[0] || 'User';
    };

    // ✅ Get safe conversation subtitle
    const getConversationSubtitle = (conv) => {
        if (!conv) return 'Direct message';
        if (conv.last_message) {
            const text = conv.last_message.message || '';
            return text.length > 40 ? text.substring(0, 40) + '...' : text;
        }
        return conv.username ? `@${conv.username}` : 'Direct message';
    };

    // ✅ Get conversation avatar
    const getConversationAvatar = (conv) => {
        const name = getConversationName(conv);
        return name.charAt(0).toUpperCase();
    };

    // ✅ Get group avatar
    const getGroupAvatar = (group) => {
        if (!group?.name) return 'G';
        return group.name.charAt(0).toUpperCase();
    };

    // ✅ Format timestamp
    const formatTimestamp = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;

            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString();
        } catch (error) {
            return '';
        }
    };

    return (
        <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
            {/* Header */}
            <div className="sidebar-header">
                <h2>Messages</h2>
                <div className="sidebar-header-actions">
                    <button
                        className="sidebar-icon-btn"
                        onClick={onCreateGroup}
                        title="Create Group"
                    >
                        <Users size={20} />
                    </button>
                    <button
                        className="sidebar-icon-btn"
                        onClick={onNewMessage}
                        title="New Message"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="sidebar-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="sidebar-search-input"
                />
            </div>

            {/* Tabs */}
            <div className="sidebar-tabs">
                <button
                    className={`sidebar-tab ${activeTab === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                    title="Groups"
                >
                    <Users size={18} />
                    <span>Groups</span>
                    {groups.length > 0 && (
                        <span className="sidebar-tab-badge">{groups.length}</span>
                    )}
                </button>
                <button
                    className={`sidebar-tab ${activeTab === 'dms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dms')}
                    title="Direct Messages"
                >
                    <MessageSquare size={18} />
                    <span>Messages</span>
                    {conversations.length > 0 && (
                        <span className="sidebar-tab-badge">{conversations.length}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="sidebar-content">
                {activeTab === 'groups' ? (
                    <div className="sidebar-list">
                        {filteredGroups.length === 0 ? (
                            <div className="sidebar-empty">
                                <div className="empty-icon">
                                    <Users size={32} />
                                </div>
                                <p>{localSearch ? 'No groups found' : 'No groups yet'}</p>
                                {!localSearch && (
                                    <button className="sidebar-create-btn" onClick={onCreateGroup}>
                                        <Plus size={16} /> Create Group
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredGroups.map((group) => {
                                if (!group) return null;
                                return (
                                    <button
                                        key={group.id}
                                        className={`sidebar-item ${selectedGroup?.id === group.id ? 'active' : ''
                                            }`}
                                        onClick={() => onSelectGroup(group)}
                                    >
                                        <div className="sidebar-item-avatar group-avatar">
                                            {getGroupAvatar(group)}
                                        </div>
                                        <div className="sidebar-item-content">
                                            <div className="sidebar-item-header">
                                                <p className="sidebar-item-name">{group.name || 'Group'}</p>
                                                {group.updated_at && (
                                                    <span className="sidebar-item-time">
                                                        {formatTimestamp(group.updated_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="sidebar-item-meta">
                                                {group.members?.length || 0} members
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="sidebar-list">
                        {filteredConversations.length === 0 ? (
                            <div className="sidebar-empty">
                                <div className="empty-icon">
                                    <MessageSquare size={32} />
                                </div>
                                <p>{localSearch ? 'No conversations found' : 'No conversations yet'}</p>
                                {!localSearch && (
                                    <button className="sidebar-create-btn" onClick={onNewMessage}>
                                        <Plus size={16} /> New Message
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                if (!conv) return null;
                                return (
                                    <button
                                        key={conv.id}
                                        className={`sidebar-item ${selectedUser?.id === conv.id ? 'active' : ''
                                            }`}
                                        onClick={() => onSelectUser(conv)}
                                    >
                                        <div className="sidebar-item-avatar user-avatar">
                                            {getConversationAvatar(conv)}
                                            {onlineUsers?.has(conv.id) && (
                                                <span className="sidebar-online-indicator"></span>
                                            )}
                                        </div>
                                        <div className="sidebar-item-content">
                                            <div className="sidebar-item-header">
                                                <p className="sidebar-item-name">
                                                    {getConversationName(conv)}
                                                </p>
                                                {conv.last_message?.created_at && (
                                                    <span className="sidebar-item-time">
                                                        {formatTimestamp(conv.last_message.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="sidebar-item-meta">
                                                {getConversationSubtitle(conv)}
                                            </p>
                                        </div>
                                        {conv.last_message && !conv.last_message.is_read && (
                                            <div className="sidebar-item-unread"></div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="sidebar-footer-btn"
                    onClick={onRefresh}
                    title="Refresh chats"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>
        </aside>
    );
}