// CoPaw WebSocket Hook - WebChat Channel 专用

import { useEffect, useRef, useState, useCallback } from 'react';
import { CoPawMessage, CoPawAttachment, WebSocketEvents } from '@/types/copaw';

interface UseCoPawWebSocketOptions {
  userId: string;
  wsUrl?: string;  // 支持自定义 WebSocket URL（多环境）
  onMessage?: (message: CoPawMessage) => void;
  onAsset?: (asset: CoPawAttachment & { position?: { x: number; y: number } }) => void;
  onTyping?: (isTyping: boolean) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useCoPawWebSocket(options: UseCoPawWebSocketOptions) {
  const { userId, wsUrl: customWsUrl, onMessage, onAsset, onTyping, onError, onConnect, onDisconnect } = options;
  
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  // 获取 WebSocket URL（支持环境变量或自定义）
  const getWsUrl = useCallback(() => {
    if (customWsUrl) return customWsUrl;
    return process.env.NEXT_PUBLIC_COPAW_WS_URL || 'ws://localhost:7080/ws';  // 默认使用 7080
  }, [customWsUrl]);
  
  const connect = useCallback(() => {
    // 限制重连次数
    if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[CoPaw] Max reconnection attempts reached');
      onError?.('无法连接到服务器，请检查网络或刷新页面');
      return;
    }
    
    const wsUrl = getWsUrl();
    console.log(`[CoPaw] Connecting to ${wsUrl}...`);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[CoPaw] Connected');
        setIsConnected(true);
        reconnectCountRef.current = 0;  // 重置重连计数
        onConnect?.();
        
        // 发送认证消息
        ws.send(JSON.stringify({
          type: 'auth',
          user_id: userId,
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_success':
              setSessionId(data.session_id);
              console.log(`[CoPaw] Authenticated, session: ${data.session_id}`);
              break;
              
            case 'message':
              onMessage?.(data);
              if (data.role === 'agent') {
                setIsConnected(false);
              }
              // 清除错误状态
              onError?.(null);
              break;
              
            case 'asset':
              onAsset?.(data.asset);
              break;
              
            case 'typing':
              onTyping?.(data.isTyping);
              break;
              
            case 'error':
              console.error('[CoPaw] Server error:', data.message);
              onError?.(data.message);
              break;
              
            case 'pong':
              // 心跳响应
              break;
          }
        } catch (err) {
          console.error('[CoPaw] Failed to parse message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`[CoPaw] Disconnected (code: ${event.code})`);
        setIsConnected(false);
        onDisconnect?.();
        
        // 自动重连（指数退避）
        reconnectCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        
        console.log(`[CoPaw] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current})...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
      
      ws.onerror = (error) => {
        console.error('[CoPaw] WebSocket error:', error);
        onError?.('连接错误');
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('[CoPaw] Failed to create WebSocket:', err);
      onError?.('创建连接失败');
    }
  }, [userId, getWsUrl, onMessage, onAsset, onTyping, onError, onConnect, onDisconnect]);
  
  const disconnect = useCallback(() => {
    reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS;  // 阻止自动重连
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);
  
  const sendMessage = useCallback((content: string, attachments?: CoPawAttachment[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        attachments: attachments || [],
      }));
      return true;
    }
    console.warn('[CoPaw] Cannot send message, WebSocket not open');
    return false;
  }, []);
  
  useEffect(() => {
    connect();
    
    // 心跳（每 25 秒）
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
    
    return () => {
      clearInterval(heartbeat);
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    sessionId,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

// 简单日志工具
const logger = {
  info: (...args: any[]) => console.log('[CoPaw]', ...args),
  error: (...args: any[]) => console.error('[CoPaw]', ...args),
  warn: (...args: any[]) => console.warn('[CoPaw]', ...args),
};
