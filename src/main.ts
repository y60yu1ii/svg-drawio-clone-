import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import router from "./router/index";
import App from "./App.vue";

createApp(App).use(createPinia()).use(ElementPlus).use(router).mount("#app");
