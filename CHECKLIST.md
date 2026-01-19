# ✅ CHECKLIST DE BUGS - BJJ Tournament Manager

Esta es una lista de chequeo rápida para trackear el progreso en la resolución de bugs.

---

## 🔴 BUGS CRÍTICOS (BLOCKERS)


- [ ] **BUG-002: Athletes UPDATE no persiste cambios**. Done
  - Archivo: `client/src/pages/AthleteManager.tsx`
  - Línea: 37-51
  - Síntoma: Edit funciona pero no guarda en BD
  - Causa: Request payload incorrecto o problema en backend
  - Tiempo Estimado: 2-3 horas. 

- [ ] **BUG-003: Tournament Details no muestra info del torneo** Done
  - Archivo: `client/src/pages/TournamentDetail.tsx`
  - Síntoma: Solo muestra "Tournament Details" sin datos específicos
  - Causa: Falta fetch de datos del torneo
  - Tiempo Estimado: 1-2 horas
  - **Subtareas:**
    - [ ] Agregar `getTournamentById` a `api.ts`
    - [ ] Fetch tournament data en `TournamentDetail.tsx`
    - [ ] Renderizar tournament.name, date, location, status

---

## 🟡 BUGS NO CRÍTICOS

- [ ] **BUG-004: Date timezone issue** Done
  - Archivo: `client/src/pages/TournamentList.tsx`
  - Síntoma: Fechas se muestran con -1 día
  - Causa: Timezone mismatch client/server
  - Solución: Usar `date-fns` o similar

- [ ] **BUG-005: Leaderboard endpoint 404** Done
  - Archivo: `client/src/pages/Leaderboard.tsx` (posible)
  - Síntoma: Console muestra 404 para `/api/leaderboard`
  - Causa: Código legacy o fetch directo


- [ ] **BUG-006: Browser tab title es "client"** Done
  - Archivo: `client/index.html`
  - Síntoma: Tab dice "client" en lugar de "BJJ Manager"
  - Solución: Cambiar `<title>client</title>` a `<title>BJJ Manager</title>`


---

## ❌ FUNCIONALIDADES FALTANTES

### Testing
- [ ] **FEAT-001: Setup test infrastructure**
  - [ ] Instalar Vitest en client
  - [ ] Instalar Jest en server
  - [ ] Crear vitest.config.ts
  - [ ] Crear jest.config.js
  - [ ] Escribir 1 test de ejemplo
  - Tiempo Estimado: 3-4 horas

### Validación
- [ ] **FEAT-002: Input validation**
  - [ ] Validar weight > 0 en Athletes
  - [ ] Validar age entre 5 y 100 en Athletes
  - [ ] Validar name no vacío
  - [ ] Validar tournament date no en pasado
  - Tiempo Estimado: 2-3 horas

### Error Handling
- [ ] **FEAT-003: Better error handling**
  - [ ] Instalar react-hot-toast
  - [ ] Reemplazar alert() con toast notifications
  - [ ] Crear Error Boundary component
  - [ ] Mostrar mensajes de error específicos
  - Tiempo Estimado: 2-3 horas

### CRUD Operations
- [ ] **FEAT-004: Tournament DELETE**
  - [ ] Backend: Crear `deleteTournament` controller
  - [ ] Backend: Agregar ruta DELETE
  - [ ] Frontend: Crear `deleteTournament` en api.ts
  - [ ] Frontend: Agregar botón Delete en TournamentList
  - Tiempo Estimado: 2 horas

- [ ] **FEAT-005: Category DELETE**
  - Similar a Tournament DELETE
  - Tiempo Estimado: 2 horas

---

## 🧪 TESTING REQUERIDO

- [ ] **TEST-001: Bracket generation con diferentes tamaños**
  - [ ] Test con 1 atleta
  - [ ] Test con 2 atletas
  - [ ] Test con 3 atletas (bye)
  - [ ] Test con 4 atletas
  - [ ] Test con 8 atletas
  - [ ] Test con número impar (5, 7)
  - Tiempo Estimado: 4-6 horas

- [ ] **TEST-002: Match Control Table**
  - [ ] Test scoring buttons
  - [ ] Test timer functionality
  - [ ] Test finish match
  - Tiempo Estimado: 3-4 horas

