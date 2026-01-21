<template>
  <section class="home" :class="{ dark: darkMode }">

    <!-- ================= CONFIGURACIÓN ================= -->
    <div v-if="view === 'config'" class="panel">

      <header class="header">
        <Button
          label="Comenzar"
          icon="pi pi-play-circle"
          class="start-btn"
          :disabled="!canStart || isLoading"
          @click="startTimers"
        />

        <div class="options">
          <div class="repeat">
            <Checkbox v-model="repeat" binary />
            <label>Repetir infinitamente</label>
          </div>

          <!-- Control de audio -->
          <Button
            :icon="isAudioEnabled ? 'pi pi-volume-up' : 'pi pi-volume-off'"
            text
            rounded
            @click="toggleAudio"
            :tooltip="isAudioEnabled ? 'Silenciar sonidos' : 'Activar sonidos'"
          />

          <Button
            icon="pi pi-moon"
            text
            rounded
            @click="toggleDark"
          />
        </div>
      </header>

      <!-- Controles de volumen (opcional, se puede esconder) -->
      <div v-if="showVolumeControl" class="volume-control">
        <label>Volumen:</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          :value="volume * 100"
          @input="setAudioVolume($event.target.value / 100)"
          class="volume-slider"
        />
        <span>{{ Math.round(volume * 100) }}%</span>
      </div>

      <!-- LISTA DE CRONÓMETROS -->
      <TimerList
        :timers="timers"
        :disabled="isRunning"
        @add-after="addTimerAfter"
        @remove="removeTimer"
        @update-name="updateTimerName"
      />
    </div>

    <!-- ================= EJECUCIÓN ================= -->
    <div v-else class="panel">
      <TimerDisplay
        :current="currentTimer"
        :next="nextTimer"
        :remaining="remainingTime"
        @finish="finish"
      />
    </div>

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimerSequence } from '@/composables/useTimerSequence'
import { useAudio } from '@/composables/useAudio'

import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'

import TimerList from '@/components/TimerList.vue'
import TimerDisplay from '@/components/TimerDisplay.vue'

/* =======================
 * AUDIO
 * ======================= */
const {
  isAudioEnabled,
  volume,
  toggleAudio,
  setAudioVolume
} = useAudio()

const showVolumeControl = ref(false)
const isLoading = ref(false)

/* =======================
 * ESTADO DE VISTA
 * ======================= */
const view = ref('config')
const darkMode = ref(false)

/* =======================
 * TIMER ENGINE CON SEGURIDAD Y AUDIO
 * ======================= */
const {
  timers,
  currentTimer,
  nextTimer,
  remainingTime,
  isRunning,
  repeat,
  removeTimer,
  updateTimerName: updateTimerNameInEngine,
  start,
  stop,
  enableSounds,
  disableSounds
} = useTimerSequence()

/* =======================
 * SINCRONIZAR AUDIO CON TIMER ENGINE
 * ======================= */
watch(isAudioEnabled, (enabled) => {
  if (enabled) {
    enableSounds()
  } else {
    disableSounds()
  }
}, { immediate: true })

/* =======================
 * MONITOREO DE SEGURIDAD
 * ======================= */

// Detectar manipulación de datos
let lastValidState = null
const SECURITY_CHECK_INTERVAL = 5000 // 5 segundos

let securityCheck = null

onMounted(() => {
  // Inicializar seguridad
  securityCheck = setInterval(() => {
    // Verificar que los timers sean válidos
    const currentState = JSON.stringify(timers.value)
    
    if (lastValidState && currentState !== lastValidState) {
      // Detectar cambios sospechosos en los nombres
      timers.value.forEach((timer, index) => {
        if (timer.name && timer.name.length > 32) {
          console.error(`SEGURIDAD: Timer ${timer.id} tiene nombre demasiado largo: ${timer.name.length}`)
          // Auto-corrección
          timer.name = timer.name.slice(0, 32)
        }
      })
    }
    
    lastValidState = currentState
  }, SECURITY_CHECK_INTERVAL)

  // Inicializar timers
  if (timers.value.length === 0) {
    addTimerAtEnd()
  }
  
  // Inicializar estado válido
  lastValidState = JSON.stringify(timers.value)
})

// Limpiar intervalo al desmontar
onUnmounted(() => {
  if (securityCheck) {
    clearInterval(securityCheck)
  }
})

/* =======================
 * COMPUTED - PERMITIR NOMBRES VACÍOS
 * ======================= */
