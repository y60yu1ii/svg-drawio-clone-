import {
  createRouter,
  RouteRecordRaw,
  Router,
  createWebHistory,
} from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Main",
    component: () => import("../components/Dashboard.vue"),
    meta: {
      title: "Main",
    },
    // props: { msg: "msg passed!" },
  },
  {
    path: "/dev",
    name: "Dev2",
    component: () => import("../components/Dashboard.vue"),
    meta: {
      title: "Dev",
    },
  },
];

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((toRoute, _, next) => {
  window.document.title = (
    toRoute.meta && toRoute.meta.title ? toRoute.meta.title : "Main"
  ).toString();
  next();
});

export default router;
