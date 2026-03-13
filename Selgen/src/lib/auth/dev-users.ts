// 开发阶段硬编码用户配置

export const DEV_USERS = [
  {
    id: 'dev-user-1',
    email: 'dev1@example.com',
    password: 'dev123456',
    name: 'Developer 1',
    role: 'admin',
  },
  {
    id: 'dev-user-2',
    email: 'dev2@example.com',
    password: 'dev123456',
    name: 'Developer 2',
    role: 'user',
  },
  {
    id: 'test-user-1',
    email: 'test@example.com',
    password: 'test123456',
    name: 'Test User',
    role: 'user',
  },
];

export interface DevUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export function verifyDevUser(email: string, password: string): DevUser | null {
  const user = DEV_USERS.find(
    (u) => u.email === email && u.password === password
  );
  
  if (user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
  
  return null;
}
