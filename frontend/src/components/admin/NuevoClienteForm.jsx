import React, { useState, useEffect } from 'react';
import { 
  Building, User, MapPin, FileText, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, X, 
  Zap, Droplet, Users, GraduationCap,
  Hospital, Factory, HardHat, Fuel, Mail, Phone,
  ShieldCheck, Briefcase
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createClient, 
  validateRFCInDB, 
  validateEmailUnique, 
  getRequiredDocuments,
  ClientCodePreview,
  RequiredDocumentsPreview
} from './NuevoClienteIntegration';
import { toast } from 'react-hot-toast';

const NuevoClienteForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [validatingRFC, setValidatingRFC] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    // Paso 1: Datos Básicos de la Empresa
    name: '',
    commercial_name: '',
    rfc: '',
    phone: '',
    
    // Paso 2: Usuario Principal / Contacto Operativo (quien accederá al sistema)
    operational_contact: { 
      nombre: '', 
      area: 'Seguridad e Higiene',
      cargo: '', 
      telefono: '', 
      celular: '',
      email: '' // Este email es el LOGIN del cliente
    },
    
    // Paso 3: Representante Legal (solo informativo, sin acceso)
    legal_contact: { 
      nombre: '', 
      cargo: '', 
      telefono: '', 
      email: '' 
    },
    
    // Paso 4: Clasificación
    municipality: '',
    business_type: '',
    business_subtype: '',
    risk_level: '',
    
    // Paso 5: Domicilios
    physical_address: '',
    fiscal_address: '',
    coordinates: { lat: '', lng: '' },
    boundaries: { norte: '', sur: '', este: '', oeste: '' },
    
    // Paso 6: Datos del Inmueble
    property_age: '',
    previous_uses: '',
    total_surface: '',
    built_surface: '',
    
    // Paso 7: Instalaciones
    electrical_voltage: '',
    electrical_config: { fases: '', amperes: '', transformador: false },
    gas_installation: { tipo: '', capacidad: '', ubicacion: '' },
    
    // Paso 8: Personal y Población
    staff_data: { 
      total_empleados: '', 
      turnos: '', 
      horarios: '',
      capacitacion_pc: false 
    },
    floating_population: '',
    
    // Datos Específicos (según business_type)
    educational_data: null,
    medical_data: null,
    industrial_data: null,
    construction_data: null,
    hydrocarbon_data: null,
    
    // Documentos adicionales personalizados
    additional_documents: []
  });

  // Obtener documentos requeridos cuando cambie la clasificación
  useEffect(() => {
    const fetchRequiredDocs = async () => {
      if (formData.municipality && formData.business_type && formData.risk_level) {
        const result = await getRequiredDocuments(
          formData.municipality,
          formData.business_type,
          formData.business_subtype,
          formData.risk_level
        );
        
        if (result.success) {
          setRequiredDocs(result.documents);
        }
      }
    };
    
    fetchRequiredDocs();
  }, [formData.municipality, formData.business_type, formData.business_subtype, formData.risk_level]);

  const steps = [
    { number: 1, title: 'Datos Empresa', icon: Building },
    { number: 2, title: 'Usuario Principal', icon: ShieldCheck },
    { number: 3, title: 'Rep. Legal', icon: Briefcase },
    { number: 4, title: 'Clasificación', icon: FileText },
    { number: 5, title: 'Domicilios', icon: MapPin },
    { number: 6, title: 'Inmueble', icon: Building },
    { number: 7, title: 'Instalaciones', icon: Zap },
    { number: 8, title: 'Personal', icon: Users }
  ];

  const municipalities = [
    'San Juan del Río',
    'El Marqués',
    'Querétaro',
    'Tequisquiapan',
    'Corregidora',
    'Colón',
    'Pedro Escobedo'
  ];

  const businessTypes = [
    { value: 'educativo', label: 'Educativo', icon: GraduationCap },
    { value: 'industrial', label: 'Industrial', icon: Factory },
    { value: 'turistico_hospedaje_alimentos', label: 'Turístico/Hospedaje/Alimentos', icon: Building },
    { value: 'comercial', label: 'Comercial', icon: Building },
    { value: 'hidrocarburos', label: 'Hidrocarburos', icon: Fuel },
    { value: 'medico_hospitalario', label: 'Médico/Hospitalario', icon: Hospital },
    { value: 'rehabilitacion_adicciones', label: 'Rehabilitación/Adicciones', icon: Hospital },
    { value: 'construccion', label: 'Construcción', icon: HardHat },
    { value: 'servicios_generales', label: 'Servicios Generales', icon: Building }
  ];

  const getBusinessTypeLabel = (value) => {
    const type = businessTypes.find(bt => bt.value === value);
    return type ? type.label : value;
  };

  const riskLevels = [
    { value: 'bajo', label: 'Bajo Riesgo', color: 'text-green-700 bg-green-50 border-green-200' },
    { value: 'medio', label: 'Riesgo Medio', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { value: 'alto', label: 'Alto Riesgo', color: 'text-red-700 bg-red-50 border-red-200' }
  ];

  // Validación de RFC
  const validateRFC = (rfc) => {
    const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return rfcPattern.test(rfc.toUpperCase());
  };

  // Validación de email
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Validar paso actual
  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.name) newErrors.name = 'Razón social es requerida';
        if (!formData.rfc) {
          newErrors.rfc = 'RFC es requerido';
        } else if (!validateRFC(formData.rfc)) {
          newErrors.rfc = 'RFC inválido (formato: AAA000000AAA)';
        }
        if (!formData.phone) newErrors.phone = 'Teléfono es requerido';
        break;
        
      case 2:
        if (!formData.operational_contact.nombre) {
          newErrors.operational_nombre = 'Nombre del usuario es requerido';
        }
        if (!formData.operational_contact.email) {
          newErrors.operational_email = 'Email es requerido';
        } else if (!validateEmail(formData.operational_contact.email)) {
          newErrors.operational_email = 'Email inválido';
        }
        if (!formData.operational_contact.telefono) {
          newErrors.operational_telefono = 'Teléfono es requerido';
        }
        break;
        
      case 4:
        if (!formData.municipality) newErrors.municipality = 'Municipio es requerido';
        if (!formData.business_type) newErrors.business_type = 'Giro de negocio es requerido';
        if (!formData.risk_level) newErrors.risk_level = 'Nivel de riesgo es requerido';
        break;
        
      case 5:
        if (!formData.physical_address) newErrors.physical_address = 'Domicilio físico es requerido';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validar RFC con debounce
  const handleRFCChange = async (value) => {
    handleChange('rfc', value.toUpperCase());
    
    if (value.length >= 12) {
      setValidatingRFC(true);
      const validation = await validateRFCInDB(value);
      setValidatingRFC(false);
      
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, rfc: 'RFC inválido (formato: AAA000000AAA)' }));
      } else if (validation.exists) {
        setErrors(prev => ({ 
          ...prev, 
          rfc: `RFC ya registrado para: ${validation.existingClient.name}` 
        }));
      }
    }
  };

  // Validar email del usuario operativo
  const handleOperationalEmailChange = async (value) => {
    handleNestedChange('operational_contact', 'email', value.toLowerCase());
    
    if (validateEmail(value)) {
      setValidatingEmail(true);
      const validation = await validateEmailUnique(value);
      setValidatingEmail(false);
      
      if (!validation.isUnique) {
        setErrors(prev => ({ ...prev, operational_email: 'Email ya registrado' }));
      }
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
    
    // Limpiar error específico
    const errorKey = `${parent}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser?.id) {
        throw new Error('No se pudo autenticar. Por favor, inicia sesión nuevamente.');
      }

      const currentUserId = authUser.id;

      // Crear cliente en Supabase
      const result = await createClient(formData, currentUserId);
      
      if (result.success) {
        toast.success(`Cliente ${result.clientCode} creado exitosamente`);
        toast.success(`Credenciales enviadas a ${formData.operational_contact.email}`);
        
        onSuccess?.({ 
          clientId: result.clientId, 
          clientCode: result.clientCode,
          clientUserId: result.clientUserId,
          documentsAssigned: requiredDocs.filter(d => d.is_mandatory).length
        });
      } else {
        toast.error(result.error || 'Error al crear el cliente');
      }
      
    } catch (error) {
      console.error('Error creando cliente:', error);
      toast.error(error.message || 'Error inesperado al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-start">
                <Building className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Información de la Empresa</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Datos fiscales y comerciales del establecimiento
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Nombre Completo"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={formData.commercial_name}
                onChange={(e) => handleChange('commercial_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Nombre con el que opera (si es diferente)"
              />
              <p className="text-xs text-gray-500 mt-1">Opcional - Solo si difiere de la razón social</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => handleRFCChange(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 font-mono text-lg ${errors.rfc ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="ABC123456XYZ"
                    maxLength={13}
                  />
                  {validatingRFC && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.rfc && <p className="text-red-500 text-xs mt-1">{errors.rfc}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono Principal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="(442) 123-4567"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Usuario Principal del Sistema</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Responsable de trámites que tendrá acceso al sistema
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Importante</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    El correo electrónico de esta persona se utilizará para crear su usuario. 
                    Se enviará automáticamente un email con las credenciales de acceso.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.operational_contact.nombre}
                  onChange={(e) => handleNestedChange('operational_contact', 'nombre', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 ${errors.operational_nombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Juan Pérez García"
                />
                {errors.operational_nombre && <p className="text-red-500 text-xs mt-1">{errors.operational_nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.operational_contact.area}
                  onChange={(e) => handleNestedChange('operational_contact', 'area', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >
                  <option value="Seguridad e Higiene">Seguridad e Higiene</option>
                  <option value="Protección Civil">Protección Civil</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Administración">Administración</option>
                  <option value="Gerencia General">Gerencia General</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.operational_contact.cargo}
                  onChange={(e) => handleNestedChange('operational_contact', 'cargo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Responsable de Seguridad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.operational_contact.email}
                    onChange={(e) => handleOperationalEmailChange(e.target.value)}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 ${errors.operational_email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="usuario@empresa.com"
                  />
                  {validatingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.operational_email && <p className="text-red-500 text-xs mt-1">{errors.operational_email}</p>}
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Este correo se usará para acceder al sistema
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.operational_contact.telefono}
                    onChange={(e) => handleNestedChange('operational_contact', 'telefono', e.target.value)}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 ${errors.operational_telefono ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="(442) 123-4567"
                  />
                </div>
                {errors.operational_telefono && <p className="text-red-500 text-xs mt-1">{errors.operational_telefono}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Celular (Opcional)
                </label>
                <input
                  type="tel"
                  value={formData.operational_contact.celular}
                  onChange={(e) => handleNestedChange('operational_contact', 'celular', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="442-123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900">Representante Legal</h4>
                  <p className="text-xs text-purple-700 mt-1">
                    Solo para fines documentales - No tendrá acceso al sistema
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                Esta información es únicamente para documentación legal. El contacto operativo del paso anterior será quien tenga acceso al sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.legal_contact.nombre}
                  onChange={(e) => handleNestedChange('legal_contact', 'nombre', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Nombre del representante legal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.legal_contact.cargo}
                  onChange={(e) => handleNestedChange('legal_contact', 'cargo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Director General"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.legal_contact.telefono}
                  onChange={(e) => handleNestedChange('legal_contact', 'telefono', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="(442) 123-4567"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.legal_contact.email}
                  onChange={(e) => handleNestedChange('legal_contact', 'email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="legal@empresa.com"
                />
                <p className="text-xs text-gray-500 mt-1">Correo secundario - Solo para contacto legal</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Recordatorio:</strong> El usuario principal del sistema será <strong>{formData.operational_contact.nombre || '[Pendiente]'}</strong> con el correo <strong>{formData.operational_contact.email || '[Pendiente]'}</strong>
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clasificación del Negocio</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Municipio <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.municipality}
                onChange={(e) => handleChange('municipality', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.municipality ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar municipio</option>
                {municipalities.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.municipality && <p className="text-red-500 text-xs mt-1">{errors.municipality}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giro de Negocio <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {businessTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('business_type', value)}
                    className={`flex items-center p-3 border-2 rounded-lg transition-all ${
                      formData.business_type === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-2 ${formData.business_type === value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
              {errors.business_type && <p className="text-red-500 text-xs mt-1">{errors.business_type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Riesgo <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {riskLevels.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('risk_level', value)}
                    className={`w-full flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                      formData.risk_level === value
                        ? color + ' border-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                    {formData.risk_level === value && <CheckCircle className="h-5 w-5" />}
                  </button>
                ))}
              </div>
              {errors.risk_level && <p className="text-red-500 text-xs mt-1">{errors.risk_level}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtipo de Negocio (Opcional)
              </label>
              <input
                type="text"
                value={formData.business_subtype}
                onChange={(e) => handleChange('business_subtype', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Especificar subtipo si aplica"
              />
            </div>

            {formData.risk_level && (
              <div className="mt-4">
                <ClientCodePreview riskLevel={formData.risk_level} />
              </div>
            )}

            {requiredDocs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Documentos que se asignarán automáticamente:
                </h4>
                <RequiredDocumentsPreview 
                  municipality={formData.municipality}
                  businessType={formData.business_type}
                  businessSubtype={formData.business_subtype}
                  riskLevel={formData.risk_level}
                  documents={requiredDocs}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Domicilios</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio Físico <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.physical_address}
                onChange={(e) => handleChange('physical_address', e.target.value)}
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 ${errors.physical_address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Calle, número, colonia, código postal"
              />
              {errors.physical_address && <p className="text-red-500 text-xs mt-1">{errors.physical_address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio Fiscal
              </label>
              <textarea
                value={formData.fiscal_address}
                onChange={(e) => handleChange('fiscal_address', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Dejar en blanco si es igual al físico"
              />
              <button
                type="button"
                onClick={() => handleChange('fiscal_address', formData.physical_address)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Copiar domicilio físico
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitud
                </label>
                <input
                  type="text"
                  value={formData.coordinates.lat}
                  onChange={(e) => handleNestedChange('coordinates', 'lat', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="20.123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitud
                </label>
                <input
                  type="text"
                  value={formData.coordinates.lng}
                  onChange={(e) => handleNestedChange('coordinates', 'lng', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="-100.123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colindancias
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['norte', 'sur', 'este', 'oeste'].map(direction => (
                  <input
                    key={direction}
                    type="text"
                    value={formData.boundaries[direction]}
                    onChange={(e) => handleNestedChange('boundaries', direction, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder={`Al ${direction}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Inmueble</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Antigüedad del Inmueble (años)
                </label>
                <input
                  type="number"
                  value={formData.property_age}
                  onChange={(e) => handleChange('property_age', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Superficie Total (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_surface}
                  onChange={(e) => handleChange('total_surface', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="500.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Superficie Construida (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.built_surface}
                  onChange={(e) => handleChange('built_surface', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="400.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usos Previos del Inmueble
              </label>
              <textarea
                value={formData.previous_uses}
                onChange={(e) => handleChange('previous_uses', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Describir actividades anteriores realizadas en el inmueble"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Instalaciones Eléctricas y Gas</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Instalación Eléctrica</h4>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Voltaje (V)
                      </label>
                      <input
                        type="number"
                        value={formData.electrical_voltage}
                        onChange={(e) => handleChange('electrical_voltage', e.target.value)}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm"
                        placeholder="220"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Fases
                      </label>
                      <select
                        value={formData.electrical_config.fases}
                        onChange={(e) => handleNestedChange('electrical_config', 'fases', e.target.value)}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Seleccionar</option>
                        <option value="monofasica">Monofásica</option>
                        <option value="bifasica">Bifásica</option>
                        <option value="trifasica">Trifásica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Amperes
                      </label>
                      <input
                        type="number"
                        value={formData.electrical_config.amperes}
                        onChange={(e) => handleNestedChange('electrical_config', 'amperes', e.target.value)}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <label className="flex items-center text-sm text-blue-700">
                    <input
                      type="checkbox"
                      checked={formData.electrical_config.transformador}
                      onChange={(e) => handleNestedChange('electrical_config', 'transformador', e.target.checked)}
                      className="mr-2"
                    />
                    Cuenta con transformador propio
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <Droplet className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900 mb-2">Instalación de Gas</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-orange-700 mb-1">
                        Tipo de Gas
                      </label>
                      <select
                        value={formData.gas_installation.tipo}
                        onChange={(e) => handleNestedChange('gas_installation', 'tipo', e.target.value)}
                        className="w-full border border-orange-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">No aplica</option>
                        <option value="lp">Gas LP</option>
                        <option value="natural">Gas Natural</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-orange-700 mb-1">
                        Capacidad (kg/m³)
                      </label>
                      <input
                        type="text"
                        value={formData.gas_installation.capacidad}
                        onChange={(e) => handleNestedChange('gas_installation', 'capacidad', e.target.value)}
                        className="w-full border border-orange-300 rounded px-2 py-1 text-sm"
                        placeholder="300 kg"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-orange-700 mb-1">
                      Ubicación del Tanque/Instalación
                    </label>
                    <input
                      type="text"
                      value={formData.gas_installation.ubicacion}
                      onChange={(e) => handleNestedChange('gas_installation', 'ubicacion', e.target.value)}
                      className="w-full border border-orange-300 rounded px-2 py-1 text-sm"
                      placeholder="Exterior, lado norte"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal y Población</h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Datos del Personal
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">
                    Total de Empleados
                  </label>
                  <input
                    type="number"
                    value={formData.staff_data.total_empleados}
                    onChange={(e) => handleNestedChange('staff_data', 'total_empleados', e.target.value)}
                    className="w-full border border-purple-300 rounded px-2 py-1 text-sm"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">
                    Número de Turnos
                  </label>
                  <select
                    value={formData.staff_data.turnos}
                    onChange={(e) => handleNestedChange('staff_data', 'turnos', e.target.value)}
                    className="w-full border border-purple-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    <option value="1">1 turno</option>
                    <option value="2">2 turnos</option>
                    <option value="3">3 turnos</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Horarios de Operación
                </label>
                <input
                  type="text"
                  value={formData.staff_data.horarios}
                  onChange={(e) => handleNestedChange('staff_data', 'horarios', e.target.value)}
                  className="w-full border border-purple-300 rounded px-2 py-1 text-sm"
                  placeholder="Lunes a Viernes 8:00 - 18:00"
                />
              </div>

              <label className="flex items-center text-sm text-purple-700">
                <input
                  type="checkbox"
                  checked={formData.staff_data.capacitacion_pc}
                  onChange={(e) => handleNestedChange('staff_data', 'capacitacion_pc', e.target.checked)}
                  className="mr-2"
                />
                Personal capacitado en Protección Civil
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Población Flotante (visitantes/día)
              </label>
              <input
                type="number"
                value={formData.floating_population}
                onChange={(e) => handleChange('floating_population', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número aproximado de personas que visitan el establecimiento diariamente
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h2>
              <p className="text-sm text-gray-500 mt-1">
                Paso {currentStep} de {steps.length}: {steps[currentStep - 1].title}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              {steps.map(step => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === step.number 
                        ? 'bg-blue-600 text-white' 
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="text-xs mt-1 text-center hidden md:block">{step.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </button>

            {currentStep < 8 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando Cliente...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Crear Cliente
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoClienteForm;