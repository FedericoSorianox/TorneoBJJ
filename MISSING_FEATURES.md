# ❌ FUNCIONALIDADES FALTANTES - BJJ Tournament Manager

Este documento lista todas las funcionalidades que deberían existir pero que aún NO están implementadas o están incompletas.

---

## 🔴 CRÍTICAS (Impiden uso básico de la app)

### 1. Athletes - DELETE Operation
**Estado:** ROTO ❌  
**Prioridad:** CRÍTICA

**Qué falta:**
- El botón DELETE no ejecuta la función
- No se eliminan atletas de la base de datos

**Código Afectado:**
- `client/src/pages/AthleteManager.tsx` (línea 103)

**Implementación Requerida:**
- Verificar event binding del botón
- Asegurar que `handleDelete` se ejecute
- Verificar que el `confirm()` dialog funcione

---

### 2. Athletes - UPDATE Operation

**Qué falta:**
- Los cambios en la edición no se persisten en BD
- El formulario resetea pero los datos no se actualizan

**Código Afectado:**
- `client/src/pages/AthleteManager.tsx` (línea 37-51)

**Implementación Requerida:**
- Verificar que el payload del PUT request sea correcto
- Agregar logging para debug
- Verificar que el backend procese el update correctamente

---

### 3. Tournament Details - Mostrar Información del Torneo

**Qué falta:**
- La página `/tournaments/:id` no muestra nombre, fecha, ubicación del torneo
- Solo muestra categorías

**Código Afectado:**
- `client/src/pages/TournamentDetail.tsx` (todo el componente)
- `client/src/api.ts` (falta exportar `getTournamentById`)

**Implementación Requerida:**
```typescript
// En api.ts
export const getTournamentById = (id: string) => 
    api.get(`/tournaments/${id}`).then(res => res.data);

// En TournamentDetail.tsx
const [tournament, setTournament] = useState<any>(null);

useEffect(() => {
    if (!id) return;
    Promise.all([
        getTournamentById(id),
        getCategories(id),
        getAthletes()
    ]).then(([t, cats, aths]) => {
        setTournament(t);
        setCategories(cats);
        setAthletes(aths);
    });
}, [id]);

// En el JSX:
<h1>{tournament?.name || 'Tournament Details'}</h1>
<p>{new Date(tournament?.date).toLocaleDateString()} - {tournament?.location}</p>
<span>Status: {tournament?.status}</span>
```

---

## 🟡 IMPORTANTES (Limitan funcionalidad significativamente)

### 4. Testing Infrastructure
**Estado:** NO EXISTE ❌  
**Prioridad:** ALTA

**Qué falta:**
- ❌ Sin framework de testing (Vitest, Jest)
- ❌ Sin tests unitarios
- ❌ Sin tests de integración
- ❌ Sin tests E2E
- ❌ 0% de code coverage

**Implementación Requerida:**
1. **Instalar Vitest para cliente:**
```bash
cd client
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

2. **Instalar Jest para servidor:**
```bash
cd server
npm install -D jest ts-jest @types/jest supertest
```

3. **Crear archivos de config:**
```javascript
// client/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

4. **Escribir tests mínimos:**
```typescript
// client/src/pages/AthleteManager.test.tsx
import { render, screen } from '@testing-library/react';
import AthleteManager from './AthleteManager';

describe('AthleteManager', () => {
  it('should render athlete list', () => {
    render(<AthleteManager />);
    expect(screen.getByText(/Athletes/i)).toBeInTheDocument();
  });
});
```

---

### 5. Input Validation
**Estado:** PARCIAL ⚠️  
**Prioridad:** ALTA

**Qué falta:**
- ✅ Campos requeridos (funcionan)
- ❌ Validación de rangos numéricos
- ❌ Validación de formato de strings
- ❌ Validación de fechas

**Casos de Uso NO Validados:**
1. **Athletes:**
   - Weight puede ser negativo o 0
   - Age puede ser negativo, 0, o > 150
   - Name puede ser solo espacios en blanco

2. **Tournaments:**
   - Date puede ser en el pasado
   - Name puede ser vacío o solo espacios

**Implementación Requerida:**
```typescript
// Ejemplo de validación en AthleteManager
const validateForm = () => {
    const errors = [];
    
    if (form.weight <= 0) {
        errors.push('Weight must be greater than 0');
    }
    
    if (form.age < 5 || form.age > 100) {
        errors.push('Age must be between 5 and 100');
    }
    
    if (!form.name.trim()) {
        errors.push('Name cannot be empty');
    }
    
    return errors;
};

const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }
    // ... resto del código
};
```

---

### 6. Error Handling UI


**Qué falta:**
- ❌ Toast notifications
- ❌ Error boundaries
- ❌ Loading states informativos
- ❌ Mensajes de error específicos

**Implementación Requerida:**
1. **Instalar librería de toasts:**
```bash
npm install react-hot-toast
```

2. **Implementar toast notifications:**
```typescript
import toast, { Toaster } from 'react-hot-toast';

// En lugar de alert():
toast.error('Failed to delete athlete');
toast.success('Athlete updated successfully');
```

