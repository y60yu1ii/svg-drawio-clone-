<script setup lang="ts">
import { ref, Ref } from "vue";
// import { usePIDWebSocket } from "../store/comm";
// import { connectPIDSocket } from "../store/api";
import { storeToRefs } from "pinia";
// const wsPIDStore = usePIDWebSocket();
const { payload } = storeToRefs(wsStore);

interface Valve {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
  name: string;
  value: number;
  color: string;
  srcset: string;
  ratio: number;
  offsetX: number;
  offsetY: number;
  scaling: boolean;
  dragging: boolean;
  joining: boolean;
  selected: boolean;
}

interface Pipe {
  id: string;
  c1: string;
  c2: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  qx: number;
  qy: number;
  lx: number;
  ly: number;
  selected: boolean;
  dragging: boolean;
  name: string;
}

interface ValveBlob {
  xywh: number[];
  id: string;
  name: string;
  color: string;
  icon: string;
  ratio: number;
}

interface PipeBlob {
  id: string;
  c1: string;
  c2: string;
  lq: number[];
}

interface Form {
  name: string;
  color: string;
  w: number;
  h: number;
  ratio: number;
  srcset: string;
}

const valveList = ref([
  new URL("../assets/icons/pressuregauge.png", import.meta.url).href,
  new URL("../assets/icons/meter.png", import.meta.url).href,
  new URL("../assets/icons/pump.png", import.meta.url).href,
  new URL("../assets/icons/waterpump.png", import.meta.url).href,
  new URL("../assets/icons/tank-truck.png", import.meta.url).href,
]);

const filename = ref("diagram");
const valves: Ref<Valve[]> = ref([]);
const pipes: Ref<Pipe[]> = ref([]);
const form: Ref<Form> = ref({
  name: "box",
  color: "#0869AB",
  w: 100,
  h: 100,
  ratio: 0.8,
  srcset: valveList.value[0],
});

const box = ref<null | {
  addEventListener: (event: string, func: any) => null;
  removeEventListener: (event: string, func: any) => null;
}>(null);

const addValve = function (x: number, y: number) {
  valves.value.push({
    x: x,
    y: y,
    w: form.value.w,
    h: form.value.h,
    name: form.value.name,
    srcset: form.value.srcset,
    ratio: form.value.ratio,
    offsetX: 0,
    offsetY: 0,
    id: _uuid(),
    value: 0,
    color: form.value.color,
    scaling: false,
    dragging: false,
    joining: false,
    selected: false,
  });
};

const addConection = function (
  cx1: number,
  cy1: number,
  c1: string,
  cx2: number,
  cy2: number,
  c2: string
) {
  const id = _uuid();
  pipes.value.push({
    id: id,
    c1: c1,
    c2: c2,
    x1: cx1,
    y1: cy1,
    x2: cx2,
    y2: cy2,
    qx: (cx2 - cx1) / 2,
    qy: (cy2 - cy1) / 2,
    lx: (cx2 - cx1) / 2,
    ly: (cy2 - cy1) / 2,
    selected: false,
    dragging: false,
    name: `pipe:${id}`,
  });
};

const addRandomComponents = function () {
  var px: number = 1280 / 2;
  var py: number = 800 / 2;

  px += Math.random() * 10 - 20;
  py += Math.random() * 10 - 20;

  form.value.srcset =
    valveList.value[Math.floor(Math.random() * valveList.value.length)];
  form.value.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  addValve(px, py);
};

const addComponents = function () {
  addValve(1280 / 2, 800 / 2);
};

const loadValve = function (v: ValveBlob) {
  const srcset =
    valveList.value.find((e) => {
      return e.includes(v.icon);
    }) || valveList.value[0];
  valves.value.push({
    x: v.xywh[0],
    y: v.xywh[1],
    w: v.xywh[2],
    h: v.xywh[3],
    name: v.name,
    srcset: srcset,
    ratio: v.ratio || 0.8,
    offsetX: 0,
    offsetY: 0,
    id: v.id,
    value: 0,
    color: v.color,
    scaling: false,
    dragging: false,
    joining: false,
    selected: false,
  });
};

