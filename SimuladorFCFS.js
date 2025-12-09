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