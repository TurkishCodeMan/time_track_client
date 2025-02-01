import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LoginCredentials, RegisterCredentials } from '../types';
import { authApi } from '../api';

const getStorageToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde token'ı ayarla
  useEffect(() => {
    const token = getStorageToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
    if (token) {
      authApi.setAuthToken(token);
    }
  }, []);

  // Kullanıcı bilgilerini al
  const { data: user } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getUser,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!getStorageToken()
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      authApi.setAuthToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      queryClient.setQueryData(['auth', 'user'], data.user);
      router.push('/dashboard');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      authApi.setAuthToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      queryClient.setQueryData(['auth', 'user'], data.user);
      router.push('/dashboard');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      authApi.removeAuthToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      queryClient.clear();
      router.push('/');
    },
  });

  const login = useCallback((credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  }, [loginMutation]);

  const register = useCallback((credentials: RegisterCredentials) => {
    registerMutation.mutate(credentials);
  }, [registerMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const getToken = () => {
    return getStorageToken();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    getToken,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
} 