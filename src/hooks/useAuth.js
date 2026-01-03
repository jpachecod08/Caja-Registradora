import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

/**
 * Hook personalizado para manejar la autenticación
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Obtener sesión actual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          throw sessionError;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Si hay usuario, obtener su perfil
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        }
        
      } catch (error) {
        console.error('Error in auth check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Obtener perfil del usuario desde la base de datos
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Si el perfil no existe, crear uno básico
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
          return;
        }
        
        throw error;
      }

      setUserProfile(data);
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Crear perfil de usuario si no existe
  const createUserProfile = async (userId) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      const newProfile = {
        id: userId,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'cashier',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      toast.success('Perfil de usuario creado');
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast.error('Error al crear perfil de usuario');
    }
  };

  // Iniciar sesión con email y contraseña
  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Manejar errores específicos
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión.');
        }
        throw error;
      }

      // Actualizar último acceso
      if (data.user) {
        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);
      }

      toast.success('Inicio de sesión exitoso');
      return { success: true, user: data.user, session: data.session };
      
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrarse con email y contraseña
  const signUp = useCallback(async (email, password, fullName) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'cashier'
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este email ya está registrado. Intenta iniciar sesión.');
        }
        throw error;
      }

      // Crear perfil en la tabla users
      if (data.user) {
        await createUserProfile(data.user.id);
      }

      toast.success('Registro exitoso. Por favor verifica tu email.');
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Error al registrarse');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      toast.success('Sesión cerrada exitosamente');
      return { success: true };
      
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error al cerrar sesión');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar perfil de usuario
  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      toast.success('Perfil actualizado exitosamente');
      return { success: true, profile: data };
      
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Error al actualizar perfil');
      return { success: false, error: error.message };
    }
  }, [user]);

  // Cambiar contraseña
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Primero verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast.success('Contraseña actualizada exitosamente');
      return { success: true };
      
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Error al cambiar contraseña');
      return { success: false, error: error.message };
    }
  }, [user]);

  // Restablecer contraseña (envío de email)
  const resetPassword = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Se ha enviado un enlace para restablecer tu contraseña a tu email');
      return { success: true };
      
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Error al enviar enlace de restablecimiento');
      return { success: false, error: error.message };
    }
  }, []);

  // Verificar si el usuario tiene un rol específico
  const hasRole = useCallback((role) => {
    if (!userProfile) return false;
    return userProfile.role === role;
  }, [userProfile]);

  // Verificar si el usuario tiene permiso para una acción
  const hasPermission = useCallback((permission) => {
    if (!userProfile) return false;
    
    const permissions = {
      admin: ['manage_users', 'manage_products', 'view_reports', 'manage_settings'],
      manager: ['manage_products', 'view_reports'],
      cashier: ['make_sales', 'view_products']
    };

    const userPermissions = permissions[userProfile.role] || permissions.cashier;
    return userPermissions.includes(permission);
  }, [userProfile]);

  // Obtener información del usuario para mostrar
  const getUserDisplayName = useCallback(() => {
    if (!userProfile && !user) return 'Usuario';
    
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    return user?.email?.split('@')[0] || 'Usuario';
  }, [userProfile, user]);

  // Verificar si el usuario está autenticado
  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  // Obtener token de acceso
  const getAccessToken = useCallback(() => {
    return session?.access_token || null;
  }, [session]);

  // Refrescar sesión
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id);
      }
      
      return { success: true, session: data.session };
      
    } catch (error) {
      console.error('Refresh session error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    // Estado
    user,
    session,
    userProfile,
    loading,
    
    // Métodos de autenticación
    signIn,
    signUp,
    signOut,
    
    // Métodos de perfil
    updateProfile,
    changePassword,
    resetPassword,
    
    // Métodos de verificación
    isAuthenticated,
    hasRole,
    hasPermission,
    getUserDisplayName,
    getAccessToken,
    
    // Utilidades
    refreshSession,
    
    // Estado derivado
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    isCashier: hasRole('cashier') || !userProfile,
    
    // Permisos específicos
    canManageUsers: hasPermission('manage_users'),
    canManageProducts: hasPermission('manage_products'),
    canViewReports: hasPermission('view_reports'),
    canMakeSales: hasPermission('make_sales')
  };
};

export default useAuth;