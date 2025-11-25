// proceso_lugar.js
// Este script depende de la variable global procesoLugarMap

document.addEventListener('DOMContentLoaded', function() {
    const procesoSelect = document.getElementById('process_id');
    const lugarSelect = document.getElementById('place_id');
    
    // Validar que los elementos existen
    if (!procesoSelect || !lugarSelect) {
        console.error('proceso_lugar.js: No se encontraron los elementos select');
        return;
    }
    
    // Validar que existe el mapa de proceso-lugar
    if (typeof procesoLugarMap === 'undefined') {
        console.error('proceso_lugar.js: procesoLugarMap no está definido. Verifica que las variables globales se carguen antes de este script.');
        return;
    }
    
    console.log('proceso_lugar.js: Inicializado correctamente con', Object.keys(procesoLugarMap).length, 'procesos');
    
    // Evento cuando cambia la selección del proceso
    procesoSelect.addEventListener('change', function() {
        const procesoSeleccionado = this.value;
        
        console.log('proceso_lugar.js: Proceso seleccionado:', procesoSeleccionado);
        
        // Si no hay proceso seleccionado, resetear lugar
        if (!procesoSeleccionado) {
            lugarSelect.value = '';
            console.log('proceso_lugar.js: Lugar reseteado');
            return;
        }
        
        // Buscar el lugar correspondiente al proceso
        const lugarCorrespondiente = procesoLugarMap[procesoSeleccionado];
        
        if (lugarCorrespondiente) {
            console.log('proceso_lugar.js: Lugar encontrado:', lugarCorrespondiente);
            
            // Intentar seleccionar el lugar en el select
            let encontrado = false;
            
            for (let i = 0; i < lugarSelect.options.length; i++) {
                if (lugarSelect.options[i].value === lugarCorrespondiente || 
                    lugarSelect.options[i].text === lugarCorrespondiente) {
                    lugarSelect.selectedIndex = i;
                    encontrado = true;
                    console.log('proceso_lugar.js: Lugar seleccionado automáticamente');
                    break;
                }
            }
            
            if (!encontrado) {
                console.warn(`proceso_lugar.js: No se encontró el lugar "${lugarCorrespondiente}" en el select de lugares`);
                lugarSelect.value = '';
            }
        } else {
            console.warn(`proceso_lugar.js: No hay lugar asociado al proceso "${procesoSeleccionado}"`);
            lugarSelect.value = '';
        }
    });
});