<template>
  <div 
    ref="container"
    id="container"
    class="container"
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
      <button class="clear-button" @click="clearCanvas(true)">Clear canvas</button>
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
      class="pop-up"
      v-else
    >
      <a class="button" href="#popup1">Join the session</a>
    </div>
    <div id="popup1" class="overlay">
      <div class="popup">
        <h2>Enter Username</h2>
        <div class="content">
          <input ref="user-name-input" id="user-name-input" type="text" v-model="tempUsername"/>
          <button ref="user-name-button" id="user-name-button" class="button" @click="assignUsername()"><a class="submit-link" href="#">Submit</a></button>
        </div>
      </div>
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
  mounted() {
    document.body.classList.add('app-body')
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

  .container {
    font-family: Arial, Helvetica, sans-serif;
    align-content: center;
  }  
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

  .button {
    font-size: 1em;
    padding: 10px;
    color: #ffffffdc;
    border: 2px solid #540781dc;
    border-radius: 20px/50px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease-out;
    background: #7613afdc;
  }
  .button:hover {
    background: #3f0c5cdc;
    color: white;
  }

  .overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    transition: opacity 500ms;
    visibility: hidden;
    opacity: 0;
  }
  .overlay:target {
    visibility: visible;
    opacity: 1;
  }

  .popup {
    margin: 70px auto;
    padding: 20px;
    background: #fff;
    border-radius: 5px;
    width: 30%;
    position: relative;
    transition: all 5s ease-in-out;
  }

  .popup h2 {
    margin-top: 0;
    color: #333;
    font-family: Tahoma, Arial, sans-serif;
  }
  
  .popup .content {
    max-height: 30%;
    overflow: auto;
  }

  .pop-up {
    text-align: center;
  }
  .app-name {
    padding-top: 10px;
    color: white;
    text-align: center;
    font-weight: bold;
    font-size: 48px;
  }
  .submit-link {
    color:white;
    font-style: normal;
    text-decoration: none;
  }
  #user-name-input {
    height: 25px;
    padding-left: 10px;
  }
  ul {
    background: rgb(235, 235, 235);
  }
  li {
    max-width: 100px;
  }
  li:hover{
    background: rgb(211, 211, 211);
  }
  .clear-button {
    border-radius: 0px;
    background:rgb(42, 86, 233);
    color:white;
    width: 200px;
    height: 65px;
    font-size: 24px;
    border:none;
  }
  .clear-button:hover {
    background:rgb(7, 38, 139);
    color:white;
  }
</style>