import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * ✅ Custom Socket.IO Hook for React
 * 
 * Usage:
 * const { socket, isConnected, messages, sendMessage, joinRoom, leaveRoom } = useSocketIO(
 *   'http://127.0.0.1:8001',
 *   token
 * );
 */

export function useSocketIO(serverUrl, token) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [newGroup, setNewGroup] = useState(null);

    // ✅ Initialize Socket.IO connection
    useEffect(() => {
        if (!serverUrl || !token) {
            console.warn('Missing serverUrl or token');
            return;
        }

        // Create socket connection
        socketRef.current = io(serverUrl, {
            query: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        const socket = socketRef.current;

        // ✅ Connection events
        socket.on('connect', () => {
            console.log('✅ Socket.IO connected:', socket.id);
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('🔴 Socket.IO connection error:', err.message);
            setError('Connection failed. Please check your internet connection.');
            setIsConnected(false);
        });

        socket.on('error', (data) => {
            console.error('⚠️ Socket.IO error:', data);
            setError(data.message || 'An error occurred');
        });

        // ✅ Room events
        socket.on('joined_group', (data) => {
            setCurrentRoom({ type: 'group', id: data.group_id });
        });

        socket.on('joined_direct_chat', (data) => {
            setCurrentRoom({ type: 'direct', id: data.other_user_id });
        });

        // ✅ Message events
        socket.on('group_message', (data) => {
            console.log('📨 Group message received:', data);
            setMessages(prev => [...prev, { ...data, type: 'group' }]);
        });

        socket.on('direct_message', (data) => {
            console.log('📨 Direct message received:', data);
            setMessages(prev => [...prev, { ...data, type: 'direct' }]);
        });

        socket.on('group_created', (data) => {
            console.log('📂 Group created notification received:', data);
            setNewGroup(data);
        });

        // ✅ Initial online users list
        socket.on('online_users_list', (data) => {
            console.log('📋 Received online users list:', data.user_ids);
            setOnlineUsers(new Set(data.user_ids));
        });

        // ✅ User status events
        socket.on('user_status_change', (data) => {
            console.log('👤 User status changed (Hook):', data);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (data.is_online) {
                    console.log(`Adding user ${data.user_id} to online set`);
                    newSet.add(data.user_id);
                } else {
                    console.log(`Removing user ${data.user_id} from online set`);
                    newSet.delete(data.user_id);
                }
                console.log('Updated Online Users Set:', Array.from(newSet));
                return newSet;
            });
        });

        socket.on('user_joined', (data) => {
            console.log('👤 User joined:', data);
        });

        socket.on('user_left', (data) => {
            console.log('👤 User left:', data);
        });

        // ✅ Typing indicator
        socket.on('user_typing', (data) => {
            if (data.is_typing) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.user_id === data.user_id)) {
                        return [...prev, data];
                    }
                    return prev;
                });
            } else {
                setTypingUsers(prev => prev.filter(u => u.user_id !== data.user_id));
            }
        });

        // ✅ Cleanup on unmount
        return () => {
            console.log('🔌 Disconnecting Socket.IO...');
            if (socket) {
                socket.disconnect();
            }
        };
    }, [serverUrl, token]);

    // ✅ Join group chat room
    const joinGroup = useCallback((groupId) => {
        if (!socketRef.current || !socketRef.current.connected) {
            console.warn('Socket not connected');
            return;
        }

        console.log('🚪 Joining group:', groupId);
        socketRef.current.emit('join_group', { group_id: groupId });
        setMessages([]); // Clear previous messages
    }, []);

    // ✅ Leave group chat room
    const leaveGroup = useCallback((groupId) => {
        if (!socketRef.current || !socketRef.current.connected) {
            return;
        }

        console.log('🚪 Leaving group:', groupId);
        socketRef.current.emit('leave_group', { group_id: groupId });
        setCurrentRoom(null);
    }, []);

    // ✅ Join direct chat room
    const joinDirectChat = useCallback((userId) => {
        if (!socketRef.current || !socketRef.current.connected) {
            console.warn('Socket not connected');
            return;
        }

        console.log('🚪 Joining direct chat with user:', userId);
        socketRef.current.emit('join_direct_chat', { user_id: userId });
        setMessages([]); // Clear previous messages
    }, []);

    // ✅ Leave direct chat room
    const leaveDirectChat = useCallback((userId) => {
        if (!socketRef.current || !socketRef.current.connected) {
            return;
        }

        console.log('🚪 Leaving direct chat with user:', userId);
        socketRef.current.emit('leave_direct_chat', { user_id: userId });
        setCurrentRoom(null);
    }, []);

    // ✅ Send group message
    const sendGroupMessage = useCallback((groupId, message) => {
        if (!socketRef.current || !socketRef.current.connected) {
            console.warn('Socket not connected');
            return false;
        }

        if (!message.trim()) {
            return false;
        }

        console.log('📤 Sending group message:', { groupId, message });
        socketRef.current.emit('send_group_message', {
            group_id: groupId,
            message: message.trim()
        });

        return true;
    }, []);

    // ✅ Send direct message
    const sendDirectMessage = useCallback((receiverId, message) => {
        if (!socketRef.current || !socketRef.current.connected) {
            console.warn('Socket not connected');
            return false;
        }

        if (!message.trim()) {
            return false;
        }

        console.log('📤 Sending direct message:', { receiverId, message });
        socketRef.current.emit('send_direct_message', {
            receiver_id: receiverId,
            message: message.trim()
        });

        return true;
    }, []);

    // ✅ Send typing indicator
    const sendTyping = useCallback((type, id, isTyping) => {
        if (!socketRef.current || !socketRef.current.connected) {
            return;
        }

        socketRef.current.emit('typing', {
            type, // 'group' or 'direct'
            id,
            is_typing: isTyping
        });
    }, []);

    // ✅ Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        error,
        messages,
        currentRoom,
        typingUsers,
        joinGroup,
        leaveGroup,
        joinDirectChat,
        leaveDirectChat,
        onlineUsers,
        newGroup,
        setNewGroup,
        sendGroupMessage,
        sendDirectMessage,
        sendTyping,
        clearMessages,
    };
}