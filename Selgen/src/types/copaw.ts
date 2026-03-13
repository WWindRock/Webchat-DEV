// CoPaw 类型定义

export interface CoPawMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: number;
  sessionId: string;
  attachments?: CoPawAttachment[];
  metadata?: {
    thinking?: string;
    tool_calls?: any[];
  };
}

export interface CoPawAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'code';
  url: string;
  name: string;
  mimeType?: string;
}

export interface WebSocketEvents {
  message: CoPawMessage;
  asset: CoPawAttachment & { position?: { x: number; y: number } };
  typing: { isTyping: boolean };
  error: { message: string };
}
