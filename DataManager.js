class DataManager {
    static procesosPredefinidos = [
        { id: 'A', tiempoLlegada: 0, tiempoRafaga: 6, inicioBloqueo: 3, duracionBloqueo: 2 },
        { id: 'B', tiempoLlegada: 1, tiempoRafaga: 8, inicioBloqueo: 1, duracionBloqueo: 3 },
        { id: 'C', tiempoLlegada: 2, tiempoRafaga: 7, inicioBloqueo: 5, duracionBloqueo: 1 },
        { id: 'D', tiempoLlegada: 4, tiempoRafaga: 3, inicioBloqueo: 0, duracionBloqueo: 0 },
        { id: 'E', tiempoLlegada: 6, tiempoRafaga: 9, inicioBloqueo: 2, duracionBloqueo: 4 },
        { id: 'F', tiempoLlegada: 6, tiempoRafaga: 2, inicioBloqueo: 0, duracionBloqueo: 0 }
    ];

    static crearProcesoPredefinido(data) {
        return new Proceso(
            data.id,
            data.tiempoLlegada,
            data.tiempoRafaga,
            data.inicioBloqueo,
            data.duracionBloqueo
        );
    }

    static getProcesoPredefinido(id) {
        const data = this.procesosPredefinidos.find(p => p.id === id);
        return data ? this.crearProcesoPredefinido(data) : null;
    }

    static getAllPredefinidos() {
        return this.procesosPredefinidos.map(data => this.crearProcesoPredefinido(data));
    }

    static cargarProcesosPredefinidosEnUI() {
        const listaDiv = document.getElementById('listaProcesosPredefinidos');
        if (!listaDiv) return;
        
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
        
        this.procesosPredefinidos.forEach(p => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><strong>${p.id}</strong></td>
                <td>${p.tiempoLlegada}</td>
                <td>${p.tiempoRafaga}</td>
                <td>${p.inicioBloqueo}</td>
                <td>${p.duracionBloqueo}</td>
                <td>
                    <button 
                        class="btn-agregar-proceso" 
                        id="btnProc${p.id}"
                        onclick="SimulacionManager.agregarProcesoPredefinido('${p.id}')">
                        Agregar
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        tabla.appendChild(tbody);
        listaDiv.innerHTML = '';
        listaDiv.appendChild(tabla);
        
        // Actualizar estado de botones
        setTimeout(() => {
            if (typeof SimulacionManager !== 'undefined') {
                SimulacionManager.actualizarBotonesPredefinidos();
            }
        }, 100);
    }
}