const loadPipe = function (p: PipeBlob, nodes: Valve[]) {
  const c1V = nodes.find((e: Valve) => {
    return e.id == p.c1;
  });
  const c2V = nodes.find((e: Valve) => {
    return e.id == p.c2;
  });
  // console.log(`pipe ${p.id} c1 ${p.c1} c2 ${p.c2} ${c1V}`);
  if (c1V != null && c2V != null) {
    pipes.value.push({
      id: p.id,
      c1: p.c1,
      c2: p.c2,
      x1: c1V.x + c1V.w / 2,
      y1: c1V.y + c1V.h / 2,
      x2: c2V.x + c2V.w / 2,
      y2: c2V.y + c2V.h / 2,
      qx: p.lq[0],
      qy: p.lq[1],
      lx: p.lq[2],
      ly: p.lq[3],
      selected: false,
      dragging: false,
      name: `pipe:${p.id}`,
    });
  }
};

const mousedown = function (e: any) {
  var id = e.target.id;
  console.log(`mouse down ${id}`);
  //mouse down on valve
  const v = valves.value.find((e: Valve) => {
    return e.id == id;
  });
  if (v != null) {
    var x = e.offsetX - v.x;
    var y = e.offsetY - v.y;

    v.offsetX = x;
    v.offsetY = y;
    v.dragging = true;
    v.joining = false;
    box.value?.addEventListener("mousemove", mousemove);
  } else {
    //mousedown not on a valve
    //clearing all selected valves
    valves.value.forEach((e: Valve) => {
      e.selected = false;
    });
  }

  //mouse down on a connected pipe
  const p = pipes.value.find((e: Pipe) => {
    return e.id === id && e.c2 !== "move";
  });
  if (p != null && !p.dragging) {
    p.dragging = true;
    p.selected = true;
    box.value?.addEventListener("mousemove", mousemove);
  }

  //click on background
  if (id == "bg") {
    //clear all unfinshed pipes
    pipes.value = pipes.value.filter((e: Pipe) => {
      return e.c2 !== "move";
    });
    pipes.value.forEach((p: Pipe) => {
      p.selected = false;
    });
    box.value?.removeEventListener("mousemove", mousemove);
  }

  //handling id-hdl
  if (id.split("-")[1] == "hdl") {
    const scaleBox = valves.value.find((e: Valve) => {
      return e.id == id.split("-")[0];
    });
    if (scaleBox != null) {
      scaleBox.scaling = true;
      box.value?.addEventListener("mousemove", mousemove);
    }
  }
};

const dblClick = function (e: any) {
  var id = e.target.id;
  const item = valves.value.find((e: Valve) => {
    return e.id === id;
  });
  //selected item
  if (item != null) {
    item.selected = !item.selected;
    // if (item.selected) {
    //   form.value.color = item.color;
    //   form.value.w = item.w;
    //   form.value.h = item.h;
    //   form.value.name = item.name;
    //   form.value.srcset = item.srcset;
    //   form.value.ratio = item.ratio;
    // }
  }
};

const mouseup = function (e: any) {
  const id = e.target.id;
  //done or giving up events
  // regular draging
  const dv = valves.value.find((e: Valve) => {
    return e.dragging;
  });

  if (dv != null) {
    dv.dragging = false;
    // regular draging
  }

  pipes.value
    .filter((pf: Pipe) => {
      return pf.dragging;
    })
    .forEach((p: Pipe) => {
      p.dragging = false;
    });

  //handling id-hdl
  const vs = valves.value.find((e: Valve) => {
    return e.scaling;
  });
  if (vs != null) {
    vs.scaling = false;
  }

  const pm = pipes.value.find((p: Pipe) => {
    return p.c2 === "move";
  });
  if (pm === null) {
    box.value?.removeEventListener("mousemove", mousemove);
  }
};

function mousemove(e: any) {
  // moving dragging items
  const v = valves.value.find((e: Valve) => {
    return e.dragging;
  });
  if (v != null) {
    v.x = e.offsetX - v.offsetX;
    v.y = e.offsetY - v.offsetY;
    updatePipes(v);
  }

  // moving item handle
  const vs = valves.value.find((e: Valve) => {
    return e.scaling;
  });
  if (vs != null) {
    vs.w = Math.max(0, e.offsetX - vs.x);
    vs.h = Math.max(0, e.offsetY - vs.y);
    updatePipes(vs);
  }

  // moving unfinishing pipes
  const p = pipes.value.find((e: Pipe) => {
    return e.c2 == "move";
  });

  if (p != null) {
    p.qx = (e.offsetX - p.x1) / 2;
    p.qy = (e.offsetY - p.y1) / 2;
    p.lx = e.offsetX;
    p.ly = e.offsetY;
    p.x2 = e.offsetX;
    p.y2 = e.offsetY;
  }

  // moving pipe handle
  const pd = pipes.value.find((e: Pipe) => {
    return e.dragging;
  });

  if (pd != null) {
    pd.qx = e.offsetX - pd.x1;
    pd.qy = e.offsetY - pd.y1;
    pd.lx = e.offsetX;
    pd.ly = e.offsetY;
  }
}

