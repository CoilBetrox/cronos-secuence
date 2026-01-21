class AudioPlayer {
  constructor() {
    this.audioContext = null
    this.sounds = new Map()
    this.isInitialized = false
    this.isMuted = false
    this.volume = 0.7
    this.maxConcurrentSounds = 3
    this.activeSounds = 0
    
    // Pre-cargar sonidos
    this.soundFiles = {
      timerEnd: {
        url: '/sounds/timer-end.wav',
        fallback: '/sounds/timer-end.ogg',
        isPreloaded: false,
        buffer: null
      },
      buttonClick: {
        url: '/sounds/button-click.wav',
        isPreloaded: false,
        buffer: null
      }
    }
  }

  /* =======================
   * INICIALIZACIÓN SEGURA
   * ======================= */
  async initialize() {
    if (this.isInitialized) return true
    
    try {
      // Crear AudioContext (con compatibilidad cross-browser)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      
      if (!AudioContextClass) {
        console.warn('AudioContext no soportado en este navegador')
        return false
      }
      
      this.audioContext = new AudioContextClass()
      
      // Pre-cargar sonidos importantes
      await this.preloadSound('timerEnd')
      
      this.isInitialized = true
      console.log('AudioPlayer inicializado correctamente')
      return true
    } catch (error) {
      console.error('Error inicializando AudioPlayer:', error)
      return false
    }
  }

  /* =======================
   * PRE-CARGA DE SONIDOS
   * ======================= */
  async preloadSound(soundKey) {
    const soundConfig = this.soundFiles[soundKey]
    if (!soundConfig || soundConfig.isPreloaded) return
    
    try {
      // Intentar cargar el sonido principal
      let buffer = await this.loadAudioBuffer(soundConfig.url)
      
      // Si falla, intentar con el fallback
      if (!buffer && soundConfig.fallback) {
        buffer = await this.loadAudioBuffer(soundConfig.fallback)
      }
      
      if (buffer) {
        soundConfig.buffer = buffer
        soundConfig.isPreloaded = true
        console.log(`Sonido pre-cargado: ${soundKey}`)
      }
    } catch (error) {
      console.warn(`No se pudo pre-cargar ${soundKey}:`, error)
    }
  }

  async loadAudioBuffer(url) {
    return new Promise((resolve, reject) => {
      // Verificar si ya está en caché
      if (this.sounds.has(url)) {
        resolve(this.sounds.get(url))
        return
      }
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            reject(new Error(`HTTP ${response.status}`))
            return
          }
          return response.arrayBuffer()
        })
        .then(arrayBuffer => {
          if (!this.audioContext) {
            reject(new Error('AudioContext no inicializado'))
            return
          }
          
          this.audioContext.decodeAudioData(arrayBuffer)
            .then(audioBuffer => {
              this.sounds.set(url, audioBuffer)
              resolve(audioBuffer)
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }

  /* =======================
   * REPRODUCCIÓN OPTIMIZADA
   * ======================= */
  async play(soundKey, options = {}) {
    // Verificar si está silenciado
    if (this.isMuted) return null
    
    // Limitar sonidos concurrentes
    if (this.activeSounds >= this.maxConcurrentSounds) {
      console.warn('Máximo de sonidos concurrentes alcanzado')
      return null
    }
    
    // Inicializar si es necesario
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return null
    }
    
    // Asegurar que el AudioContext esté running
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    const soundConfig = this.soundFiles[soundKey]
    if (!soundConfig) {
      console.warn(`Sonido no encontrado: ${soundKey}`)
      return null
    }
    
    try {
      // Obtener el buffer de audio
      let buffer = soundConfig.buffer
      
      // Cargar si no está pre-cargado
      if (!buffer) {
        buffer = await this.loadAudioBuffer(soundConfig.url)
        if (!buffer && soundConfig.fallback) {
          buffer = await this.loadAudioBuffer(soundConfig.fallback)
        }
      }
      
      if (!buffer) {
        console.warn(`No se pudo cargar el sonido: ${soundKey}`)
        return null
      }
      
      // Crear source
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      
      // Crear gain node para control de volumen
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = this.volume * (options.volume || 1)
      
      // Conectar nodos
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      // Configurar opciones
      if (options.playbackRate) {
        source.playbackRate.value = options.playbackRate
      }
      
      // Manejar finalización
      source.onended = () => {
        this.activeSounds--
        source.disconnect()
        gainNode.disconnect()
      }
      
      // Reproducir
      this.activeSounds++
      const startTime = this.audioContext.currentTime + (options.delay || 0)
      source.start(startTime)
      
      return {
        source,
        stop: () => {
          try {
            source.stop()
          } catch (e) {
            // Ignorar errores si ya se detuvo
          }
        }
      }
    } catch (error) {
      console.error(`Error reproduciendo ${soundKey}:`, error)
      this.activeSounds = Math.max(0, this.activeSounds - 1)
      return null
    }
  }

  /* =======================
   * CONTROL DE VOLUMEN Y MUTE
   * ======================= */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value))
  }

  mute() {
    this.isMuted = true
  }

  unmute() {
    this.isMuted = false
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  /* =======================
   * MÉTODOS CONVENIENTES
   * ======================= */
  async playTimerEnd() {
    return this.play('timerEnd', {
      volume: 0.8,
      playbackRate: 1.0
    })
  }

  async playButtonClick() {
    return this.play('buttonClick', {
      volume: 0.5,
      playbackRate: 1.0
    })
  }

  /* =======================
   * LIMPIEZA
   * ======================= */
  cleanup() {
    // Cerrar AudioContext para liberar recursos
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.sounds.clear()
    this.isInitialized = false
    this.activeSounds = 0
  }
}

// Instancia singleton
export const audioPlayer = new AudioPlayer()