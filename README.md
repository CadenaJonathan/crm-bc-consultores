# CRM Protección Civil - Querétaro

Sistema CRM especializado para gestión documental de protección civil en los 18 municipios de Querétaro.

## 🚀 Características Principales

- ✅ Gestión de clientes multi-establecimiento
- ✅ QR dinámicos con validación en tiempo real
- ✅ Alertas automáticas de vencimiento
- ✅ Reportes exportables
- ✅ Sistema multi-rol (Cliente, Admin, SuperAdmin)

## 🛠 Stack Tecnológico

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Microservicio:** Node.js + Express
- **Storage:** Cloudflare R2
- **Hosting:** Vercel + Railway

## 📦 Estructura del Proyecto

- `frontend/` - Aplicación React
- `microservice/` - Servicio Node.js para PDF/QR
- `database/` - Scripts SQL y migraciones
- `docs/` - Documentación técnica

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
cd frontend && npm install
cd ../microservice && npm install

# Variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev