class SimulacionManager {
    static simulador = null;
    static tiempoIntervalo = null;
    static simulacionEnCurso = false;
    static procesosAgregados = new Set();
    static procesosEnInventario = new Map();

static iniciarSimulador(algoritmo) {    
    document.getElementById('menuPrincipal').style.display = 'none';
    document.getElementById('simulador').style.display = 'block';
    document.getElementById('tituloAlgoritmo').textContent = algoritmo;

    // Mostrar y ocultar control de quantum según el algoritmo
    const quantumControl = document.getElementById('quantumControl');
    if (algoritmo === 'RR') {
        quantumControl.style.display = 'flex';
    } else {
        quantumControl.style.display = 'none';
    }
    
    this.simulador = this.crearSimulador(algoritmo);
    
    this.procesosAgregados.clear();
    this.actualizarInterfaz();
}

    static volverMenu() {
        this.detenerSimulacion();
        document.getElementById('menuPrincipal').style.display = 'flex';
        document.getElementById('simulador').style.display = 'none';
        this.simulador = null;
        this.procesosAgregados.clear();
        this.procesosEnInventario.clear();
    }

    static agregarProcesoAlInventario(proceso) {
        if (this.procesosEnInventario.has(proceso.id)) {
            alert(`Ya existe un proceso con ID ${proceso.id}`);
            return false;
        }
        
        this.procesosEnInventario.set(proceso.id, proceso);
        this.actualizarInterfaz();
        return true;
    }

    static agregarProcesoASimulacion(id) {
        if (!this.simulador) {
            alert('Por favor inicia un simulador primero');
            return false;
        }
        
        const proceso = this.procesosEnInventario.get(id);
        if (!proceso) {
            alert(`Proceso ${id} no encontrado en inventario`);
            return false;
        }
        
        if (this.procesosAgregados.has(id)) {
            alert(`El proceso ${id} ya está en la simulación`);
            return false;
        }
        
        const procesoParaSimular = new Proceso(
            proceso.id,
            proceso.tiempoLlegada,
            proceso.tiempoRafaga,
            proceso.inicioBloqueo,
            proceso.duracionBloqueo
        );
        
        const agregado = this.simulador.agregarProceso(procesoParaSimular);
        if (agregado) {
            this.procesosAgregados.add(id);
            this.actualizarInterfaz();
            return true;
        }
        return false;
    }

static agregarProcesoPredefinido(id) {    
    if (!this.simulador) {
        alert('Por favor inicia un simulador primero');
        return;
    }
    
    if (this.procesosAgregados.has(id)) {
        alert(`El proceso ${id} ya ha sido agregado`);
        return;
    }
    
    const proceso = DataManager.getProcesoPredefinido(id);
    if (proceso) {
        if (!this.procesosEnInventario.has(id)) {
            this.procesosEnInventario.set(id, proceso);
        }
        
        const procesoNuevo = new Proceso(
            proceso.id,
            proceso.tiempoLlegada,
            proceso.tiempoRafaga,
            proceso.inicioBloqueo,
            proceso.duracionBloqueo
        );
        
        const agregado = this.simulador.agregarProceso(procesoNuevo);
        if (agregado) {
            this.procesosAgregados.add(id);
            this.actualizarBotonesPredefinidos();
            this.actualizarInterfaz();
        } else {
            console.warn(`No se pudo agregar el proceso ${id}`);
        }
    }
}

    static actualizarInterfaz() {
        this.actualizarBotonesPredefinidos();
        InterfaceManager.actualizarListaProcesosPersonalizados(
            this.procesosEnInventario,
            this.procesosAgregados
        );
        
        if (this.simulador) {
            InterfaceManager.actualizarCola(this.simulador);
            InterfaceManager.actualizarGantt(this.simulador);
        }
    }

static actualizarBotonesPredefinidos() {
    const botones = document.querySelectorAll('[id^="btnProc"]');
    
    botones.forEach(btn => {
        const idProceso = btn.id.replace('btnProc', '').replace('Custom', '');
        btn.disabled = this.procesosAgregados.has(idProceso);
        
        if (btn.disabled) {
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            btn.title = `Proceso ${idProceso} ya está en la simulación`;
        } else {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = `Agregar proceso ${idProceso} a la simulación`;
        }
    });
}

    //  Actualizar quantum
    static actualizarQuantum() {
        if (!this.simulador) {
            alert('No hay simulador activo');
            return;
        }
        
        if (this.simulador.constructor.name !== 'SimuladorRR') {
            alert('El quantum solo aplica para el algoritmo Round Robin');
            return;
        }
        
        if (this.simulacionEnCurso) {
            alert('No puedes cambiar el quantum mientras la simulación está en curso. Pausa o reinicia primero.');
            return;
        }
        
        const inputQuantum = document.getElementById('inputQuantum');
        const nuevoQuantum = parseInt(inputQuantum.value);
        
        if (isNaN(nuevoQuantum) || nuevoQuantum < 1) {
            alert('El quantum debe ser un número mayor o igual a 1');
            return;
        }
        
        this.simulador.quantum = nuevoQuantum;
        this.simulador.quantumRestante = nuevoQuantum;
        alert(`Quantum actualizado a ${nuevoQuantum}`);
    }

