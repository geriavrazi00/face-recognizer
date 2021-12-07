<template>
  <FaceRecognizer/>
</template>

<script>
import FaceRecognizer from './components/FaceRecognizer.vue'

export default {
  name: 'App',
  components: {
    FaceRecognizer
  }
}
</script>

<style>
#app {
  font-family: "Lucida Console", "Courier New", monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
</style>
