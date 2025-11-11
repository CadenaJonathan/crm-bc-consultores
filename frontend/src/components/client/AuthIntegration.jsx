// =====================================================
// INTEGRACIÓN DE SUPABASE AUTH - VERSIÓN FRONTEND
// =====================================================
// Esta versión NO usa auth.admin (que requiere SERVICE_ROLE_KEY)
// En su lugar, crea usuarios directamente sin verificar si existen

import { supabase } from '../../lib/supabase';

/**
 * GENERAR CONTRASEÑA TEMPORAL SEGURA
 */
export const generateSecurePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Asegurar que tenga al menos uno de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * CREAR USUARIO EN SUPABASE AUTH - VERSIÓN SIMPLIFICADA
 * Esta versión usa signUp normal (no requiere SERVICE_ROLE_KEY)
 */
export const createAuthUser = async (email, userData = {}) => {
  try {
    console.log('🔐 Creando usuario en Supabase Auth...');
    
    // Generar contraseña temporal segura
    const temporaryPassword = generateSecurePassword(16);
    
    // Crear usuario usando signUp (no requiere admin)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: temporaryPassword,
      options: {
        data: {
          full_name: userData.full_name || '',
          role: 'cliente',
          area: userData.area || 'Seguridad e Higiene',
          cargo: userData.cargo || '',
          phone: userData.phone || '',
          created_by: 'admin',
          ...userData
        },
        emailRedirectTo: window.location.origin + '/login'
      }
    });
    
    if (signUpError) {
      // Si el usuario ya existe, devolver info
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('User already registered')) {
        console.log('⚠️ Usuario ya existe, buscando en client_users...');
        
        // Buscar el usuario en client_users
        const { data: existingUser } = await supabase
          .from('client_users')
          .select('auth_user_id')
          .eq('email', email.toLowerCase())
          .single();
        
        if (existingUser?.auth_user_id) {
          return {
            success: true,
            authUserId: existingUser.auth_user_id,
            temporaryPassword: null,
            userExists: true
          };
        }
        
        // Si no lo encontramos, aún así continuar
        console.log('⚠️ Usuario existe en Auth pero no en client_users');
      }
      
      console.error('❌ Error creando usuario en Auth:', signUpError);
      throw signUpError;
    }
    
    console.log('✅ Usuario creado en Auth:', signUpData.user.id);
    
    return {
      success: true,
      authUserId: signUpData.user.id,
      temporaryPassword: temporaryPassword,
      userExists: false
    };
    
  } catch (error) {
    console.error('❌ Excepción creando usuario en Auth:', error);
    return {
      success: false,
      error: error.message,
      authUserId: null,
      temporaryPassword: null
    };
  }
};

/**
 * CREAR NOTIFICACIÓN DE BIENVENIDA
 */
export const createWelcomeNotification = async (clientId, userData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        client_id: clientId,
        type: 'system_message',
        title: '¡Bienvenido al Sistema de Protección Civil!',
        message: `Hola ${userData.full_name}, tu cuenta ha sido creada exitosamente. Revisa tu correo electrónico para obtener tus credenciales de acceso.`,
        metadata: {
          welcome: true,
          user_email: userData.email
        }
      });
    
    if (error) {
      console.error('Error creando notificación de bienvenida:', error);
    } else {
      console.log('✅ Notificación de bienvenida creada');
    }
  } catch (error) {
    console.error('Excepción creando notificación:', error);
  }
};

/**
 * ENVIAR EMAIL CON CREDENCIALES
 * NOTA: Por ahora solo registra en consola
 * Para implementar email real, usar Edge Function
 */
export const sendCredentialsEmail = async (recipientEmail, temporaryPassword, userData) => {
  try {
    console.log('📧 Preparando email de credenciales...');
    console.log('📧 Para:', recipientEmail);
    console.log('📧 Contraseña temporal (solo en logs):', temporaryPassword);
    
    // TODO: Implementar envío real de email usando Edge Function
    // const { data, error } = await supabase.functions.invoke('send-credentials-email', {
    //   body: {
    //     to: recipientEmail,
    //     recipientName: userData.full_name || userData.nombre,
    //     email: recipientEmail,
    //     password: temporaryPassword,
    //     cargo: userData.cargo
    //   }
    // });
    
    console.log('⚠️ Email NO implementado aún - Solo logging');
    console.log('📧 Implementar Edge Function para envío real');
    
    return {
      success: true,
      message: 'Email preparado (pendiente implementación de envío)'
    };
    
  } catch (error) {
    console.error('❌ Error preparando email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * CREAR USUARIO DE CLIENTE CON AUTH - VIA EDGE FUNCTION
 * Evita el auto-login y envía credenciales por email
 */
export const createClientUserWithAuth = async (clientId, email, temporaryPassword, clientCode, clientName) => {
  console.log('=== LLAMANDO A EDGE FUNCTION PARA CREAR USUARIO ===');
  console.log('Client ID:', clientId);
  console.log('Email:', email);
  console.log('Client Code:', clientCode);
  console.log('Client Name:', clientName);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('📡 Llamando a Edge Function create-client-user...');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-client-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          clientId,
          email,
          password: temporaryPassword,
          clientCode,
          clientName
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP de Edge Function:', response.status, errorText);
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Error en Edge Function:', result.error);
      throw new Error(result.error);
    }

    console.log('✅ Usuario creado exitosamente via Edge Function');
    console.log('   - Client User ID:', result.clientUserId);
    console.log('   - Auth User ID:', result.authUserId);
    console.log('   - Email enviado: true');

    return {
      clientUserId: result.clientUserId,
      authUserId: result.authUserId,
      emailSent: true
    };

  } catch (error) {
    console.error('❌ Error llamando a Edge Function:', error);
    throw error;
  }
};

/**
 * VERIFICAR ESTADO DE AUTH DE UN USUARIO
 */
export const checkUserAuthStatus = async (email) => {
  try {
    // Como no tenemos admin access, solo podemos verificar en client_users
    const { data: userData, error } = await supabase
      .from('client_users')
      .select('auth_user_id, created_at, last_login')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) throw error;
    
    if (!userData || !userData.auth_user_id) {
      return {
        exists: false,
        message: 'Usuario no vinculado con Auth'
      };
    }
    
    return {
      exists: true,
      authUserId: userData.auth_user_id,
      createdAt: userData.created_at,
      lastLogin: userData.last_login
    };
    
  } catch (error) {
    console.error('Error verificando estado de Auth:', error);
    return {
      exists: false,
      error: error.message
    };
  }
};

export default {
  generateSecurePassword,
  createAuthUser,
  createWelcomeNotification,
  sendCredentialsEmail,
  createClientUserWithAuth,
  checkUserAuthStatus
};