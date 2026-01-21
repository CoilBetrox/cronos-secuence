import { ref, computed, watch } from 'vue'
import { audioPlayer } from '@/utils/audioPlayer'

// Clase de utilidad para seguridad
class TimerSecurity {
  static MAX_NAME_LENGTH = 32
  static MAX_TIMERS = 50
  static MAX_TOTAL_CHARS = 1000
  
  static sanitizeTimer(timer) {
    if (!timer || typeof timer !== 'object') return null
    
    return {
      id: this.sanitizeId(timer.id),
      name: this.sanitizeName(timer.name),
      hh: this.sanitizeNumber(timer.hh, 0, 23),
      mm: this.sanitizeNumber(timer.mm, 0, 59),
      ss: this.sanitizeNumber(timer.ss, 0, 59),
      duration: timer.duration || 0
    }
  }
  
  static sanitizeId(id) {
    const num = Number(id)
    if (isNaN(num) || num <= 0 || num > Number.MAX_SAFE_INTEGER) {
      return Date.now() + Math.random()
    }
    return num
  }
  
  static sanitizeName(name) {
    if (name === '' || name === null || name === undefined) return ''

    let str = String(name || '').slice(0, this.MAX_NAME_LENGTH)
    // Eliminar caracteres potencialmente peligrosos
    str = str.replace(/[<>{}[\]\\]/g, '')
    return str.trim()
  }
  
  static sanitizeNumber(value, min, max) {
    const num = parseInt(value) || 0
    if (isNaN(num)) return min
    return Math.min(Math.max(num, min), max)
  }
  
  static validateTimer(timer) {
    if (!timer || typeof timer !== 'object') return false
    
    // Validar ID
    if (!this.isValidId(timer.id)) return false
    
    // Validar nombre
    if (!this.isValidName(timer.name)) return false
    
    // Validar tiempos
    return this.isValidTime('hh', timer.hh) &&
           this.isValidTime('mm', timer.mm) &&
           this.isValidTime('ss', timer.ss)
  }
  
  static isValidId(id) {
    return typeof id === 'number' && 
           id > 0 && 
           id < Number.MAX_SAFE_INTEGER
  }
  
  static isValidName(name) {
    if (name === '') return true

    return typeof name === 'string' && 
           name.length <= this.MAX_NAME_LENGTH &&
           !/[<>{}[\]\\]|script|javascript:/gi.test(name)
  }
  
  static isValidTime(type, value) {
    const num = parseInt(value)
    if (isNaN(num) || num < 0) return false
    
    switch(type) {
      case 'hh': return num <= 23
      case 'mm': return num <= 59
      case 'ss': return num <= 59
      default: return false
    }
  }
}

