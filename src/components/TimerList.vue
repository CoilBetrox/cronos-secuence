<template>
  <div class="timer-list">
    <div
      v-for="(timer, index) in timers"
      :key="timer.id"
      class="timer-row"
    >
      <InputText
        v-model="timer.name"
        placeholder="Nombre (ej. Calentamiento)"
        class="name"
        maxlength="32"
      />

      <div class="time-inputs">
        <div class="time-group">
          <InputNumber 
            v-model="timer.hh" 
            :min="0" 
            :max="23" 
            show-buttons
            button-layout="vertical"
            class="time-input"
            input-class="time-number"
          />
          <span class="time-label">hh</span>
        </div>
        
        <span class="time-separator">:</span>
        
        <div class="time-group">
          <InputNumber 
            v-model="timer.mm" 
            :min="0" 
            :max="59" 
            show-buttons
            button-layout="vertical"
            class="time-input"
            input-class="time-number"
          />
          <span class="time-label">mm</span>
        </div>
        
        <span class="time-separator">:</span>
        
        <div class="time-group">
          <InputNumber 
            v-model="timer.ss" 
            :min="0" 
            :max="59" 
            show-buttons
            button-layout="vertical"
            class="time-input"
            input-class="time-number"
          />
          <span class="time-label">ss</span>
        </div>
      </div>

      <div class="action-buttons">
        <!-- Botón para agregar después de este timer -->
        <Button
          icon="pi pi-plus"
          severity="success"
          rounded
          @click="$emit('add-after', index)"
          class="add-btn"
          :tooltip="'Agregar después'"
          tooltip-options="{ position: 'top' }"
        />
        
        <!-- Botón para eliminar este timer (no mostrar en el primero si solo hay uno) -->
        <Button
          v-if="timers.length > 1"
          icon="pi pi-minus"
          severity="danger"
          rounded
          @click="$emit('remove', timer.id)"
          class="remove-btn"
          :tooltip="'Eliminar'"
          tooltip-options="{ position: 'top' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const props = defineProps({
  timers: Array,
})

const emit = defineEmits(['add-after', 'remove', 'update-name'])

// Validación robusta del nombre
function validateAndUpdateName(timer, newValue) {
  // 1. Limitar longitud
  let validatedValue = newValue.slice(0, 32)
  
  // 2. Sanitizar contenido (opcional, según necesidades)
  // Eliminar caracteres peligrosos o innecesarios
  validatedValue = validatedValue.replace(/[<>{}[\]]/g, '') // Elimina caracteres HTML/JS peligrosos
  
  // 3. Validar que no sea solo espacios
  if (validatedValue.trim().length === 0) {
    validatedValue = ''
  }
  
  // 4. Asignar el valor validado
  timer.name = validatedValue
  
  // 5. Emitir evento con valor validado
  emit('update-name', { 
    id: timer.id, 
    name: validatedValue,
    originalLength: newValue.length,
    validatedLength: validatedValue.length
  })
}

// Watcher para validación adicional
watch(() => props.timers, (newTimers) => {
  newTimers.forEach(timer => {
    if (timer.name && timer.name.length > 32) {
      console.warn(`Timer ${timer.id} tiene nombre excesivo: ${timer.name.length} caracteres`)
      timer.name = timer.name.slice(0, 32)
    }
  })
}, { deep: true })
</script>

<style scoped>
.timer-list {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dark .timer-list {
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.timer-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(249, 250, 251, 0.8);
  margin-bottom: 0.75rem;
  transition: background-color 0.2s ease;
}

.dark .timer-row {
  background: rgba(51, 65, 85, 0.5);
}

.timer-row:hover {
  background: rgba(243, 244, 246, 0.9);
}

.dark .timer-row:hover {
  background: rgba(71, 85, 105, 0.6);
}

.timer-row:last-child {
  margin-bottom: 0;
}

.timer-row .name {
  flex: 1;
  min-width: 200px;
}

.timer-row .name :deep(.p-inputtext) {
  width: 100%;
  background: transparent;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.timer-row .name :deep(.p-inputtext:focus) {
  border-color: #3b82f6;
  box-shadow: none;
}

/* =======================
 * TIME INPUTS STYLES - REORGANIZADO
 * ======================= */
.time-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Courier New', monospace;
  min-width: 240px;
  margin-right: 1rem;
}

.time-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
}

