import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Building, 
  User, 
  LogOut,
  Bell,
  Search,
  Shield,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../common/Loading'

export const ClientLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { user, userRole, signOut, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/client', 
      icon: Home,
      current: location.pathname === '/client' || location.pathname === '/client/'
    },
    { 
      name: 'Mis Documentos', 
      href: '/client/documents', 
      icon: FileText,
      current: location.pathname.startsWith('/client/documents')
    },
    { 
      name: 'Establecimientos', 
      href: '/client/establishments', 
      icon: Building,
      current: location.pathname.startsWith('/client/establishments')
    },
    { 
      name: 'Mi Perfil', 
      href: '/client/profile', 
      icon: User,
      current: location.pathname.startsWith('/client/profile')
    },
  ]

  const handleSignOut = async () => {
    if (loading) return
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Shield className="h-8 w-8 text-primary-600" />
              <div className="ml-2">
                <h1 className="text-lg font-bold text-gray-900">B&C Consultores</h1>
                <p className="text-xs text-gray-600">Panel Cliente</p>
              </div>
            </div>
            <nav className="mt-8 px-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.user_metadata?.first_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Shield className="h-8 w-8 text-primary-600" />
              <div className="ml-2">
                <h1 className="text-lg font-bold text-gray-900">B&C Consultores</h1>
                <p className="text-xs text-gray-600">Panel Cliente</p>
              </div>
            </div>
            
            <nav className="mt-8 flex-grow px-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.user_metadata?.first_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Buscador */}
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder="Buscar documentos..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notificaciones */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <Bell className="h-6 w-6" />
              </button>

              {/* Menú de perfil */}
              <div className="relative">
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden md:ml-3 md:block text-sm font-medium text-gray-700">
                    {user?.user_metadata?.first_name || 'Usuario'}
                  </span>
                  <ChevronDown className="hidden md:ml-1 md:block h-4 w-4 text-gray-400" />
                </button>

                {profileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <Link
                      to="/client/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={loading}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Cerrando sesión...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar Sesión
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Overlay para cerrar menús */}
      {profileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </div>
  )
}