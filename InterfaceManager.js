class InterfaceManager {
    static init() {
        console.log('InterfaceManager inicializado');
    }

    
static actualizarGantt(simulador) {
    const ganttGrid = document.getElementById('ganttGrid');
    if (!ganttGrid || !simulador) return;
    
    ganttGrid.innerHTML = '';
    
    if (simulador.todosLosProcesos.length === 0 || simulador.tiempoActual === 0) {
        this.actualizarEscalaTiempo(30);
        return;
    }
    
    // ✅ Invertir orden: último agregado aparece arriba
    const procesosOrdenados = [...simulador.todosLosProcesos].reverse();
    
    let tiempoMax = Math.max(simulador.tiempoActual, 30);
    
    // Crear una fila para cada proceso
    procesosOrdenados.forEach(proceso => {
        const filaDiv = document.createElement('div');
        filaDiv.className = 'fila-proceso';
        
        // Etiqueta del proceso
        const etiquetaDiv = document.createElement('div');
        etiquetaDiv.className = 'etiqueta';
        etiquetaDiv.textContent = proceso.id;
        
        filaDiv.appendChild(etiquetaDiv);
        
        // Crear celdas para cada unidad de tiempo
        for (let tiempo = 0; tiempo < tiempoMax; tiempo++) {
            const celdaDiv = document.createElement('div');
            celdaDiv.className = 'celda';
            
            // Determinar si el proceso existe en este tiempo
            const haLlegado = tiempo >= proceso.tiempoLlegada;
            const haTerminado = proceso.estado === 'TERMINADO' && proceso.tiempoSalida && tiempo >= proceso.tiempoSalida;
            
            if (!haLlegado || haTerminado) {
                filaDiv.appendChild(celdaDiv);
                continue;
            }
            
            // Buscar eventos en este instante en el ganttChart
            const eventos = simulador.ganttChart.filter(ev => 
                ev.instante === tiempo && ev.proceso === proceso.id
            );
            
            // Determinar el estado más importante
            if (eventos.some(e => e.estado === 'EJECUCION')) {
                celdaDiv.classList.add('ejecucion');
                celdaDiv.title = `T=${tiempo}: ${proceso.id} en EJECUCIÓN`;
            } else if (eventos.some(e => e.estado === 'BLOQUEADO')) {
                celdaDiv.classList.add('bloqueado');
                celdaDiv.title = `T=${tiempo}: ${proceso.id} BLOQUEADO`;
            } else if (eventos.some(e => e.estado === 'LISTO')) {
                celdaDiv.classList.add('espera');
                celdaDiv.title = `T=${tiempo}: ${proceso.id} en ESPERA`;
            }
            
            // Marcar tiempo de llegada
            if (tiempo === proceso.tiempoLlegada) {
                celdaDiv.classList.add('borde-proceso', 'llegada');
            }
            
            filaDiv.appendChild(celdaDiv);
        }
        ganttGrid.appendChild(filaDiv);
    });
    
    // Actualizar escala de tiempo
    this.actualizarEscalaTiempo(tiempoMax);
}

static actualizarEscalaTiempo(maxTiempo) {
    const escalaDiv = document.getElementById('escalaTiempo');
    if (!escalaDiv) return;
    
    escalaDiv.innerHTML = '';
    
    // Crear números desde 0 hasta maxTiempo (inclusive)
    // Esto pone un número en cada borde, no en el centro de cada celda
    for (let i = 0; i <= maxTiempo; i++) {
        const numDiv = document.createElement('div');
        numDiv.className = 'escala-num';
        numDiv.textContent = i;
        escalaDiv.appendChild(numDiv);
    }
}
    static actualizarCola(simulador) {
        const colaDiv = document.getElementById('colaVisualizacion');
        if (!colaDiv || !simulador) return;
        
        colaDiv.innerHTML = '';
        
        if (simulador.colaListos.length === 0) {
            const span = document.createElement('span');
            span.className = 'cola-vacia';
            span.textContent = 'Vacía';
            colaDiv.appendChild(span);
        } else {
            // Mostrar información del proceso en la cola
            simulador.colaListos.forEach(proceso => {
                const procesoDiv = document.createElement('div');
                procesoDiv.className = 'proceso-cola';
                
                const infoDiv = document.createElement('div');
                infoDiv.textContent = proceso.id;
                infoDiv.style.fontWeight = 'bold';
                
                procesoDiv.appendChild(infoDiv);
                colaDiv.appendChild(procesoDiv);
            });
        }
    }

static actualizarListaProcesosPersonalizados(procesosEnInventario, procesosAgregados) {
    const listaDiv = document.getElementById('listaProcesosPersonalizados');
    if (!listaDiv) return;
    
    listaDiv.innerHTML = '';
    
    console.log('Actualizando lista personalizada:');
    console.log('Inventario:', Array.from(procesosEnInventario.keys()));
    console.log('Agregados:', Array.from(procesosAgregados));
    
    const procesosArray = Array.from(procesosEnInventario.values());
    
    // Filtrar SOLO procesos personalizados (no predefinidos)
    const procesosPersonalizados = procesosArray.filter(proceso => {
        const esPredefinido = DataManager.procesosPredefinidos.some(p => p.id === proceso.id);
        return !esPredefinido;
    });
    
    console.log('Procesos personalizados encontrados:', procesosPersonalizados.map(p => p.id));
    
    // Si no hay procesos personalizados
    if (procesosPersonalizados.length === 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'mensaje-vacio';
        mensaje.textContent = 'No hay procesos personalizados creados';
        listaDiv.appendChild(mensaje);
        return;
    }
    
    // Ordenar por ID
    procesosPersonalizados.sort((a, b) => a.id.localeCompare(b.id));
    
    // Crear tabla
    const tabla = document.createElement('table');
    tabla.className = 'tabla-procesos';
    
    // Crear encabezado
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Proceso</th>
            <th>Instante llegada</th>
            <th>Ejecución t</th>
            <th colspan="2">Bloqueo</th>
            <th>Acción</th>
        </tr>
        <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>inicio</th>
            <th>duración</th>
            <th></th>
        </tr>
    `;
    tabla.appendChild(thead);
    
    // Crear cuerpo
    const tbody = document.createElement('tbody');
    
    procesosPersonalizados.forEach(proceso => {
        const tr = document.createElement('tr');
        
        const estaAgregado = procesosAgregados.has(proceso.id);
        console.log(`Proceso ${proceso.id}: agregado=${estaAgregado}`);
        
        tr.innerHTML = `
            <td><strong>${proceso.id}</strong></td>
            <td>${proceso.tiempoLlegada}</td>
            <td>${proceso.tiempoRafaga}</td>
            <td>${proceso.inicioBloqueo}</td>
            <td>${proceso.duracionBloqueo}</td>
            <td>
                <button 
                    class="btn-agregar-proceso" 
                    id="btnProcCustom${proceso.id}"
                    ${estaAgregado ? 'disabled' : ''}
                    onclick="SimulacionManager.agregarProcesoASimulacion('${proceso.id}')">
                    Agregar
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    tabla.appendChild(tbody);
    listaDiv.appendChild(tabla);
}
}