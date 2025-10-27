<template>
  <div class="icon-with-label" :class="{ rtl }">
    <div class="icon-wrapper">
      <font-awesome-icon :icon="iconPlusStyle" />
    </div>
    <slot />
  </div>
</template>

<script type="ts">
const brands = ['jira', 'github']

export default {
  props: {
    icon: {
      type: String,
      default: 'user-secret'
    },
    rtl: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    iconPlusStyle() {
      if (brands.includes(this.icon)) {
        return ['fab', this.icon]
      }
      return ['fas', this.icon]
    }
  
  }
}

</script>

<style scoped>
.icon-with-label {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  vertical-align: middle;
}

.icon-wrapper {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
  text-align: center;
  vertical-align: middle;
  user-select: none;
}

.rtl {
  flex-direction: row-reverse;
}
</style>
