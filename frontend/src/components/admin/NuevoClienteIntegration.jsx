// NuevoClienteIntegration.jsx
// Este archivo conecta el formulario con Supabase

import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

/**
 * VISTA PREVIA DEL CÓDIGO DE CLIENTE
 */
export const generateClientCodePreview = (riskLevel) => {
  const year = new Date().getFullYear();
  
  const prefixes = {
    'alto': 'CCR',
    'medio': 'RM',
    'bajo': 'RB'
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
 */
export const validateRFCInDB = async (rfc) => {
  try {
    const { data, error } = await supabase
      .rpc('validate_rfc', { rfc_input: rfc.toUpperCase() });
    
    if (error) throw error;
    
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
 * VALIDAR EMAIL ÚNICO (para usuarios de cliente Y email de empresa)
 */
export const validateEmailUnique = async (email) => {
  try {
    // Verificar en clients
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (clientError && clientError.code !== 'PGRST116') throw clientError;
    
    // Verificar en client_users
    const { data: userData, error: userError } = await supabase
      .from('client_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (userError && userError.code !== 'PGRST116') throw userError;
    
    const exists = !!(clientData || userData);
    
    return {
      isUnique: !exists,
      exists: exists,
      existingType: clientData ? 'empresa' : userData ? 'usuario' : null
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
 * CREAR CLIENTE Y USUARIO EN SUPABASE
 */
export const createClient = async (formData, currentUserId) => {
  try {
    console.log('=== INICIANDO CREACIÓN DE CLIENTE ===');
    console.log('User ID:', currentUserId);
    console.log('Form Data:', formData);

    // Preparar datos JSONB
    const legalContact = formData.legal_contact?.nombre ? {
      nombre: formData.legal_contact.nombre,
      cargo: formData.legal_contact.cargo,
      telefono: formData.legal_contact.telefono,
      email: formData.legal_contact.email
    } : null;

    const operationalContact = formData.operational_contact?.nombre ? {
      nombre: formData.operational_contact.nombre,
      area: formData.operational_contact.area,
      cargo: formData.operational_contact.cargo,
      telefono: formData.operational_contact.telefono,
      celular: formData.operational_contact.celular,
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

    // PASO 1: Generar código de cliente
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_client_code', { p_risk_level: formData.risk_level });

    if (codeError) throw new Error('Error generando código: ' + codeError.message);
    
    const clientCode = codeData;

    // PASO 2: Insertar cliente
    const clientData = {
      name: formData.name,
      commercial_name: formData.commercial_name || null,
      rfc: formData.rfc.toUpperCase(),
      phone: formData.phone,
      physical_address: formData.physical_address,
      fiscal_address: formData.fiscal_address || formData.physical_address,
      municipality: formData.municipality,
      business_type: formData.business_type,
      business_subtype: formData.business_subtype || null,
      risk_level: formData.risk_level,
      client_code: clientCode,
      legal_contact: legalContact,
      operational_contact: operationalContact,
      property_age: formData.property_age ? parseInt(formData.property_age) : null,
      previous_uses: formData.previous_uses || null,
      total_surface: formData.total_surface ? parseFloat(formData.total_surface) : null,
      built_surface: formData.built_surface ? parseFloat(formData.built_surface) : null,
      boundaries: boundaries,
      coordinates: coordinates,
      electrical_voltage: formData.electrical_voltage ? parseInt(formData.electrical_voltage) : null,
      electrical_config: electricalConfig,
      gas_installation: gasInstallation,
      staff_data: staffData,
      floating_population: formData.floating_population ? parseInt(formData.floating_population) : null,
      educational_data: formData.educational_data || null,
      medical_data: formData.medical_data || null,
      industrial_data: formData.industrial_data || null,
      construction_data: formData.construction_data || null,
      hydrocarbon_data: formData.hydrocarbon_data || null,
      created_by: currentUserId,
      status: 'active'
    };

    console.log('Insertando cliente:', clientData);

    const { data: insertedClient, error: insertError } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando cliente:', insertError);
      throw new Error(insertError.message);
    }

    console.log('Cliente insertado:', insertedClient);

    // PASO 3: Crear usuario del cliente (si hay operational_contact)
    let clientUserId = null;
    let temporaryPassword = null;

    if (formData.operational_contact?.email && formData.operational_contact?.nombre) {
      console.log('Creando usuario del cliente...');
      
      const { data: userResult, error: userError } = await supabase
        .rpc('create_client_user_account', {
          p_client_id: insertedClient.id,
          p_email: formData.operational_contact.email,
          p_full_name: formData.operational_contact.nombre,
          p_area: formData.operational_contact.area || 'Seguridad e Higiene',
          p_cargo: formData.operational_contact.cargo || 'Responsable de trámites',
          p_phone: formData.operational_contact.telefono,
          p_celular: formData.operational_contact.celular || null,
          p_created_by: currentUserId
        });

      if (userError) {
        console.error('Error creando usuario:', userError);
        // No lanzar error, solo registrar
      } else if (userResult?.success) {
        clientUserId = userResult.user_id;
        temporaryPassword = userResult.temporary_password;
        console.log('Usuario creado:', clientUserId);
        
        // TODO: Aquí deberías enviar el email con las credenciales
        // await sendCredentialsEmail(formData.operational_contact.email, temporaryPassword);
      }
    }

    // PASO 4: Asignar documentos requeridos
    const docsResult = await getRequiredDocuments(
      formData.municipality,
      formData.business_type,
      formData.business_subtype,
      formData.risk_level
    );

    if (docsResult.success && docsResult.documents.length > 0) {
      const documentsToAssign = docsResult.documents.map(doc => ({
        client_id: insertedClient.id,
        document_type_id: doc.document_type_id,
        status: 'pending',
        is_mandatory: doc.is_mandatory,
        uploaded_by: doc.uploaded_by || 'client', // 'client', 'consultant', 'both'
        assigned_to: doc.uploaded_by === 'consultant' ? 'consultant' : 'client',
        created_by: currentUserId
      }));

      const { error: docsError } = await supabase
        .from('client_documents')
        .insert(documentsToAssign);

      if (docsError) {
        console.error('Error asignando documentos:', docsError);
      } else {
        console.log(`${documentsToAssign.length} documentos asignados correctamente`);
      }
    }

    // PASO 5: Asignar documentos adicionales personalizados (si los hay)
    if (formData.additional_documents && formData.additional_documents.length > 0) {
      const additionalDocsToAssign = formData.additional_documents.map(docTypeId => ({
        client_id: insertedClient.id,
        document_type_id: docTypeId,
        status: 'pending',
        is_mandatory: false,
        uploaded_by: 'client',
        assigned_to: 'client',
        created_by: currentUserId
      }));

      const { error: additionalDocsError } = await supabase
        .from('client_documents')
        .insert(additionalDocsToAssign);

      if (additionalDocsError) {
        console.error('Error asignando documentos adicionales:', additionalDocsError);
      } else {
        console.log(`${additionalDocsToAssign.length} documentos adicionales asignados`);
      }
    }

    console.log('=== CLIENTE CREADO EXITOSAMENTE ===');
    console.log('Client ID:', insertedClient.id);
    console.log('Client Code:', clientCode);
    console.log('Client User ID:', clientUserId);

    return {
      success: true,
      clientId: insertedClient.id,
      clientCode: clientCode,
      clientUserId: clientUserId,
      temporaryPassword: temporaryPassword, // Solo para log, NO mostrar al usuario
      message: `Cliente creado exitosamente con código ${clientCode}`
    };

  } catch (error) {
    console.error('=== ERROR EN createClient ===');
    console.error('Error completo:', error);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message || 'Error al crear el cliente'
    };
  }
};

/**
 * COMPONENTE DE VISTA PREVIA DEL CÓDIGO
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

  // Agrupar por quien debe subirlos
  const clientDocs = documents.filter(d => d.uploaded_by === 'client');
  const consultantDocs = documents.filter(d => d.uploaded_by === 'consultant');
  const bothDocs = documents.filter(d => d.uploaded_by === 'both');

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
                  {doc.uploaded_by && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 rounded text-red-800">
                      {doc.uploaded_by === 'client' ? '👤 Cliente' : 
                       doc.uploaded_by === 'consultant' ? '🏢 Consultoría' : 
                       '👥 Ambos'}
                    </span>
                  )}
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
        <p className="text-xs text-green-800 mb-2">
          ✓ Se asignarán automáticamente {mandatory.length} documentos obligatorios
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white rounded px-2 py-1">
            <span className="font-medium">👤 Cliente:</span> {clientDocs.length}
          </div>
          <div className="bg-white rounded px-2 py-1">
            <span className="font-medium">🏢 Consultoría:</span> {consultantDocs.length}
          </div>
          <div className="bg-white rounded px-2 py-1">
            <span className="font-medium">👥 Ambos:</span> {bothDocs.length}
          </div>
        </div>
      </div>
    </div>
  );
};