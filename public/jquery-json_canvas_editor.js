(function($) {

  // Constants
  // ---------

  var CST = {
    TOOLS: {
      TEXT: 1,
      HAND: 2,
      PATH: 3
    },
    DEFAULT_FONT: '30px Helvetica'
  };

  // Variables
  // ---------

  var selectedTool,
    $this,
    stage,
    layer,
    currentSelectedNode,
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
      if (textNode instanceof TextNode) {
        this.$font.val(this.model && this.model.getFontFamily() || '');
        this.$size.val(this.model && this.model.getFontSize() || '');
      } else {
        this.$font.val('');
        this.$size.val('');
      }
    }
  };

  var editView = {
    initialize: function($elt) {
      var that = this;
      this.$remove = $elt.find('#remove');
      this.$unselect = $elt.find('#unselect');
      this.$remove.on('click', function() {
        if (that.model) {
          that.model.remove();
          freeEditionViews();
          stage.draw();
        }
      });
      this.$unselect.on('click', function() {
        if (that.model) {
          freeEditionViews();
        }
      });
    },

    setModel: function(node) {
      this.model = node;
    }
  };

  function freeEditionViews() {
    if (currentSelectedNode && currentSelectedNode.unselect) {
      currentSelectedNode.unselect();
    }
    currentSelectedNode = undefined;
    editView.setModel(undefined);
    textEditingView.setModel(undefined);
  }

  // Support
  // -------

  var ImageNode = function(img, x, y) {
    Kinetic.Group.call(this, {
      x: x,
      y: y,
      draggable: true
    });
    this.add(new Kinetic.Image({
      x: 0,
      y: 0,
      name: 'image',
      image: img
    }));

    var that = this;
    function createAnchor(x, y, name) {
      var anchor = new Kinetic.Circle({
        x: x,
        y: y,
        stroke: '#666',
        fill: '#ddd',
        strokeWidth: 2,
        radius: 8,
        name: name,
        draggable: true,
        dragOnTop: false
      });

      anchor.on('dragmove', function() {
        that.update(this);
        layer.draw();
      })
      .on('mousedown touchstart', function() {
        that.setDraggable(false);
        this.moveToTop();
      })
      .on('mouseup', function() {
        console.log('up!');
        that.setDraggable(true);
        this.moveToTop();
      })
      .on('mouseover', function() {
        document.body.style.cursor = 'pointer';
        this.setStrokeWidth(4);
        layer.draw();
      })
      .on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.setStrokeWidth(2);
        layer.draw();
      });

      that.add(anchor);
    }

    createAnchor(0, 0, 'topLeft');
    createAnchor(img.width, 0, 'topRight');
    createAnchor(img.width, img.height, 'bottomRight');
    createAnchor(0, img.height, 'bottomLeft');
    this.setAnchors(false);

    this
    .on('click', function(evt) {
      this.edit();
    });
  };

  ImageNode.prototype = Object.create(Kinetic.Group.prototype);
  ImageNode.prototype.update = function(activeAnchor) {
    var group = this;

    var topLeft = group.get('.topLeft')[0];
    var topRight = group.get('.topRight')[0];
    var bottomRight = group.get('.bottomRight')[0];
    var bottomLeft = group.get('.bottomLeft')[0];
    var image = group.get('.image')[0];

    var anchorX = activeAnchor.getX();
    var anchorY = activeAnchor.getY();

    // update anchor positions
    switch (activeAnchor.getName()) {
      case 'topLeft':
        topRight.setY(anchorY);
        bottomLeft.setX(anchorX);
        break;
      case 'topRight':
        topLeft.setY(anchorY);
        bottomRight.setX(anchorX);
        break;
      case 'bottomRight':
        bottomLeft.setY(anchorY);
        topRight.setX(anchorX);
        break;
      case 'bottomLeft':
        bottomRight.setY(anchorY);
        topLeft.setX(anchorX);
        break;
    }

    image.setPosition(topLeft.getPosition());

    var width = topRight.getX() - topLeft.getX();
    var height = bottomLeft.getY() - topLeft.getY();
    if(width && height) {
      image.setSize(width, height);
    }
  };
  ImageNode.prototype.setAnchors = function(visible) {
    if (visible) {
      this.get('.topLeft')[0].show();
      this.get('.topRight')[0].show();
      this.get('.bottomRight')[0].show();
      this.get('.bottomLeft')[0].show();
    } else {
      this.get('.topLeft')[0].hide();
      this.get('.topRight')[0].hide();
      this.get('.bottomRight')[0].hide();
      this.get('.bottomLeft')[0].hide();
    }
    layer.draw();
  };
  ImageNode.prototype.unselect = function() {
    this.setAnchors(false);
  };
  ImageNode.prototype.edit = function() {
    freeEditionViews();
    this.setAnchors(true);
    currentSelectedNode = this;
    editView.setModel(this);
  };

  var TextNode = function(x, y) {
    Kinetic.Text.call(this, {
      x: x,
      y: y,
      text: 'Placholder',
      fontSize: 30,
      fontFamily: 'Helvetica',
      fill: 'white',
      draggable: true
    });

    this
    .on('dblclick', function(evt) {
      this.setText(prompt('New Text:'));
      stage.draw();
    })
    .on('click', function(evt) {
      this.edit();
    })
    .on('mouseover', function(evt) {
      document.body.style.cursor = 'pointer';
    })
    .on('mouseout', function() {
      document.body.style.cursor = 'default';
    });
  };

  TextNode.prototype = Object.create(Kinetic.Text.prototype);
  TextNode.prototype.edit = function() {
    freeEditionViews();
    this.moveToTop();
    currentSelectedNode = this;
    editView.setModel(this);
    textEditingView.setModel(this);
  };

  function canvasToEditor() {
    stage = new Kinetic.Stage({
      container: $this.get(0),
      width: 1200,
      height: 800
    });

    layer = new Kinetic.Layer();
    stage.add(layer);

    var newSpline,
      splineDrawing = false;
    $(stage.getContainer())
    .on('mousedown', function(evt) {
      switch(selectedTool) {
        case CST.TOOLS.TEXT:
          var text = new TextNode(evt.offsetX, evt.offsetY);
          nodes.push(text);
          layer.add(text);
          stage.draw();
          toolSelection.selectHand();
          text.edit();
          break;
        case CST.TOOLS.PATH:
          $.each(nodes, function() {
            this.setDraggable(false);
          });
          newSpline = new Kinetic.Spline({
            points: [{
              x: evt.offsetX,
              y: evt.offsetY
            }],
            stroke: 'white',
            strokeWidth: 10,
            lineCap: 'round',
            tension: 1,
            draggable: true
          });
          newSpline.on('click', function() {
            freeEditionViews();
            this.moveToTop();
            currentSelectedNode = this;
            editView.setModel(this);
          });
          splineDrawing = true;
          nodes.push(newSpline);
          layer.add(newSpline);
          layer.draw();
          break;
      }
    })
    .on('mousemove', function(evt) {
      if (splineDrawing && selectedTool === CST.TOOLS.PATH) {
        newSpline.attrs.points.push({x: evt.offsetX, y: evt.offsetY});
        newSpline.setPoints(newSpline.attrs.points);
        layer.draw();
      }
    })
    .on('mouseup', function(evt) {
      splineDrawing = false;
      toolSelection.selectHand();
      $.each(nodes, function() {
        this.setDraggable(true);
      });
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
              imgNode.edit();
              toolSelection.selectHand();
            };
          };
          reader.readAsDataURL(file);
        }
      }
      evt.preventDefault();
    }, false);
  }

  var toolSelection = {};
  function setupTools($tools) {
    // Text tool is selected by default
    selectedTool = CST.TOOLS.TEXT;

    toolSelection.selectText = function() {
      $tools.find('li').removeClass('pure-menu-selected');
      selectedTool = CST.TOOLS.TEXT;
      $tools.find('.text').addClass('pure-menu-selected');
    };

    toolSelection.selectHand = function() {
      $tools.find('li').removeClass('pure-menu-selected');
      selectedTool = CST.TOOLS.HAND;
      $tools.find('.hand').addClass('pure-menu-selected');
    };

    toolSelection.selectPath = function() {
      $tools.find('li').removeClass('pure-menu-selected');
      selectedTool = CST.TOOLS.PATH;
      $tools.find('.path').addClass('pure-menu-selected');
    };

    settings.tools.find('.text').on('click', function() {
      toolSelection.selectText();
    });

    settings.tools.find('.hand').on('click', function() {
      toolSelection.selectHand();
    });

    settings.tools.find('.path').on('click', function() {
      toolSelection.selectPath();
    });
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