const updatePipes = function (v: Valve) {
  // moving on dragging item associate pipes
  const c1 = pipes.value.filter((e: Pipe) => {
    return e.c1 === v.id;
  });
  if (c1?.length >= 0) {
    c1.forEach((p: Pipe) => {
      p.x1 = v.x + v.w / 2;
      p.y1 = v.y + v.h / 2;
      p.lx = p.x1;
      p.ly = p.y1;
      p.dragging = false;
    });
  }
  const c2 = pipes.value.filter((e: Pipe) => {
    return e.c2 === v.id;
  });
  if (c2?.length >= 0) {
    c2.forEach((p: Pipe) => {
      p.x2 = v.x + v.w / 2;
      p.y2 = v.y + v.h / 2;
      p.dragging = false;
    });
  }
};

const rightClick = function (e: any) {
  var id = e.target.id;
  e.preventDefault();

  const v = valves.value.find((e: Valve) => {
    return e.id === id;
  });

  if (v != null) {
    const p = pipes.value.find((e: Pipe) => {
      return e.c2 === "move";
    });

    if (p != null) {
      if (p.c1 != v?.id) {
        p.x2 = v.x + v.w / 2;
        p.y2 = v.y + v.h / 2;
        p.c2 = v.id;
        box.value?.removeEventListener("mousemove", mousemove);
      }
    } else {
      v.joining = true;
      addConection(
        v.x + v.w / 2,
        v.y + v.h / 2,
        v.id,
        e.offsetX,
        e.offsetY,
        "move"
      );
    }
  }
};

const delComponents = function () {
  const svs = valves.value.filter((v: Valve) => {
    return v.selected;
  });
  if (svs?.length > 0) {
    //clear all match pipes
    pipes.value = pipes.value.filter((p: Pipe) => {
      return svs.find((v: Valve) => {
        return v.id != p.c2 && v.id != p.c1;
      }); // must not be undefine or kills all
    });
  }

  //clear all match valves & pipes
  valves.value = valves.value.filter((v: Valve) => {
    return !v.selected;
  });
  pipes.value = pipes.value.filter((p: Pipe) => {
    return !p.selected;
  });
};

const keyup = function (e: any) {
  // console.log(`key press ${e.which}`);
  if (e.which === 8) {
    e.preventDefault();
    delComponents();
  }
};
window.addEventListener("keyup", keyup);

function _uuid() {
  var d = Date.now();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    })
    .substring(0, 4);
}

const onFileChange = function (e: any) {
  let files = e.target.files || e.dataTransfer.files;
  if (!files.length) return;
  if (!files.length) return;
  readFile(files[0]);
};

const readFile = function (file: File) {
  let reader = new FileReader();
  reader.onload = (e) => {
    // console.log(e?.target?.result);
    if (e?.target?.result) {
      let json = JSON.parse(e.target.result as string);
      valves.value.length = 0;
      pipes.value.length = 0;
      // console.log(json);
      const loadValves = json["valves"];
      if (loadValves) {
        for (var i = 0; i < loadValves.length; i++) {
          loadValve(loadValves[i] as ValveBlob);
        }
      }

      const loadPipes = json["pipes"];
      if (loadPipes) {
        for (var i = 0; i < loadPipes.length; i++) {
          loadPipe(loadPipes[i] as PipeBlob, valves.value);
        }
      }
    }
  };
  reader.readAsText(file);
};

