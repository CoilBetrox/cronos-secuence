<template>
  <div class="timer-display">
    <!-- Botón finalizar con estilo similar a "Comenzar" -->
    <button class="finish-btn" @click="$emit('finish')">
      <i class="pi pi-stop-circle" style="margin-right: 0.5rem;"></i>
      Finalizar
    </button>

    <div class="current">
      <div class="label">Actual</div>
      <div class="name">{{ current?.name || 'Sin nombre' }}</div>
      <div class="time">{{ formattedTime }}</div>
    </div>

    <div v-if="next" class="next">
      <div class="label">Siguiente</div>
      <div class="name">{{ next.name || 'Sin nombre' }}</div>
      <div class="time">{{ formatDuration(next.duration) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: Object,
  next: Object,
  remaining: Number,
})

const emit = defineEmits(['finish'])

const formattedTime = computed(() => formatTime(props.remaining))

function formatTime(seconds) {
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function formatDuration(duration) {
  return formatTime(duration)
}
</script>

<style scoped>
.timer-display {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.finish-btn {
  align-self: center;
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.finish-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
}

.finish-btn:active {
  transform: translateY(0);
}

.finish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.current {
  padding: 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.dark .current {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: #334155;
}

.current .label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.dark .current .label {
  color: #94a3b8;
}

.current .name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.dark .current .name {
  color: #f1f5f9;
}

.current .time {
  font-size: 5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -3px;
  color: #2563eb;
  text-shadow: 0 2px 10px rgba(37, 99, 235, 0.2);
  margin: 0.5rem 0;
  font-family: 'Courier New', monospace; /* Mejor para tiempos */
}

.dark .current .time {
  color: #60a5fa;
  text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
}

.next {
  opacity: 0.8;
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: opacity 0.3s ease;
}

.dark .next {
  background: rgba(30, 41, 59, 0.6);
  border-color: #475569;
}

.next:hover {
  opacity: 1;
}

.next .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.next .name {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.dark .next .name {
  color: #cbd5e1;
}

.next .time {
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #6b7280;
  font-family: 'Courier New', monospace; /* Mejor para tiempos */
}

.dark .next .time {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .timer-display {
    padding: 1rem;
  }
  
  .finish-btn {
    padding: 0.875rem 2rem;
    width: 100%;
  }
  
  .current .time {
    font-size: 3.5rem;
  }
  
  .next .time {
    font-size: 2rem;
  }
}
</style>