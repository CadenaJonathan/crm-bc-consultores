// src/pages/client/Settings.jsx o similar
import PushNotificationSettings from '@/components/client/PushNotificationSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1>Configuración</h1>
      
      {/* Otras secciones */}
      
      <PushNotificationSettings />
      
      {/* Más configuraciones */}
    </div>
  );
}