3. **Agregar Error Boundary:**
```typescript
// client/src/components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

---

### 7. Tournament - DELETE Operation

**Qué falta:**
- No hay ruta DELETE en backend
- No hay botón "Delete Tournament" en UI

**Implementación Requerida:**

**Backend:**
```typescript
// server/src/controllers/TournamentController.ts
export const deleteTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        // También eliminar categorías asociadas
        await Category.deleteMany({ tournamentId: req.params.id });
        
        res.json({ message: 'Tournament deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// server/src/routes/tournamentRoutes.ts
router.delete('/:id', deleteTournament);
```

**Frontend:**
```typescript
// client/src/api.ts
export const deleteTournament = (id: string) => 
    api.delete(`/tournaments/${id}`).then(res => res.data);

// client/src/pages/TournamentList.tsx
<button onClick={() => handleDelete(t._id)}>Delete</button>
```

---

### 8. Category - DELETE Operation
**Estado:** IMPLEMENTADO ✅

**Qué falta:**
- ✅ Implementado (Backend & Frontend)

---

### 9. Bracket Generation - Testing Completo
**Estado:** IMPLEMENTADO ✅

**Qué falta:**
- ✅ Implementado (server/src/engine/BracketGen.test.ts)
- ✅ 100% Pass rate para casos solicitados

**Test Cases Requeridos:**
```
1. Bracket con 0 atletas → Error esperado
2. Bracket con 1 atleta → Campeón directo
3. Bracket con 2 atletas → 1 match final
4. Bracket con 3 atletas → 1 bye
5. Bracket con 4 atletas → 2 semis + final
6. Bracket con 8 atletas → Quarter + Semi + Final
7. Bracket con 16 atletas → Round of 16 + ...
```

---

### 10. Match Control Table - Testing
**Estado:** IMPLEMENTADO ✅

**Qué falta:**
- ✅ Timer synchronizado via web sockets
- ✅ Múltiples usuarios ven los cambios en tiempo real
- ✅ Funciona correctamente

---

### 11. Socket.io - Real-time Updates
**Estado:** IMPLEMENTADO ✅

**Qué falta:**
- ✅ Implementado (Backend & Frontend)
- ✅ Sync de Timer, Score y Status

---

### 12. Date/Timezone Handling
**Estado:** IMPLEMENTADO ✅

**Qué falta:**
- ✅ Implementado con `date-fns`
- ✅ Uso de `format(parseISO(...))` para evitar inconsistencias

---

## 🟢 MEJORAS OPCIONALES (Nice to have)

###  Optimistic UI Updates

**Qué falta:**
- Cuando se crea/edita/elimina, se espera respuesta del servidor
- UX se siente lenta

**Implementación Requerida:**
Usar librerías como React Query o SWR.

---

### . Paginación


**Qué falta:**
- Listas crecen indefinidamente
- Puede causar problemas de performance con 1000+ atletas

---

### . Búsqueda y Filtros


**Qué falta:**
- No hay search bar en Athletes
- No hay filtros por belt, academy, etc.

---

### 16. Autenticación y Autorización
**Estado:** NO EXISTE  
**Prioridad:** MEDIA (para producción)

**Qué falta:**
- ❌ Sin login/logout
- ❌ Sin roles (admin, referee, viewer)
- ❌ Cualquiera puede modificar cualquier dato

**Implementación Requerida:**
- Usar JWT tokens
- Implementar middleware de autenticación
- Agregar roles y permisos

---

### 17. Rate Limiting
**Estado:** NO EXISTE  
**Prioridad:** BAJA (crítico en producción)

**Qué falta:**
- API vulnerable a abuse/DDoS

**Implementación Requerida:**
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

### 18. Logging Estructurado
**Estado:** BÁSICO  
**Prioridad:** BAJA

**Qué falta:**
- Solo `console.log` y `console.error`
- Sin niveles de log (debug, info, warn, error)
- Sin logging a archivo

**Implementación Requerida:**
```bash
npm install winston
```

---

### 19. Health Check Endpoint
**Estado:** NO EXISTE  
**Prioridad:** BAJA

**Qué falta:**
- Endpoint `/health` para monitoring

**Implementación Requerida:**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

### 20. Documentation
**Estado:** MÍNIMA  
**Prioridad:** BAJA

**Qué falta:**
- ❌ Sin API documentation (Swagger/OpenAPI)
- ❌ Sin README completo
- ❌ Sin setup instructions
- ⚠️ Sin comentarios en código complejo

---

## 📊 RESUMEN

| Categoría | Cantidad |
|-----------|----------|
| **Críticas** | 3 |
| **Importantes** | 9 |
| **Mejoras Opcionales** | 8 |
| **TOTAL** | **20** |

---

**Priorización Recomendada:**

**Esta Semana:**
1. Fix Athletes DELETE
2. Fix Athletes UPDATE
3. Fix Tournament Details display

**Próximas 2 Semanas:**
4. Implementar testing infrastructure
5. Agregar input validation
6. Mejorar error handling

**Próximo Mes:**
7. Testear bracket generation
8. Testear match control
9. Implementar Tournament/Category DELETE
10. Fix date/timezone issues

**Backlog:**
- Resto de mejoras opcionales según prioridad del negocio

---

**Última Actualización:** 2026-01-15
