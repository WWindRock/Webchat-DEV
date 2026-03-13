import { useSession } from "next-auth/react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user as User | null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
  };
}
