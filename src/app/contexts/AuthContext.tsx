import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id?: string;
  email: string;
  nombre?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorMessage?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; errorMessage?: string }>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user y token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('meteomap_user');
    const savedToken = localStorage.getItem('meteomap_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; errorMessage?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extraer mensaje - intentar todos los campos posibles
        let errorMessage = 'Error al iniciar sesión';
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.details) {
          const firstError = Object.values(data.details)[0];
          if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        
        console.log('Login error message:', errorMessage);
        setError(errorMessage);
        return { success: false, errorMessage };
      }

      const userData = data.user || { email };
      
      setUser(userData);
      localStorage.setItem('meteomap_user', JSON.stringify(userData));
      localStorage.setItem('meteomap_token', data.accessToken);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Login error:', errorMessage);
      return { success: false, errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('meteomap_token');
      
      // Llamar al endpoint de logout si el token existe
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      setUser(null);
      localStorage.removeItem('meteomap_user');
      localStorage.removeItem('meteomap_token');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
      console.error('Logout error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; errorMessage?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nombre: name }),
      });

      const errorData = await response.json();
      
      console.log('Register response:', {
        status: response.status,
        ok: response.ok,
        data: errorData,
      });

      if (!response.ok) {
        // Error de registro
        let errorMessage = 'Error al registrarse';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
        
        setError(errorMessage);
        return { success: false, errorMessage };
      }

      const userData = errorData.user || { email, name };
      
      setUser(userData);
      localStorage.setItem('meteomap_user', JSON.stringify(userData));
      localStorage.setItem('meteomap_token', errorData.accessToken);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Register error:', errorMessage);
      return { success: false, errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
