import { defineStore } from "pinia";

export const useWebSocket = defineStore("dataSource", {
  state: () => ({
    payload: "{}",
  }),

  getters: {},

  actions: {
    receive(msg: string) {
      this.payload = msg;
    },
  },
});
