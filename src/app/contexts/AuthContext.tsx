import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string; // Primary identifier from MongoDB _id
  email: string;
  name?: string;
  nombre?: string;
  biografia?: string;
  ubicacion?: string;
  avatar_style?: string;
  avatar_seed?: string;
  avatar_url?: string;
  rol?: string;
  createdAt?: string; // Timestamp de creación
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorMessage?: string }>;
  loginGoogle: (credential: string) => Promise<{ success: boolean; errorMessage?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, avatarStyle?: string) => Promise<{ success: boolean; errorMessage?: string }>;
  updateProfile: (profileData: { nombre?: string; email?: string; avatar_style?: string; biografia?: string; ubicacion?: string }) => Promise<{ success: boolean; errorMessage?: string }>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

// Helper function to normalize user data from backend to frontend format
const normalizeUserData = (backendUser: any): User => {
  // Check if data is nested inside 'perfil' (new backend structure)
  const profile = backendUser.perfil || {};
  
  return {
    id: backendUser.id || backendUser._id?.toString(),
    email: backendUser.email,
    name: backendUser.name || profile.nombre || backendUser.nombre,
    nombre: profile.nombre || backendUser.nombre,
    biografia: profile.biografia || backendUser.biografia,
    ubicacion: profile.ubicacion || backendUser.ubicacion,
    avatar_style: profile.avatar_style || backendUser.avatar_style,
    avatar_seed: profile.avatar_seed || backendUser.avatar_seed,
    avatar_url: profile.avatar_url || backendUser.avatar_url,
    rol: backendUser.rol,
    createdAt: backendUser.createdAt,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user y token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('meteomap_user');
    const savedToken = localStorage.getItem('meteomap_token');
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      // Normalize user data when loading from localStorage to ensure consistency
      const normalizedUser = normalizeUserData(parsedUser);
      setUser(normalizedUser);
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

      const userData = normalizeUserData(data.user || { email });
      
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

  const loginGoogle = async (idToken: string): Promise<{ success: boolean; errorMessage?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Error al iniciar sesión con Google';
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        }
        setError(errorMessage);
        return { success: false, errorMessage };
      }

      const userData = normalizeUserData(data.user);
      setUser(userData);
      localStorage.setItem('meteomap_user', JSON.stringify(userData));
      localStorage.setItem('meteomap_token', data.accessToken);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Google login error:', errorMessage);
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

  const register = async (email: string, password: string, nombre: string, avatarStyle?: string): Promise<{ success: boolean; errorMessage?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nombre, avatar_style: avatarStyle }),
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

      const userData = normalizeUserData(errorData.user || { email, nombre });
      
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

  const updateProfile = async (profileData: { nombre?: string; email?: string; avatar_style?: string; biografia?: string; ubicacion?: string }): Promise<{ success: boolean; errorMessage?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('meteomap_token');
      const response = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Error al actualizar perfil';
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        }
        setError(errorMessage);
        return { success: false, errorMessage };
      }

      // Update local user data
      if (user) {
        // Correctly handle the response from backend which might be nested
        const updatedUser = normalizeUserData(data.user || data || { ...user, ...profileData });
        setUser(updatedUser);
        localStorage.setItem('meteomap_user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Update profile error:', errorMessage);
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
        loginGoogle,
        logout,
        register,
        updateProfile,
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
