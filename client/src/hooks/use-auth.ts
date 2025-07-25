import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Redirect to role-specific dashboard after login
      setTimeout(() => {
        const userRole = data.user?.role;
        switch (userRole) {
          case 'patient':
            window.location.href = '/PatientDashboard';
            break;
          case 'ambulance':
            window.location.href = '/AmbulanceDashboard';
            break;
          case 'hospital':
            window.location.href = '/HospitalDashboard';
            break;
          case 'admin':
            window.location.href = '/AdminDashboard';
            break;
          default:
            window.location.href = '/';
        }
      }, 100);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Redirect to role-specific dashboard after registration
      setTimeout(() => {
        const userRole = data.user?.role;
        switch (userRole) {
          case 'patient':
            window.location.href = '/PatientDashboard';
            break;
          case 'ambulance':
            window.location.href = '/AmbulanceDashboard';
            break;
          case 'hospital':
            window.location.href = '/HospitalDashboard';
            break;
          case 'admin':
            window.location.href = '/AdminDashboard';
            break;
          default:
            window.location.href = '/';
        }
      }, 100);
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  // Add token to API requests
  useEffect(() => {
    if (token) {
      // This would typically be handled by the queryClient configuration
      // For now, we'll set it in localStorage and let the apiRequest function handle it
    }
  }, [token]);

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  };

  return createElement(AuthContext.Provider, { value: contextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}