const canStart = computed(() => {
  // Validar que haya al menos un timer con tiempo configurado
  // NO requerimos que tenga nombre
  return timers.value.some(t => {
    const totalSeconds = (t.hh || 0) * 3600 + (t.mm || 0) * 60 + (t.ss || 0)
    return totalSeconds > 0
  })
})

/* =======================
 * MÉTODOS CON VALIDACIÓN
 * ======================= */
function addTimerAtEnd() {
  const newTimer = {
    id: Date.now() + Math.random(),
    name: '', // Nombre vacío permitido
    hh: 0,
    mm: 0,
    ss: 0,
  }
  
  // Validar antes de agregar
  if (isValidTimer(newTimer)) {
    timers.value.push(newTimer)
  } else {
    console.error('Intento de agregar timer inválido')
  }
}

function addTimerAfter(index) {
  // Validar índice
  if (index < 0 || index >= timers.value.length) {
    console.error('Índice inválido para agregar timer')
    return
  }
  
  const newTimer = {
    id: Date.now() + Math.random(),
    name: '', // Nombre vacío permitido
    hh: 0,
    mm: 0,
    ss: 0,
  }
  
  if (isValidTimer(newTimer)) {
    timers.value.splice(index + 1, 0, newTimer)
  }
}

function startTimers() {
  isLoading.value = true
  
  // Validación final antes de iniciar
  if (!canStart.value) {
    console.error('No se puede iniciar: ningún timer tiene tiempo configurado')
    isLoading.value = false
    return
  }
  
  start(() => {
    view.value = 'config'
    isLoading.value = false
  })
  view.value = 'running'
  isLoading.value = false
}

function finish() {
  stop()
  view.value = 'config'
}

function toggleDark() {
  darkMode.value = !darkMode.value
}

function updateTimerName({ id, name }) {
  // Validar antes de actualizar
  if (!id || typeof name !== 'string') {
    console.error('Datos inválidos para actualizar nombre')
    return
  }
  
  // Permitir nombres vacíos, pero limitar longitud si hay contenido
  if (name.length > 32) {
    console.warn('Nombre excede límite de 32 caracteres')
    name = name.slice(0, 32)
  }
  
  updateTimerNameInEngine(id, name)
}

/* =======================
 * VALIDACIÓN DE TIMER - PERMITIR NOMBRES VACÍOS
 * ======================= */
function isValidTimer(timer) {
  if (!timer || typeof timer !== 'object') return false
  
  // Validar ID
  if (typeof timer.id !== 'number' || timer.id <= 0) {
    console.error('ID de timer inválido:', timer.id)
    return false
  }
  
  // Validar nombre (permitir vacío, pero limitar longitud si existe)
  if (timer.name && timer.name.length > 32) {
    console.error('Nombre de timer excede límite:', timer.name.length)
    return false
  }
  
  // Validar valores numéricos
  const numericFields = ['hh', 'mm', 'ss']
  for (const field of numericFields) {
    const value = timer[field]
    if (typeof value !== 'number' || value < 0) {
      console.error(`Campo ${field} inválido:`, value)
      return false
    }
  }
  
  return true
}

/* =======================
 * INTERCEPTOR DE SEGURIDAD
 * ======================= */

// Interceptar push al array para validación extra
const originalArrayMethods = {
  push: Array.prototype.push,
  splice: Array.prototype.splice,
  unshift: Array.prototype.unshift
}

// Sobrescribir métodos del array con validación
const createSecureArrayHandler = (array) => {
  return new Proxy(array, {
    get(target, prop) {
      if (prop === 'push') {
        return function(...items) {
          // Validar cada item antes de agregar
          const validItems = items.filter(item => {
            if (item && item.name && item.name.length > 100) {
              console.error('SEGURIDAD: Intento de inyección detectado')
              return false
            }
            return isValidTimer(item)
          })
          
          if (validItems.length !== items.length) {
            console.warn('Algunos items fueron rechazados por seguridad')
          }
          
          return originalArrayMethods.push.apply(target, validItems)
        }
      }
      
      if (prop === 'splice') {
        return function(start, deleteCount, ...items) {
          // Validar items a insertar
          const validItems = items.filter(isValidTimer)
          return originalArrayMethods.splice.call(target, start, deleteCount, ...validItems)
        }
      }
      
      return target[prop]
    }
  })
}

// Aplicar proxy de seguridad a timers
timers.value = createSecureArrayHandler(timers.value)

/* =======================
 * THEME SWITCH (PrimeVue)
 * ======================= */
