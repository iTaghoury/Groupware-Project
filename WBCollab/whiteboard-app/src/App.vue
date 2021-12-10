<template>
  <div
    ref="sketch"
    id="sketch"
  >
    <canvas
      ref="canvas"
      id="canvas"
    ></canvas>
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
    }
  },
  data: function() {
      return {
        timeout: undefined
      }
  },
  methods: {
    drawOnCanvas() {
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

          mouse.x = e.pageX - this.offsetLeft;
          mouse.y = e.pageY - this.offsetTop;
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

      var root = this;
      var onPaint = function() {
          ctx.beginPath();
          ctx.moveTo(last_mouse.x, last_mouse.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.closePath();
          ctx.stroke();
          
          if(root.$data.timeout != undefined) clearTimeout(root.$data.timeout);
          root.$data.timeout = setTimeout(function() {
            var base64ImageData = canvas.toDataURL("image/png");
            root.$socket.emit('canvas-data', base64ImageData)
          }, 1)
      };
    }
  },
  mounted() {
    this.drawOnCanvas();
  }
};
</script>

<style scoped>
#canvas {
  border: 1px solid black;
  width: 100%;
  height: 100%;
}
#sketch {
  height: 66%;
  width: 56%;
  margin: 0 auto;
}
</style>