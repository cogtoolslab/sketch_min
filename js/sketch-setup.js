
// global drawing params
var drawingAllowed = true;
var submitAllowed = false; // allow submission once there is at least one stroke
var strokeColor = 'red';
var strokeWidth = 3;
var simplifyParam = 2;
var currStrokeNum = 0;

function setupSketchPad() {

  // instantiate new sketchpad
  sketchpad = new Sketchpad();
  var tool = new Tool();
  sketchpad.setupTool();

}


///////// CORE DRAWING FUNCTIONS ///////////

function Sketchpad() {
  // initialize paper.js      
  paper.setup('sketchpad');
  // when the section below is commented out, it defaults to width 300px, height 150px
  paper.view.viewSize.width = 300;
  paper.view.viewSize.height = 300;
};

Sketchpad.prototype.setupTool = function () {
  // initialize path and tool
  var path;

  // define mouse interaction events
  tool.onMouseDown = function (event) {
    startStroke(event);
  }

  tool.onMouseDrag = function (event) {
    if (drawingAllowed && !_.isEmpty(path)) {
      var point = event.point.round();
      currMouseX = point.x;
      currMouseY = point.y;
      path.add(point);
    }
  };

  tool.onMouseUp = function (event) {
    endStroke(event);
  }

  // startStroke
  function startStroke(event) {
    if (drawingAllowed) {
      startStrokeTime = Date.now();
      // If a path is ongoing, send it along before starting this new one
      if (!_.isEmpty(path)) {
        endStroke(event);
      }

      var point = (event ? event.point.round() :
        { x: currMouseX, y: currMouseY });
      path = new Path({
        segments: [point],
        strokeColor: strokeColor,
        strokeWidth: strokeWidth
      });
    }
  };

  // endStroke
  function endStroke(event) {
    // Only send stroke if actual line (single points don't get rendered)

    try {

      if (drawingAllowed && path.length > 1) {

        // allow submission of button if endStroke is called 
        // submit_button.disabled = false;

        // record end stroke time
        endStrokeTime = Date.now();

        // Increment stroke num
        currStrokeNum += 1;

        // Simplify path to reduce data sent
        path.simplify(simplifyParam);

        // send stroke data to db.
        send_stroke_data(path);

        // reset path
        path = [];
      }

    } catch (error) {
      if (error instanceof TypeError) {
        console.log('caught it')
        console.log(error)
      }
    }
  }

}



// placeholder stroke data sender
function send_stroke_data(path) {

  // path.selected = false;
  var svgString = path.exportSVG({ asString: false }).getAttribute('d');

  try {
    
    // specify other metadata
    let stroke_data = {
      eventType: 'stroke',
      svg: svgString,
      arcLength: path.length,
      currStrokeNum: currStrokeNum,
      simplifyParam: simplifyParam
      // startResponseTime: startResponseTime,
      // startStrokeTime: startStrokeTime,
      // endStrokeTime: endStrokeTime,
      // time: Date.now()
    };

    console.log('stroke_data', stroke_data);
  } catch (error) {
    console.log('error sending stroke data', error)
  }

  // send stroke data to server
  // socket.emit('stroke', stroke_data);

}

// placeholder end_trial function
function end_trial() {

  // disable button to prevent double firing
  submit_button.disabled = true;

  // sketch rendering to base64 encoding
  var dataURL = display_element.querySelector('#sketchpad').toDataURL();
  dataURL = dataURL.replace('data:image/png;base64,', '');

  // data saving
  var trial_data = _.extend({}, {
    eventType: 'sketch',
    numStrokes: currStrokeNum,
    pngData: dataURL,
    sketchID: sketchID,
    // startTrialTime: startTrialTime,
    // endTrialTime: Date.now(),
    // totalTrialTime: Date.now() - startTrialTime
  });

  // clear the HTML in the display element
  display_element.innerHTML = '';

  // clear sketchpad canvas and reset drawing state vars
  project.activeLayer.removeChildren();

};
