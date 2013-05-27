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
    nodes = [];

  var textEditingView = {
    initialize: function($elt) {
      var that = this;
      this.$elt = $elt;
      this.$text = $elt.find('#text-value');
      this.$style = $elt.find('#text-style');
      this.$validate = $elt.find('#validate');

      this.$validate.on('click', function() {
        if (that.model) {
          that.model.text  = that.$text.val();
          that.model.style = that.$style.val();
          refreshCanvas();
        }
      });
    },

    setModel: function(textNode) {
      this.model = textNode;
      this.$text.val(this.model.text);
      this.$style.val(this.model.style);
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

  var TextNode = function(x, y) {
    Node.call(this, x, y);
    this.text = "Placeholder";
    this.style = CST.DEFAULT_FONT;
  };

  TextNode.prototype = Object.create(Node.prototype);

  TextNode.prototype.draw = function(context) {
    context.save();
    context.font = this.style;
    context.fillText(this.text, this.x, this.y);
    context.restore();
  };

  TextNode.prototype.collideAction = function() {
    textEditingView.setModel(this);
  };

  var ImageNode = function(x, y, url) {
    Node.call(this, x, y);
    this.img = new Image();
    this.img.src = url;
    this.width = this.img.width;
    this.height = this.img.height;
    var that = this;
    this.img.onload = function() {
      that.draw(canvas.getContext('2d'));
    };
  };

  ImageNode.prototype = Object.create(Node.prototype);

  ImageNode.prototype.draw = function(context) {
      context.drawImage(this.img, this.x, this.y);
  };

  ImageNode.prototype.collideAction = function() {
    // textEditingView.setModel(this);
  };

  function refreshCanvas() {
    canvas.width = canvas.width;
    setCanvasStyle(canvas);
    $.each(nodes, function() { this.draw(canvas.getContext('2d')); });
  }

  function canvasToEditor() {
    var context = canvas.getContext('2d');
    setCanvasStyle(canvas);

    canvas.addEventListener('dragover', function(evt) {
      evt.preventDefault();
    });
    canvas.addEventListener('drop', function(evt) {
      var posX = evt.offsetX;
      var posY = evt.offsetY;

      if (evt.dataTransfer.files.length > 0) {
        var file = evt.dataTransfer.files[0];
        if (file.type.indexOf('image') != -1) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            nodes.push(new ImageNode(posX, posY, evt.target.result));
          };
          reader.readAsDataURL(file);
        }
      }
      evt.preventDefault();
    }, false);

    $(canvas)
    .on('mousedown', function(evt) {
      switch(selectedTool) {
        case CST.TOOLS.TEXT:
          nodes.push(new TextNode(evt.offsetX, evt.offsetY));
          break;
        case CST.TOOLS.HAND:
          $.each(nodes, function() {
            this.collide(evt.offsetX, evt.offsetY);
          });
          break;
      }

      refreshCanvas(canvas);
    })
    .on('mousemove', function(evt) {
      $.each(nodes, function() {
        if (this.dragged) {
          this.moveTo(evt.offsetX, evt.offsetY);
          refreshCanvas(canvas);
        }
      });
    })
    .on('mouseup', function(evt) {
      $.each(nodes, function() { this.dragged = false; });
    });
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

    return this.filter('canvas').each(function() {
      canvas = this;
      canvasToEditor();
    });
  };

})(jQuery);