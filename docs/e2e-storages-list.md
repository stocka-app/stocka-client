# E2E Test Plan — Storages List (H-01)

> Alcance: solo la pantalla de listar instalaciones (`/storages`).
> No cubre: crear, editar, archivar, restaurar, eliminar (esas son H-02 a H-06).
> Referencia: STOC-315 + Pencil Design System + UX/UI S2 Confluence

---

## 1. Primera carga (Skeleton → Success)

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| L-01 | Navegar a `/storages` con instalaciones existentes | Se muestra skeleton con barra de progreso → transiciona a success state con cards |
| L-02 | Skeleton muestra estructura correcta | 6 cards skeleton con bracket lateral, icono placeholder, badges, título, dirección, footer |
| L-03 | Skeleton no bloquea la pantalla | No hay overlay ni spinner durante la primera carga |
| L-04 | Success state muestra header | Título "Instalaciones" + subtítulo + botón "Nueva instalación" (si tiene permiso) |
| L-05 | Success state muestra tabs | 4 tabs pill: Todos, Almacenes, Bodegas, Áreas personalizadas — cada uno con conteo |
| L-06 | Success state muestra stats bar | 3 métricas: sedes activas (verde), congeladas (ámbar), ocupación |
| L-07 | Success state muestra controles | Search input + dropdown de estado + botón sort A→Z |
| L-08 | Success state muestra grid de cards | Cards con: bracket lateral coloreado, icono, nombre, badge tipo, dot estado, dirección, "— productos" |
| L-09 | Card crear inline al final del grid | Card dashed con "+" y "Crear instalación" — solo si usuario tiene permiso |

---

## 2. Card de instalación — Anatomía visual

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| C-01 | Card tipo WAREHOUSE | Bracket azul (`inst-almacen-accent`), icono `warehouse`, badge "Almacén" azul |
| C-02 | Card tipo STORE_ROOM | Bracket ámbar (`inst-bodega-accent`), icono `inventory_2`, badge "Bodega" ámbar |
| C-03 | Card tipo CUSTOM_ROOM | Bracket gris (`inst-custom-accent`), icono `other_houses`, badge "Área personalizada" gris |
| C-04 | Card estado ACTIVE | Dot verde + label "Activo" |
| C-05 | Card estado FROZEN | Dot ámbar + label "Congelado" + card content opacity-75 + borde warning/30 |
| C-06 | Card estado ARCHIVED | Dot gris + label "Archivado" + card opacity-50 + fondo neutral-50 |
| C-07 | Card con dirección | Muestra la dirección truncada debajo del nombre |
| C-08 | Card sin dirección | No muestra línea de dirección |
| C-09 | Card muestra conteo de productos | Muestra "— productos" con icono inventory_2 (placeholder Sprint 3) |
| C-10 | Nombre siempre visible | El nombre ocupa línea completa, nunca se trunca por el badge |

---

## 3. Empty state (sin instalaciones)

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| E-01 | Negocio sin instalaciones | Icono warehouse centrado con anillos concéntricos |
| E-02 | Título empty state | "Aún no tienes instalaciones" |
| E-03 | CTA crear primera | Botón "Crear mi primera instalación" visible (si tiene permiso) |
| E-04 | Link de ayuda | Link "¿Qué es una instalación?" visible |
| E-05 | 3 cards de propuesta de valor | Centralización, Optimización, Roles y Permisos |
| E-06 | Sin controles | No se muestra stats bar, search bar, ni tabs |
| E-07 | CTA abre panel de creación | Click en "Crear mi primera instalación" abre el sheet lateral |

---

## 4. Error state

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| ER-01 | Fallo de red al cargar | Icono cloud_off centrado con anillos danger |
| ER-02 | Título error | "No pudimos cargar tus instalaciones" |
| ER-03 | Botón reintentar | Botón rojo "Reintentar" que re-lanza fetchStorages |
| ER-04 | Botón ayuda | Botón outline "Obtener ayuda" |
| ER-05 | 3 cards troubleshooting | Conexión (wifi_off), Espera (update), Soporte (support_agent) |
| ER-06 | Sin mensajes técnicos | No se muestra código de error, stack trace ni mensaje del servidor |
| ER-07 | Reintentar funciona | Click en "Reintentar" carga los datos si la red se restaura |

