class SimuladorFCFS {
    constructor() {
        this.tiempoActual = 0;
        this.colaListos = [];      // Cola FIFO para FCFS
        this.colaBloqueados = [];  // Lista de procesos esperando I/O
        this.procesosTerminados = [];
        this.todosLosProcesos = []; // Referencia global
        this.ganttChart = [];      // Datos para la gráfica
        this.cpu = null;           // Proceso actual en ejecución
    }

    agregarProceso(proceso) {
        this.todosLosProcesos.push(proceso);
    }

    tiempoTotal(){

    }

    simular() {
        // El bucle continúa mientras haya procesos que no han terminado
        while (this.procesosTerminados.length < this.todosLosProcesos.length) {
            
            // A. Revisar nuevos procesos que llegan al sistema (NUEVO -> LISTO)
            this.verificarLlegadas();

            // B. Revisar procesos bloqueados que ya cumplieron su tiempo (BLOQUEADO -> LISTO)
            this.verificarDesbloqueos();

            // C. Asignar CPU si está libre (Algoritmo FCFS: toma el primero de la cola)
            if (this.cpu === null && this.colaListos.length > 0) {
                this.cpu = this.colaListos.shift(); // Saca el primero (FIFO)
                this.cpu.estado = 'EJECUCION';
            }

            // D. Ejecutar un ciclo de reloj (1 unidad de tiempo)
            this.ejecutarCiclo();

            // E. Avanzar el reloj global
            this.tiempoActual++;
        }

        return this.ganttChart;
    }

    verificarLlegadas() {
        this.todosLosProcesos.forEach(p => {
            if (p.tiempoLlegada === this.tiempoActual && p.estado === 'NUEVO') {
                p.estado = 'LISTO';
                this.colaListos.push(p);
                console.log(`[t=${this.tiempoActual}] ${p.id} llegó y entra a cola de listos.`);
            }
        });
    }

    verificarDesbloqueos() {
        // Filtramos la cola de bloqueados
        for (let i = 0; i < this.colaBloqueados.length; i++) {
            let p = this.colaBloqueados[i];
            
            if (this.tiempoActual >= p.tiempoDesbloqueo) {
                p.estado = 'LISTO';
                p.tiempoDesbloqueo = null; // Resetear
                this.colaListos.push(p);   // Vuelve a la cola de listos (al final)
                this.colaBloqueados.splice(i, 1); // Lo sacamos de bloqueados
                i--; // Ajustar índice
            }
        }
    }

    ejecutarCiclo() {
        // Primero, registrar LISTO para todos los procesos en cola de listos
        this.colaListos.forEach(p => {
            this.ganttChart.push({ 
                instante: this.tiempoActual, 
                proceso: p.id,
                estado: 'LISTO' 
            });
        });

        // Segundo, registrar BLOQUEADO para todos los procesos bloqueados
        this.colaBloqueados.forEach(p => {
            this.ganttChart.push({ 
                instante: this.tiempoActual, 
                proceso: p.id,
                estado: 'BLOQUEADO' 
            });
        });

        if (this.cpu) {
            // 1. Registrar en Gantt como EJECUCION
            this.ganttChart.push({ 
                instante: this.tiempoActual, 
                proceso: this.cpu.id,
                estado: 'EJECUCION' 
            });

            // 2. Procesar
            this.cpu.tiempoRestante--;
            this.cpu.tiempoEjecutado++;

            // 3. Verificar si terminó
            if (this.cpu.tiempoRestante === 0) {
                this.cpu.estado = 'TERMINADO';
                this.procesosTerminados.push(this.cpu);
                this.cpu.tiempoSalida = this.tiempoActual;
                this.cpu = null; // Liberar CPU
            } 
            // 4. Verificar si se debe bloquear AHORA
            else if (this.cpu.esBloqueable()) {
                this.cpu.estado = 'BLOQUEADO';
                // Calculamos cuándo saldrá del bloqueo
                this.cpu.tiempoDesbloqueo = this.tiempoActual + this.cpu.duracionBloqueo; 
                
                this.colaBloqueados.push(this.cpu);
                this.cpu = null; // Liberar CPU
            }

        } else {
            // CPU Ociosa
            this.ganttChart.push({ 
                instante: this.tiempoActual, 
                proceso: 'OCIO', 
                estado: 'OCIO' 
            });
            console.log(`[t=${this.tiempoActual}] CPU Ociosa...`);
        }
    }
}