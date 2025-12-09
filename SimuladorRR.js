/**
 * SimuladorRR - Round Robin con Quantum = 2
 * Los bloqueados permanecen en la cola pero no pueden ejecutar
 */
class SimuladorRR extends SimuladorBase {
    constructor() {
        super();
        this.quantum = 2;
        this.quantumRestante = this.quantum;
        this.proximoS = false;
        this.tiempoActualEsS = false;
        // Map para saber qué procesos están bloqueados y cuándo se desbloquean
        this.infoBloqueados = new Map(); // id -> tiempoDesbloqueo
    }

    get tiempoActual() {
        return this.tiempo;
    }

    get colaListos() {
        // Solo los que NO están bloqueados
        return this.cola.filter(p => !this.infoBloqueados.has(p.id));
    }

    get cpu() {
        return this.ejecutando;
    }

    get todosLosProcesos() {
        return this.procesos;
    }

    get colaBloqueados() {
        // Los que SÍ están bloqueados
        return this.cola.filter(p => this.infoBloqueados.has(p.id));
    }

    /**
     * RR: agregar al final de la cola (FIFO)
     */
    agregarACola(proceso) {
        this.cola.push(proceso);
        console.log(`[RR] ${proceso.id} agregado al final de cola. Cola completa: [${this.cola.map(p => {
            const bloq = this.infoBloqueados.has(p.id) ? '*B' : '';
            return p.id + bloq;
        }).join(', ')}]`);
    }

    /**
     * Registrar estado actual en el Gantt
     */
    registrarEstado() {
        if (this.tiempoActualEsS) {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: 'S',
                estado: 'DESPACHADOR'
            });
            
            this.cola.forEach(p => {
                if (this.infoBloqueados.has(p.id)) {
                    this.ganttChart.push({
                        instante: this.tiempo,
                        proceso: p.id,
                        estado: 'BLOQUEADO'
                    });
                } else {
                    this.ganttChart.push({
                        instante: this.tiempo,
                        proceso: p.id,
                        estado: 'LISTO'
                    });
                }
            });
            
