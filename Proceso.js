class Proceso {
    constructor(id, tiempoLlegada, tiempoRafaga, inicioBloqueo = null, duracionBloqueo = 0) {
        this.id = id;
        this.tiempoLlegada = tiempoLlegada;
        this.tiempoRafaga = tiempoRafaga;
        this.tiempoSalida = this.tiempoSalida;
        
        this.inicioBloqueo = inicioBloqueo;
        this.duracionBloqueo = duracionBloqueo;
        this.tiempoDesbloqueo = null;

        // Estado dinámico
        this.tiempoRestante = tiempoRafaga;
        this.tiempoEjecutado = 0;
        this.estado = 'NUEVO';
        
        // Nueva propiedad para la gráfica
        this.tiempoFinal = null; // Se calculará después de la simulación
    }

    esBloqueable() {
        return this.inicioBloqueo !== null && 
               this.tiempoEjecutado === this.inicioBloqueo &&
               this.duracionBloqueo > 0;
    }
}