class Main {
    static init() {        
        try {
            // Inicializar los managers
            DataManager.cargarProcesosPredefinidosEnUI();
            SimulacionManager.init();
            InterfaceManager.init();
            ModalManager.init(); 
            
            // Asegurar que el modal esté cerrado al inicio
            const modal = document.getElementById('modalProceso');
            if (modal) {
                modal.classList.remove('mostrar'); 
            }
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Main.init();
});