.time-input {
  width: 85px;
}

/* Asegurar que los botones estén como columna */
.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical) {
  display: flex;
  flex-direction: row; /* Botones a la derecha del input */
  align-items: center;
  gap: 2px;
}

.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-input) {
  order: 1;
  width: 60px; /* Input más estrecho */
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  padding: 0.5rem 0.25rem !important;
  height: 44px;
  border-radius: 10px 0 0 10px !important; /* Redondeo solo izquierda */
  border-right: none !important; /* Eliminar borde derecho */
}

.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-button-group) {
  order: 2;
  display: flex;
  flex-direction: column;
  height: 44px;
}

.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-button) {
  width: 28px;
  height: 22px;
  min-height: 22px;
  border-radius: 0;
  flex: 1;
}

.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-button-up) {
  border-radius: 0 10px 0 0;
  margin-bottom: 0;
}

.time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-button-down) {
  border-radius: 0 0 10px 0;
  margin-top: 0;
}

/* Botones de incremento/decremento más visibles */
.time-input :deep(.p-inputnumber-button) {
  background: #f3f4f6 !important;
  border-color: #e5e7eb !important;
  color: #374151 !important;
}

.time-input :deep(.p-inputnumber-button:hover) {
  background: #e5e7eb !important;
}

.time-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.dark .time-label {
  color: #94a3b8;
}

/* Separadores ":" centrados verticalmente con los inputs */
.time-separator {
  font-size: 1.75rem;
  font-weight: 700;
  color: #374151;
  align-self: center; /* Centrado verticalmente */
  margin: 0;
  line-height: 44px; /* Misma altura que los inputs */
  height: 44px;
  display: flex;
  align-items: center;
}

.dark .time-separator {
  color: #cbd5e1;
}

/* =======================
 * ACTION BUTTONS
 * ======================= */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.add-btn,
.remove-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  min-height: 36px !important;
}

/* =======================
 * RESPONSIVE
 * ======================= */
@media (max-width: 768px) {
  .timer-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
  }
  
  .timer-row .name {
    min-width: auto;
    width: 100%;
  }
  
  .time-inputs {
    width: 100%;
    justify-content: center;
    min-width: auto;
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .time-input {
    width: 70px;
  }
  
  .time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-input) {
    width: 50px;
    height: 40px;
    font-size: 0.9375rem;
  }
  
  .time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-button-group) {
    height: 40px;
  }
  
  .time-separator {
    line-height: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
  
  .action-buttons {
    align-self: center;
    margin-top: 0.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .timer-row {
    gap: 1rem;
  }
  
  .time-input {
    width: 80px;
  }
  
  .time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-input) {
    width: 55px;
  }
  
  .time-inputs {
    min-width: 220px;
  }
}

/* Desktop grande */
@media (min-width: 1025px) {
  .timer-row .name {
    min-width: 240px;
  }
  
  .time-inputs {
    min-width: 260px;
  }
  
  .time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-input) {
    width: 65px;
  }
}

/* =======================
 * DARK MODE ADJUSTMENTS
 * ======================= */
.dark .time-input :deep(.p-inputnumber-input) {
  background: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

.dark .time-input :deep(.p-inputnumber-button) {
  background: #334155 !important;
  border-color: #475569 !important;
  color: #cbd5e1 !important;
}

.dark .time-input :deep(.p-inputnumber-button:hover) {
  background: #475569 !important;
}

.dark .time-input :deep(.p-inputnumber.p-inputnumber-buttons-vertical .p-inputnumber-input) {
  background: #1e293b;
  border-color: #475569;
}

.dark .time-input :deep(.p-inputnumber-input:focus) {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2) !important;
}
</style>