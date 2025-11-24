import { useState } from 'react';
import { User, Bell, Shield, Key } from 'lucide-react';
import PushNotificationSettings from '../../components/client/PushNotificationSettings';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

  const tabs = [
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'security', name: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-gray-600">
            Administra tus preferencias y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-white rounded-lg shadow p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                      transition-colors duration-200
                      ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Tab de Notificaciones */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <PushNotificationSettings />
                  
                  {/* Otras configuraciones de notificaciones */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Preferencias de Notificaciones
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Documentos aprobados</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Documentos rechazados</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Documentos por vencer</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Mensajes del sistema</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab de Perfil */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Información del Perfil
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        placeholder="+52 442 123 4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Guardar cambios
                    </button>
                  </div>
                </div>
              )}

              {/* Tab de Seguridad */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Seguridad de la Cuenta
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Cambiar contraseña
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}