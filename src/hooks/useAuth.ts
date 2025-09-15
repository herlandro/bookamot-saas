import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'GARAGE_OWNER';
}

export interface AuthSession {
  user: User;
  expires: string;
}

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, requireAuth, router]);

  return {
    user: session?.user as User | undefined,
    session: session as AuthSession | null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  };
}

export default useAuth;