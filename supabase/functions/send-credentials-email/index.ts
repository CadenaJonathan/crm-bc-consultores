// =====================================================
// SUPABASE EDGE FUNCTION - ENVÍO DE EMAILS
// =====================================================
// Ubicación: supabase/functions/send-credentials-email/index.ts
//
// Esta función se debe desplegar en Supabase Edge Functions
// para enviar emails de forma segura usando Resend

/*

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface EmailRequest {
  to: string
  recipientName: string
  email: string
  password: string
  cargo?: string
  clientName?: string
}

serve(async (req) => {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Parsear body
    const { to, recipientName, email, password, cargo, clientName }: EmailRequest = await req.json()

    // Validaciones
    if (!to || !recipientName || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validar que la petición viene de un usuario autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar token con Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el usuario sea admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generar HTML del email
    const emailHTML = generateEmailHTML(recipientName, email, password, cargo, clientName)

    // Enviar email usando Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Protección Civil Querétaro <noreply@proteccioncivil.qro.gob.mx>',
        to: [to],
        subject: 'Credenciales de Acceso - Sistema Protección Civil',
        html: emailHTML
      })
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      throw new Error(`Error de Resend: ${JSON.stringify(errorData)}`)
    }

    const resendData = await resendResponse.json()

    // Registrar envío en audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'EMAIL_SENT',
      table_name: 'client_users',
      new_values: {
        email_to: to,
        email_type: 'credentials',
        resend_id: resendData.id
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email enviado correctamente',
        emailId: resendData.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error enviando email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHTML(
  recipientName: string, 
  email: string, 
  password: string, 
  cargo?: string,
  clientName?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credenciales de Acceso</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .credentials-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .credential-item {
      margin: 15px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
      display: block;
      margin-bottom: 8px;
    }
    .credential-value {
      font-family: 'Courier New', monospace;
      background: white;
      padding: 12px 16px;
      border-radius: 6px;
      border: 2px solid #e5e7eb;
      display: block;
      font-size: 16px;
      color: #1f2937;
      font-weight: 600;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning-box strong {
      display: block;
      margin-bottom: 5px;
      color: #92400e;
    }
    .steps {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .steps h3 {
      margin: 0 0 15px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .step {
      margin: 12px 0;
      padding-left: 25px;
      position: relative;
      color: #1e3a8a;
    }
    .step:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      margin: 25px 0;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .support-box {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .support-box h3 {
      color: #374151;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .support-box ul {
      list-style: none;
      padding: 0;
    }
    .support-box li {
      margin: 8px 0;
      color: #6b7280;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Bienvenido al Sistema</h1>
      <p>Protección Civil - Querétaro</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hola <strong>${recipientName}</strong>,
      </div>
      
      <p>Tu cuenta ha sido creada exitosamente en el Sistema de Protección Civil${clientName ? ` para <strong>${clientName}</strong>` : ''}. A continuación encontrarás tus credenciales de acceso:</p>
      
      <div class="credentials-box">
        <div class="credential-item">
          <span class="credential-label">📧 Correo Electrónico (Usuario):</span>
          <span class="credential-value">${email}</span>
        </div>
        
        <div class="credential-item">
          <span class="credential-label">🔑 Contraseña Temporal:</span>
          <span class="credential-value">${password}</span>
        </div>
      </div>
      
      <div class="warning-box">
        <strong>⚠️ IMPORTANTE:</strong>
        Por tu seguridad, <strong>debes cambiar esta contraseña</strong> en tu primer inicio de sesión. El sistema te pedirá que establezcas una nueva contraseña segura.
      </div>
      
      <div class="steps">
        <h3>📝 Pasos para acceder:</h3>
        <div class="step">Haz clic en el botón "Acceder al Sistema" abajo</div>
        <div class="step">Ingresa tu email y contraseña temporal</div>
        <div class="step">El sistema te pedirá cambiar tu contraseña</div>
        <div class="step">Crea una contraseña segura con mínimo 8 caracteres</div>
        <div class="step">¡Listo! Ya puedes usar todas las funcionalidades</div>
      </div>
      
      <center>
        <a href="${Deno.env.get('PUBLIC_SITE_URL') || 'https://proteccioncivil.qro.gob.mx'}/login" class="button">
          🚀 Acceder al Sistema
        </a>
      </center>
      
      <div class="support-box">
        <h3>📚 ¿Necesitas ayuda?</h3>
        <p>Si tienes problemas para acceder o alguna pregunta, no dudes en contactarnos:</p>
        <ul>
          <li>📞 Teléfono: 442 245 5000</li>
          <li>📧 Email: soporte@proteccioncivil.qro.gob.mx</li>
          <li>🕐 Horario: Lunes a Viernes, 9:00 - 18:00</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
      <p>© ${new Date().getFullYear()} Sistema de Protección Civil - Querétaro</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/* 
=====================================================
CONFIGURACIÓN REQUERIDA EN SUPABASE:
=====================================================

1. Crear la Edge Function:
   supabase functions new send-credentials-email

2. Copiar este código en:
   supabase/functions/send-credentials-email/index.ts

3. Configurar secrets:
   supabase secrets set RESEND_API_KEY=tu_api_key_aqui
   supabase secrets set PUBLIC_SITE_URL=https://tudominio.com

4. Desplegar función:
   supabase functions deploy send-credentials-email

5. Obtener Resend API Key:
   - Registrarse en https://resend.com
   - Crear API Key en el dashboard
   - Verificar dominio de envío

6. Actualizar AuthIntegration.jsx para llamar esta función:
   
   const { data, error } = await supabase.functions.invoke('send-credentials-email', {
     body: {
       to: recipientEmail,
       recipientName: userData.full_name,
       email: recipientEmail,
       password: temporaryPassword,
       cargo: userData.cargo,
       clientName: clientData.name
     }
   })

=====================================================
*/