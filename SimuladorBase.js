/**
 * SimuladorBase - Implementa exactamente el pseudocódigo especificado
 * CORRECCIÓN: Registrar ANTES de ejecutar en el siguiente paso
 */
class SimuladorBase {
    constructor() {
        this.tiempo = 0;
        this.cola = [];                    // Cola de procesos listos
        this.ejecutando = null;            // Proceso actual en CPU
        this.tiempoEjecutado = {};         // Mapa: id -> tiempo ejecutado
        this.bloqueados = [];              // Array de tuplas [proceso, tiempoRestanteBloqueo]
        this.procesos = [];                // Todos los procesos
        this.procesosTerminados = [];      // Procesos completados
        this.ganttChart = [];              // Registro de estados
        this.maxTiempo = 100;
    }

    /**
     * Getters para compatibilidad con InterfaceManager
     */
    get tiempoActual() {
        return this.tiempo;
    }

    get colaListos() {
        return this.cola;
    }

    get cpu() {
        return this.ejecutando;
    }

    get todosLosProcesos() {
        return this.procesos;
    }

    get colaBloqueados() {
        return this.bloqueados.map(([p]) => p);
    }

    /**
     * Agregar un proceso al simulador
     */
    agregarProceso(proceso) {
        if (this.procesos.some(p => p.id === proceso.id)) {
            console.warn(`El proceso ${proceso.id} ya existe`);
            return false;
        }

        console.log(`[AGREGAR] ${proceso.id}: llegada=${proceso.tiempoLlegada}, rafaga=${proceso.tiempoRafaga}, bloqueo@${proceso.inicioBloqueo}x${proceso.duracionBloqueo}`);
        
        this.procesos.push(proceso);
        this.tiempoEjecutado[proceso.id] = 0;
        
        return true;
    }

    /**
     * Agregar proceso a la cola (implementado por subclases)
     */
    agregarACola(proceso) {
        throw new Error("Método 'agregarACola' debe ser implementado por la subclase");
    }

    /**
     * PASO 1: Registrar estado ACTUAL (ANTES de cambios)
     */
    paso1_RegistrarEstado() {
        // Registrar proceso en ejecución
        if (this.ejecutando && this.ejecutando.estado === 'EJECUCION') {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: this.ejecutando.id,
                estado: 'EJECUCION'
            });
        }

        // Registrar procesos en cola (listos)
        this.cola.forEach(p => {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: p.id,
                estado: 'LISTO'
            });
        });

        // Registrar procesos bloqueados
        this.bloqueados.forEach(([p]) => {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: p.id,
                estado: 'BLOQUEADO'
            });
        });

        // Registrar OCIO si no hay actividad
        if (!this.ejecutando && this.cola.length === 0 && this.bloqueados.length === 0) {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: 'OCIO',
                estado: 'OCIO'
            });
        }
    }

    /**
     * PASO 2: Añadir procesos que llegan en este tiempo
     */
    paso2_AnadirLlegadas() {
        this.procesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempo && p.estado === 'NUEVO') {
                console.log(`[T=${this.tiempo}] ${p.id} LLEGA a la cola`);
                p.estado = 'LISTO';
                this.agregarACola(p);
            }
        });
    }

    /**
     * PASO 3: Actualizar procesos bloqueados y desbloquear si es necesario
     */
    paso3_ActualizarBloqueados() {
        for (let i = this.bloqueados.length - 1; i >= 0; i--) {
            const [proceso, tRestante] = this.bloqueados[i];
            
            // Decrementar tiempo restante
            const nuevoTiempoRestante = tRestante - 1;
            console.log(`[T=${this.tiempo}] ${proceso.id} bloqueado: tRestante=${nuevoTiempoRestante}`);
            
            if (nuevoTiempoRestante === 0) {
                console.log(`[T=${this.tiempo}] ${proceso.id} DESBLOQUEADO -> cola`);
                proceso.estado = 'LISTO';
                this.agregarACola(proceso);
                this.bloqueados.splice(i, 1);
            } else {
                // Actualizar tiempo restante
                this.bloqueados[i] = [proceso, nuevoTiempoRestante];
            }
        }
    }

    /**
     * PASO 4: Si no hay proceso ejecutando, tomar el siguiente de la cola
     */
    paso4_AsignarSiNecesario() {
        if (this.ejecutando === null && this.cola.length > 0) {
            this.ejecutando = this.cola.shift();
            this.ejecutando.estado = 'EJECUCION';
            if (this.ejecutando.tiempoInicioEjecucion === null) {
                this.ejecutando.tiempoInicioEjecucion = this.tiempo;
            }
            console.log(`[T=${this.tiempo}] ${this.ejecutando.id} asignado a CPU`);
        }
    }

    /**
     * PASO 5: Ejecutar una unidad de CPU
     */
