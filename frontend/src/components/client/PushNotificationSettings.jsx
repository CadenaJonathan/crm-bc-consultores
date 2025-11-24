import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PushNotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = usePushNotifications();

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(!!subscription);
  }, [subscription]);

  const handleToggle = async () => {
    try {
      if (isEnabled) {
        // Desactivar notificaciones
        await unsubscribeFromPush(user.id);
        toast.success('Notificaciones desactivadas');
      } else {
        // Activar notificaciones
        await subscribeToPush(user.id);
        toast.success('¡Notificaciones activadas! Recibirás alertas importantes.');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      
      if (error.message.includes('denegad')) {
        toast.error(
          'Has bloqueado las notificaciones. Ve a configuración del navegador para habilitarlas.',
          { duration: 6000 }
        );
      } else {
        toast.error('Error al configurar notificaciones');
      }
    }
  };

  const handleTest = () => {
    sendTestNotification();
    toast.success('Notificación de prueba enviada');
  };

  // Si el navegador no soporta notificaciones
  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Notificaciones no disponibles
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Tu navegador no soporta notificaciones push. Usa Chrome, Firefox, Edge o Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si los permisos fueron denegados
  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Notificaciones bloqueadas
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Has bloqueado las notificaciones para este sitio. Para habilitarlas:
            </p>
            <ol className="text-sm text-red-700 mt-2 ml-4 list-decimal space-y-1">
              <li>Haz clic en el ícono de candado (🔒) en la barra de direcciones</li>
              <li>Busca "Notificaciones" y selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isEnabled ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            {isEnabled ? (
              <Bell className="w-6 h-6 text-blue-600" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones Push
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Recibe alertas en tiempo real sobre el estado de tus documentos
            </p>

            {isEnabled && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 w-fit">
                <Check className="w-4 h-4" />
                <span>Notificaciones activas</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
            ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          >
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute inset-0 m-auto" />
            )}
          </span>
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-6 space-y-3 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900">Recibirás notificaciones para:</h4>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Documentos aprobados por Protección Civil</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Documentos que necesitan correcciones</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Documentos próximos a vencer (15 días antes)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Mensajes importantes del sistema</span>
          </li>
        </ul>
      </div>

      {/* Botón de prueba */}
      {isEnabled && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleTest}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Enviar notificación de prueba
          </button>
        </div>
      )}

      {/* Nota de privacidad */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Privacidad:</strong> Tus notificaciones son privadas y seguras. 
          Solo recibirás alertas sobre tu cuenta y documentos. Puedes desactivarlas en cualquier momento.
        </p>
      </div>
    </div>
  );
}