    static toggleSimulacion() {
        if (!this.simulador || !this.simulador.todosLosProcesos || this.simulador.todosLosProcesos.length === 0) {
            alert('Por favor agrega al menos un proceso a la simulación');
            return;
        }
        
        const btn = document.getElementById('btnPlay');
        
        if (this.simulacionEnCurso) {
            this.pausarSimulacion();
            btn.textContent = 'Reanudar';
        } else {
            this.iniciarSimulacion();
            btn.textContent = 'Pausar';
        }
    }

    static iniciarSimulacion() {
        this.simulacionEnCurso = true;
        document.getElementById('btnAgregarProceso').disabled = true;
        
        //  Deshabilitar input de quantum durante simulación
        const inputQuantum = document.getElementById('inputQuantum');
        if (inputQuantum) {
            inputQuantum.disabled = true;
        }
        
        if (!this.simulador) {
            console.error('No hay simulador inicializado');
            return;
        }
        
        if (!this.simulador.todosLosProcesos || this.simulador.todosLosProcesos.length === 0) {
            alert('No hay procesos para simular');
            this.simulacionEnCurso = false;
            return;
        }
                
        this.tiempoIntervalo = setInterval(() => {
            if (!this.simulador) {
                clearInterval(this.tiempoIntervalo);
                return;
            }
            
            const continua = this.simulador.paso();
            
            InterfaceManager.actualizarGantt(this.simulador);
            InterfaceManager.actualizarCola(this.simulador);
            document.getElementById('tiempoActual').textContent = this.simulador.tiempoActual;
            
            const terminados = this.simulador.procesosTerminados.length;
            const total = this.simulador.todosLosProcesos.length;
            document.getElementById('estadoSimulacion').textContent = 
                `Procesos terminados: ${terminados}/${total}`;
            
            if (!continua) {
                this.finalizarSimulacion();
            }
        }, 1000);
    }

    static pausarSimulacion() {
        clearInterval(this.tiempoIntervalo);
        this.simulacionEnCurso = false;
        document.getElementById('btnAgregarProceso').disabled = false;
        
        // Habilitar input de quantum al pausar
        const inputQuantum = document.getElementById('inputQuantum');
        if (inputQuantum) {
            inputQuantum.disabled = false;
        }
    }

    static detenerSimulacion() {
        clearInterval(this.tiempoIntervalo);
        this.simulacionEnCurso = false;
    }

    static finalizarSimulacion() {
        this.detenerSimulacion();
        document.getElementById('btnPlay').textContent = 'Iniciar';
        document.getElementById('btnPlay').disabled = false;
        document.getElementById('btnAgregarProceso').disabled = false;
        document.getElementById('estadoSimulacion').textContent = 'Simulación finalizada';
        
        // Habilitar input de quantum al finalizar
        const inputQuantum = document.getElementById('inputQuantum');
        if (inputQuantum) {
            inputQuantum.disabled = false;
        }
    }

static reiniciarSimulacion() {
    
    this.detenerSimulacion();
    this.simulacionEnCurso = false;
    
    this.procesosAgregados.clear();
    
    const algoritmo = document.getElementById('tituloAlgoritmo').textContent;
    this.simulador = this.crearSimulador(algoritmo);
    
    document.getElementById('tiempoActual').textContent = '0';
    document.getElementById('btnPlay').textContent = 'Iniciar';
    document.getElementById('btnPlay').disabled = false;
    document.getElementById('btnAgregarProceso').disabled = false;
    document.getElementById('estadoSimulacion').textContent = 'Simulación reiniciada - Agrega procesos';
    
    // Habilitar input de quantum al reiniciar
    const inputQuantum = document.getElementById('inputQuantum');
    if (inputQuantum) {
        inputQuantum.disabled = false;
    }
    
    DataManager.cargarProcesosPredefinidosEnUI();
    
    setTimeout(() => {
        InterfaceManager.actualizarListaProcesosPersonalizados(
            this.procesosEnInventario,
            this.procesosAgregados
        );
        
        InterfaceManager.actualizarGantt(this.simulador);
        InterfaceManager.actualizarCola(this.simulador);
        
    }, 150);
    
}

static crearSimulador(algoritmo) {
    let simulador;
    
    switch(algoritmo) {
        case 'FCFS':
            simulador = new SimuladorFCFS();
            break;
        
        case 'SJF':
            simulador = new SimuladorSJF();
            break;
        
        case 'SRTF':
            simulador = new SimuladorSRTF();
            break;
        
        case 'RR':
            // Obtener quantum del input al crear el simulador
            const inputQuantum = document.getElementById('inputQuantum');
            const quantum = inputQuantum ? parseInt(inputQuantum.value) : 2;
            simulador = new SimuladorRR();
            simulador.quantum = quantum;
            simulador.quantumRestante = quantum;
            break;
        
        default:
            simulador = new SimuladorFCFS();
    }
    
    return simulador;
}
}