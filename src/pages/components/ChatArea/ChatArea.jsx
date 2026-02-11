import { useEffect, useState, useRef } from 'react';
import { Send, Phone, Video, Info } from 'lucide-react';
import axios from 'axios';
import GroupInfoModal from '../GroupInfoModal/GroupInfoModal';
import './ChatArea.css';

export default function ChatArea({
    type,
    data,
    token,
    currentUser,
    socket,
    isConnected,
    onJoinRoom,
    onLeaveRoom,
    onSendMessage,
    socketMessages,
    typingUsers,
    onlineUsers
}) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // ✅ Load initial messages from API when chat changes
    useEffect(() => {
        if (data && token) {
            fetchMessages();

            // Join the appropriate room
            if (type === 'group') {
                onJoinRoom('group', data.id);
            } else if (type === 'direct') {
                onJoinRoom('direct', data.id);
            }
        }

        // Leave room on cleanup
        return () => {
            if (data) {
                if (type === 'group') {
                    onLeaveRoom('group', data.id);
                } else if (type === 'direct') {
                    onLeaveRoom('direct', data.id);
                }
            }
        };
    }, [data?.id, type]);

    // ✅ Merge socket messages with loaded messages
    useEffect(() => {
        if (socketMessages && socketMessages.length > 0) {
            // Process all socket messages to ensure we don't miss any
            socketMessages.forEach((socketMsg) => {
                // Check if message belongs to current chat (handle both 'group' and 'group_id')
                const isForCurrentChat = type === 'group'
                    ? (socketMsg.group === data?.id || socketMsg.group_id === data?.id)
                    : (socketMsg.sender_id === data?.id || socketMsg.receiver_id === data?.id ||
                        socketMsg.sender?.id === data?.id || socketMsg.receiver?.id === data?.id);

                if (isForCurrentChat) {
                    setMessages(prev => {
                        // Check if message already exists
                        const exists = prev.some(msg => msg.id === socketMsg.id);
                        if (!exists) {
                            return [...prev, socketMsg];
                        }
                        return prev;
                    });
                }
            });
        }
    }, [socketMessages, type, data?.id]);

    // ✅ Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ Fetch initial messages from API
    const fetchMessages = async () => {
        setIsLoading(true);
        setError(null);
        setMessages([]); // Clear previous messages

        try {
            let response;

            if (type === 'group') {
                response = await axios.get(
                    `http://127.0.0.1:8000/api/group-messages/group_messages/?group_id=${data.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } else if (type === 'direct') {
                response = await axios.get(
                    `http://127.0.0.1:8000/api/direct-messages/conversation/?user_id=${data.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            const messagesData = Array.isArray(response.data) ? response.data : [];
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages');
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ✅ Handle typing indicator
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            if (socket && isConnected) {
                socket.emit('typing', {
                    type: type,
                    id: data.id,
                    is_typing: true
                });
            }
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (socket && isConnected) {
                socket.emit('typing', {
                    type: type,
                    id: data.id,
                    is_typing: false
                });
            }
        }, 1000);
    };

    // ✅ Handle message send
    const handleSendMessage = async (e) => {
        e.preventDefault();
        console.log('🚀 handleSendMessage triggered. Input:', messageInput);

        if (!messageInput.trim()) {
            return;
        }

        if (!isConnected) {
            console.warn('⚠️ Cannot send: socket not connected');
            setError('Not connected. Please wait...');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const messageText = messageInput;
        setMessageInput('');

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            if (socket && isConnected) {
                socket.emit('typing', {
                    type: type,
                    id: data.id,
                    is_typing: false
                });
            }
        }

        // ✅ Add temporary message to UI for instant feedback
        const tempMessage = {
            id: `temp-${Date.now()}`,
            message: messageText,
            sender: currentUser?.username || 'You',
            sender_id: currentUser?.id,
            created_at: new Date().toISOString(),
            isTemporary: true,
        };

        console.log('📝 Adding temporary message:', tempMessage);
        setMessages(prev => {
            const next = [...prev, tempMessage];
            console.log('📊 Local messages state after temp add:', next.length);
            return next;
        });

        // ✅ Send via Socket.IO
        console.log(`📤 Emitting send via onSendMessage (${type}, ${data.id})`);
        const success = onSendMessage(type, data.id, messageText);

        if (!success) {
            console.error('❌ onSendMessage returned false');
            setError('Failed to send message');
            setMessageInput(messageText); // Restore input
            // Remove temporary message
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        } else {
            console.log('✅ onSendMessage successful. Setting 2s timeout for temp removal.');
            // Remove temporary message after a delay (real message will come via socket)
            setTimeout(() => {
                console.log('⏱️ Removing temporary message:', tempMessage.id);
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            }, 2000);
        }
    };

    // ✅ Get sender name safely
    const getSenderName = (msg) => {
        if (typeof msg.sender === 'object' && msg.sender) {
            return msg.sender?.username || msg.sender?.first_name || 'User';
        }
        return msg.sender || 'User';
    };

    // ✅ Get current user ID safely
    const getCurrentUserId = () => {
        if (typeof currentUser === 'object') {
            return currentUser?.id;
        }
        return null;
    };

    // ✅ Format date
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
                });
            }
        } catch (error) {
            return 'Unknown';
        }
    };

    // ✅ Format time
    const formatTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch (error) {
            return '';
        }
    };

    const currentUserId = getCurrentUserId();

    // ✅ Get typing users for current chat
    const currentTypingUsers = typingUsers.filter(user => user.user_id !== currentUserId);

    return (
        <div className="chat-area">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h2 className="chat-title">
                        {type === 'group' ? data?.name : data?.username}
                    </h2>
                    <p className="chat-subtitle">
                        {type === 'group'
                            ? `${data?.members?.length || 0} members`
                            : onlineUsers?.has(data?.id) ? '🟢 Online' : '🔴 Offline'}
                    </p>
                </div>

                <div className="chat-header-actions">
                    {type === 'group' && (
                        <button
                            className="chat-action-btn"
                            title="Group info"
                            onClick={() => setShowGroupInfo(true)}
                        >
                            <Info size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {/* Connection Status */}
                {!isConnected && (
                    <div className="chat-connection-warning">
                        <p>⚠️ Not connected to real-time chat. Reconnecting...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="chat-error">
                        <p>{error}</p>
                        <button onClick={fetchMessages} className="chat-retry-btn">
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="chat-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    // Messages List
                    messages.map((msg, index) => {
                        // ✅ Handle both flat sender_id and nested sender.id object
                        const messageSenderId = msg.sender_id || msg.sender?.id;
                        const isCurrentUser = messageSenderId == currentUserId;
                        const showDate =
                            index === 0 ||
                            formatDate(messages[index - 1].created_at) !==
                            formatDate(msg.created_at);

                        return (
                            <div key={msg.id || index} className="chat-message-group">
                                {showDate && (
                                    <div className="chat-date-separator">
                                        <span>{formatDate(msg.created_at)}</span>
                                    </div>
                                )}
                                <div
                                    className={`chat-message ${isCurrentUser ? 'sent' : 'received'
                                        } ${msg.isTemporary ? 'temporary' : ''}`}
                                >
                                    {!isCurrentUser && (
                                        <p className="chat-message-sender">
                                            {getSenderName(msg)}
                                        </p>
                                    )}
                                    <p className="chat-message-text">{msg.message || ''}</p>
                                    <span className="chat-message-time">
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {currentTypingUsers.length > 0 && (
                    <div className="chat-typing-indicator">
                        <span>
                            {currentTypingUsers.map(u => u.username).join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                    }}
                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                    className="chat-input"
                    disabled={isLoading || !isConnected}
                />
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!messageInput.trim() || isLoading || !isConnected}
                    title={isConnected ? "Send message" : "Connecting..."}
                >
                    <Send size={20} />
                </button>
            </form>

            {/* Group Info Modal */}
            {showGroupInfo && type === 'group' && (
                <GroupInfoModal
                    group={data}
                    onClose={() => setShowGroupInfo(false)}
                />
            )}
        </div>
    );
}