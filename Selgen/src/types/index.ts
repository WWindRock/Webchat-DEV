/**
 * 全局类型定义
 */

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 工具执行
export interface ToolExecution {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'error';
  input?: any;
  output?: any;
  startTime: Date;
  endTime?: Date;
}

// 对话消息
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'video' | 'code' | 'component';
  metadata?: Record<string, any>;
  timestamp: Date;
  isLoading?: boolean;
  tools?: ToolExecution[];
}

// 对话
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  context?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 作品/生成内容
export interface Work {
  id: string;
  userId: string;
  skillName: string;
  type: 'image' | 'video' | 'interactive';
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  likes: number;
  views: number;
  tags: string[];
  createdAt: Date;
}

// API响应标准格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
