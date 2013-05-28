(function($) {

  // Constants
  // ---------

  var CST = {
    TOOLS: {
      TEXT: 1,
      HAND: 2
    },
    DEFAULT_FONT: '30px Helvetica'
  };

  // Variables
  // ---------

  var selectedTool,
    canvas,
    $this,
    stage,
    nodes = [];

  var textEditingView = {
    initialize: function($elt) {
      var that = this;
      this.$elt = $elt;
      this.$font = $elt.find('#style-font');
      this.$size = $elt.find('#style-size');
      this.$validate = $elt.find('#validate');

      this.$validate.on('click', function() {
        if (that.model) {
          that.model.setFontFamily(that.$font.val());
          that.model.setFontSize(that.$size.val());
          stage.draw();
        }
      });
    },

    setModel: function(textNode) {
      this.model = textNode;
      this.$font.val(this.model.getFontFamily());
      this.$size.val(this.model.getFontSize());
    }
  };

  var editView = {
    initialize: function($elt) {
      var that = this;
      this.$remove = $elt.find('#remove');
      this.$remove.on('click', function() {
        if (that.model) {
          console.log('removing', that.model);
          nodes.splice(nodes.indexOf(that.model), 1);
          refreshCanvas();
        }
      });
    },

    setModel: function(node) {
      this.model = node;
    }
  };

  // Support
  // -------

  var Node = function(x, y) {
    this.x = x;
    this.y = y;
    this.dragged = false;
  };

  Node.prototype = {
    // returns true if there's a collision
    collide: function(x, y) {
      if (this.x <= x && this.y <= y &&
          (this.x + 180) >= x && (this.y + 40) >= y) {
        this.dragged = true;
        this.draggedSource = { x: x, y: y};
        editView.setModel(this);
        this.collideAction();
        return true;
      }
      return false;
    },

    moveTo: function(x, y) {
      this.x += x - this.draggedSource.x;
      this.y += y - this.draggedSource.y;
      this.draggedSource.x = x;
      this.draggedSource.y = y;
    }
  };

  // var TextNode = function(x, y) {
  //   Node.call(this, x, y);
  //   this.text = "Placeholder";
  //   this.style = CST.DEFAULT_FONT;
  // };

  // TextNode.prototype = Object.create(Node.prototype);

  // TextNode.prototype.draw = function(context) {
  //   context.save();
  //   context.font = this.style;
  //   context.fillText(this.text, this.x, this.y);
  //   context.restore();
  // };

  // TextNode.prototype.collideAction = function() {
  //   textEditingView.setModel(this);
  // };

  // var ImageNode = function(x, y, url) {
  //   Node.call(this, x, y);
  //   this.img = new Image();
  //   this.img.src = url;
  //   this.width = this.img.width;
  //   this.height = this.img.height;
  //   var that = this;
  //   this.img.onload = function() {
  //     that.draw(canvas.getContext('2d'));
  //   };
  // };

  // ImageNode.prototype = Object.create(Node.prototype);

  // ImageNode.prototype.draw = function(context) {
  //     context.drawImage(this.img, this.x, this.y);
  // };

  // ImageNode.prototype.collideAction = function() {
  //   // textEditingView.setModel(this);
  // };

  var ImageNode = function(img, x, y) {
    Kinetic.Image.call(this, {
      x: x,
      y: y,
      draggable: true,
      image: img
    });

    this
    .on('click', function(evt) {
      // this.edit();
    });
  };

  ImageNode.prototype = Object.create(Kinetic.Image.prototype);

  var TextNode = function(x, y) {
    Kinetic.Text.call(this, {
      x: x,
      y: y,
      text: 'Placholder',
      fontSize: 30,
      fontFamily: 'Helvetica',
      fill: 'black',
      draggable: true
    });

    this
    .on('dblclick', function(evt) {
      this.setText(prompt('New Text:'));
      stage.draw();
    })
    .on('click', function(evt) {
      this.edit();
    });
  };

  TextNode.prototype = Object.create(Kinetic.Text.prototype);

  TextNode.prototype.edit = function() {
    textEditingView.setModel(this);
  };

  function refreshCanvas() {
    canvas.width = canvas.width;
    setCanvasStyle(canvas);
    $.each(nodes, function() { this.draw(canvas.getContext('2d')); });
  }

  function canvasToEditor() {
    stage = new Kinetic.Stage({
      container: $this.get(0),
      width: 800,
      height: 600
    });

    var layer = new Kinetic.Layer();
    stage.add(layer);

    $(stage.getContainer())
    .on('mousedown', function(evt) {
      switch(selectedTool) {
        case CST.TOOLS.TEXT:
          var text = new TextNode(evt.offsetX, evt.offsetY);
          nodes.push(text);
          layer.add(text);
          stage.draw();
          selectedTool = CST.TOOLS.HAND;
          break;
      }
    });

    stage.getContainer().addEventListener('dragover', function(evt) {
      evt.preventDefault();
    });
    stage.getContainer().addEventListener('drop', function(evt) {
      var posX = evt.offsetX;
      var posY = evt.offsetY;

      if (evt.dataTransfer.files.length > 0) {
        var file = evt.dataTransfer.files[0];
        if (file.type.indexOf('image') != -1) {
          var reader = new FileReader();

          reader.onload = function(evt) {
            var img = new Image();
            img.src = evt.target.result;

            img.onload = function() {
              var imgNode = new ImageNode(img, posX, posY);
              nodes.push(imgNode);
              layer.add(imgNode);
              stage.draw();
              selectedTool = CST.TOOLS.HAND;
            };
          };
          reader.readAsDataURL(file);
        }
      }
      evt.preventDefault();
    }, false);

    // $(canvas)
    // .on('mousedown', function(evt) {
    //   var node;

    //   switch(selectedTool) {
    //     case CST.TOOLS.TEXT:
    //       node = new TextNode(evt.offsetX, evt.offsetY);
    //       nodes.push(node);
    //       textEditingView.setModel(node);
    //       selectedTool = CST.TOOLS.HAND;
    //       break;
    //     case CST.TOOLS.HAND:
    //       $.each(nodes, function() {
    //         this.collide(evt.offsetX, evt.offsetY);
    //       });
    //       break;
    //   }

    //   refreshCanvas(canvas);
    // })
    // .on('mousemove', function(evt) {
    //   $.each(nodes, function() {
    //     if (this.dragged) {
    //       this.moveTo(evt.offsetX, evt.offsetY);
    //       refreshCanvas(canvas);
    //     }
    //   });
    // })
    // .on('mouseup', function(evt) {
    //   $.each(nodes, function() { this.dragged = false; });
    // });
  }

  function setupTools($tools) {
    // Text tool is selected by default
    selectedTool = CST.TOOLS.TEXT;

    settings.tools.find('.text').on('click', function() {
      selectedTool = CST.TOOLS.TEXT;
    });
    settings.tools.find('.hand').on('click', function() {
      selectedTool = CST.TOOLS.HAND;
    });
  }

  function setCanvasStyle() {
    var context = canvas.getContext('2d');
    context.font = '30px Helvetica';
    context.textBaseline = "top";
  }

  // Plugin
  // ------

  $.fn.jsonCanvasEditor = function(options) {
    settings = $.extend({
      tools: $('#jcTools'),
      text: $('#jcText'),
      edit: $('#jcEdit')
    }, options);

    setupTools(settings.tools);
    textEditingView.initialize(settings.text);
    editView.initialize(settings.edit);

    $this = this;
    canvasToEditor();
  };

})(jQuery);