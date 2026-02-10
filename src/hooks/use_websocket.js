import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ✅ Custom WebSocket Hook
 * 
 * Usage:
 * const { messages, isConnected, sendMessage } = useWebSocket(
 *   'ws://127.0.0.1:8000/ws/chat/group/1/',
 *   token
 * );
 */

export function useWebSocket(wsUrl, token) {
    const wsRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const messageQueueRef = useRef([]);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    // ✅ Send message through WebSocket
    const sendMessage = useCallback((messageData) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            // Queue message if not connected
            messageQueueRef.current.push(messageData);
            return;
        }

        try {
            wsRef.current.send(JSON.stringify(messageData));
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    }, []);

    // ✅ Process queued messages
    const processMessageQueue = useCallback(() => {
        while (messageQueueRef.current.length > 0) {
            const message = messageQueueRef.current.shift();
            sendMessage(message);
        }
    }, [sendMessage]);

    // ✅ Connect to WebSocket
    const connect = useCallback(() => {
        if (!wsUrl || !token) {
            console.warn('Missing wsUrl or token');
            return;
        }

        try {
            // ✅ Add token to WebSocket URL (if needed)
            // Note: Django Channels uses headers for auth
            wsRef.current = new WebSocket(wsUrl);

            // ✅ On Connection Open
            wsRef.current.onopen = () => {
                console.log('WebSocket connected:', wsUrl);
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;

                // ✅ Send auth message if needed
                wsRef.current.send(
                    JSON.stringify({
                        type: 'auth',
                        token: token,
                    })
                );

                // ✅ Process queued messages
                processMessageQueue();
            };

            // ✅ Receive Message
            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Message received:', data);

                    setMessages((prevMessages) => [...prevMessages, data]);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            // ✅ On Error
            wsRef.current.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection error');
            };

            // ✅ On Close
            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // ✅ Attempt reconnection
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    console.log(
                        `Reconnecting... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
                    );

                    setTimeout(() => {
                        connect();
                    }, RECONNECT_DELAY);
                } else {
                    setError('Failed to connect. Max reconnect attempts reached.');
                }
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            setError('Failed to establish connection');
        }
    }, [wsUrl, token, processMessageQueue]);

    // ✅ Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [wsUrl, token, connect]);

    // ✅ Return hook interface
    return {
        messages,
        isConnected,
        error,
        sendMessage,
        ws: wsRef.current,
    };
}