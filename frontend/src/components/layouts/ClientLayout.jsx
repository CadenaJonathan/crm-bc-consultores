// src/components/layouts/ClientLayout.jsx
// CORREGIR LAS RUTAS PARA COINCIDIR CON App.jsx

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

// ✅ RUTAS CORREGIDAS - coinciden con App.jsx
const navigation = [
  { name: 'Inicio', href: '/dashboard/cliente', icon: HomeIcon, current: false },
  { name: 'Mis Documentos', href: '/dashboard/cliente/documents', icon: DocumentTextIcon, current: false },
  { name: 'Mis Establecimientos', href: '/dashboard/cliente/establishments', icon: BuildingOfficeIcon, current: false },
  { name: 'Mi Perfil', href: '/dashboard/cliente/profile', icon: UserCircleIcon, current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const ClientLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { user, userRole, logout } = useAuth()  // ✅ Cambiar signOut por logout
  const location = useLocation()
  const navigate = useNavigate()

  // Actualizar navegación activa
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href
  }))

  const handleSignOut = async () => {
    try {
      await logout()  // ✅ Cambiar signOut por logout
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">PC</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-gray-900">Protección Civil</h1>
                  </div>
                </div>
              </div>
              
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-1">
                      {updatedNavigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={classNames(
                              item.current
                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                              'group flex gap-x-3 rounded-md p-2 pl-3 text-sm leading-6 font-medium'
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PC</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Protección Civil</h1>
                <p className="text-xs text-gray-500">Portal Cliente</p>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {updatedNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* Botón de cerrar sesión */}
              <li className="mt-auto mb-4">
                <button
                  onClick={handleSignOut}
                  className="group flex w-full gap-x-3 rounded-md p-3 text-sm leading-6 font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Panel de Control
              </h2>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notificaciones */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <BellIcon className="h-6 w-6" />
                  {/* Badge de notificaciones */}
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    2
                  </span>
                </button>

                {/* Dropdown de notificaciones */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-4 hover:bg-gray-50">
                        <div className="flex">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Documento por vencer
                            </p>
                            <p className="text-sm text-gray-600">
                              Tu FEII-01 vence en 15 días
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Hace 2 horas
                            </p>
                          </div>
                          <div className="ml-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                              Urgente
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 hover:bg-gray-50">
                        <div className="flex">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Documento aprobado
                            </p>
                            <p className="text-sm text-gray-600">
                              Tu FEII-02 ha sido aprobado
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ayer
                            </p>
                          </div>
                          <div className="ml-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                              Aprobado
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <Link
                        to="/dashboard/cliente/notifications"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        Ver todas las notificaciones
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil de usuario */}
              <div className="flex items-center gap-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.first_name || 'Cliente'}
                  </p>
                  <p className="text-xs text-gray-600">{userRole}</p>
                </div>
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {(user?.user_metadata?.first_name || 'C')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay para cerrar notificaciones */}
      {notificationsOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </div>
  )
}