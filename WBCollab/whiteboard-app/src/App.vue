<template>
  <div 
    ref="container"
    id="container"
  >  
    <div
      ref="kicked"
      id="kicked"
      v-if="kicked"
      >
      <h1>You have been kicked by {{ kicked }}</h1>
    </div>
    <div 
      ref="appli"
      id="appli"
      v-else-if="userNameEntered()"
    >
      <ul 
        ref="student-list"
        id="student-list"
      >
        <li v-for="(value, name) in usersTable" :key="name" :style="{color: colorTable[name]}" @click="kick(name)">
          {{ value }}
        </li>
      </ul>
      <button @click="clearCanvas(true)">Clear canvas</button>
      <div
        ref="sketch"
        id="sketch"
      >
        <canvas
          ref="canvas"
          id="draw-canvas"
        ></canvas>
        <canvas
          ref="cursorCanvas"
          id="cursor-canvas"
        ></canvas>
      </div>
    </div>
    <div 
      ref="pop-up"
      id="pop-up"
      v-else
    >
      Enter Username
      <input ref="user-name-input" id="user-name-input" type="text" v-model="tempUsername"/>
      <button ref="user-name-button" id="user-name-button" @click="assignUsername()">Submit</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  sockets: {
    connect: function() {
      console.log('socket connected')
    },
    'canvas-data': function (data) {
      var image = new Image();
      var canvas = this.$refs.canvas;
      var ctx = canvas.getContext('2d');
      image.onload = function() {
        ctx.drawImage(image, 0, 0);
      };
      image.src = data;
    },
    'update-users-table': function (data) {
      this.$data.usersTable = data;
      for(var key in data) {
        this.$data.colorTable[key] = this.stringToHslColor(data[key]);
      }
    },
    'update-cursor-table': function (data) {
      if(this.userNameEntered()) {
        this.$data.cursorTable = data;
        
        var cursorCanvas = this.$refs.cursorCanvas;
        var cursorCTX = cursorCanvas.getContext('2d');

        var sketch = this.$refs.sketch;
        var sketch_style = getComputedStyle(sketch);

        cursorCanvas.width = parseInt(sketch_style.getPropertyValue('width'));
        cursorCanvas.height = parseInt(sketch_style.getPropertyValue('height'));

        cursorCTX.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
        

        for(var key in this.$data.cursorTable) {

          cursorCTX.fillStyle = this.$data.colorTable[key];
          cursorCTX.beginPath();
          cursorCTX.arc(this.$data.cursorTable[key].x, this.$data.cursorTable[key].y, 5, 0, 2*Math.PI);
          cursorCTX.fill();
        }
      }
    },
    'kicked': function (data) {
      this.$data.username = null;
      this.$data.kicked = data;
    },
    'clear-canvas': function() {
      this.clearCanvas(false);
    }
  },
  data: function() {
      return {
        colorTable: {},
        cursorTable: {},
        usersTable: {},
        tempUsername: null,
        username: null,
        timeout: undefined,
        cursorTimeout: undefined,
        kicked: null,
        drawOnCanvasCalled: false
      }
  },
  methods: {
    clearCanvas(emit) {
      var canvas = this.$refs.canvas;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if(emit) this.$socket.emit('clear-canvas');
    },
    kick(socketID) {
      this.$socket.emit('kick-request', socketID);
    },
    userNameEntered() {
      return this.$data.username != null;
    },
    assignUsername() {
      if(this.$data.tempUsername != null) { 
        this.$data.username = this.$data.tempUsername;
        this.$socket.emit("username-submit", this.$data.username);
      }
    },
    stringToHslColor(str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      var h = hash % 360;
      var s = 80;
      var l = 40;
      return 'hsl('+h+', '+s+'%, '+l+'%)';
    },
    drawOnCanvas() {
      
      var root = this;

      var canvas = this.$refs.canvas;
      var ctx = canvas.getContext('2d');

      
      var sketch = this.$refs.sketch;
      var sketch_style = getComputedStyle(sketch);
      canvas.width = parseInt(sketch_style.getPropertyValue('width'));
      canvas.height = parseInt(sketch_style.getPropertyValue('height'));
      var mouse = {x: 0, y: 0};
      var last_mouse = {x: 0, y: 0};

      /* Mouse Capturing Work */
      canvas.addEventListener('mousemove', function(e) {
          last_mouse.x = mouse.x;
          last_mouse.y = mouse.y;

          mouse.x = e.pageX - sketch.offsetLeft;
          mouse.y = e.pageY - sketch.offsetTop;

          if(root.$data.cursorTimeout != undefined) clearTimeout(root.$data.cursorTimeout);
          root.$data.cursorTimeout = setTimeout(function() {
            root.$socket.emit('cursor-data', mouse);
          }, 10);

      }, false);


      /* Drawing on Paint App */
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'blue';

      canvas.addEventListener('mousedown', function() {
          canvas.addEventListener('mousemove', onPaint, false);
      }, false);

      canvas.addEventListener('mouseup', function() {
          canvas.removeEventListener('mousemove', onPaint, false);
      }, false);

      var onPaint = function() {
          ctx.beginPath();
          ctx.moveTo(last_mouse.x, last_mouse.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.closePath();
          ctx.stroke();
          
          if(root.$data.timeout != undefined) clearTimeout(root.$data.timeout);
          root.$data.timeout = setTimeout(function() {
            var base64ImageData = canvas.toDataURL("image/png");
            root.$socket.emit('canvas-data', base64ImageData);
          }, 1)
      };
    }
  },
  updated() {
    if(this.userNameEntered() && !this.$data.drawOnCanvasCalled) {
      this.drawOnCanvas();
      this.$data.drawOnCanvasCalled = true;
    }
  }
};
</script>

<style scoped>
  #draw-canvas {
    border: 2px solid black;
    position: absolute;
    top: 0;
    left: 0;
    width: 1280px;
    height: 720px;
    z-index: 1;
  }
  #sketch {
    position: fixed;
    width: 1280px;
    height: 720px;
    margin: 0 auto;
  }
  #cursor-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 1280px;
    height: 720px;
    z-index: 0;
  }
</style>