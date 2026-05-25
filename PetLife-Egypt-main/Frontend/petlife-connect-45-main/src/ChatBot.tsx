import React, { useState, useEffect, useRef } from 'react';

interface Message {
    sender: 'You' | 'PetLife Assistant' | 'System';
    text: string;
}

const ChatBot = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Color palettes
    const lightTheme = {
        chatBg: '#FDF5E6',      // warm beige
        headerBg: '#8B5A2B',    // rich brown
        headerText: '#FFF8F0',
        userBubble: '#EED9B0',
        assistantBubble: '#F4E5CD',
        systemBubble: '#E2CFB3',
        textPrimary: '#4A3728',
        textSecondary: '#7B5A3B',
        inputBg: '#FFFFFF',
        inputBorder: '#D4B896',
        sendButtonBg: '#8B5A2B',
        sendButtonHover: '#6B3E1A',
        toggleBg: '#8B5A2B',
        toggleHover: '#6B3E1A',
        shadow: 'rgba(0,0,0,0.1)'
    };

    const darkTheme = {
        chatBg: '#2C241A',      // dark beige/brown
        headerBg: '#5A3A22',
        headerText: '#FDEBD0',
        userBubble: '#4A3B2C',
        assistantBubble: '#3E3328',
        systemBubble: '#352C22',
        textPrimary: '#F0E2D0',
        textSecondary: '#C2A878',
        inputBg: '#3D3328',
        inputBorder: '#6B4E2E',
        sendButtonBg: '#A67B4A',
        sendButtonHover: '#8B5A2B',
        toggleBg: '#A67B4A',
        toggleHover: '#8B5A2B',
        shadow: 'rgba(0,0,0,0.3)'
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages: Message[] = [...messages, { sender: 'You', text: input }];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentInput }),
            });

            if (!response.ok) throw new Error('Failed to connect');

            const data = await response.json();
            setMessages([...newMessages, { sender: 'PetLife Assistant', text: data.reply }]);
        } catch (error) {
            setMessages([...newMessages, { sender: 'System', text: 'Error connecting to server. Is the backend running?' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const styles = {
        container: {
            position: 'fixed' as const,
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            fontFamily: "'Inter', system-ui, sans-serif",
        },

        toggleButton: {
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            backgroundColor: theme.toggleBg,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: `0 4px 12px ${theme.shadow}`,
        },
        chatWindow: {
            width: '420px', // Increased from 380px for better proportion
            backgroundColor: theme.chatBg,
            boxShadow: `0 8px 24px ${theme.shadow}`,
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            transition: 'all 0.2s ease',
        },
        header: {
            padding: '14px 18px',
            backgroundColor: theme.headerBg,
            color: theme.headerText,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '16px',
        },
        closeButton: {
            background: 'none',
            border: 'none',
            color: theme.headerText,
            fontSize: '20px',
            cursor: 'pointer',
            opacity: 0.8,
        },
        themeToggle: {
            background: 'none',
            border: 'none',
            color: theme.headerText,
            fontSize: '18px',
            cursor: 'pointer',
            marginRight: '12px',
        },
        messagesContainer: {
            height: '500px', // ✅ Increased from 320px to make it longer
            overflowY: 'auto' as const,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            scrollBehavior: 'smooth' as const,
        },
        messageRow: (sender: string) => ({
            display: 'flex',
            justifyContent: sender === 'You' ? 'flex-end' : 'flex-start',
        }),
        messageBubble: (sender: string) => ({
            maxWidth: '80%',
            padding: '10px 14px',
            borderRadius: '20px',
            backgroundColor: sender === 'You'
                ? theme.userBubble
                : sender === 'PetLife Assistant'
                    ? theme.assistantBubble
                    : theme.systemBubble,
            color: theme.textPrimary,
            fontSize: '14px',
            lineHeight: 1.4,
            boxShadow: `0 1px 2px ${theme.shadow}`,
        }),
        senderName: {
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '4px',
            color: theme.textSecondary,
        },
        inputContainer: {
            padding: '12px 16px',
            borderTop: `1px solid ${theme.inputBorder}`,
            display: 'flex',
            gap: '10px',
            backgroundColor: theme.chatBg,
        },
        input: {
            flex: 1,
            padding: '10px 14px',
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: '30px',
            fontSize: '14px',
            backgroundColor: theme.inputBg,
            color: theme.textPrimary,
            outline: 'none',
        },
        sendButton: {
            padding: '8px 18px',
            backgroundColor: theme.sendButtonBg,
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
        },
        emptyState: {
            textAlign: 'center' as const,
            color: theme.textSecondary,
            marginTop: '40px',
        },
        thinkingBubble: {
            display: 'flex',
            gap: '4px',
            padding: '8px 12px',
            borderRadius: '15px',
            backgroundColor: theme.assistantBubble,
            width: 'fit-content',
        },
        dot: {
            width: '6px',
            height: '6px',
            backgroundColor: theme.textSecondary,
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out both',
        }
    };

    const [hoverStates, setHoverStates] = useState({
        toggle: false,
        send: false,
        close: false,
        theme: false,
    });

    const handleHover = (key: keyof typeof hoverStates, value: boolean) => {
        setHoverStates(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={styles.container}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => handleHover('toggle', true)}
                    onMouseLeave={() => handleHover('toggle', false)}
                    style={{
                        ...styles.toggleButton,
                        backgroundColor: hoverStates.toggle ? theme.toggleHover : theme.toggleBg,
                        transform: hoverStates.toggle ? 'scale(1.05)' : 'scale(1)',
                    }}
                >
                    🐾
                </button>
            )}

            {isOpen && (
                <div style={styles.chatWindow}>
                    <div style={styles.header}>
                        <span>🐕 PetLife Assistant</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={toggleTheme}
                                onMouseEnter={() => handleHover('theme', true)}
                                onMouseLeave={() => handleHover('theme', false)}
                                style={{
                                    ...styles.themeToggle,
                                    opacity: hoverStates.theme ? 1 : 0.7,
                                }}
                            >
                                {isDarkMode ? '☀️' : '🌙'}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                onMouseEnter={() => handleHover('close', true)}
                                onMouseLeave={() => handleHover('close', false)}
                                style={{
                                    ...styles.closeButton,
                                    opacity: hoverStates.close ? 1 : 0.8,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div style={styles.messagesContainer}>
                        {messages.length === 0 && (
                            <div style={styles.emptyState}>
                                🐾 How can I help you and your pet today?
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={styles.messageRow(msg.sender)}>
                                <div style={styles.messageBubble(msg.sender)}>
                                    <div style={styles.senderName}>{msg.sender}</div>
                                    <div>{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={styles.messageRow('PetLife Assistant')}>
                                <div style={styles.thinkingBubble}>
                                    <div style={{ ...styles.dot, animationDelay: '-0.32s' }}></div>
                                    <div style={{ ...styles.dot, animationDelay: '-0.16s' }}></div>
                                    <div style={styles.dot}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={styles.inputContainer}>
                        <input
                            style={styles.input}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask about pet care..."
                        />
                        <button
                            onClick={sendMessage}
                            onMouseEnter={() => handleHover('send', true)}
                            onMouseLeave={() => handleHover('send', false)}
                            style={{
                                ...styles.sendButton,
                                backgroundColor: hoverStates.send ? theme.sendButtonHover : theme.sendButtonBg,
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
            <style>
                {`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
                `}
            </style>
        </div>
    );
};

export default ChatBot;