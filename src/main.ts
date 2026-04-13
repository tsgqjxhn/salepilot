//import and export
import { createApp } from "vue";
import { pinia } from "@/stores/pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { permissionDirective } from "@/directives/permission";
import "./assets/base.css"; 
import 'element-plus/theme-chalk/dark/css-vars.css'
//create instance
const app = createApp(App);
app.use(pinia);
//use function - initialize auth store from localStorage
const authStore = useAuthStore(pinia);
const uiStore = useUiStore(pinia);
authStore.initFromStorage();
authStore.startSilentRefresh();
void authStore.bootstrapAuthSession();
uiStore.initialize();
app.use(router);
app.use(ElementPlus);
app.directive("permission", permissionDirective);
app.mount("#app");
