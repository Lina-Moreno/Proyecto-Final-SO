/**
 * Simulador SRTF (Shortest Remaining Time First)
 * Implementa planificación por el menor tiempo restante primero
 */
class SimuladorSRTF extends SimuladorBase {
    constructor() {
        super();
        console.log('Simulador SRTF creado');
    }

    /**
     * Agregar proceso a la cola (ordenado por tiempo restante)
     */
    agregarACola(proceso) {
        // Insertar en la posición correcta para mantener la cola ordenada por tiempo restante
        let insertado = false;
        
        for (let i = 0; i < this.cola.length; i++) {
            if (proceso.tiempoRestante < this.cola[i].tiempoRestante) {
                this.cola.splice(i, 0, proceso);
                insertado = true;
                break;
            }
            // Si tienen el mismo tiempo restante, usar FCFS como desempate
            else if (proceso.tiempoRestante === this.cola[i].tiempoRestante) {
                if (proceso.tiempoLlegada < this.cola[i].tiempoLlegada) {
                    this.cola.splice(i, 0, proceso);
                    insertado = true;
                    break;
                }
            }
        }
        
        if (!insertado) {
            this.cola.push(proceso);
        }
        
        console.log(`[SRTF] ${proceso.id} agregado a cola. Cola actual:`, 
            this.cola.map(p => `${p.id}(${p.tiempoRestante})`).join(', '));
    }

    /**
     * Revisar si hay un proceso en cola con menor tiempo restante que el actual
     * Esto implementa el preemptivo de SRTF
     */
    verificarPreemption() {
        if (!this.ejecutando) return;
        
        // Buscar en la cola un proceso con menor tiempo restante
        const procesoMasCorto = this.cola.find(p => p.tiempoRestante < this.ejecutando.tiempoRestante);
        
        if (procesoMasCorto) {
            console.log(`[SRTF-PREEMPT] ${this.ejecutando.id} (${this.ejecutando.tiempoRestante}) → ${procesoMasCorto.id} (${procesoMasCorto.tiempoRestante})`);
            
            // Remover el proceso más corto de la cola
            const index = this.cola.indexOf(procesoMasCorto);
            if (index > -1) {
                this.cola.splice(index, 1);
            }
            
            // Poner el proceso actual de vuelta en la cola (ordenado)
            this.ejecutando.estado = 'LISTO';
            this.agregarACola(this.ejecutando);
            
            // Asignar el proceso más corto a CPU
            this.ejecutando = procesoMasCorto;
            this.ejecutando.estado = 'EJECUCION';
            
            if (this.ejecutando.tiempoInicioEjecucion === null) {
                this.ejecutando.tiempoInicioEjecucion = this.tiempo;
            }
            
            console.log(`[T=${this.tiempo}] ${this.ejecutando.id} (más corto) asignado a CPU`);
        }
    }

    /**
     * Sobrescribir paso 4 para incluir verificación de preemption
     */
    paso4_AsignarSiNecesario() {
        if (this.ejecutando === null && this.cola.length > 0) {
            this.ejecutando = this.cola.shift();
            this.ejecutando.estado = 'EJECUCION';
            if (this.ejecutando.tiempoInicioEjecucion === null) {
                this.ejecutando.tiempoInicioEjecucion = this.tiempo;
            }
            console.log(`[T=${this.tiempo}] ${this.ejecutando.id} (SRTF) asignado a CPU`);
        }
        // Si ya hay un proceso ejecutando, verificar si debe ser preemptado
        else if (this.ejecutando !== null) {
            this.verificarPreemption();
        }
    }

    /**
     * Sobrescribir paso 5 para actualizar tiempo restante y verificar preemption después de ejecutar
     */
    paso5_EjecutarUnidad() {
        if (this.ejecutando === null) {
            return;
        }

        const p = this.ejecutando;
        
        // Incrementar tiempo ejecutado
        this.tiempoEjecutado[p.id]++;
        p.tiempoRestante--;
        
        console.log(`[T=${this.tiempo}] SRTF ejecutando ${p.id}: ejecutado=${this.tiempoEjecutado[p.id]}/${p.tiempoRafaga}, restante=${p.tiempoRestante}`);

        // Verificar si debe bloquearse AHORA
        if (p.inicioBloqueo > 0 && this.tiempoEjecutado[p.id] === p.inicioBloqueo) {
            console.log(`[T=${this.tiempo}] ${p.id} SE BLOQUEA por ${p.duracionBloqueo} unidades`);
            p.estado = 'BLOQUEADO';
            this.bloqueados.push([p, p.duracionBloqueo]);
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
     * Sobrescribir paso 2 para ordenar nuevos procesos que llegan
     */
    paso2_AnadirLlegadas() {
        this.procesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempo && p.estado === 'NUEVO') {
                console.log(`[T=${this.tiempo}] ${p.id} LLEGA a la cola SRTF`);
                p.estado = 'LISTO';
                this.agregarACola(p);
                
                // Verificar preemption después de agregar un nuevo proceso
                this.verificarPreemption();
            }
        });
    }

    /**
     * Sobrescribir paso 3 para reordenar procesos desbloqueados
     */
    paso3_ActualizarBloqueados() {
        for (let i = this.bloqueados.length - 1; i >= 0; i--) {
            const [proceso, tRestante] = this.bloqueados[i];
            
            // Decrementar tiempo restante
            const nuevoTiempoRestante = tRestante - 1;
            console.log(`[T=${this.tiempo}] ${proceso.id} bloqueado: tRestante=${nuevoTiempoRestante}`);
            
            if (nuevoTiempoRestante === 0) {
                console.log(`[T=${this.tiempo}] ${proceso.id} DESBLOQUEADO -> cola SRTF`);
                proceso.estado = 'LISTO';
                this.agregarACola(proceso);
                this.bloqueados.splice(i, 1);
                
                // Verificar preemption después de desbloquear un proceso
                this.verificarPreemption();
            } else {
                // Actualizar tiempo restante
                this.bloqueados[i] = [proceso, nuevoTiempoRestante];
            }
        }
    }
}