class Proceso {
    constructor(id, tiempoLlegada, tiempoRafaga, inicioBloqueo = 0, duracionBloqueo = 0) {
        this.id = id;
        this.tiempoLlegada = tiempoLlegada;
        this.tiempoRafaga = tiempoRafaga;
        this.tiempoRestante = tiempoRafaga;
        this.inicioBloqueo = inicioBloqueo || 0;
        this.duracionBloqueo = duracionBloqueo || 0;
        
        this.estado = 'NUEVO'; // NUEVO, LISTO, EJECUCION, BLOQUEADO, TERMINADO
        this.tiempoInicioEjecucion = null;
        this.tiempoSalida = null;
        this.tiempoEspera = 0;
    }

    reset() {
        this.tiempoRestante = this.tiempoRafaga;
        this.estado = 'NUEVO';
        this.tiempoInicioEjecucion = null;
        this.tiempoSalida = null;
        this.tiempoEspera = 0;
    }

    toString() {
        return `${this.id}[L:${this.tiempoLlegada}, R:${this.tiempoRafaga}, E:${this.estado}]`;
    }
}