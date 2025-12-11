
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


    agregarProceso(proceso) {
        if (this.procesos.some(p => p.id === proceso.id)) {
            console.warn(`El proceso ${proceso.id} ya existe`);
            return false;
        }
        
        this.procesos.push(proceso);
        this.tiempoEjecutado[proceso.id] = 0;
        
        return true;
    }

    agregarACola(proceso) {
        throw new Error("Método 'agregarACola' debe ser implementado por la subclase");
    }


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

    paso2_AnadirLlegadas() {
        this.procesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempo && p.estado === 'NUEVO') {
                p.estado = 'LISTO';
                this.agregarACola(p);
            }
        });
    }

    paso3_ActualizarBloqueados() {
        for (let i = this.bloqueados.length - 1; i >= 0; i--) {
            const [proceso, tRestante] = this.bloqueados[i];
            
            // Decrementar tiempo restante
            const nuevoTiempoRestante = tRestante - 1;
            
            if (nuevoTiempoRestante === 0) {
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
        }
    }

paso5_EjecutarUnidad() {
    if (this.ejecutando === null) {
        return;
    }

    const p = this.ejecutando;
    
    // Incrementar tiempo ejecutado
    this.tiempoEjecutado[p.id]++;
    p.tiempoRestante--;
    

    // Verificar si debe bloquearse AHORA
    if (p.inicioBloqueo > 0 && this.tiempoEjecutado[p.id] === p.inicioBloqueo) {
        p.estado = 'BLOQUEADO';
        
        this.bloqueados.push([p, p.duracionBloqueo + 1]);
        
        this.ejecutando = null;
        return;
    }

    // Verificar si completó ejecución
    if (this.tiempoEjecutado[p.id] === p.tiempoRafaga) {
        p.estado = 'TERMINADO';
        p.tiempoSalida = this.tiempo + 1;
        this.procesosTerminados.push(p);
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
        return false;
    }

    // 1. Llegadas
    this.paso2_AnadirLlegadas();
    
    // 2. Desbloqueos
    this.paso3_ActualizarBloqueados();
    
    // 3. Asignar CPU si está libre
    this.paso4_AsignarSiNecesario();
    
    // HORA SÍ registrar el estado (después de asignar)
    this.paso1_RegistrarEstado();
    
    // 4. Ejecutar
    this.paso5_EjecutarUnidad();
    
    // 5. Incrementar espera
    this.paso6_IncrementarEspera();

    // Mostrar estado actual
    const colaStr = this.cola.map(p => p.id).join(',') || '-';
    const bloqStr = this.bloqueados.map(([p, t]) => `${p.id}(${t})`).join(',') || '-';
    const cpuStr = this.ejecutando ? this.ejecutando.id : '-';
    // Avanzar tiempo
    this.tiempo++;

    return this.hayActividadRestante();
}

/**
 * Resetear simulación
 */
reset() {
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

    // Verificar si hay procesos que aún no han llegado
    const hayProcesosNuevos = this.procesos.some(p => p.estado === 'NUEVO');

    return this.cola.length > 0 ||
           this.bloqueados.length > 0 ||
           this.ejecutando !== null ||
           hayProcesosNuevos; 
}
}