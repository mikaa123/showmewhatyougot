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
    $this,
    stage,
    layer,
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
      this.$font.val(this.model && this.model.getFontFamily() || '');
      this.$size.val(this.model && this.model.getFontSize() || '');
    }
  };

  var editView = {
    initialize: function($elt) {
      var that = this;
      this.$remove = $elt.find('#remove');
      this.$remove.on('click', function() {
        if (that.model) {
          that.model.remove();
          freeEditionViews();
          stage.draw();
        }
      });
    },

    setModel: function(node) {
      this.model = node;
    }
  };

  function freeEditionViews() {
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

    this
    .on('click', function(evt) {
      // this.edit();
    });
  };

  ImageNode.prototype = Object.create(Kinetic.Group.prototype);

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
      this.moveToTop();
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
    editView.setModel(this);
    textEditingView.setModel(this);
  };

  function canvasToEditor() {
    stage = new Kinetic.Stage({
      container: $this.get(0),
      width: 800,
      height: 600
    });

    layer = new Kinetic.Layer();
    stage.add(layer);

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
        case CST.TOOLS.HAND:
          freeEditionViews();
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

    settings.tools.find('.text').on('click', function() {
      toolSelection.selectText();
    });

    settings.tools.find('.hand').on('click', function() {
      toolSelection.selectHand();
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