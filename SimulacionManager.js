class SimulacionManager {
    static simulador = null;
    static tiempoIntervalo = null;
    static simulacionEnCurso = false;
    static procesosAgregados = new Set(); // IDs de procesos en simulación
    static procesosEnInventario = new Map(); // TODOS los procesos disponibles

static iniciarSimulador(algoritmo) {
    console.log('Iniciando simulador con algoritmo:', algoritmo);
    
    document.getElementById('menuPrincipal').style.display = 'none';
    document.getElementById('simulador').style.display = 'block';
    document.getElementById('tituloAlgoritmo').textContent = algoritmo;
    
    // ✅ Usar el método centralizado
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
        this.procesosEnInventario.clear(); // ✅ Limpiar inventario también
    }

    // Método para solo guardar en inventario (NO en simulación)
    static agregarProcesoAlInventario(proceso) {
        // Verificar que no exista ya
        if (this.procesosEnInventario.has(proceso.id)) {
            alert(`Ya existe un proceso con ID ${proceso.id}`);
            return false;
        }
        
        this.procesosEnInventario.set(proceso.id, proceso);
        this.actualizarInterfaz();
        console.log(`Proceso ${proceso.id} agregado al inventario`);
        return true;
    }

    // Método para agregar a simulación (al hacer clic en botón)
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
        
        // Clonar el proceso para no modificar el original
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
            console.log(`Proceso ${id} agregado a simulación`);
            return true;
        }
        return false;
    }

    // Agregar proceso predefinido directamente a la simulación
static agregarProcesoPredefinido(id) {
    console.log('Agregando proceso predefinido:', id);
    
    if (!this.simulador) {
        alert('Por favor inicia un simulador primero');
        return;
    }
    
    if (this.procesosAgregados.has(id)) {
        alert(`El proceso ${id} ya ha sido agregado`);
        return;
    }
    
    // Obtener el proceso desde DataManager (siempre fresco)
    const proceso = DataManager.getProcesoPredefinido(id);
    if (proceso) {
        // Primero agregar al inventario si no está
        if (!this.procesosEnInventario.has(id)) {
            this.procesosEnInventario.set(id, proceso);
        }
        
        // Crear una NUEVA instancia del proceso (importante para reinicios)
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
            
            // Actualizar botones INMEDIATAMENTE
            this.actualizarBotonesPredefinidos();
            
            // Actualizar interfaz
            this.actualizarInterfaz();
            
            console.log(`Proceso ${id} agregado correctamente`);
        } else {
            console.warn(`No se pudo agregar el proceso ${id}`);
        }
    }
}

    static actualizarInterfaz() {
        this.actualizarBotonesPredefinidos();
        InterfaceManager.actualizarListaProcesosPersonalizados(
            this.procesosEnInventario, // ✅ Usar Map, no array
            this.procesosAgregados
        );
        
        if (this.simulador) {
            InterfaceManager.actualizarCola(this.simulador);
            InterfaceManager.actualizarGantt(this.simulador);
        }
    }

static actualizarBotonesPredefinidos() {
    // Obtener TODOS los botones de procesos predefinidos
    const botones = document.querySelectorAll('[id^="btnProc"]');
    
    botones.forEach(btn => {
        // Extraer el ID del proceso del ID del botón (ej: "btnProcA" -> "A")
        const idProceso = btn.id.replace('btnProc', '');
        
        // Verificar si este proceso YA está en la simulación
        btn.disabled = this.procesosAgregados.has(idProceso);
        
        // Agregar estilo visual para que sea obvio cuando está deshabilitado
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
        console.log('Iniciando simulación...');
        this.simulacionEnCurso = true;
        document.getElementById('btnAgregarProceso').disabled = true;
        
        if (!this.simulador) {
            console.error('No hay simulador inicializado');
            return;
        }
        
        if (!this.simulador.todosLosProcesos || this.simulador.todosLosProcesos.length === 0) {
            alert('No hay procesos para simular');
            this.simulacionEnCurso = false;
            return;
        }
        
        console.log(`Iniciando simulación con ${this.simulador.todosLosProcesos.length} procesos`);
        
        this.tiempoIntervalo = setInterval(() => {
            if (!this.simulador) {
                console.log('Simulador eliminado, deteniendo intervalo');
                clearInterval(this.tiempoIntervalo);
                return;
            }
            
            console.log(`\n=== Intervalo T=${this.simulador.tiempoActual} ===`);
            const continua = this.simulador.paso();
            
            InterfaceManager.actualizarGantt(this.simulador);
            InterfaceManager.actualizarCola(this.simulador);
            document.getElementById('tiempoActual').textContent = this.simulador.tiempoActual;
            
            const terminados = this.simulador.procesosTerminados.length;
            const total = this.simulador.todosLosProcesos.length;
            document.getElementById('estadoSimulacion').textContent = 
                `Procesos terminados: ${terminados}/${total}`;
            
            if (!continua) {
                console.log('Simulación finalizada normalmente');
                this.finalizarSimulacion();
            }
        }, 1000);
    }

    static pausarSimulacion() {
        clearInterval(this.tiempoIntervalo);
        this.simulacionEnCurso = false;
        document.getElementById('btnAgregarProceso').disabled = false;
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
    }

static reiniciarSimulacion() {
    console.log('Reiniciando simulación');
    
    // 1. Detener simulación
    this.detenerSimulacion();
    this.simulacionEnCurso = false;
    
    // 2. Limpiar SOLO los procesos agregados
    //    (mantener procesosEnInventario para conservar los personalizados)
    this.procesosAgregados.clear();
    console.log('✅ procesosAgregados limpiado');
    
    // 3. Crear nuevo simulador del MISMO tipo
    const algoritmo = document.getElementById('tituloAlgoritmo').textContent;
    this.simulador = this.crearSimulador(algoritmo);
    console.log(`✅ Nuevo simulador ${algoritmo} creado`);
    
    // 4. Resetear controles de UI
    document.getElementById('tiempoActual').textContent = '0';
    document.getElementById('btnPlay').textContent = 'Iniciar';
    document.getElementById('btnPlay').disabled = false;
    document.getElementById('btnAgregarProceso').disabled = false;
    document.getElementById('estadoSimulacion').textContent = 'Simulación reiniciada - Agrega procesos';
    
    // 5. Recargar botones predefinidos
    DataManager.cargarProcesosPredefinidosEnUI();
    
    // 6. Actualizar interfaz completa después de cargar botones
    setTimeout(() => {
        // ❌ NO llamar actualizarBotonesPredefinidos() aquí
        //    porque DataManager ya lo hace internamente
        
        // Actualizar lista de procesos personalizados
        InterfaceManager.actualizarListaProcesosPersonalizados(
            this.procesosEnInventario,
            this.procesosAgregados // ← Ahora está vacío, botones se habilitan
        );
        
        // Actualizar visualizaciones
        InterfaceManager.actualizarGantt(this.simulador);
        InterfaceManager.actualizarCola(this.simulador);
        
        console.log('✅ Interfaz actualizada completamente');
    }, 150);
    
    console.log('🔄 Simulación reiniciada correctamente');
}

// AGREGAR este método auxiliar:
static crearSimulador(algoritmo) {
    switch(algoritmo) {
        case 'FCFS':
            return new SimuladorFCFS();
        
        case 'SJF':
            return new SimuladorSJF();
        
        case 'SRTF':
            return new SimuladorSRTF();
        
        case 'RR':
            alert('Round Robin aún no está implementado');
            return null;
        
        default:
            return new SimuladorFCFS();
    }
}
}