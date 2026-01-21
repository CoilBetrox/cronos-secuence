<template>
  <div class="timer-form">
    <input v-model="name" placeholder="Nombre (ej. Calentamiento)" />
    <input v-model.number="seconds" type="number" placeholder="Segundos" />
    <button @click="add">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])

const name = ref('')
const seconds = ref(0)

function add() {
  if (!name.value || seconds.value <= 0) return

  emit('add', {
    id: Date.now(),
    name: name.value,
    duration: seconds.value,
  })

  name.value = ''
  seconds.value = 0
}
</script>
<style scoped>
.timer-form {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.dark .timer-form {
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.timer-form input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937;
}

.dark .timer-form input {
  background: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

.timer-form input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.timer-form input[type="number"] {
  width: 100px;
}

.timer-form button {
  width: 44px;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-form button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.timer-form button:active {
  transform: translateY(0);
}

.timer-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .timer-form {
    flex-direction: column;
  }
  
  .timer-form input[type="number"] {
    width: 100%;
  }
}
</style>