paso5_EjecutarUnidad() {
    if (this.ejecutando === null) {
        return;
    }

    const p = this.ejecutando;
    
    // Incrementar tiempo ejecutado
    this.tiempoEjecutado[p.id]++;
    p.tiempoRestante--;
    
    console.log(`[T=${this.tiempo}] Ejecutando ${p.id}: ejecutado=${this.tiempoEjecutado[p.id]}/${p.tiempoRafaga}, restante=${p.tiempoRestante}`);

    // Verificar si debe bloquearse AHORA
    if (p.inicioBloqueo > 0 && this.tiempoEjecutado[p.id] === p.inicioBloqueo) {
        console.log(`[T=${this.tiempo}] ${p.id} SE BLOQUEA por ${p.duracionBloqueo} unidades`);
        p.estado = 'BLOQUEADO';
        
        // ✅ CORRECCIÓN: +1 para que el desbloqueo sea correcto
        this.bloqueados.push([p, p.duracionBloqueo + 1]);
        
        this.ejecutando = null;
        return;
    }

    // Verificar si completó ejecución
    if (this.tiempoEjecutado[p.id] === p.tiempoRafaga) {
        p.estado = 'TERMINADO';
        p.tiempoSalida = this.tiempo + 1;
        this.procesosTerminados.push(p);
        console.log(`[T=${this.tiempo}] ${p.id} TERMINADO`);
        this.ejecutando = null;
    }
}

    /**
     * PASO 6: Incrementar tiempo de espera para procesos listos
     */
    paso6_IncrementarEspera() {
        this.cola.forEach(p => {
            if (p.estado === 'LISTO') {
                p.tiempoEspera++;
            }
        });
    }

    /**
     * Ejecutar un paso de la simulación
     */
paso() {
    if (this.procesos.length === 0) return false;

    const todosTerminados = this.procesos.every(p => p.estado === 'TERMINADO');
    if (todosTerminados) {
        console.log(`[T=${this.tiempo}] *** SIMULACIÓN COMPLETADA ***`);
        return false;
    }

    console.log(`\n========== TIEMPO ${this.tiempo} ==========`);

    // ✅ NUEVO ORDEN (según tu pseudocódigo):
    
    // 1. Llegadas
    this.paso2_AnadirLlegadas();
    
    // 2. Desbloqueos
    this.paso3_ActualizarBloqueados();
    
    // 3. Asignar CPU si está libre
    this.paso4_AsignarSiNecesario();
    
    // ✅ AHORA SÍ registrar el estado (después de asignar)
    this.paso1_RegistrarEstado();
    
    // 4. Ejecutar
    this.paso5_EjecutarUnidad();
    
    // 5. Incrementar espera
    this.paso6_IncrementarEspera();

    // Mostrar estado actual
    const colaStr = this.cola.map(p => p.id).join(',') || '-';
    const bloqStr = this.bloqueados.map(([p, t]) => `${p.id}(${t})`).join(',') || '-';
    const cpuStr = this.ejecutando ? this.ejecutando.id : '-';
    console.log(`↓ Cola: [${colaStr}], Bloqueados: [${bloqStr}], CPU: [${cpuStr}]`);

    // Avanzar tiempo
    this.tiempo++;

    return this.hayActividadRestante();
}

/**
 * Resetear simulación
 */
reset() {
    console.log(`[RESET] Limpiando ${this.procesos.length} procesos`);
    
    this.tiempo = 0;
    this.cola = [];
    this.ejecutando = null;
    this.tiempoEjecutado = {};
    this.bloqueados = [];
    this.procesos = [];  // LIMPIAR LA LISTA DE PROCESOS
    this.procesosTerminados = [];
    this.ganttChart = [];
}

    /**
     * Verificar si hay actividad restante
     */
hayActividadRestante() {
    if (this.tiempo >= this.maxTiempo) {
        return false;
    }

    // ✅ AGREGAR ESTA VERIFICACIÓN:
    // Verificar si hay procesos que aún no han llegado
    const hayProcesosNuevos = this.procesos.some(p => p.estado === 'NUEVO');

    return this.cola.length > 0 ||
           this.bloqueados.length > 0 ||
           this.ejecutando !== null ||
           hayProcesosNuevos; // ← CRÍTICO: considerar procesos futuros
}
}