- [ ] **TEST-003: Socket.io real-time**
  - [ ] Test con 2 navegadores simultáneos
  - [ ] Test reconexión
  - [ ] Test race conditions
  - Tiempo Estimado: 3-4 horas

---

## 📊 PROGRESO GENERAL

### Bugs Críticos
- **Total:** 3
- **Resueltos:** 0
- **Progreso:** 0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

### Bugs No Críticos
- **Total:** 3
- **Resueltos:** 0
- **Progreso:** 0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

### Features Faltantes
- **Total:** 5
- **Implementadas:** 0
- **Progreso:** 0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

### Testing
- **Total Suites:** 3
- **Completadas:** 0
- **Progreso:** 0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

---

## 🎯 PRIORIZACIÓN

### Sprint 1 (Esta Semana)
**Objetivo:** Resolver BLOCKERS

```
[ ] BUG-001: Athletes DELETE        (2h)
[ ] BUG-002: Athletes UPDATE        (3h)
[ ] BUG-003: Tournament Details     (2h)
```
**Total:** ~7 horas

### Sprint 2 (Próxima Semana)
**Objetivo:** Estabilidad y Validación

```
[ ] FEAT-002: Input validation      (3h)
[ ] FEAT-003: Error handling        (3h)
[ ] BUG-004: Date timezone          (3h)
```
**Total:** ~9 horas

### Sprint 3 (Semana 3)
**Objetivo:** Testing Infrastructure

```
[ ] FEAT-001: Setup tests           (4h)
[ ] TEST-001: Bracket tests         (6h)
```
**Total:** ~10 horas

### Sprint 4 (Semana 4)
**Objetivo:** Features y Testing Avanzado

```
[ ] FEAT-004: Tournament DELETE     (2h)
[ ] FEAT-005: Category DELETE       (2h)
[ ] TEST-002: Match Control         (4h)
[ ] TEST-003: Socket.io             (4h)
```
**Total:** ~12 horas

---

## 📝 NOTAS

### Bugs Verificados Manualmente:
✅ BUG-001: Confirmado en navegador - Delete no funciona  
✅ BUG-002: Confirmado en navegador - Update no persiste  
✅ BUG-003: Confirmado en navegador - Missing tournament info  
✅ BUG-004: Confirmado - Date muestra 31/1 en lugar de 1/2  
✅ BUG-005: Confirmado en console logs - 404 error

### Evidencia Fotográfica Disponible:
- `athletes_after_delete_1768487097092.png` - Prueba de BUG-001
- `tournament_details_empty_1768487532895.png` - Prueba de BUG-003
- `leaderboard_view_1768487587696.png` - Estado de leaderboard

### Comandos Útiles:

**Test manual rápido de endpoints:**
```bash
# List athletes
curl http://localhost:5001/api/athletes

# Create athlete
curl -X POST http://localhost:5001/api/athletes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","academy":"Academy","belt":"Blue","weight":80,"age":25,"gender":"Male"}'

# Delete athlete (reemplazar ID)
curl -X DELETE http://localhost:5001/api/athletes/ATHLETE_ID

# Update athlete (reemplazar ID)
curl -X PUT http://localhost:5001/api/athletes/ATHLETE_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","academy":"Academy","belt":"Blue","weight":85,"age":26,"gender":"Male"}'
```

**Limpiar base de datos de test:**
```bash
# Eliminar todos los atletas de test
# (ejecutar desde Mongo shell o similar)
db.athletes.deleteMany({ academy: /test/i })
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Para BUG-001 (Athletes DELETE):
- [ ] Click en Delete muestra confirmation dialog
- [ ] Click en "OK" elimina el atleta de la UI
- [ ] Reload de página confirma que el atleta fue eliminado de BD
- [ ] No hay errores en consola

### Para BUG-002 (Athletes UPDATE):
- [ ] Click en Edit carga datos en el formulario
- [ ] Modificar datos y click en Update
- [ ] Formulario vuelve a estado "New Athlete"
- [ ] Lista muestra el atleta con datos actualizados
- [ ] Reload confirma que los cambios se guardaron

### Para BUG-003 (Tournament Details):
- [ ] Página muestra nombre del torneo como título
- [ ] Página muestra fecha formateada
- [ ] Página muestra ubicación
- [ ] Página muestra status del torneo
- [ ] Toda esta info se carga al entrar a la página

---

**Última Actualización:** 2026-01-15  
**Próxima Revisión:** Después de Sprint 1
