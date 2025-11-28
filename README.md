# 🚀 PERFORMIA FRONTEND

Sistema de Evaluación de Desempeño - Aplicación Frontend Angular

---

## 📋 REQUISITOS PREVIOS

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **Angular CLI**: v17.x

```bash
node --version  # Verificar versión de Node
npm --version   # Verificar versión de npm
```

---

## 🛠️ INSTALACIÓN

### 1. Instalar Angular CLI globalmente (si no lo tienes)

```bash
npm install -g @angular/cli@17
```

### 2. Instalar dependencias del proyecto

```bash
cd performia-frontend
npm install
```

### 3. Configurar variables de entorno

Edita `src/environments/environment.ts` con la URL de tu backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // Cambia esto según tu configuración
  appName: 'Performia',
  version: '1.0.0'
};
```

---

## 🚀 EJECUCIÓN

### Modo desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en: `http://localhost:4200`

### Modo producción

```bash
npm run build
# o
ng build --configuration production
```

Los archivos compilados estarán en `dist/performia-frontend`

---

## 📁 ESTRUCTURA DEL PROYECTO

```
performia-frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Servicios singleton, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                  # Componentes reutilizables
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   └── sidebar/
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                # Módulos por funcionalidad
│   │   │   └── auth/
│   │   │       ├── pages/
│   │   │       │   └── login/
│   │   │       ├── auth-routing.module.ts
│   │   │       └── auth.module.ts
│   │   │
│   │   ├── app-routing.module.ts    # Routing principal
│   │   └── app.module.ts            # Módulo raíz
│   │
│   ├── styles/                      # Estilos globales SCSS
│   │   ├── _variables.scss          # Variables (colores, tamaños)
│   │   ├── _mixins.scss             # Mixins reutilizables
│   │   └── styles.scss              # Estilos globales
│   │
│   ├── assets/                      # Recursos estáticos
│   │   └── images/
│   │       └── logo-performia.png
│   │
│   ├── environments/                # Configuración de entornos
│   │   ├── environment.ts           # Desarrollo
│   │   └── environment.prod.ts      # Producción
│   │
│   ├── index.html                   # HTML principal
│   └── main.ts                      # Punto de entrada
│
├── angular.json                     # Configuración de Angular
├── package.json                     # Dependencias
├── tsconfig.json                    # Configuración de TypeScript
└── README.md                        # Este archivo
```

---

## 🎨 DESIGN SYSTEM

El proyecto incluye un design system completo con:

- **Colores**: Azul corporativo, verde (éxito), amarillo (advertencia), rojo (error)
- **Tipografía**: Inter (fuente principal)
- **Componentes**: Botones, cards, inputs, badges, tablas, modales
- **Utilidades**: Clases CSS para espaciado, tipografía, colores

Ver `DESIGN_SYSTEM_PERFORMIA.md` para más detalles.

---

## 🔐 AUTENTICACIÓN

### Login

El sistema utiliza JWT para autenticación:

1. Usuario ingresa email y contraseña
2. Backend valida y devuelve token JWT
3. Token se guarda en `localStorage`
4. Todas las peticiones HTTP incluyen el token en el header `Authorization`

### Roles disponibles

- **Colaborador**: Puede ver y responder sus evaluaciones
- **Manager**: Puede evaluar a su equipo y gestionar objetivos
- **RRHH**: Puede gestionar usuarios, formularios y evaluaciones
- **Administrador**: Acceso total al sistema
- **Director**: Puede ver reportes globales y análisis

### Guards

- **AuthGuard**: Protege rutas que requieren autenticación
- **RoleGuard**: Protege rutas según el rol del usuario

---

## 📦 DEPENDENCIAS PRINCIPALES

```json
{
  "@angular/core": "^17.0.0",
  "@angular/router": "^17.0.0",
  "@angular/forms": "^17.0.0",
  "@angular/common": "^17.0.0",
  "rxjs": "~7.8.0",
  "typescript": "~5.2.2"
}
```

---

## 🧪 TESTING

```bash
npm test
# o
ng test
```

---

## 📝 SCRIPTS DISPONIBLES

```bash
npm start          # Iniciar en modo desarrollo
npm run build      # Compilar para producción
npm test           # Ejecutar tests
npm run lint       # Verificar código
```

---

## 🔧 CONFIGURACIÓN DEL BACKEND

Asegúrate de que el backend esté corriendo en `http://localhost:8000` (o la URL configurada en `environment.ts`).

El frontend espera los siguientes endpoints:

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/cambiar-password` - Cambiar contraseña
- `POST /api/auth/recuperar-password` - Solicitar recuperación
- `POST /api/auth/reset-password` - Restablecer contraseña

---

## 🐛 TROUBLESHOOTING

### Error: Cannot find module '@angular/cli'

```bash
npm install -g @angular/cli
```

### Error: Port 4200 is already in use

```bash
ng serve --port 4300
```

### Error de CORS

Asegúrate de que el backend permita peticiones desde `http://localhost:4200`

---

## 📄 LICENCIA

© 2025 Percy Leonardo Marca Rojas - Performia

---

## 👨‍💻 AUTOR

**Percy Leonardo Marca Rojas**

---

## 🔜 PRÓXIMOS PASOS

1. ✅ Login implementado
2. ⏳ Recuperar contraseña
3. ⏳ Dashboard por roles
4. ⏳ Gestión de usuarios
5. ⏳ Gestión de evaluaciones
6. ⏳ Reportes y análisis

---

## 📞 SOPORTE

Para dudas o problemas, contacta al desarrollador.
