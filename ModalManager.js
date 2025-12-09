class ModalManager {
    static abrirModalProceso() {
        const modal = document.getElementById('modalProceso');
        if (modal) {
            modal.classList.add('mostrar'); // ← CORREGIDO
        }
    }

    static cerrarModalProceso() {
        const modal = document.getElementById('modalProceso');
        if (modal) {
            modal.classList.remove('mostrar'); // ← CORREGIDO
        }
        const form = document.getElementById('formProceso');
        if (form) {
            form.reset();
        }
    }
static guardarProceso() {
    // NO verificar SimulacionManager.simulador aquí
    // porque solo estamos creando el proceso, no agregándolo a simulación
    
    const nombre = document.getElementById('inputNombre').value.trim().toUpperCase();
    const llegada = parseInt(document.getElementById('inputLlegada').value);
    const rafaga = parseInt(document.getElementById('inputRafaga').value);
    const inicioBloqueo = document.getElementById('inputInicioBloqueo').value ? 
                        parseInt(document.getElementById('inputInicioBloqueo').value) : 0;
    const duracionBloqueo = document.getElementById('inputDuracionBloqueo').value ? 
                         parseInt(document.getElementById('inputDuracionBloqueo').value) : 0;

    // Validaciones básicas
    if (!nombre || isNaN(llegada) || isNaN(rafaga)) {
        alert('Por favor completa los campos obligatorios');
        return;
    }

    // ✅ VALIDACIONES DE LÓGICA
    if (llegada < 0) {
        alert('El tiempo de llegada no puede ser negativo');
        return;
    }
    if (rafaga <= 0) {
        alert('El tiempo de ráfaga debe ser mayor a 0');
        return;
    }
    if (inicioBloqueo < 0 || duracionBloqueo < 0) {
        alert('Los tiempos de bloqueo no pueden ser negativos');
        return;
    }
    if (inicioBloqueo > 0 && duracionBloqueo <= 0) {
        alert('Si especifica inicio de bloqueo, la duración debe ser > 0');
        return;
    }

    // CREAR proceso pero NO agregarlo a simulación
    const proceso = new Proceso(nombre, llegada, rafaga, inicioBloqueo, duracionBloqueo);
    
    // Guardar en inventario para mostrarlo en UI
    // Necesitamos crear este método en SimulacionManager
    const guardado = SimulacionManager.agregarProcesoAlInventario(proceso);
    
    if (guardado) {
        this.cerrarModalProceso();
    }
}

    static init() {
        const modal = document.getElementById('modalProceso');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'modalProceso') {
                    this.cerrarModalProceso();
                }
            });
        }
    }
}