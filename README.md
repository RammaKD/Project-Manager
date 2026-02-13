# Project Manager

Sistema de gestión de proyectos estilo Trello/Jira híbrido.

## 📁 Estructura del proyecto
```
ProjectManager/
├── Backend/     # API REST (NestJS + PostgreSQL + Prisma)
└── Frontend/    # Web app (Angular)
```

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma
- **Autenticación**: JWT

### Frontend
- **Framework**: Angular
- **Lenguaje**: TypeScript
- **Estilos**: CSS

## 📦 Instalación y uso

### Backend (local)
```bash
cd Backend
npm install
npx prisma migrate dev
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

Variables de entorno requeridas:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Frontend (local)
```bash
cd Frontend
npm install
ng serve
```

La app estará disponible en `http://localhost:4200`

## ✨ Funcionalidades

### Implementadas
- ✅ Autenticación y autorización (JWT)
- ✅ Gestión de proyectos (CRUD)
- ✅ Sistema de miembros y roles
- ✅ Tableros Kanban con múltiples listas
- ✅ Tareas con drag & drop
- ✅ Asignación de tareas
- ✅ Sistema de prioridades
- ✅ Comentarios en tareas (modal dedicado)
- ✅ Etiquetas (labels) personalizables
- ✅ Conteo de comentarios por tarea

### En desarrollo
- ⏳ Notificaciones en tiempo real (WebSockets)
- ⏳ Búsqueda avanzada de tareas
- ⏳ Reportes y estadísticas

## 🚀 Deploy

### Backend (Render)
1. Crear Web Service con Root Directory `Backend`.
2. Build: `npm install && npm run build`.
3. Start: `npm run start:prod`.
4. Configurar env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.

### Frontend (Vercel)
1. Importar repo y seleccionar Root Directory `Frontend`.
2. Build: `npm run build -- --configuration production`.
3. Output: `dist/Frontend/browser`.
4. Ajustar `CORS_ORIGIN` en Render con el dominio de Vercel.

## 📝 Licencia

MIT