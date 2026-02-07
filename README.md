# Stocka Client

Sistema de Control de Inventarios para pequeños negocios en México.

## Stack Tecnológico

- **React 18.2+** con TypeScript
- **Vite 5+** como build tool
- **React Router v6** para navegación
- **Tailwind CSS 3.4+** con shadcn/ui
- **React Hook Form 7.49+** con Zod para validación
- **Zustand 4.4+** para estado global
- **react-i18next** para internacionalización (EN/ES)
- **Axios** para peticiones HTTP
- **lucide-react** para iconos

## Estructura del Proyecto

```
stocka-client/
└── src/
    ├── app/                      # Configuración de la aplicación
    │   ├── App.tsx               # Componente raíz
    │   ├── router.tsx            # Configuración de rutas
    │   └── providers.tsx         # Providers (Router, etc.)
    │
    ├── features/                 # Módulos por funcionalidad
    │   ├── auth/                 # Feature de autenticación
    │   │   ├── api/              # Mocks y futura API
    │   │   ├── components/       # Componentes específicos
    │   │   ├── pages/            # Páginas
    │   │   ├── hooks/            # Hooks
    │   │   ├── store/            # Estado con Zustand
    │   │   ├── types/            # Tipos TypeScript
    │   │   └── schemas/          # Validaciones Zod
    │   │
    │   └── dashboard/            # Feature de dashboard
    │
    ├── shared/                   # Código compartido
    │   ├── components/           # Componentes reutilizables
    │   │   └── ui/               # shadcn/ui components
    │   ├── layouts/              # Layouts
    │   ├── hooks/                # Hooks compartidos
    │   ├── lib/                  # Utilidades
    │   └── types/                # Tipos globales
    │
    ├── locales/                  # Traducciones i18n
    │   ├── en/                   # Inglés
    │   └── es/                   # Español
    │
    └── styles/                   # Estilos globales
```

## Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd stocka-client

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.development

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Ejecutar ESLint
```

## Features Implementados

### Autenticación (Mock)

- **Login**: Email/username + password
- **Registro**: Email, username, password
- **Logout**: Limpieza de sesión
- **Persistencia**: LocalStorage

### Internacionalización

- Idiomas: Inglés (default), Español
- Detección automática del idioma del navegador
- Selector de idioma en la UI

### UI/UX

- Diseño responsive (Mobile-first)
- Componentes shadcn/ui personalizados
- Paleta de colores Stocka
- Loading states con spinners
- Validación de formularios en tiempo real

## Flujo de Autenticación (Mock)

1. Usuario accede a `/auth/login` o `/auth/register`
2. Completa el formulario
3. Mock simula delay de red (800-1500ms)
4. Si éxito → guarda tokens → redirige a `/dashboard`
5. Si error → muestra mensaje en formulario
6. En `/dashboard` puede hacer logout

## Variables de Entorno

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Stocka
VITE_APP_VERSION=0.0.1
```

## Próximos Pasos

- [ ] Conectar API real
- [ ] Implementar módulo de inventarios
- [ ] Gestión de productos
- [ ] Reportes y dashboard
- [ ] Configuración de usuario

## Licencia

MIT