const downloadFile = function () {
  const iconName = new RegExp("(?<=\/)[^\/\?#]+(?=[^\/]*$)");
  const vData = valves.value.map((e) => {
    const icon = e.srcset.match(iconName);
    return {
      xywh: [e.x, e.y, e.w, e.h],
      id: e.id,
      name: e.name,
      color: e.color,
      icon: icon ? icon[0] : "meter",
      ratio: e.ratio,
    } as ValveBlob;
  });
  const pData = pipes.value.map((e) => {
    return {
      id: e.id,
      name: e.name,
      c1: e.c1,
      c2: e.c2,
      lq: [e.qx, e.qy, e.lx, e.ly],
    } as PipeBlob;
  });
  const blob = {
    valves: vData,
    pipes: pData,
  };
  popDownloadFile(filename.value, `${JSON.stringify(blob)}`);
};

const popDownloadFile = function (name: string, data: string) {
  if (name === "diagram") {
    name += `_${_uuid()}`;
  }
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name + ".json");
  document.body.appendChild(link);
  link.click();
};

/* Websocket */
interface PIDSource {
  valves: ValveData[];
}
interface ValveData {
  id: string;
  value: number;
  unit: string;
}
const valveDatList: Ref<ValveData[]> = ref([]);
const updatePeriod = 500; // output Chart time
var repeatedUpdateChart: ReturnType<typeof setTimeout>;
const updateDataSource = function () {
  clearTimeout(repeatedUpdateChart);
  let obj: PIDSource = JSON.parse(wsPIDStore.payload || "{}");
  if (obj.valves != undefined) {
    valveDatList.value = obj.valves;
    valveDatList.value.forEach((e: ValveData, idx: number) => {
      const v = valves.value.find((e, i) => {
        return i == idx;
      });
      if (v != null) {
        v.value = e.value;
      }
    });
  }
  repeatedUpdateChart = setTimeout(updateDataSource, updatePeriod);
};
</script>

