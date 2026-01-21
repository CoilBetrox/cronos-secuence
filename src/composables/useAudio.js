import { ref, onMounted, onUnmounted } from 'vue'
import { audioPlayer } from '@/utils/audioPlayer'

export function useAudio() {
  const isAudioEnabled = ref(true)
  const volume = ref(0.7)
  const isLoading = ref(false)

  /* =======================
   * INICIALIZACIÓN
   * ======================= */
  onMounted(async () => {
    // Cargar preferencias del usuario
    const savedVolume = localStorage.getItem('audio-volume')
    const savedEnabled = localStorage.getItem('audio-enabled')
    
    if (savedVolume !== null) {
      volume.value = parseFloat(savedVolume)
      audioPlayer.setVolume(volume.value)
    }
    
    if (savedEnabled !== null) {
      isAudioEnabled.value = savedEnabled === 'true'
      if (!isAudioEnabled.value) {
        audioPlayer.mute()
      }
    }
    
    // Inicializar audio (silenciosamente en segundo plano)
    setTimeout(() => {
      audioPlayer.initialize().then(success => {
        if (success) {
          console.log('Audio listo para usar')
        }
      })
    }, 1000)
  })

  onUnmounted(() => {
    audioPlayer.cleanup()
  })

  /* =======================
   * MÉTODOS DE CONTROL
   * ======================= */
  async function playSound(soundKey, options = {}) {
    if (!isAudioEnabled.value) return null
    
    isLoading.value = true
    try {
      const sound = await audioPlayer.play(soundKey, {
        ...options,
        volume: volume.value * (options.volume || 1)
      })
      return sound
    } catch (error) {
      console.error('Error al reproducir sonido:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function playTimerEnd() {
    return playSound('timerEnd', { volume: 0.8 })
  }

  async function playButtonClick() {
    return playSound('buttonClick', { volume: 0.5 })
  }

  function setAudioVolume(newVolume) {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    volume.value = clampedVolume
    audioPlayer.setVolume(clampedVolume)
    localStorage.setItem('audio-volume', clampedVolume.toString())
  }

  function toggleAudio() {
    isAudioEnabled.value = !isAudioEnabled.value
    
    if (isAudioEnabled.value) {
      audioPlayer.unmute()
    } else {
      audioPlayer.mute()
    }
    
    localStorage.setItem('audio-enabled', isAudioEnabled.value.toString())
    return isAudioEnabled.value
  }

  /* =======================
   * ESTADO DEL AUDIO
   * ======================= */
  function getAudioStatus() {
    return {
      enabled: isAudioEnabled.value,
      volume: volume.value,
      contextState: audioPlayer.audioContext?.state || 'not-initialized',
      canPlay: isAudioEnabled.value && audioPlayer.isInitialized
    }
  }

  return {
    // Estado
    isAudioEnabled,
    volume,
    isLoading,
    
    // Métodos de reproducción
    playSound,
    playTimerEnd,
    playButtonClick,
    
    // Control
    setAudioVolume,
    toggleAudio,
    
    // Información
    getAudioStatus,
    
    // Acceso directo (para casos especiales)
    audioPlayer
  }
}