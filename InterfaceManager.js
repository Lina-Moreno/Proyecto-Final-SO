class InterfaceManager {
    
static actualizarGantt(simulador) {
    const ganttGrid = document.getElementById('ganttGrid');
    if (!ganttGrid || !simulador) return;
    
    ganttGrid.innerHTML = '';
    
    if (simulador.todosLosProcesos.length === 0 || simulador.tiempoActual === 0) {
        this.actualizarEscalaTiempo(30);
        return;
    }
    
    // último agregado aparece arriba
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
    
    // Crear fila del DESPACHADOR (S) - solo para RR
    if (simulador.constructor.name === 'SimuladorRR') {
        const filaDespachador = document.createElement('div');
        filaDespachador.className = 'fila-proceso';
        
        // Etiqueta del despachador
        const etiquetaDiv = document.createElement('div');
        etiquetaDiv.className = 'etiqueta despachador';
        etiquetaDiv.textContent = 'S';
        etiquetaDiv.style.backgroundColor = '#2196F3';
        etiquetaDiv.style.color = 'white';
        
        filaDespachador.appendChild(etiquetaDiv);
        
        // Crear celdas para cada unidad de tiempo
        for (let tiempo = 0; tiempo < tiempoMax; tiempo++) {
            const celdaDiv = document.createElement('div');
            celdaDiv.className = 'celda';
            
            // Buscar si hay un evento de DESPACHADOR en este tiempo
            const esDespachador = simulador.ganttChart.some(ev => 
                ev.instante === tiempo && ev.estado === 'DESPACHADOR'
            );
            
            if (esDespachador) {
                celdaDiv.classList.add('despachador');
                celdaDiv.style.backgroundColor = '#2196F3';
                celdaDiv.title = `T=${tiempo}: DESPACHADOR (cambio de proceso)`;
            }
            
            filaDespachador.appendChild(celdaDiv);
        }
        
        ganttGrid.appendChild(filaDespachador);
    }
    
    // Actualizar escala de tiempo
    this.actualizarEscalaTiempo(tiempoMax);
    
    // ACTUALIZAR TABLA DE ESTADÍSTICAS
    this.actualizarTablaEstadisticas(simulador);
}

static actualizarEscalaTiempo(maxTiempo) {
    const escalaDiv = document.getElementById('escalaTiempo');
    if (!escalaDiv) return;
    
    escalaDiv.innerHTML = '';
    
    // Crear números desde 0 hasta maxTiempo
    for (let i = 0; i <= maxTiempo; i++) {
        const numDiv = document.createElement('div');
        numDiv.className = 'escala-num';
        numDiv.textContent = i;
        escalaDiv.appendChild(numDiv);
    }
}

    // Actualizar cola - Muestra cola unificada (listos + bloqueados)
    static actualizarCola(simulador) {
        const colaDiv = document.getElementById('colaVisualizacion');
        if (!colaDiv || !simulador) return;
        
        colaDiv.innerHTML = '';
        
        // Para RR: mostrar toda la cola unificada
        if (simulador.constructor.name === 'SimuladorRR') {
            if (simulador.cola.length === 0) {
                const span = document.createElement('span');
                span.className = 'cola-vacia';
                span.textContent = 'Vacía';
                colaDiv.appendChild(span);
                return;
            }
            
            // Mostrar cada proceso en el orden de la cola
            simulador.cola.forEach(p => {
                const procesoDiv = document.createElement('div');
                procesoDiv.className = 'proceso-cola';
                
                const estaBloqueado = simulador.infoBloqueados.has(p.id);
                
                if (estaBloqueado) {
                    const tiempoDesbloqueo = simulador.infoBloqueados.get(p.id);
                    procesoDiv.style.backgroundColor = '#ff5252';
                    procesoDiv.style.color = 'white';
                    procesoDiv.title = `${p.id} - Bloqueado hasta t=${tiempoDesbloqueo}`;
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = `<strong>${p.id}</strong><br><small>Bloq. @${tiempoDesbloqueo}</small>`;
                    procesoDiv.appendChild(infoDiv);
                } else {
                    procesoDiv.title = `${p.id} - Listo`;
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = `<strong>${p.id}</strong>`;
                    procesoDiv.appendChild(infoDiv);
                }
                
                colaDiv.appendChild(procesoDiv);
            });
        } else {
            // Para otros algoritmos, solo mostrar cola de listos
            if (simulador.colaListos.length === 0) {
                const span = document.createElement('span');
                span.className = 'cola-vacia';
                span.textContent = 'Vacía';
                colaDiv.appendChild(span);
            } else {
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
    }

static actualizarListaProcesosPersonalizados(procesosEnInventario, procesosAgregados) {
    const listaDiv = document.getElementById('listaProcesosPersonalizados');
    if (!listaDiv) return;
    
    listaDiv.innerHTML = '';

    const procesosArray = Array.from(procesosEnInventario.values());
    
    // Filtrar SOLO procesos personalizados 
    const procesosPersonalizados = procesosArray.filter(proceso => {
        const esPredefinido = DataManager.procesosPredefinidos.some(p => p.id === proceso.id);
        return !esPredefinido;
    });
    
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


static actualizarTablaEstadisticas(simulador) {
    const contenedorStats = document.getElementById('tablaEstadisticas');
    if (!contenedorStats || !simulador) return;
    
    contenedorStats.innerHTML = '';
    
    // Solo mostrar si hay procesos terminados
    const procesosTerminados = simulador.todosLosProcesos.filter(p => p.estado === 'TERMINADO');
    
    if (procesosTerminados.length === 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'mensaje-vacio';
        mensaje.textContent = 'No hay procesos finalizados aún';
        contenedorStats.appendChild(mensaje);
        return;
    }
    
    // Crear tabla
    const tabla = document.createElement('table');
    tabla.className = 'tabla-estadisticas';
    
    // Crear encabezado
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Proceso</th>
            <th>Ejecución<br>t</th>
            <th>Espera</th>
            <th>Bloqueo</th>
            <th>Instante<br>fin<br>If</th>
            <th>Retorno<br>T = If - Ii</th>
            <th>Tiempo<br>perdido<br>T - t</th>
            <th>Penalidad<br>Ip = T/t</th>
            <th>Tiempo<br>respuesta<br>Tr</th>
        </tr>
    `;
    tabla.appendChild(thead);
    
    // Crear cuerpo
    const tbody = document.createElement('tbody');
    
    procesosTerminados.forEach(proceso => {
        const tr = document.createElement('tr');
        
        // Calcular estadísticas
        const Ii = proceso.tiempoLlegada;
        const If = proceso.tiempoSalida;
        const t = proceso.tiempoRafaga;
        const T = If - Ii;
        const TmenosT = T - t;
        const Ip = (T / t).toFixed(2);
        
        // Tiempo de respuesta = primer tiempo de ejecución - tiempo de llegada
        const Tr = proceso.tiempoInicioEjecucion !== null ? 
                   proceso.tiempoInicioEjecucion - Ii : 0;
        
        // Tiempo de espera (lo tenemos en proceso.tiempoEspera)
        const espera = proceso.tiempoEspera || 0;
        
        // Calcular tiempo de bloqueo
        const bloqueo = TmenosT - espera;
        
        tr.innerHTML = `
            <td><strong>${proceso.id}</strong></td>
            <td>${t}</td>
            <td>${espera}</td>
            <td>${bloqueo}</td>
            <td>${If}</td>
            <td>${T}</td>
            <td>${TmenosT}</td>
            <td>${Ip}</td>
            <td>${Tr}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    tabla.appendChild(tbody);
    contenedorStats.appendChild(tabla);
}
}