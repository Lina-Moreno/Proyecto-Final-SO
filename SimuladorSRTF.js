/**
 * SimuladorSRTF - Shortest Remaining Time First (Expropiativo)
 * Implementación optimizada que mantiene el mismo comportamiento
 */
class SimuladorSRTF extends SimuladorBase {
    constructor() {
        super();
    }

    /**
     * Agregar proceso a la cola ordenada por tiempo RESTANTE (menor primero)
     */
    agregarACola(proceso) {
        this.cola.push(proceso);
        this.cola.sort((a, b) => a.tiempoRestante - b.tiempoRestante);
    }

    /**
     * Asignar un proceso a CPU e inicializar su tiempo de inicio si es necesario
     */
    asignarACPU(proceso) {
        this.ejecutando = proceso;
        proceso.estado = 'EJECUCION';
        if (proceso.tiempoInicioEjecucion === null) {
            proceso.tiempoInicioEjecucion = this.tiempo;
        }
    }

    /**
     * Registrar todos los eventos del tiempo actual en el ganttChart
     */
    registrarEventos() {
        if (this.ejecutando?.estado === 'EJECUCION') {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: this.ejecutando.id,
                estado: 'EJECUCION'
            });
        }

        this.cola.forEach(p => {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: p.id,
                estado: 'LISTO'
            });
        });

        this.bloqueados.forEach(([p]) => {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: p.id,
                estado: 'BLOQUEADO'
            });
        });

        if (!this.ejecutando && this.cola.length === 0 && this.bloqueados.length === 0) {
            this.ganttChart.push({
                instante: this.tiempo,
                proceso: 'OCIO',
                estado: 'OCIO'
            });
        }
    }

    /**
     * Mostrar estado actual para depuración
     */
    mostrarEstado() {
        const colaStr = this.cola.map(p => `${p.id}(${p.tiempoRestante})`).join(',') || '-';
        const bloqStr = this.bloqueados.map(([p, t]) => `${p.id}(${t})`).join(',') || '-';
        const cpuStr = this.ejecutando ? `${this.ejecutando.id}(${this.ejecutando.tiempoRestante})` : '-';
        console.log(`↓ Cola: [${colaStr}], Bloqueados: [${bloqStr}], CPU: [${cpuStr}]`);
    }

    /**
     * MÉTODO PASO PERSONALIZADO
     * Implementa SRTF con expropiación
     */
    paso() {
        if (this.procesos.length === 0) return false;

        if (this.procesos.every(p => p.estado === 'TERMINADO')) {
            console.log(`[T=${this.tiempo}] *** SIMULACIÓN COMPLETADA ***`);
            return false;
        }

        console.log(`\n========== TIEMPO ${this.tiempo} ==========`);

        // 1. PROCESAR LLEGADAS
        this.procesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempo && p.estado === 'NUEVO') {
                console.log(`[T=${this.tiempo}] ${p.id} LLEGA a la cola`);
                p.estado = 'LISTO';
                this.agregarACola(p);
            }
        });

        // 2. PROCESAR DESBLOQUEOS
        for (let i = this.bloqueados.length - 1; i >= 0; i--) {
            const [proceso, tRestante] = this.bloqueados[i];
            const nuevoTiempoRestante = tRestante - 1;
            
            if (nuevoTiempoRestante === 0) {
                console.log(`[T=${this.tiempo}] ${proceso.id} DESBLOQUEADO -> cola`);
                proceso.estado = 'LISTO';
                this.agregarACola(proceso);
                this.bloqueados.splice(i, 1);
            } else {
                this.bloqueados[i] = [proceso, nuevoTiempoRestante];
            }
        }

        // 3. EXPROPIACIÓN
        if (this.ejecutando && this.cola.length > 0) {
            const procesoMasCorto = this.cola[0];
            if (procesoMasCorto.tiempoRestante < this.ejecutando.tiempoRestante) {
                console.log(`[T=${this.tiempo}] ⚡ EXPROPIACIÓN: ${this.ejecutando.id}(${this.ejecutando.tiempoRestante}) -> ${procesoMasCorto.id}(${procesoMasCorto.tiempoRestante})`);
                this.ejecutando.estado = 'LISTO';
                this.agregarACola(this.ejecutando);
                this.asignarACPU(this.cola.shift());
            }
        }

        // 4. ASIGNAR CPU SI ESTÁ LIBRE
        if (!this.ejecutando && this.cola.length > 0) {
            this.asignarACPU(this.cola.shift());
            console.log(`[T=${this.tiempo}] ${this.ejecutando.id} asignado a CPU`);
        }

        // 5. REGISTRAR EVENTOS
        this.registrarEventos();

        // 6. EJECUTAR PROCESO
        if (this.ejecutando) {
            const p = this.ejecutando;
            this.tiempoEjecutado[p.id]++;
            p.tiempoRestante--;
            
            console.log(`[T=${this.tiempo}] Ejecutando ${p.id}: ejecutado=${this.tiempoEjecutado[p.id]}/${p.tiempoRafaga}, restante=${p.tiempoRestante}`);

            if (p.inicioBloqueo > 0 && this.tiempoEjecutado[p.id] === p.inicioBloqueo) {
                console.log(`[T=${this.tiempo}] ${p.id} SE BLOQUEA por ${p.duracionBloqueo} unidades`);
                p.estado = 'BLOQUEADO';
                this.bloqueados.push([p, p.duracionBloqueo + 1]);
                this.ejecutando = null;
            } else if (this.tiempoEjecutado[p.id] === p.tiempoRafaga) {
                p.estado = 'TERMINADO';
                p.tiempoSalida = this.tiempo + 1;
                this.procesosTerminados.push(p);
                console.log(`[T=${this.tiempo}] ${p.id} TERMINADO`);
                this.ejecutando = null;
            }
        }

        // 7. INCREMENTAR TIEMPO DE ESPERA
        this.cola.forEach(p => {
            if (p.estado === 'LISTO') {
                p.tiempoEspera++;
            }
        });

        this.mostrarEstado();
        this.tiempo++;
        return this.hayActividadRestante();
    }
}