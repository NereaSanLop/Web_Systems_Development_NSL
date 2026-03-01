# Time Bank - Sistema de Gestión de Usuarios

Un sistema web full-stack de gestión de usuarios con autenticación JWT, roles de usuario (admin/user) y arquitectura MVC.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Capturas de Pantalla](#capturas-de-pantalla)

## Características

### Autenticación y Autorización
- Registro de usuarios con opción de rol admin
- Login con JWT (JSON Web Tokens)
- Protección de rutas según autenticación
- Control de acceso basado en roles (RBAC)

### Gestión de Usuarios
- Dashboard personalizado para cada usuario
- Panel de administración para usuarios admin
- CRUD completo de usuarios (solo admin)
- Visualización de perfiles con nombre, email y rol

### Interfaz de Usuario
- Diseño responsivo con Bootstrap 5
- Navegación intuitiva entre vistas
- Alertas y confirmaciones para acciones críticas
- Estados de carga (spinners)

## Tecnologías

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para manejo de base de datos
- **SQLite** - Base de datos ligera
- **PyJWT** - Generación y validación de tokens
- **Passlib & Bcrypt** - Hash seguro de contraseñas
- **Pydantic** - Validación de datos

### Frontend
- **React 19** - Biblioteca de interfaz de usuario
- **React Router DOM** - Enrutamiento SPA
- **Axios** - Cliente HTTP
- **Bootstrap 5** - Framework CSS responsivo

## Arquitectura

El proyecto sigue el patrón **MVC (Model-View-Controller)**:

### Backend (FastAPI)
```
├── Models (models.py)          → Definición de entidades (User, Role)
├── Views (routers/)            → Endpoints HTTP
└── Controllers (controllers/)  → Lógica de negocio
```

### Frontend (React)
```
├── Models (localStorage)       → Gestión de token
├── Views (components/)         → Componentes React
└── Controllers (controllers/)  → Lógica de negocio y llamadas API
```

## Instalación

### Prerrequisitos
- Python 3.9+
- Node.js 16+
- npm o yarn

### Backend

```bash
# Clonar el repositorio
git clone <repository-url>
cd Web_Systems_Development_NSL

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En macOS/Linux:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear archivo backend/.env y añadir:
# SECRET_KEY=tu_cadena_secreta_de_minimo_32_caracteres
# Hay un archivo backend/.env.example que sirve de ejemplo


# Iniciar servidor backend
cd backend
uvicorn app.main:app --reload
```

El backend estará disponible en: `http://127.0.0.1:8000`

### Frontend

```bash
# En otra terminal, ir a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

El frontend estará disponible en: `http://localhost:3000`

## Uso

### 1. Registro de Usuario

- Navega a `http://localhost:3000/signup`
- Completa el formulario con:
  - Nombre
  - Email
  - Contraseña
  - (Opcional) Marca el checkbox "Registrarse como Administrador"
- Haz clic en "Registrarse"

### 2. Iniciar Sesión

- Navega a `http://localhost:3000/login`
- Ingresa tu email y contraseña
- Serás redirigido al Dashboard

### 3. Dashboard (Usuario Normal)

- Ver tu perfil (nombre, email, rol)
- Cerrar sesión

### 4. Panel de Administración (Solo Admin)

- Desde el Dashboard, haz clic en "Administrar"
- Ver lista completa de usuarios
- Borrar usuarios (con confirmación)
- Volver al Dashboard

## Estructura del Proyecto

```
Web_Systems_Development_NSL/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── __init__.py
│   │   │   ├── auth_controller.py      # Lógica de autenticación
│   │   │   └── user_controller.py      # Lógica de usuarios
│   │   ├── routers/
│   │   │   ├── auth_router.py          # Endpoints de auth
│   │   │   └── users_router.py         # Endpoints de usuarios
│   │   ├── auth.py                     # JWT y hash de passwords
│   │   ├── database.py                 # Configuración de DB
│   │   ├── dependencies.py             # Dependencias de FastAPI
│   │   ├── main.py                     # Punto de entrada
│   │   ├── models.py                   # Modelos SQLAlchemy
│   │   └── schemas.py                  # Schemas Pydantic
│   ├── requirements.txt
│   └── timebank.db                     # Base de datos SQLite
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin.js                # Panel de administración
│   │   │   ├── Dashboard.js            # Dashboard de usuario
│   │   │   ├── Home.js                 # Página de inicio
│   │   │   ├── Login.js                # Formulario de login
│   │   │   ├── Signup.js               # Formulario de registro
│   │   │   └── ProtectedRoute.jsx      # HOC para rutas protegidas
│   │   ├── controllers/
│   │   │   ├── authController.js       # Lógica de autenticación
│   │   │   └── userController.js       # Lógica de usuarios
│   │   ├── services/
│   │   │   └── api.js                  # Configuración de Axios
│   │   ├── App.js                      # Componente principal
│   │   └── index.js                    # Punto de entrada
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── README.md
└── requirements.txt
```

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |

**Request Body - Signup:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "mypassword123",
  "is_admin": false
}
```

**Request Body - Login:**
```json
{
  "email": "juan@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usuarios

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/me` | Obtener perfil del usuario actual | Sí | user/admin |
| GET | `/users` | Listar todos los usuarios | Sí | admin |
| DELETE | `/users/{user_id}` | Borrar un usuario | Sí | admin |

**Response - GET /me:**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "user"
}
```

**Response - GET /users:**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
]
```

### Headers Requeridos para Endpoints Protegidos

```
Authorization: Bearer <token_jwt>
```

## Capturas de Pantalla

### Página de Inicio
Pantalla de bienvenida con opciones de Login y Registro.

### Login
Formulario de inicio de sesión con validación de credenciales.

### Registro
Formulario de registro con opción de crear cuenta como administrador.

### Dashboard (Usuario)
Vista del perfil personal con información del usuario.

### Dashboard (Admin)
Vista del perfil con botón adicional "Administrar" para acceder al panel de administración.

### Panel de Administración
Tabla con lista completa de usuarios y opción de borrar.

## Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración (60 minutos)
- Validación de tokens en cada petición protegida
- CORS configurado para desarrollo
- Protección de rutas frontend y backend
- Confirmación antes de acciones destructivas

## Testing

### Documentación Interactiva de la API

FastAPI genera automáticamente documentación interactiva:

```
http://127.0.0.1:8000/docs
```

Aquí puedes probar todos los endpoints directamente desde el navegador.