---

## 5. Filtro por tipo (tabs)

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| T-01 | Tab "Todos" activo por defecto | Tab "Todos" con fondo brand, los demás sin fondo |
| T-02 | Click en "Almacenes" | Filtra mostrando solo cards WAREHOUSE, tab se activa |
| T-03 | Click en "Bodegas" | Filtra mostrando solo cards STORE_ROOM |
| T-04 | Click en "Áreas personalizadas" | Filtra mostrando solo cards CUSTOM_ROOM |
| T-05 | Conteo por tab | Cada tab muestra la cantidad correcta entre paréntesis |
| T-06 | Click en "Todos" resetea | Vuelve a mostrar todas las instalaciones |

---

## 6. Filtro por estado

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| S-01 | Dropdown estado muestra opciones | "Todos los estados", "Activo", "Congelado", "Archivado" |
| S-02 | Seleccionar "Congelado" | Solo se muestran cards con estado FROZEN |
| S-03 | Chip descartable aparece | Chip "Congelado" con X aparece debajo de los controles |
| S-04 | Click en X del chip | Elimina el filtro y muestra todas las instalaciones |
| S-05 | Sin resultados por estado | Muestra "No hay instalaciones con ese filtro activo" |
| S-06 | Seleccionar "Todos los estados" | Resetea el filtro de estado |

---

## 7. Búsqueda por nombre

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| B-01 | Escribir texto en búsqueda | Cards se filtran mostrando solo las que coinciden con el nombre |
| B-02 | Búsqueda sin coincidencias | Muestra "No encontramos instalaciones con ese nombre" |
| B-03 | Chip de búsqueda | Chip con el término entre comillas y X para descartar |
| B-04 | Click en X del chip de búsqueda | Limpia el campo y muestra todas las instalaciones |
| B-05 | Sin CTA crear en no-results | No se muestra botón "Crear" en el header cuando no hay resultados |
| B-06 | Botón "Limpiar búsqueda" | Presente en el no-results state, limpia todos los filtros |
| B-07 | Botón "Ver todas" | Presente en el no-results state, resetea todos los filtros |
| B-08 | 3 cards de sugerencia | Verifica nombre (spellcheck), Cambia filtro (filter_alt), Crea nueva (add_circle) |

---

## 8. Ordenamiento

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| O-01 | Botón sort muestra "A → Z" por defecto | Texto "A → Z" con icono sort_by_alpha |
| O-02 | Click alterna a "Z → A" | Texto cambia a "Z → A" |
| O-03 | Cards se reordenan | Las cards aparecen en el nuevo orden |
| O-04 | Loader overlay durante reorden | Cards al 30% opacity + spinner doble anillo centrado |
| O-05 | Spinner no bloquea pantalla | El usuario puede seguir interactuando (no hay overlay bloqueante) |

---

## 9. Filtros combinados

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| FC-01 | Estado "Activo" + búsqueda "Norte" | Solo instalaciones activas cuyo nombre contiene "Norte" |
| FC-02 | Tipo "Almacenes" + estado "Congelado" | Solo almacenes congelados |
| FC-03 | Tipo + estado + búsqueda | Los tres filtros se aplican con AND |
| FC-04 | Chips múltiples | Se muestran chips para estado y búsqueda simultáneamente |
| FC-05 | Quitar un chip mantiene los demás | Eliminar chip de estado mantiene la búsqueda activa |

---

## 10. Acciones por rol y estado

### Instalación Activa

| ID | Rol | Acciones visibles |
|----|-----|-------------------|
| R-01 | Dueño / Socio | Ver más, Editar, Archivar |
| R-02 | Gerente | Ver más, Editar, Archivar |
| R-03 | Almacenista | Ver más, Editar |
| R-04 | Observador | Ver más |

### Instalación Congelada

| ID | Rol | Acciones visibles |
|----|-----|-------------------|
| R-05 | Dueño / Socio | Ver más, Editar |
| R-06 | Gerente | Ver más, Editar |
| R-07 | Almacenista | Ver más, Editar |
| R-08 | Observador | Ver más |

