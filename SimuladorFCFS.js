/**
 * SimuladorFCFS - First Come First Served
 * Los procesos se ejecutan en el orden en que llegan
 */
class SimuladorFCFS extends SimuladorBase {
    constructor() {
        super();
    }

    /**
     * FCFS: simplemente añadir al final de la cola
     * El proceso que llegó primero se ejecuta primero
     */
    agregarACola(proceso) {
        this.cola.push(proceso);
    }
}

/**
 * SimuladorSJF - Shortest Job First
 * Los procesos con menor tiempo de ráfaga se ejecutan primero
 */
class SimuladorSJF extends SimuladorBase {
    constructor() {
        super();
    }

    /**
     * SJF: ordenar la cola por tiempo de ráfaga (menor primero)
     */
    agregarACola(proceso) {
        this.cola.push(proceso);
        // Ordenar por tiempoRafaga (menor primero)
        this.cola.sort((a, b) => a.tiempoRafaga - b.tiempoRafaga);
    }
}