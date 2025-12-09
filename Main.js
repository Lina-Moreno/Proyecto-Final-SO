class Main {
    static init() {
        console.log('Inicializando aplicación...');
        
        try {
            // Inicializar los managers
            DataManager.cargarProcesosPredefinidosEnUI();
            SimulacionManager.init();
            InterfaceManager.init();
            ModalManager.init(); // ← FALTABA INICIALIZAR EL MODAL MANAGER
            
            // Asegurar que el modal esté cerrado al inicio
            const modal = document.getElementById('modalProceso');
            if (modal) {
                modal.classList.remove('mostrar'); // ← CORRECCIÓN: usar classList, NO style.display
            }
            
            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            alert('Hubo un error al inicializar la aplicación. Revisa la consola.');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Main.init();
});