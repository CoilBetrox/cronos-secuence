<template>
  <main class="app">
    <HomeView />
  </main>
</template>

<script setup>
import HomeView from '@/views/HomeView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

/* Smooth transitions for theme switching */
* {
  transition: background-color 0.3s ease, 
              border-color 0.3s ease,
              color 0.3s ease;
}
</style>