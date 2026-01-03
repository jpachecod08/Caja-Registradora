import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Save, 
  Eye, 
  EyeOff,
  Shield,
  LogOut
} from 'lucide-react';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)     // ✅ OBLIGATORIO
      .maybeSingle();        // ✅ NO revienta si no existe

    if (error) throw error;

    if (!data) {
      // crear perfil si no existe
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.email,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProfile({
        full_name: newProfile.full_name,
        email: newProfile.email,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } else {
      setProfile(prev => ({
        ...prev,
        full_name: data.full_name || '',
        email: user.email || ''
      }));
    }

  } catch (error) {
    console.error('Error fetching profile:', error);
    toast.error('Error al cargar perfil');
  } finally {
    setLoading(false);
  }
};



  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar contraseñas
    if (profile.new_password && profile.new_password !== profile.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);

    try {
      // Actualizar perfil
      const updates = {
        full_name: profile.full_name,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
  .from('profiles')
  .update({
    full_name: profile.full_name,
    updated_at: new Date().toISOString()
  })
  .eq('id', user.id);

if (profileError) throw profileError;


      // Actualizar contraseña si se proporcionó
      if (profile.current_password && profile.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profile.new_password
        });

        if (passwordError) throw passwordError;
      }

      toast.success('Perfil actualizado exitosamente');
      
      // Limpiar campos de contraseña
      setProfile(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Administra tu información personal</p>
        </div>
        
        <button
          onClick={signOut}
          className="btn-danger flex items-center mt-4 lg:mt-0"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </button>
      </div>

      {/* Información de perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Información Personal</h3>
                <p className="text-sm text-gray-500">Actualiza tus datos básicos</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="input-field pl-10 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Contraseñas */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
                    <p className="text-sm text-gray-500">Actualiza tu contraseña de acceso</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        name="current_password"
                        value={profile.current_password}
                        onChange={handleChange}
                        className="input-field pl-10 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          name="new_password"
                          value={profile.new_password}
                          onChange={handleChange}
                          className="input-field pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword.new ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          name="confirm_password"
                          value={profile.confirm_password}
                          onChange={handleChange}
                          className="input-field pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword.confirm ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Información de cuenta */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Información de la Cuenta</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Rol</p>
                <p className="font-medium text-gray-900">Cajero</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Activo
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Miembro desde</p>
                <div className="flex items-center text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Último acceso</p>
                <div className="flex items-center text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Soporte</h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con tu cuenta o tienes alguna pregunta?
            </p>
            <button className="w-full btn-secondary">
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;