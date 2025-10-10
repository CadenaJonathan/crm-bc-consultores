// NuevoClienteIntegration.jsx
// Este archivo conecta el formulario con Supabase

import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

/**
 * VISTA PREVIA DEL CÓDIGO DE CLIENTE
 * Muestra cómo se verá el identificador según el nivel de riesgo
 */
export const generateClientCodePreview = (riskLevel) => {
  const year = new Date().getFullYear();
  
  const prefixes = {
    'alto': 'CCR',    // Carta de Corresponsabilidad
    'medio': 'RM',    // Riesgo Medio
    'bajo': 'RB'      // Riesgo Bajo
  };
  
  const prefix = prefixes[riskLevel] || 'GEN';
  
  return {
    prefix,
    example: `${prefix}0001/${year}`,
    description: riskLevel === 'alto' 
      ? 'Carta de Corresponsabilidad'
      : `Riesgo ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`
  };
};

/**
 * VALIDAR RFC EN SUPABASE
 * Verifica si el RFC ya existe en la base de datos
 */
export const validateRFCInDB = async (rfc) => {
  try {
    const { data, error } = await supabase
      .rpc('validate_rfc', { rfc_input: rfc.toUpperCase() });
    
    if (error) throw error;
    
    // Verificar si ya existe
    const { data: existing, error: checkError } = await supabase
      .from('clients')
      .select('id, name, rfc')
      .eq('rfc', rfc.toUpperCase())
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    return {
      isValid: data,
      exists: !!existing,
      existingClient: existing
    };
  } catch (error) {
    console.error('Error validando RFC:', error);
    return {
      isValid: false,
      exists: false,
      error: error.message
    };
  }
};

/**
 * VALIDAR EMAIL ÚNICO
 * Verifica si el email ya está registrado
 */
export const validateEmailUnique = async (email) => {
  try {
    const { data, error } = await supabase
      .rpc('email_exists', { email_input: email.toLowerCase() });
    
    if (error) throw error;
    
    return {
      isUnique: !data,
      exists: data
    };
  } catch (error) {
    console.error('Error validando email:', error);
    return {
      isUnique: false,
      error: error.message
    };
  }
};

/**
 * OBTENER DOCUMENTOS REQUERIDOS
 * Consulta qué documentos se deben asignar según clasificación del cliente
 */
export const getRequiredDocuments = async (municipality, businessType, businessSubtype, riskLevel) => {
  try {
    const { data, error } = await supabase
      .rpc('get_required_documents_for_client', {
        p_municipality: municipality,
        p_business_type: businessType,
        p_business_subtype: businessSubtype,
        p_risk_level: riskLevel
      });
    
    if (error) throw error;
    
    return {
      success: true,
      documents: data || [],
      mandatory: data?.filter(d => d.is_mandatory) || [],
      optional: data?.filter(d => !d.is_mandatory) || []
    };
  } catch (error) {
    console.error('Error obteniendo documentos requeridos:', error);
    return {
      success: false,
      error: error.message,
      documents: []
    };
  }
};

/**
 * CREAR CLIENTE EN SUPABASE
 * Función principal que crea el cliente y asigna documentos
 */
