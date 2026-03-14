import { useEffect, useRef, useCallback, useState } from "react";
import * as signalR from "@microsoft/signalr";

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || "http://localhost:5000/chathub";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "system";
}

interface UseSignalROptions {
  /** Unique conversation/room identifier */
  conversationId: string;
  /** Current user id */
  userId: string;
  /** Called when a new message arrives */
  onMessageReceived?: (message: ChatMessage) => void;
  /** Called when typing indicator changes */
  onTypingChanged?: (userId: string, isTyping: boolean) => void;
  /** Auto-connect on mount (default true) */
  autoConnect?: boolean;
}

export function useSignalR({
  conversationId,
  userId,
  onMessageReceived,
  onTypingChanged,
  autoConnect = true,
}: UseSignalROptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Listen for messages
    connection.on("ReceiveMessage", (message: ChatMessage) => {
      onMessageReceived?.(message);
    });

    // Listen for typing indicators
    connection.on("UserTyping", (typingUserId: string, isTyping: boolean) => {
      onTypingChanged?.(typingUserId, isTyping);
    });

    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => {
      setIsConnected(true);
      // Rejoin conversation after reconnect
      connection.invoke("JoinConversation", conversationId).catch(() => {});
    });
    connection.onclose(() => setIsConnected(false));

    try {
      await connection.start();
      await connection.invoke("JoinConversation", conversationId);
      connectionRef.current = connection;
      setIsConnected(true);
      setConnectionError(null);
    } catch (err) {
      console.warn("SignalR connection failed (using mock mode):", err);
      setConnectionError("Chat server unavailable — running in demo mode");
      // Don't throw — allow UI to work in mock/demo mode
    }
  }, [conversationId, onMessageReceived, onTypingChanged]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke("SendMessage", conversationId, content);
    }
    // Return a mock message for UI even if not connected
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: userId,
      senderName: "You",
      content,
      timestamp: new Date().toISOString(),
      type: "text",
    };
    return msg;
  }, [conversationId, userId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      connectionRef.current.invoke("SetTyping", conversationId, isTyping).catch(() => {});
    }
  }, [conversationId]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return { isConnected, connectionError, connect, disconnect, sendMessage, sendTypingIndicator };
}
