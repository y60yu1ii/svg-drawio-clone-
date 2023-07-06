<template>
  <div :class="keyboardClass"></div>
</template>

<script lang="ts" setup>
import { ref, watch, unref, onMounted, Ref } from "vue";
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";
const props = defineProps({
  keyboardClass: {
    default: "simple-keyboard",
    type: String,
  },
  input: {
    type: String,
  },
});

var keyboard: Ref<Keyboard | undefined> = ref();
const emit = defineEmits(["onChange", "onKeyPress"]);

watch(
  () => unref(props).input,
  (input: any) => {
    keyboard.value?.setInput(input);
  }
);

function onChange(input: any) {
  keyboard.value?.setInput(input);
  // console.log(`onchange ${input}`);
  emit("onChange", input);
}

function onKeyPress(button: any) {
  // console.log(`onkeypress ${button}`);
  if (button === "{clear}") {
    keyboard.value?.clearInput();
  }
  emit("onKeyPress", button);
}

onMounted(() => {
  keyboard.value = new Keyboard("." + props.keyboardClass, {
    onChange: onChange,
    onKeyPress: onKeyPress,
    layout: {
      default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}", "{clear} {enter}"],
    },
    display: {
      "{bksp}": "←",
      "{enter}": "輸入",
      "{clear}": "清除",
    },
    theme: "hg-theme-default hg-layout-numeric numeric-theme",
  });
});
</script>

<style scoped>
/*
  Theme: numeric
*/
.simple-keyboard.hg-theme-default {
  font-size: 32px;
  font-weight: bold;
}
.numeric-theme {
  max-width: 320px;
  margin: 0 auto;
}

.numeric-theme + .simple-keyboard-preview {
  max-width: 320px;
}

.simple-keyboard.hg-theme-default.numeric-theme
  .hg-button.hg-standardBtn.hg-button-at {
  max-width: none;
}
</style>
