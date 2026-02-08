# Project Manager

Sistema de gestión de proyectos estilo Trello/Jira híbrido.

## 📁 Estructura del proyecto
```
project-manager/
├── backend/     # API REST (NestJS + PostgreSQL + Prisma)
└── frontend/    # Web app (Angular) - Próximamente
```

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma
- **Autenticación**: JWT

### Frontend (Próximamente)
- **Framework**: Angular
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS / SCSS

## 📦 Instalación y uso

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npx prisma migrate dev
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

## ✨ Funcionalidades

### Implementadas
- ✅ Autenticación y autorización (JWT)
- ✅ Gestión de proyectos (CRUD)
- ✅ Sistema de miembros y roles
- ✅ Tableros Kanban con múltiples listas
- ✅ Tareas con drag & drop
- ✅ Asignación de tareas
- ✅ Sistema de prioridades
- ✅ Comentarios en tareas
- ✅ Etiquetas (labels) personalizables
- ✅ Historial de cambios

### En desarrollo
- ⏳ Frontend con Angular
- ⏳ Notificaciones en tiempo real (WebSockets)
- ⏳ Búsqueda avanzada de tareas
- ⏳ Reportes y estadísticas

## 🚀 Deploy

Próximamente

## 📝 Licencia

MIT