### Instalación Archivada

| ID | Rol | Acciones visibles |
|----|-----|-------------------|
| R-09 | Dueño / Socio | Ver más, Editar, Eliminar |
| R-10 | Gerente | Ver más, Restaurar |
| R-11 | Almacenista | Ver más |
| R-12 | Observador | Ver más |

---

## 11. Tier limit / Upgrade

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| TL-01 | Plan FREE con cuota agotada, filtro por tipo activo | Card upgrade inline con icono lock en vez de card crear |
| TL-02 | Card upgrade muestra textos | "Límite de plan alcanzado" + descripción + "Ver planes" |
| TL-03 | Click en card upgrade | Abre modal de upgrade |
| TL-04 | Sin filtro de tipo activo | Card crear normal al final del grid |
| TL-05 | Plan con cuota disponible | Card crear visible, sin card upgrade |

---

## 12. Loader state (segunda carga / acciones)

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| LS-01 | Filtrar/buscar con datos existentes | Cards al 30% opacity + spinner doble anillo centrado |
| LS-02 | Spinner tiene fondo surface-card | Círculo con bg-surface-card + border-border + shadow-card |
| LS-03 | Label "Cargando instalaciones..." | Texto debajo del spinner |
| LS-04 | Sin overlay radial | No hay gradiente blanco/gris alrededor del spinner |
| LS-05 | Transición a resultados | Al completar la carga, cards vuelven a opacity 100% y spinner desaparece |

---

## 13. Responsive

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| RS-01 | Mobile 320px | Grid 1 columna, header apilado verticalmente, stats bar scroll horizontal |
| RS-02 | Tablet 768px | Grid 2 columnas, sidebar colapsado a iconos |
| RS-03 | Desktop 1024px | Grid 3 columnas, sidebar expandido |
| RS-04 | Ultrawide 2560px | Grid 4 columnas, contenido centrado max-w-7xl |
| RS-05 | Touch targets | Todos los botones interactivos mínimo 44px de alto |
| RS-06 | Tabs scroll en mobile | Tabs con overflow-x-auto cuando no caben |
| RS-07 | Cards info stack en mobile | Las 3 info cards (empty/error/no-results) apilan full-width |
| RS-08 | Nombre visible en cards estrechas | El nombre nunca se trunca por el badge en pantallas angostas |

---

## 14. Dark mode

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| DM-01 | Toggle dark mode | Toda la página cambia a dark theme automáticamente |
| DM-02 | Cards usan surface-card dark | Fondo #182437 con borde #273d5c |
| DM-03 | Brand cambia a teal | Tabs activos, botones y links usan teal (#14B8A6) |
| DM-04 | Skeleton en dark | Placeholders usan neutral-200 dark (oscuros, no claros) |
| DM-05 | Spinner elevated en dark | Fondo surface-card dark, sin aura blanca |
| DM-06 | State compositions en dark | Iconos, cards y textos se adaptan automáticamente |
| DM-07 | Brackets de card en dark | Colores inst-*-accent adaptan (almacén→#60a5fa, bodega→#fbbf24, custom→#9ca3af) |

---

## 15. Paginación

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| P-01 | Más de 50 instalaciones | Controles de paginación visibles: Anterior, "Página X de Y", Siguiente |
| P-02 | Primera página | Botón "Anterior" deshabilitado |
| P-03 | Última página | Botón "Siguiente" deshabilitado |
| P-04 | Click siguiente | Carga la siguiente página con loader overlay |
| P-05 | Menos de 50 instalaciones | No se muestran controles de paginación |

---

## Resumen de cobertura

| Sección | Escenarios |
|---------|-----------|
| Primera carga | 9 |
| Card anatomía | 10 |
| Empty state | 7 |
| Error state | 7 |
| Filtro tipo | 6 |
| Filtro estado | 6 |
| Búsqueda | 8 |
| Ordenamiento | 5 |
| Filtros combinados | 5 |
| Acciones por rol | 12 |
| Tier limit | 5 |
| Loader state | 5 |
| Responsive | 8 |
| Dark mode | 7 |
| Paginación | 5 |
| **Total** | **105** |