export function useTimerSequence() {
  const timers = ref([])
  const currentIndex = ref(0)
  const remainingTime = ref(0)
  const isRunning = ref(false)
  const repeat = ref(false)
  const playSounds = ref(true)

  let intervalId = null
  let onFinish = null

  /* =======================
   * INICIALIZACIÓN DE AUDIO
   * ======================= */
  async function initializeAudio() {
    if (playSounds.value) {
      await audioPlayer.initialize()
    }
  }

  /* =======================
   * CONTROL DE SONIDOS
   * ======================= */
  function enableSounds() {
    playSounds.value = true
    audioPlayer.unmute()
  }

  function disableSounds() {
    playSounds.value = false
    audioPlayer.mute()
  }

  /* =======================
   * VALIDACIÓN Y SEGURIDAD
   * ======================= */

  // Watcher para sanitización automática
  watch(timers, (newTimers) => {
    // Validar tamaño del array
    if (newTimers.length > TimerSecurity.MAX_TIMERS) {
      console.warn(`Límite de timers excedido: ${newTimers.length}`)
      timers.value = newTimers.slice(0, TimerSecurity.MAX_TIMERS)
      return
    }
    
    // Sanitizar cada timer
    const sanitizedTimers = newTimers.map(timer => TimerSecurity.sanitizeTimer(timer))
    
    // Validar tamaño total de caracteres
    const totalChars = sanitizedTimers.reduce((sum, t) => sum + (t.name.length || 0), 0)
    if (totalChars > TimerSecurity.MAX_TOTAL_CHARS) {
      console.warn(`Límite total de caracteres excedido: ${totalChars}`)
      // Recortar nombres si es necesario
      sanitizedTimers.forEach(timer => {
        if (timer.name.length > 20) {
          timer.name = timer.name.slice(0, 20) + '...'
        }
      })
    }
    
    // Solo actualizar si hubo cambios
    if (JSON.stringify(sanitizedTimers) !== JSON.stringify(timers.value)) {
      timers.value = sanitizedTimers
    }
  }, { deep: true })

  /* =======================
   * COMPUTED
   * ======================= */

  const currentTimer = computed(() => {
    return timers.value[currentIndex.value] || null
  })

  const nextTimer = computed(() => {
    return timers.value[currentIndex.value + 1] || null
  })

  /* =======================
   * HELPERS
   * ======================= */

  function toSeconds(timer) {
    return (
      (timer.hh || 0) * 3600 +
      (timer.mm || 0) * 60 +
      (timer.ss || 0)
    )
  }

  function isValid(timer) {
    return toSeconds(timer) > 0
  }

  /* =======================
   * CRUD CON SEGURIDAD
   * ======================= */

  function addTimer(timer) {
    const sanitizedTimer = TimerSecurity.sanitizeTimer(timer)
    if (TimerSecurity.validateTimer(sanitizedTimer)) {
      timers.value.push({
        ...sanitizedTimer,
        duration: toSeconds(sanitizedTimer)
      })
    } else {
      console.error('Intento de agregar timer inválido:', timer)
    }
  }

  function removeTimer(id) {
    const sanitizedId = TimerSecurity.sanitizeId(id)
    timers.value = timers.value.filter(t => t.id !== sanitizedId)
  }

  function updateTimerName(id, newName) {
    const sanitizedId = TimerSecurity.sanitizeId(id)
    const index = timers.value.findIndex(t => t.id === sanitizedId)
    
    if (index !== -1) {
      const sanitizedName = TimerSecurity.sanitizeName(newName)
      if (TimerSecurity.isValidName(sanitizedName)) {
        timers.value[index].name = sanitizedName
      } else {
        console.warn('Nombre inválido para timer:', newName)
      }
    }
  }

  /* =======================
   * CONTROL CON VALIDACIÓN
   * ======================= */

  function start(callback) {
    // Verificar que no esté ya corriendo
    if (isRunning.value) {
      console.warn('Timer ya está en ejecución')
      return
    }

    // Validar timers antes de iniciar
    const validTimers = timers.value.filter(t => {
      const isValidTimer = TimerSecurity.validateTimer(t)
      const hasTime = toSeconds(t) > 0
      return isValidTimer && hasTime
    })

    if (!validTimers.length) {
      console.error('No hay timers válidos para iniciar')
      return
    }

    // Sanitizar timers una última vez antes de iniciar
    timers.value = validTimers.map(t => ({
      ...TimerSecurity.sanitizeTimer(t),
      duration: toSeconds(t)
    }))

    onFinish = callback
    isRunning.value = true
    currentIndex.value = 0
    remainingTime.value = timers.value[0].duration

    run()
  }

  function run() {
    clearInterval(intervalId)

    intervalId = setInterval(() => {
      if (remainingTime.value <= 1) {
        // Reproducir sonido ANTES de cambiar al siguiente timer
        if (playSounds.value && remainingTime.value === 1) {
          // Reproducir en el siguiente tick para mejor sincronización
          setTimeout(() => {
            audioPlayer.playTimerEnd().catch(error => {
              console.warn('No se pudo reproducir sonido:', error)
            })
          }, 50)
        }
        
        next()
      } else {
        remainingTime.value--
      }
    }, 1000)
  }

  function next() {
    currentIndex.value++

    if (currentIndex.value >= timers.value.length) {
      if (repeat.value) {
        currentIndex.value = 0
      } else {
        finish()
        return
      }
    }

    remainingTime.value = timers.value[currentIndex.value].duration
  }

  function finish() {
    clearInterval(intervalId)
    isRunning.value = false
    onFinish?.()
  }

  function stop() {
    clearInterval(intervalId)
    isRunning.value = false
    currentIndex.value = 0
    remainingTime.value = 0
  }

  function pause() {
    clearInterval(intervalId)
    isRunning.value = false
  }

  function resume() {
    if (!isRunning.value && remainingTime.value > 0) {
      isRunning.value = true
      run()
    }
  }

  return {
    timers,
    currentTimer,
    nextTimer,
    remainingTime,
    isRunning,
    repeat,
    playSounds,
    initializeAudio,
    enableSounds,
    disableSounds,
    addTimer,
    removeTimer,
    updateTimerName,
    start,
    stop,
    pause,
    resume,
    // Métodos de validación para debug
    validateTimer: TimerSecurity.validateTimer,
    sanitizeTimer: TimerSecurity.sanitizeTimer
  }
}