watch(darkMode, (isDark) => {
  const theme = document.getElementById('theme')
  if (!theme) return

  theme.href = isDark
    ? '/themes/lara-dark-blue/theme.css'
    : '/themes/lara-light-blue/theme.css'
})

/* =======================
 * CONTROL DE VOLUMEN VISIBILIDAD
 * ======================= */
function toggleVolumeControl() {
  showVolumeControl.value = !showVolumeControl.value
}
</script>

<style scoped>
/* =======================
 * BASE
 * ======================= */
.home {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  transition: background 0.3s ease;
}

.home.dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.panel {
  width: 100%;
  max-width: 750px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.4s ease-out;
  margin: 1rem 0;
}

.dark .panel {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =======================
 * HEADER - REORGANIZADO PARA PC (ESTILOS POR DEFECTO)
 * ======================= */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .header {
  border-bottom-color: #334155;
}

/* Botón Comenzar más grande y con mejor espaciado */
.header :deep(.start-btn) {
  padding: 0.875rem 3rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  min-width: 180px;
}

.header :deep(.start-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
}

.header :deep(.start-btn:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Opciones con mejor distribución */
.options {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
}

.repeat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #4b5563;
  font-weight: 500;
  white-space: nowrap;
}

.dark .repeat {
  color: #cbd5e1;
}

.repeat :deep(.p-checkbox) {
  transform: scale(1);
}

.options :deep(.p-button) {
  width: 46px;
  height: 46px;
  transition: all 0.2s ease;
}

.options :deep(.p-button:hover) {
  background: rgba(59, 130, 246, 0.1);
}

.dark .options :deep(.p-button) {
  color: #e2e8f0;
}

.dark .options :deep(.p-button:hover) {
  background: rgba(96, 165, 250, 0.1);
}

/* =======================
 * CONTROLES DE VOLUMEN
 * ======================= */
.volume-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 0.875rem;
}

.dark .volume-control {
  background: rgba(255, 255, 255, 0.05);
}

.volume-control label {
  font-weight: 500;
  color: #4b5563;
}

.dark .volume-control label {
  color: #cbd5e1;
}

.volume-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}

.dark .volume-slider {
  background: #475569;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.dark .volume-slider::-webkit-slider-thumb {
  background: #60a5fa;
}

.volume-control span {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  color: #374151;
}

.dark .volume-control span {
  color: #e5e7eb;
}

/* =======================
 * RESPONSIVE - MOBILE (≤ 1279px)
 * ======================= */
@media (max-width: 1279px) {
  .home {
    padding: 1rem;
    align-items: center;
  }
  
  .panel {
    padding: 1.5rem;
    border-radius: 20px;
    max-width: 100%;
    margin: 0;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .header :deep(.start-btn) {
    width: 100%;
    min-width: auto;
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
  
  .options {
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
  }
  
  .repeat {
    font-size: 0.875rem;
  }
}

/* =======================
 * RESPONSIVE - DESKTOP LARGE (≥ 1280px)
 * ======================= */
@media (min-width: 1280px) {
  .home {
    align-items: center;
  }
  
  .panel {
    max-width: 850px;
    padding: 3.5rem;
  }
  
  .header {
    gap: 2.5rem;
    margin-bottom: 2.5rem;
  }
  
  .header :deep(.start-btn) {
    padding: 1rem 4rem;
    font-size: 1.2rem;
    min-width: 200px;
  }
  
  .options {
    gap: 2.5rem;
  }
  
  .repeat {
    font-size: 1.05rem;
  }
  
  .options :deep(.p-button) {
    width: 48px;
    height: 48px;
  }
}

/* =======================
 * AJUSTES ESPECÍFICOS PARA TIMERLIST
 * ======================= */
:deep(.timer-list) {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Scrollbar personalizada */
:deep(.timer-list::-webkit-scrollbar) {
  width: 8px;
}

:deep(.timer-list::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

:deep(.timer-list::-webkit-scrollbar-thumb) {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 4px;
}

:deep(.timer-list::-webkit-scrollbar-thumb:hover) {
  background: rgba(59, 130, 246, 0.7);
}

.dark :deep(.timer-list::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.05);
}

.dark :deep(.timer-list::-webkit-scrollbar-thumb) {
  background: rgba(96, 165, 250, 0.5);
}

.dark :deep(.timer-list::-webkit-scrollbar-thumb:hover) {
  background: rgba(96, 165, 250, 0.7);
}

/* =======================
 * TIMER DISPLAY VIEW
 * ======================= */
.running-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.running-view .finish-btn {
  margin: 0 auto 1rem auto;
}
</style>