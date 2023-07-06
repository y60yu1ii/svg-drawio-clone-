// const wsUrl = process.env.VUE_APP_API_URL;
import { useWebSocket } from "../store/comm";
const wsStore = useWebSocket();
var socket: WebSocket;
export const connectSocket = () => {
  socket = new WebSocket("ws://localhost:1880/ws/request");
  socket.onopen = function () {
    console.log("websocket connected!!");
  };
  socket.onmessage = function (msg) {
    // console.log("onmessage", msg);
    wsStore.receive(`${msg.data}`);
  };
  socket.onerror = function (err) {
    console.log("error", err);
  };

  socket.onclose = function (err) {
    console.log("close", err);
  };
};

export const closeSocket = () => {
  socket?.close();
};

export const sendSocketMessage = (msg: string) => {
  if (1 === socket.readyState) socket.send(JSON.stringify(msg));
};