            return;
        }

        if (this.ejecutando && this.ejecutando.estado === 'EJECUCION') {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: this.ejecutando.id,
                estado: 'EJECUCION'
            });
        }

        this.cola.forEach(p => {
            if (this.infoBloqueados.has(p.id)) {
                this.ganttChart.push({
                    instante: this.tiempo,
                    proceso: p.id,
                    estado: 'BLOQUEADO'
                });
            } else {
                this.ganttChart.push({
                    instante: this.tiempo,
                    proceso: p.id,
                    estado: 'LISTO'
                });
            }
        });

        if (!this.ejecutando && this.cola.length === 0) {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: 'OCIO',
                estado: 'OCIO'
            });
        }
    }

    /**
     * Paso principal de Round Robin
     */
    paso() {
        if (this.procesos.length === 0) return false;

        const todosTerminados = this.procesos.every(p => p.estado === 'TERMINADO');
        if (todosTerminados) {
            console.log(`[T=${this.tiempo}] *** SIMULACIÓN COMPLETADA ***`);
            return false;
        }

        console.log(`\n========== TIEMPO ${this.tiempo} ${this.tiempoActualEsS ? '(DESPACHADOR)' : ''} ==========`);

        // --- 1. LLEGADAS en tiempo t ---
        this.procesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempo && p.estado === 'NUEVO') {
                console.log(`[T=${this.tiempo}] ${p.id} LLEGA a la cola`);
                p.estado = 'LISTO';
                if (this.tiempoEjecutado[p.id] === undefined) {
                    this.tiempoEjecutado[p.id] = 0;
                }
                this.agregarACola(p);
            }
        });

        // --- 2. DESBLOQUEOS en tiempo t ---
        const desbloqueados = [];
        for (const [id, tiempoDesbloqueo] of this.infoBloqueados.entries()) {
            if (tiempoDesbloqueo === this.tiempo) {
                desbloqueados.push(id);
            }
        }

        desbloqueados.forEach(id => {
            const proceso = this.cola.find(p => p.id === id);
            if (proceso) {
                console.log(`[T=${this.tiempo}] ${id} DESBLOQUEADO -> mover al final de cola`);
                proceso.estado = 'LISTO';
                this.infoBloqueados.delete(id);
                
                // Mover al final de la cola
                const index = this.cola.indexOf(proceso);
                if (index !== -1) {
                    this.cola.splice(index, 1);
                    this.cola.push(proceso);
                }
            }
        });

        // --- 3. ¿Es tiempo de Despachador (S)? ---
        if (this.proximoS) {
            this.tiempoActualEsS = true;
            this.proximoS = false;
            
            console.log(`[T=${this.tiempo}] DESPACHADOR (S) - No ejecutar proceso`);
            this.registrarEstado();
            this.mostrarEstado();
            
            this.tiempo++;
            this.tiempoActualEsS = false;
            return this.hayActividadRestante();
        }

        // --- 4. Si CPU libre, tomar siguiente proceso NO BLOQUEADO ---
        if (this.ejecutando === null) {
            const indice = this.cola.findIndex(p => !this.infoBloqueados.has(p.id));
            
            if (indice !== -1) {
                this.ejecutando = this.cola.splice(indice, 1)[0];
                this.ejecutando.estado = 'EJECUCION';
                this.quantumRestante = this.quantum;
                
                if (this.ejecutando.tiempoInicioEjecucion === null) {
                    this.ejecutando.tiempoInicioEjecucion = this.tiempo;
                }
                
                console.log(`[T=${this.tiempo}] ${this.ejecutando.id} asignado a CPU (quantum=${this.quantum})`);
            }
        }

        // --- 5. REGISTRAR ESTADO ANTES de ejecutar ---
        this.registrarEstado();

        // --- 6. EJECUTAR proceso actual ---
        if (this.ejecutando) {
            const p = this.ejecutando;
            
            this.tiempoEjecutado[p.id]++;
            p.tiempoRestante--;
            this.quantumRestante--;
            
            console.log(`[T=${this.tiempo}] Ejecutando ${p.id}: acumulado=${this.tiempoEjecutado[p.id]}/${p.tiempoRafaga}, restante=${p.tiempoRestante}, quantum_rest=${this.quantumRestante}`);

            // 6.2 Verificar si se bloquea
            if (p.inicioBloqueo > 0 && this.tiempoEjecutado[p.id] === p.inicioBloqueo) {
                const tiempoDesbloqueo = this.tiempo + p.duracionBloqueo;
                console.log(`[T=${this.tiempo}] ${p.id} SE BLOQUEA hasta t=${tiempoDesbloqueo} -> vuelve a cola como bloqueado`);
                p.estado = 'BLOQUEADO';
                
                // Agregar a cola como bloqueado
                this.agregarACola(p);
                this.infoBloqueados.set(p.id, tiempoDesbloqueo);
                
                this.ejecutando = null;
                this.proximoS = true;
                
                this.mostrarEstado();
                this.tiempo++;
                return this.hayActividadRestante();
            }

            // 6.3 Verificar si termina
            if (p.tiempoRestante === 0) {
                p.estado = 'TERMINADO';
                p.tiempoSalida = this.tiempo + 1;
                this.procesosTerminados.push(p);
                console.log(`[T=${this.tiempo}] ${p.id} TERMINADO`);
                this.ejecutando = null;
                this.proximoS = true;
                
                this.mostrarEstado();
                this.tiempo++;
                return this.hayActividadRestante();
            }

            // 6.4 Verificar si acaba quantum
            if (this.quantumRestante === 0) {
                console.log(`[T=${this.tiempo}] ${p.id} agotó quantum -> al final de cola`);
                p.estado = 'LISTO';
                this.agregarACola(p);
                this.ejecutando = null;
                this.proximoS = true;
                
                this.mostrarEstado();
                this.tiempo++;
                return this.hayActividadRestante();
            }
        }

        this.mostrarEstado();
        this.tiempo++;
        return this.hayActividadRestante();
    }

    /**
     * Mostrar estado actual (helper)
     */
    mostrarEstado() {
        const colaStr = this.cola.map(p => {
            const bloq = this.infoBloqueados.has(p.id) ? `*B@${this.infoBloqueados.get(p.id)}` : '';
            return p.id + bloq;
        }).join(',') || '-';
        const cpuStr = this.ejecutando ? this.ejecutando.id : (this.tiempoActualEsS ? 'S' : '-');
        console.log(`↓ Cola unificada: [${colaStr}], CPU: [${cpuStr}]`);
    }

    /**
     * Verificar si hay actividad restante
     */
    hayActividadRestante() {
        if (this.tiempo >= this.maxTiempo) {
            return false;
        }

        const hayProcesosNuevos = this.procesos.some(p => p.estado === 'NUEVO');

        return this.cola.length > 0 ||
               this.ejecutando !== null ||
               hayProcesosNuevos ||
               this.proximoS;
    }

    /**
     * Reset del simulador
     */
    reset() {
        super.reset();
        this.quantumRestante = this.quantum;
        this.proximoS = false;
        this.tiempoActualEsS = false;
        this.infoBloqueados.clear();
    }
}