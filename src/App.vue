<template>
  <div id="app">
<!--    <router-view/>-->
    <upload style="width: 200px;height: 100px"></upload>
  </div>
</template>

<script>
import Upload from "./views/Upload";
export default {
  components: {
    Upload
  },
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
