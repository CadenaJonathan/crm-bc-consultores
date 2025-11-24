import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Hook para gestionar Push Notifications en el CRM
 * Con persistencia de suscripción entre sesiones
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verificar soporte al montar
  useEffect(() => {
    const supported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Restaurar suscripción al cargar
  useEffect(() => {
    if (isSupported) {
      checkSubscription();
    }
  }, [isSupported]);

  /**
   * Registrar el Service Worker
   */
  const registerServiceWorker = async () => {
    try {
      console.log('Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('Service Worker registrado:', registration.scope);
      await navigator.serviceWorker.ready;
      console.log('Service Worker activo');

      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      throw new Error('No se pudo registrar el Service Worker');
    }
  };

  /**
   * Solicitar permisos de notificaciones
   */
  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Las notificaciones no están soportadas en este navegador');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'denied') {
        throw new Error('Permisos de notificación denegados');
      }

      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      throw error;
    }
  };

  /**
   * Convertir VAPID key de base64 a Uint8Array
   */
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /**
   * Suscribir al usuario a Push Notifications
   */
  const subscribeToPush = async () => {
    if (!isSupported) {
      throw new Error('Push notifications no soportadas');
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID_PUBLIC_KEY no configurada');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Iniciando suscripción push...');
      
      // 1. Obtener client_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Usuario autenticado:', user.id);

      // 2. Obtener client_id desde client_users
      const { data: clientUser, error: clientError } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (clientError) {
        console.error('Error obteniendo client_id:', clientError);
        throw new Error('No se pudo obtener información del cliente');
      }

      if (!clientUser?.client_id) {
        throw new Error('client_id no encontrado');
      }

      const clientId = clientUser.client_id;
      console.log('client_id obtenido:', clientId);

      // 3. Registrar Service Worker
      const registration = await registerServiceWorker();

      // 4. Solicitar permisos
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('Permisos no concedidos');
      }

      // 5. Obtener o crear suscripción push
      let pushSubscription = await registration.pushManager.getSubscription();

      if (!pushSubscription) {
        console.log('Creando nueva suscripción push...');
        
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        
        console.log('Suscripción push creada');
      } else {
        console.log('Suscripción push existente encontrada');
      }

      // 6. Guardar suscripción en Supabase
      const subscriptionData = JSON.parse(JSON.stringify(pushSubscription));
      await savePushSubscription(clientId, subscriptionData);

      setSubscription(pushSubscription);
      console.log('Suscripción push completada exitosamente');

      return pushSubscription;
    } catch (err) {
      console.error('Error en suscripción push:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Guardar la suscripción en Supabase
   */
  const savePushSubscription = async (clientId, subscriptionData) => {
    try {
      console.log('  Guardando suscripción en Supabase...');
      console.log('   client_id:', clientId);
      console.log('   endpoint:', subscriptionData.endpoint);
      
      if (!clientId) {
        throw new Error('client_id no disponible');
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          client_id: clientId,
          subscription: subscriptionData,
          endpoint: subscriptionData.endpoint,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Suscripción guardada:', data);
      return data;
    } catch (error) {
      console.error('Error guardando suscripción:', error);
      throw error;
    }
  };

  /**
   * Desactivar Push Notifications (sin eliminar suscripción del navegador)
   */
  const unsubscribeFromPush = async (userId) => {
    if (!subscription) {
      console.log('ℹ No hay suscripción activa');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener client_id
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('auth_user_id', userId)
        .single();

      if (!clientUser?.client_id) {
        throw new Error('client_id no encontrado');
      }

      // Solo marcar como inactiva, NO eliminar
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('client_id', clientUser.client_id);

      if (error) throw error;

      // NO desuscribir del navegador para mantener la suscripción
      // La suscripción persiste y solo se desactiva en BD

      setSubscription(null);
      console.log('Notificaciones desactivadas (suscripción mantenida)');
    } catch (error) {
      console.error('Error desactivando notificaciones:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verificar si hay suscripción activa y restaurarla
   */
  const checkSubscription = async () => {
    try {
      if (!isSupported) return null;

      // 1. Verificar suscripción en el navegador
      const registration = await navigator.serviceWorker.ready;
      let pushSubscription = await registration.pushManager.getSubscription();
      
      console.log('Verificando suscripción:', pushSubscription ? 'Existe en navegador' : 'No existe en navegador');

      // 2. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('ℹUsuario no autenticado');
        return null;
      }

      // 3. Obtener client_id
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!clientUser?.client_id) {
        console.log('ℹclient_id no encontrado');
        return null;
      }

      // 4. Buscar suscripción en BD
      const { data: savedSubscription } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('client_id', clientUser.client_id)
        .eq('is_active', true)
        .single();

      // 5. Si hay suscripción en BD y en navegador, usar la del navegador
      if (pushSubscription && savedSubscription) {
        setSubscription(pushSubscription);
        console.log('Suscripción restaurada desde navegador');
        return pushSubscription;
      }

      // 6. Si hay en BD pero no en navegador, recrear
      if (savedSubscription && !pushSubscription && VAPID_PUBLIC_KEY) {
        console.log('🔄 Restaurando suscripción desde BD...');
        
        try {
          // Solicitar permisos primero
          if (Notification.permission !== 'granted') {
            await requestPermission();
          }

          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });

          // Actualizar en BD con el nuevo endpoint
          const subscriptionData = JSON.parse(JSON.stringify(pushSubscription));
          await savePushSubscription(clientUser.client_id, subscriptionData);

          setSubscription(pushSubscription);
          console.log('Suscripción restaurada completamente');
          return pushSubscription;
        } catch (error) {
          console.error('Error restaurando suscripción:', error);
        }
      }

      return pushSubscription;
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      return null;
    }
  };

  /**
   * Enviar notificación de prueba
   */
  const sendTestNotification = () => {
    if (!isSupported || permission !== 'granted') {
      console.warn('No se puede enviar notificación de prueba');
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('Notificación de Prueba', {
        body: 'Las notificaciones están funcionando correctamente',
        icon: '/logo-192.png',
        badge: '/badge-72.png',
        tag: 'test',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribeToPush,
    unsubscribeFromPush,
    checkSubscription,
    requestPermission,
    sendTestNotification,
  };
}