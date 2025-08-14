# CRM Protección Civil - Querétaro

Sistema CRM especializado para gestión documental de protección civil en los 18 municipios de Querétaro.

## ��� Características Principales

- ✅ Gestión de clientes multi-establecimiento
- ✅ QR dinámicos con validación en tiempo real
- ✅ Alertas automáticas de vencimiento (60, 30, 15 días)
- ✅ Reportes exportables en PDF/Excel
- ✅ Sistema multi-rol (Cliente, Admin, SuperAdmin)
- ✅ Normativas específicas por municipio

## ��� Stack Tecnológico

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Microservicio:** Node.js + Express
- **Storage:** Cloudflare R2 + Supabase Storage
- **Hosting:** Vercel (Frontend) + Railway (Microservicio)
- **Email:** Resend
- **Monitoring:** Sentry

## ��� Estructura del Proyecto

```
crm-proteccion-civil-queretaro/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # APIs y servicios
│   │   └── utils/           # Utilidades
│   ├── public/              # Assets estáticos
│   └── package.json
├── microservice/            # Servicio Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── services/        # Lógica de negocio
│   │   ├── routes/          # Rutas de API
│   │   └── utils/           # Utilidades
│   ├── templates/           # Templates de email
│   └── package.json
├── database/                # Scripts SQL
│   ├── migrations/          # Migraciones
│   └── seeds/               # Datos iniciales
├── docs/                    # Documentación
│   ├── api/                 # Documentación de APIs
│   ├── deployment/          # Guías de deployment
│   └── user-guides/         # Manuales de usuario
└── .github/workflows/       # CI/CD pipelines
```

## ��� Desarrollo Local

### Prerrequisitos
- Node.js 18+
- npm 8+
- Git

### Configuración Inicial

1. **Clonar repositorio:**
```bash
git clone https://github.com/TU-USERNAME/crm-proteccion-civil-queretaro.git
cd crm-proteccion-civil-queretaro
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Instalar dependencias:**
```bash
# Frontend
cd frontend && npm install

# Microservicio
cd ../microservice && npm install
```

4. **Ejecutar en desarrollo:**
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Microservicio
cd microservice && npm run dev
```

## ��� URLs de Desarrollo

- **Frontend:** http://localhost:3000
- **Microservicio:** http://localhost:3001
- **Documentación API:** http://localhost:3001/docs

## ��� Deployment

### Frontend (Vercel)
- **Producción:** https://tu-app.vercel.app
- **Deploy automático:** Push a rama `main`

### Microservicio (Railway)
- **Producción:** https://tu-microservice.railway.app
- **Deploy automático:** Push a rama `main`

## ��� Documentación

- [Guía de Instalación](docs/deployment/installation.md)
- [API Documentation](docs/api/README.md)
- [Manual de Usuario](docs/user-guides/README.md)
- [Manual de Administrador](docs/user-guides/admin/README.md)

## ��� Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## ��� Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ��� Contacto

- **Desarrollador:** [Tu Nombre]
- **Email:** tu-email@dominio.com
- **Proyecto:** [Link del repositorio]

---

⭐ Si este proyecto te parece útil, ¡dale una estrella!