<template>
  <el-container>
    <el-main>
      <div class="bg">
        <svg
          ref="box"
          class="svg-bg"
          id="bg"
          width="1280"
          height="800"
          viewBox="0 0 1280 800"
          xmlns="http://www.w3.org/2000/svg"
          @mousedown="mousedown"
          @mouseup="mouseup"
          @dblclick="dblClick"
          @contextmenu="rightClick"
        >
          <g v-for="p in pipes" :key="p.id">
            <rect
              :x="`${p.qx + p.x1}`"
              :y="`${p.qy + p.y1}`"
              width="5"
              height="5"
              stroke-width="5"
              stroke="blue"
              :visibility="`${p.dragging ? 'visible' : 'hidden'}`"
            />
            <path
              :id="`${p.id + 'path'}`"
              :d="`M${p.x1},${p.y1} L${p.lx},${p.ly}
              ${p.x2},${p.y2}`"
              fill="none"
            />
            <g stroke-linejoin="round">
              <use
                :id="p.id"
                :href="`#${p.id + 'path'}`"
                stroke-width="14"
                stroke="#444"
                :class="`${
                  p.c2 === 'move' || p.dragging || p.selected
                    ? 'lineSelect'
                    : 'lineDone'
                }`"
              />
              <use
                :href="`#${p.id + 'path'}`"
                stroke-width="8"
                stroke="#a6aebd"
                stroke-linecap="round"
                pointer-events="none"
              />
              <use
                :href="`#${p.id + 'path'}`"
                transform="translate(2,2)"
                stroke-width="4"
                stroke="#c9ced7"
                stroke-linecap="round"
                pointer-events="none"
              />
              <!-- <use
                :href="`#${p.id + 'path'}`"
                :class="`${
                  p.c2 === 'move' || p.dragging || p.selected
                    ? 'lineSelect'
                    : 'lineAnim'
                }`"
              /> -->
              <g>
                <circle cx="0" cy="0" r="6" fill="purple" />
                <animateMotion
                  begin="0s"
                  dur="10s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath :xlink:href="`#${p.id + 'path'}`" />
                </animateMotion>
              </g>
            </g>
            <!-- <path
              :stroke="`${p.selected ? 'green' : 'purple'}`"
              :id="p.id"
              :d="`M${p.x1},${p.y1} L${p.qx + p.x1},${p.qy + p.y1} L ${p.x2},${
                p.y2
              }`"
              :class="`${
                p.c2 === 'move' || p.dragging || p.selected
                  ? 'lineSelect'
                  : 'lineDone'
              }`"
            /> -->
            <text text-anchor="middle" dy="-15">
              <textPath :href="`#${p.id + 'path'}`" startOffset="50%">
                {{ p.name }}
              </textPath>
            </text>
          </g>
          <g
            v-for="v in valves"
            :key="v.id"
            :transform="`translate(${v.x},${v.y})`"
          >
            <rect
              x="0"
              y="0"
              :id="v.id"
              :width="v.w"
              :height="v.h"
              fill="transparent"
              stroke-width="3"
              :stroke="`${
                v.scaling || v.dragging || v.selected ? `${v.color}` : 'none'
              }`"
              stroke-dasharray="4"
            />
            <rect
              :x="`${v.w - 5}`"
              :y="`${v.h - 5}`"
              :id="`${v.id}-hdl`"
              width="10"
              height="10"
              fill="orange"
              :visibility="`${
                v.scaling || v.dragging || v.selected ? 'visible' : 'hidden'
              }`"
            />
            <image
              :id="v.id"
              :width="`${v.w * v.ratio}`"
              :height="`${v.h * v.ratio}`"
              :x="`${v.w / 2 - (v.w * v.ratio) / 2}`"
              :y="`${v.h / 2 - (v.h * v.ratio) / 2 - 10}`"
              :href="`${v.srcset}`"
            />
            <text
              :x="`${v.w / 2}`"
              :y="`${v.h - 10}`"
              :font-size="`${Math.max(16, v.w / 15)}`"
              text-anchor="middle"
              stroke="black"
            >
              {{ v.name }} {{ v.id }} {{ v.value }}
            </text>
          </g>
        </svg>
      </div>
    </el-main>
    <el-aside width="280px" style="background-color: transparent">
      <h1>Select valve</h1>
      <el-form :model="form" label-width="80px">
        <el-form-item label="W">
          <el-input v-model="form.w" />
        </el-form-item>
        <el-form-item label="H">
          <el-input v-model="form.h" />
        </el-form-item>
        <el-form-item label="Icon Ratio">
          <el-input v-model="form.ratio" />
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-image
          style="width: 100px; height: 100px; margin: auto"
          :src="form.srcset"
        ></el-image>
        <el-form-item label="Image Src">
          <el-select v-model="form.srcset" placeholder="選擇閥件">
            <el-option
              v-for="item in valveList"
              :key="item"
              :label="item"
              :value="`${item}`"
            >
              <el-image
                style="width: 20px; height: 20px"
                fit="fill"
                :src="item"
              />
              {{ item }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Color">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        <el-form-item label="載入">
          <input type="file" accept="application/json" @change="onFileChange" />
        </el-form-item>
        <el-form-item label="存檔">
          <el-input v-model="filename" />
          <el-button class="btn" @click="downloadFile"
            >Download JSON File</el-button
          >
        </el-form-item>
      </el-form>
      <div>valve count: {{ valves.length }}</div>
      <div>pipe count: {{ pipes.length }}</div>
      <el-button class="btn" type="primary" @click="addComponents"
        >Add Valve</el-button
      >
      <el-button class="btn" type="warning" @click="addRandomComponents"
        >Add Random Valve</el-button
      >
      <el-button class="btn" type="primary" @click="connectPIDSocket"
        >Connect Data Source</el-button
      >
      <el-button class="btn" type="primary" @click="updateDataSource"
        >Update Data</el-button
      >
    </el-aside>
  </el-container>
</template>

<style scoped>
/* make text and image click through */
svg text,
image {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
}

.lineSelect {
  stroke: lime;
  fill: none;
  -webkit-animation-play-state: paused;
  -moz-animation-play-state: paused;
  -o-animation-play-state: paused;
  animation-play-state: paused;
}
.lineDone {
  fill: none;
}

.lineDone:hover {
  stroke: lime;
}
.lineAnim {
  stroke-dasharray: 200 20;
  stroke-width: 2;
  stroke: #0869ab;
  animation: dash linear 10s;
  stroke-linecap: round;
  animation-iteration-count: infinite;
  fill: none;
}

@keyframes dash {
  to {
    stroke-dashoffset: -1000;
  }
}

.bg {
  margin: auto;
}
.svg-bg {
  /* width: 1280px;
  max-width: 1280px;
  height: 800px;
  max-height: 800px;
  display: inline-block; */
  border: lightgray solid 2px;
  background-color: whitesmoke;
  background-image: radial-gradient(black 1px, transparent 0);
  background-size: 40px 40px;
  background-position: -19px -19px;
}
.btn {
  margin: 20px;
}
</style>
