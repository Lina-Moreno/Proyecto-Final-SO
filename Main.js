document.getElementById("btnSimular").addEventListener("click", () => {
    const sim = new SimuladorFCFS();

    // Procesos de ejemplo
    sim.agregarProceso(new Proceso('A', 0, 5, 2, 3));
    sim.agregarProceso(new Proceso('B', 1, 4));
    sim.agregarProceso(new Proceso('C', 3, 2));
    sim.agregarProceso(new Proceso('D', 8, 5, 2, 3));

    const gantt = sim.simular();
    generarGrafica(sim, gantt);
});

function generarGrafica(sim, gantt) {
    const grid = document.getElementById("ganttGrid");
    const escala = document.getElementById("escalaTiempo");

    grid.innerHTML = "";
    escala.innerHTML = "";

    // Necesitamos calcular el tiempo final de cada proceso
    sim.todosLosProcesos.forEach(p => {
        // Buscar el último evento de este proceso en el gantt
        const eventosProceso = gantt.filter(ev => ev.proceso === p.id);
        if (eventosProceso.length > 0) {
            const ultimoEvento = eventosProceso[eventosProceso.length - 1];
            p.tiempoFinal = ultimoEvento.instante;
        } else {
            p.tiempoFinal = p.tiempoLlegada;
        }
    });

    const tiempoTotal = gantt[gantt.length - 1].instante + 1;

    sim.todosLosProcesos.forEach(p => {
        const fila = document.createElement("div");
        fila.classList.add("fila-proceso");

        const etiqueta = document.createElement("div");
        etiqueta.classList.add("etiqueta");
        etiqueta.textContent = p.id;
        fila.appendChild(etiqueta);

        for (let t = 0; t < tiempoTotal; t++) {
            const celda = document.createElement("div");
            celda.classList.add("celda");

            // Verificar si el proceso existe en este tiempo
            if (t >= p.tiempoLlegada && t <= p.tiempoFinal) {
                celda.classList.add("existencia");

                const evento = gantt.find(ev => ev.instante === t && ev.proceso === p.id);

                if (evento && evento.estado === "EJECUCION")
                    celda.classList.add("ejecucion");
                else if (evento && evento.estado === "BLOQUEADO")  // Verificar eventos BLOQUEADO
                    celda.classList.add("bloqueado");
                else if (evento && evento.estado === "LISTO")
                    celda.classList.add("espera");
                else
                    celda.classList.add("espera");

                // Borde para la existencia completa
                if (t === p.tiempoLlegada) celda.classList.add("borde-proceso");

                // Marca X donde llegó
                if (t === p.tiempoLlegada) celda.classList.add("llegada");
            }

            fila.appendChild(celda);
        }

        grid.appendChild(fila);
    });

    // Escala de tiempo
    for (let t = 0; t < tiempoTotal; t++) {
        const num = document.createElement("div");
        num.classList.add("escala-num");
        num.textContent = t;
        escala.appendChild(num);
    }
}