export const createClient = async (formData, currentUserId) => {
  try {
    // Preparar datos JSONB
    const legalContact = formData.legal_contact?.nombre ? {
      nombre: formData.legal_contact.nombre,
      cargo: formData.legal_contact.cargo,
      telefono: formData.legal_contact.telefono,
      email: formData.legal_contact.email
    } : null;

    const operationalContact = formData.operational_contact?.nombre ? {
      nombre: formData.operational_contact.nombre,
      cargo: formData.operational_contact.cargo,
      telefono: formData.operational_contact.telefono,
      email: formData.operational_contact.email
    } : null;

    const coordinates = formData.coordinates?.lat && formData.coordinates?.lng ? {
      lat: parseFloat(formData.coordinates.lat),
      lng: parseFloat(formData.coordinates.lng)
    } : null;

    const boundaries = (formData.boundaries?.norte || formData.boundaries?.sur) ? {
      norte: formData.boundaries.norte,
      sur: formData.boundaries.sur,
      este: formData.boundaries.este,
      oeste: formData.boundaries.oeste
    } : null;

    const electricalConfig = formData.electrical_voltage ? {
      fases: formData.electrical_config?.fases,
      amperes: formData.electrical_config?.amperes,
      transformador: formData.electrical_config?.transformador || false
    } : null;

    const gasInstallation = formData.gas_installation?.tipo ? {
      tipo: formData.gas_installation.tipo,
      capacidad: formData.gas_installation.capacidad,
      ubicacion: formData.gas_installation.ubicacion
    } : null;

    const staffData = formData.staff_data?.total_empleados ? {
      total_empleados: parseInt(formData.staff_data.total_empleados) || 0,
      turnos: formData.staff_data.turnos,
      horarios: formData.staff_data.horarios,
      capacitacion_pc: formData.staff_data.capacitacion_pc || false
    } : null;

    // Llamar a la función de Supabase
    const { data, error } = await supabase.rpc('create_client_with_validations', {
      p_name: formData.name,
      p_commercial_name: formData.commercial_name || null,
      p_rfc: formData.rfc.toUpperCase(),
      p_email: formData.email.toLowerCase(),
      p_phone: formData.phone,
      p_physical_address: formData.physical_address,
      p_fiscal_address: formData.fiscal_address || formData.physical_address,
      p_municipality: formData.municipality,
      p_business_type: formData.business_type,
      p_business_subtype: formData.business_subtype || null,
      p_risk_level: formData.risk_level,
      p_legal_contact: legalContact,
      p_operational_contact: operationalContact,
      p_property_age: formData.property_age ? parseInt(formData.property_age) : null,
      p_previous_uses: formData.previous_uses || null,
      p_total_surface: formData.total_surface ? parseFloat(formData.total_surface) : null,
      p_built_surface: formData.built_surface ? parseFloat(formData.built_surface) : null,
      p_boundaries: boundaries,
      p_coordinates: coordinates,
      p_electrical_voltage: formData.electrical_voltage ? parseInt(formData.electrical_voltage) : null,
      p_electrical_config: electricalConfig,
      p_gas_installation: gasInstallation,
      p_staff_data: staffData,
      p_floating_population: formData.floating_population ? parseInt(formData.floating_population) : null,
      p_educational_data: formData.educational_data || null,
      p_medical_data: formData.medical_data || null,
      p_industrial_data: formData.industrial_data || null,
      p_construction_data: formData.construction_data || null,
      p_hydrocarbon_data: formData.hydrocarbon_data || null,
      p_created_by: currentUserId
    });

    if (error) throw error;

    // Verificar respuesta
    if (!data.success) {
      throw new Error(data.error || 'Error desconocido al crear cliente');
    }

    return {
      success: true,
      clientId: data.client_id,
      clientCode: data.client_code,
      message: `Cliente creado exitosamente con código ${data.client_code}`
    };

  } catch (error) {
    console.error('Error en createClient:', error);
    return {
      success: false,
      error: error.message || 'Error al crear el cliente'
    };
  }
};

/**
 * COMPONENTE DE VISTA PREVIA DEL CÓDIGO
 * Muestra en tiempo real cómo se verá el identificador
 */
export const ClientCodePreview = ({ riskLevel }) => {
  if (!riskLevel) return null;

  const preview = generateClientCodePreview(riskLevel);

  const colorClasses = {
    'alto': 'bg-red-50 border-red-300 text-red-800',
    'medio': 'bg-yellow-50 border-yellow-300 text-yellow-800',
    'bajo': 'bg-green-50 border-green-300 text-green-800'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[riskLevel]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-75 mb-1">
            Vista previa del código de cliente
          </p>
          <p className="text-2xl font-bold font-mono">
            {preview.example}
          </p>
          <p className="text-xs mt-1 opacity-75">
            {preview.description}
          </p>
        </div>
        <div className="text-4xl font-bold opacity-20">
          {preview.prefix}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-current opacity-50">
        <p className="text-xs">
          El número se asignará automáticamente al crear el cliente
        </p>
      </div>
    </div>
  );
};

/**
 * COMPONENTE DE PREVIEW DE DOCUMENTOS REQUERIDOS
 * Muestra qué documentos se asignarán al cliente
 */
export const RequiredDocumentsPreview = ({ municipality, businessType, businessSubtype, riskLevel, documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 text-center">
          Selecciona la clasificación del cliente para ver los documentos requeridos
        </p>
      </div>
    );
  }

  const mandatory = documents.filter(d => d.is_mandatory);
  const optional = documents.filter(d => !d.is_mandatory);

  return (
    <div className="space-y-3">
      {mandatory.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-900 mb-2">
            Documentos Obligatorios ({mandatory.length})
          </h4>
          <ul className="space-y-1">
            {mandatory.map(doc => (
              <li key={doc.document_type_id} className="text-xs text-red-700 flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>{doc.document_code}</strong> - {doc.document_name}
                  {doc.validity_months && (
                    <span className="text-red-600 ml-1">
                      (Vigencia: {doc.validity_months} meses)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {optional.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Documentos Opcionales ({optional.length})
          </h4>
          <ul className="space-y-1">
            {optional.map(doc => (
              <li key={doc.document_type_id} className="text-xs text-blue-700 flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>{doc.document_code}</strong> - {doc.document_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs text-green-800">
          ✓ Se asignarán automáticamente {mandatory.length} documentos obligatorios al crear el cliente
        </p>
      </div>
    </div>
  );
};