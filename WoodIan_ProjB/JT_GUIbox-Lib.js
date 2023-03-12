//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  GUIbox-Lib.js library: 
  ===================== 
One 'GUIbox' object collects together everything our program needs to respond 
properly to all user inputs, including:
	--Mouse click, double-click, and drag,
	--Keyboard keyboard inputs,
	--HTML objects for Graphical User Interface, including:
		-- on-screen buttons users can 'push' (click)
		-- edit-boxes where users can enter numbers or text strings;
		-- spans where our program can print messages for users,
	--Window objects (e.g. browser) messages such as:
		--Window re-size, 
		--Window 'tool tips' (appear when mouse hovers over HTML5 element)
		--Window hide/reveal, etc.
USAGE:
=======================
1) Add the GUIbox-Lib.js function to your HTML file
  (be sure it's BEFORE the JS file that holds 'main()', like this:)
        ... (earlier HTML stuff) ...
    		<script src="JT_GUIbox-Lib.js"></script>
    		<script src_"myMainFile.js"></script>
    		... (later HTML stuff) ...
2) Create one global GUIbox object in your JS file that holds main(), like this:
   (How? put this line above your JS main() function):
      var gui = new GUIbox();
3) Near the start of main(), initialize your one global GUIbox object:
      gui.init();
    (where? be sure to put it AFTER creating the HTML-5 'canvas' element &
    and AFTER creating the WebGL drawing context, and before you begin any
    animation or GUI tasks)
4) Take a moment to read the rest of this file, to examine the 'gui' object's 
    methods.  Recommended:
    -- Please don't modify the mouse-event handling functions, but instead use 
    the xCVV, yCVV values to supply mouse-motion values in your program.
    -- Please *DO* extend the keyboard-event handling functions by expanding 
    their 'switch()' statements to respond to additional keys as needed.
*/


// Written for EECS 351-2,	Intermediate Computer Graphics,
//				Northwestern Univ. EECS Dept., Jack Tumblin
// 2018.05.20 Created, integrated into 'Week01' starter code for ray-tracing
// 2019.05.15 Updated comments & keyboard fcns to remove deprecated 'keyPress'
//==============================================================================
//=============================================================================
function GUIbox() {	
//=============================================================================
//==============================================================================
// CONSTRUCTOR for one re-usable 'GUIbox' object that holds all data and fcns 
// needed to capture and respond to all keyboard & mouse inputs/outputs.

  this.isDrag = false;	// mouse-drag: true while user holds down mouse button
  
  this.xCVV=1.0;			// Results found from last call to this.MouseToCVV()
  this.yCVV=0.0;

  this.xMpos=0.0;			// last recorded mouse position (in CVV coords)
  this.yMpos=0.0;   

  this.xMdragTot=0.0; // total (accumulated) mouse-drag amounts(in CVV coords).
  this.yMdragTot=0.0;  
}

GUIbox.prototype.init = function() {
//==============================================================================
// Set the browser window to use GUIbox member functions as 'callbacks' for all
// user-interface events.
// Call this function in main(), after you set up your HTML-5 canvas object and
// your WebGL drawing context.
  //BACKGROUND-------------------------------
	// (SEE:  https://www.w3schools.com/jsref/met_document_addeventlistener.asp)
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  

// --------!!! SURPRISE !!!-------------------------
// Our earlier, naive way of setting mouse callback functions made calls to
// isolated functions that were NOT members of an object or a prototype: 
//      (e.g.     window.addEventListener("mousedown", myMouseDown);  
//				  	called the stand-alone myMouseDown() function, usually
//					defined somewhere below main())
// That's the old, simple, obvious way, and it always works.
// But if we assemble all our callback functions into a nice neat GUIbox object, 
// and if the GUIbox init() function sets them as event-listeners like this:
//                window.addEventListener("mousedown", this.mouseDown);
// ----- .THEN SOMETHING WEIRD HAPPENS. -----
// Mouse-down events *DO* call our GUIbox's mouseDown() member function, but
// inside mouseDown() we can't use 'this' to access any other GUIbox members;
//      console.log('this.isDown', this.isDown); //  prints 'undefined'
//      console.log('this:', this); // prints object that CALLED our callback!
// WHY THIS HAPPENS:
// --Callback functions are 'closures'; when executing them, 'this' refers to
//  the object that was given the closure, and not the object that contains the
//  function.
// HOW TO FIX IT:
//  Read down thru the code just above 'Legacy Internet Explorer..." here:
//   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
// I think the simplest solution is to use closures more cleverly:
//  a) Within our 'init()' function, create a local object I will call 'that'. 
//     The 'that' variable is just a simple reference to our GUIbox object.
//  b) Create an anonymous (e.g. no-name) function to use as our callback; 
//  c) within the 'anonymous' function, use the 'that' object to call the 
//      desired (named) method we want to use as our callback.  Inside the named
//      callback function (e.g. that.mouseDown() ), you will find that 'this'
//      refers to the GUIbox object specified by 'that', and we now can access
//      other GUIbox members we may need such as xCVV, etc.  Whew!
//-----------------------------------MORE ON THIS TOPIC:
  // https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
  // TUTORIAL: http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/
  // TUTORIAL: https://www.w3schools.com/js/js_function_closures.asp
//------------------------------------------------------------------------------

  var that = this;    // (local) var/reference to the current GUIbox object;
                      // used in anonymous functions to restore simple
                      // expected behavior of 'this' inside GUIbox functions. 
	// MOUSE:--------------------------------------------------
  window.addEventListener("mousedown", 
        function(mev) {return that.mouseDown(mev);     } ); 
	// (After each 'mousedown' event, browser calls this anonymous method that
	//    does nothing but return the 'that' object's mouseDown() method.
	//    WHY? to ensure proper operation of 'this' within the mouseDown() fcn.)
  window.addEventListener("mousemove", 
        function(mev) {return that.mouseMove(mev);     } ); 
	window.addEventListener("mouseup",   
	      function(mev) {return that.mouseUp(mev);       } );	
/*
//------------------HINT: If you don't need them, comment out these Event Listeners:
	window.addEventListener("click",
	      function(mev) {return that.mouseClick(mev);    } );			
	window.addEventListener("dblclick",  
	      function(mev) {return that.mouseDblClick(mev); } ); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, add the event
	// listener to the 'g_canvasID' object instead of the 'window' object:
	g_canvasID.addEventListener("click", 
	      function(mev) {return that.canvasClick(mev);   } );
//--------------------(END HINT)-----------
*/
	// ?Arguments?
	// Wait wait wait -- these 'listeners' just NAME the function called when 
	// the event occurs! How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments.
  // SEE: 'myMouseClick()' function body below for an example
  //----------------------------------------------------------------------------

  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", 
	      function(kev) {return that.keyDown(kev);  }, false);
	// After each 'keydown' event, call the 'KeyDown()' function; 'false'
	// (default) means event handler executed in  'bubbling', not 'capture')
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", 
	      function(kev) {return that.keyUp(kev);    }, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 

// NOTE: please don't use the 'keypress' event -- It's been deprecated!
//	see: https://developer.mozilla.org/en-US/docs/Web/API/Document/keypress_event
  //		  I use them for the arrow keys; insert/delete; home/end, etc.
	window.addEventListener("keypress", 
	      function(kev) {return that.keyPress(kev); }, false);
  // The 'keyPress' events respond ONLY to alpha-numeric keys, and sense any 
  //  		modifiers such as shift, alt, or ctrl.  I use these for single-
  //      number and single-letter inputs that include SHIFT,CTRL,ALT.
	// END Mouse & Keyboard Event-Handlers----------------------------------------
		// REPORT initial mouse-drag totals on-screen:
		document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + 
			this.xMdragTot.toFixed(5) + ', \t' + this.yMdragTot.toFixed(5);	

  // Camera-Navigation:----------------------------------
  // Initialize our camera aiming parameters using yaw-pitch sphere method.
  // Camera aiming point stays on a unit-radius sphere centered at the camera's
  // eye point, specified by:
  // --'yaw' angle(longitude) increasing CCW in xy plane measured from +x axis;
  // --'pitch' angle(latitude) increasing upwards above horizon.
  // This is BETTER than 'glass tube' because it lets us pitch camera up/down
  // in equal-angle increments, and even go past +/-90 degrees if we wish.
  // I limited 'pitch' to +/- 90 deg (+/- PI/2 radians) to avoid confusing
	// counter-intuitive images possible with past-vertical pitch.
	// (see GUIbox.mouseMove() function )
  this.camYaw = Math.PI/2.0;              // (initially I aim in +y direction)
                              // Yaw angle (radians) measured from world +x 
                              // direction to the x,y components of the camera's
                              // aiming direction.
                              // HORIZONTAL mouse-drag increases/decreases this.
  this.camYawInit = this.camYaw;  // save initial value for use in mouseMove().
//  this.camPitch = -Math.PI/2;             // (initially I look straight down)
  this.camPitch = 0.0;        // Initially aim at horizon; level with xy plane 
                              // Pitch angle (radians) measured upwards from the 
                              // horizon (the xy plane at camera's eyepoint z)
                              // upwards to the camera's aiming direction.
                              // VERTICAL mouse-drag increases/decreases this.
  this.camPitchInit = this.camPitch;  // save initial value for mouseMove().
//  this.camEyePt = vec4.fromValues(0,0,0,1); // initial camera position: origin
  this.camEyePt = vec4.fromValues(0,-8,2,1);  // initial camera position
  this.camAimPt = vec4.fromValues(       // point on yaw-pitch sphere around eye:
                this.camEyePt[0] + Math.cos(this.camYaw)*Math.cos(this.camPitch), // x
                this.camEyePt[1] + Math.sin(this.camYaw)*Math.cos(this.camPitch), // y
                this.camEyePt[2] + Math.sin(this.camPitch), // z
                1.0);  // w. 
  // Yaw & pitch angles let us specify an 'up' vector always perpendicular to
  // the camera aiming direction. (same yaw, but increase pitch by +90 degrees)
  this.camUpVec = vec4.fromValues(   // +90deg == Math.PI/2
      Math.cos(this.camYaw)*Math.cos(this.camPitch + Math.PI/2),  // x 
      Math.sin(this.camYaw)*Math.cos(this.camPitch + Math.PI/2),  // y
                            Math.sin(this.camPitch + Math.PI/2),  // z
                            0.0);   // w=0 for vectors, =1 for points.
  this.camSpeed = 0.5;	      // world-space distance moved per keystroke

  // Set initial Camera Lens (intrinsics)-----------------------  
  this.camFovy  = 45.0;   // vertical field-of-view in degrees, measured from
                          // bottom to top of camera image.
  this.camAspect = 1.0;   // camera-image width/height (sets horizontal FOV)
  this.camNear = 1.0;     // distance from Center of Projection to viewing plane
                          // (where we define left,bot,top values from Fovy & aspect)
  this.camFar = 10000;    // distance to frustum's outermost clipping plane
                          // (for WebGL camera only--ignored by ray-tracer)
  // CScene.init() will use these settings to create its ray-camera.
}

GUIbox.prototype.mouseDown = function(mev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?  console.log('mev.button=' + mev.button);  )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS(!)  

//console.log("called GUIbox.mouseDown(mev)");
//  That's not good for us -- convert to CVV coordinates instead:
	this.mouseToCVV(mev);									// convert to CVV coordinates:
																			// (result in  this.xCVV, this.yCVV)
	this.xMpos = this.xCVV;             // save current position, and...
	this.yMpos = this.yCVV;
	this.isDrag = true;						  		// set our mouse-dragging flag
	// display it on our webpage, too...
	document.getElementById('MouseAtResult').innerHTML = 
	  'GUIbox.mouseDown() at CVV coords x,y = ' + 
	  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5);
//	console.log('GUIbox.mouseDown(): xMpos,yMpos== ' + 
//	  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5));
}

GUIbox.prototype.mouseMove = function(mev) {	
//=============================================================================
// Called when user MOVES the mouse, with or without a button pressed down.
// 									(Which button?   console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
//  That's not good for us -- convert to CVV coordinates instead:

//console.log("GUIbox.mouseMove(): isDrag==", this.isDrag);
	if(this.isDrag==false) return;		// IGNORE all mouse-moves except 'dragging'
//	console.log("called GUIbox.mouseMove(mev)");	
  this.mouseToCVV(mev);							// convert to CVV coordinates:
	                                  // (result in this.xCVV, this.yCVV)
	// find how far we dragged the mouse:
	this.xMdragTot += (this.xCVV - this.xMpos); // Accumulate change-in-mouse-position,&
	this.yMdragTot += (this.yCVV - this.yMpos);
	this.xMpos = this.xCVV;	                    // Make next drag-measurement from here.
	this.yMpos = this.yCVV;

  // Report mouse-drag totals on our webpage:
	document.getElementById('MouseDragResult').innerHTML=
//			'Mouse Drag totals (CVV coords):\t' + 
//			this.xMdragTot.toFixed(5) + ', \t' + this.yMdragTot.toFixed(5) +
			'camYaw:' + (this.camYaw*(180/Math.PI)).toFixed(3) + 'deg.; camPitch:' + 
			              (this.camPitch*(180/Math.PI)).toFixed(3) + 'deg.';	
  //-------------------------
  // Camera navigation:
  // update camera aiming angles:
  this.camYaw = this.camYawInit + this.xMdragTot * 1.0; // Horiz drag in radians
  this.camPitch = this.camPitchInit - this.yMdragTot * 1.0; // Vert drag in radians
  if(this.camYaw < -Math.PI) {  // keep yaw angle values between +/- PI
    this.camYaw += 2*Math.PI;   
    }
  else if(this.camYaw > Math.PI) {
    this.camYaw -= 2*Math.PI;
    }
  if(this.camPitch < -Math.PI/2) {    // don't let pitch go below -90deg 
    this.camPitch = -Math.PI/2;       // (-Z aiming direction)
    // We want y-axis mouse-dragging to set camera pitch. When pitch reaches its
    // lowermost limit of -PI/2, what's the mouse-drag value yMdragTot?
    // camPitch = camPitchInit - yMdragTot == -PI/2; add yMdragTot to both sides:
    //            camPitchInit == yMdragTot -PI/2;  then add PI/2 to both sides:
    //            (camPitchInit + PI/2) == yMdragTot;  
    // THUS ANY mouse-drag totals > than this amount will get ignored!
    this.yMdragTot = this.camPitchInit + Math.PI/2; // upper limit on yMdragTot.
    }
  else if(this.camPitch > Math.PI/2) {  // don't let pitch go above +90deg
    this.camPitch = Math.PI/2;          // (+Z aiming direction)
    }

  // update camera aim point: using spherical coords:
  this.camAimPt[0] = this.camEyePt[0] + Math.cos(this.camYaw)*Math.cos(this.camPitch);  // x
  this.camAimPt[1] = this.camEyePt[1] + Math.sin(this.camYaw)*Math.cos(this.camPitch);  // y
  this.camAimPt[2] = this.camEyePt[2] + Math.sin(this.camPitch); // z
  // update the 'up' vector too (pitch an additional +90 degrees)
  this.camUpVec[0] = Math.cos(this.camYaw)*Math.cos(this.camPitch + Math.PI/2); 
  this.camUpVec[1] = Math.sin(this.camYaw)*Math.cos(this.camPitch + Math.PI/2);
  this.camUpVec[2] = Math.sin(this.camPitch + Math.PI/2); 

  drawAll();		// we MOVED the camera -- re-draw everything!
}

GUIbox.prototype.mouseUp = function(mev) {
//=============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
//  That's not good for us -- convert to CVV coordinates instead:

//	console.log("called GUIbox.mouseUp(mev)");
	this.mouseToCVV(mev);               // CONVERT event to CVV coord system 
	this.isDrag = false;								// CLEAR our mouse-dragging flag, and
	// accumulate any final portion of mouse-dragging we did:
	this.xMdragTot += (this.xCVV - this.xMpos);
	this.yMdragTot += (this.yCVV - this.yMpos);
	this.xMpos = this.xCVV;             // RECORD this latest mouse-position.
	this.yMpos = this.yCVV;
/*//----- DIAGNOSTIC:
	console.log('GUIbox.MouseUp: xMdragTot,yMdragTot =', 
	              this.xMdragTot.toFixed(5), ',\t', 
	              this.yMdragTot.toFixed(5));
//----- END DIAGNOSTIC.
*/
	// display it on our webpage, too...
	document.getElementById('MouseAtResult').innerHTML = 
	'GUIbox.MouseUp(       ) at CVV coords x,y = ' + 
	              this.xMpos.toFixed(5) + ', ' + 
	              this.yMpos.toFixed(5);
}

GUIbox.prototype.mouseToCVV = function(mev) {
//==============================================================================
// CONVERT mouse event 'mev' from the given 'client' coordinates (left-handed
// pixel coordinates within the browser window, with origin at upper left) 
// to Canonical View Volume (CVV) coords GUIbox.xCVV, GUIbox.yCVV.
// Define these 'CVV' coords using the HTML-5 'canvas' object in our webpage:
// -- right handed (x increases rightwards, y increases upwards on-screen)
// -- origin at the center of the canvas object in the browser client area;
// -- GUIbox.xCVV== -1 at left edge of canvas, +1.0 at right edge of canvas;
// -- GUIbox.yCVV== -1 at bottom edge of canvas, +1 at top edge of canvas.

//	console.log("called GUIbox.mouseToCVV(mev)");
var rect = g_canvasID.getBoundingClientRect(); // get canvas corners in pixels
var xp = mev.clientX - rect.left;						   // x==0 at canvas left edge
var yp = g_canvasID.height -(mev.clientY -rect.top); 
   																							// y==0 at canvas bottom edge
//  console.log('GUIbox.mousetoCVV()--in pixel coords: xp,yp=\t',xp,',\t',yp);
	// Convert to Canonical View Volume (CVV) coordinates too:
  this.xCVV = (xp - g_canvasID.width/2)  /  // move origin to center of canvas and
              (g_canvasID.width/2);	  // normalize canvas to -1 <= x < +1,
	this.yCVV = (yp - g_canvasID.height/2) /  //							 -1 <= y < +1.
	            (g_canvasID.height/2);
}
/*
//------------These next 3 functions:
//				 	 mouseClick(), mouseDblClick(), canvasClick()
//------------are here for completeness -- remove/comment-out if you don't need them.
GUIbox.prototype.mouseClick = function(mev) {
//==============================================================================
// User made a single mouse-click in the client area of browser window.
//
// NOTE:  I don't use this, but you might want it in your program.
// I avoid using this.MouseClick() and this.MouseDblClick() because they combine 
// multiple events -- I prefer separate mousedown, mouseup, mousemove event
// handlers because they let me respond more adeptly to users' mouse actions,
// especially 'dragging' actions.

// console.log("called GUIbox.myMouseClick(mev).");


 // USEFUL TRICK: REPORT ALL FUNCTION ARGUMENTS
	console.log("GUIbox.myMouseClick()---------REPORT ALL ARGUMENTS!");
	for(var i=0; i< arguments.length; i++) {// LIST all function-call arguments:
		console.log('\targ[' + i + '] == ' + arguments[i]);
	}
	console.log("---------------------(end myMouseClick() argument list)");		

	// print contents of the 'mouseEvent' object passed as argument. See:
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent 
	console.log(   mev.altKey + ',\t'     + mev.ctrlKey + 
	         '\t== mev.altKey, ctrlKey');		// true/false
	console.log(   mev.shiftKey + ',\t'   + mev.metaKey +
	         '\t== mev.shiftKey, metaKey');	// true/false
	console.log(   mev.button   + ',\t\t' + mev.buttons +
	         '\t\t== ev.button, buttons');		// >1 button?
	console.log(   mev.clientX  + ',\t'   + mev.clientY +
	       '\t\t== mev.clientX,Y');	
	 				// Mouse pointer x,y pixel position in browser-window 'client' 
	 				// coordinates, with origin at UPPER LEFT corner, integer 
	 				// x increases rightwards, y increases DOWNWARDS, in pixel units.
	console.log( mev.movementX + ',\t\t'  + mev.movementY + 
	         '\t\t== mev.movementX,Y');

}

GUIbox.prototype.mouseDblClick = function(mev) {
//==============================================================================
// User made a double mouse-click in the client area of browser window.
//
// NOTE:  I don't use this, but you might want it in your program.
// I avoid using GUIbox.mouseClick() and GUIbox.mouseDblClick() because they 
// combine multiple events -- I prefer separate mousedown, mouseup, mousemove 
// event handlers because they let me respond more adeptly to users' mouse 
// actions, especially 'dragging' actions.

// console.log("called GUIbox.mouseDblClick(mev).");

	// print contents of the 'mouseEvent' object passed as argument. See:
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent 
	console.log(   mev.altKey + ',\t'     + mev.ctrlKey + 
	         '\t== mev.altKey, ctrlKey');		// true/false
	console.log(   mev.shiftKey + ',\t'   + mev.metaKey +
	         '\t== mev.shiftKey, metaKey');	// true/false
	console.log(   mev.button   + ',\t\t' + mev.buttons +
	         '\t\t== ev.button, buttons');		// >1 button?
	console.log(   mev.clientX  + ',\t'   + mev.clientY +
	       '\t\t== mev.clientX,Y');	
	 				// Mouse pointer x,y pixel position in browser-window 'client' 
	 				// coordinates, with origin at UPPER LEFT corner, integer 
	 				// x increases rightwards, y increases DOWNWARDS, in pixel units.
	console.log( mev.movementX + ',\t\t'  + mev.movementY + 
	         '\t\t== mev.movementX,Y');
}

GUIbox.prototype.canvasClick = function(mev) {
//=============================================================================
// Called when user CLICKS mouse button within the HTML-5 canvas
// 									(Which button?  console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS(!)  
//  That's not good for us -- convert to CVV coordinates instead:

//	console.log("called myCanvasClick(mev)");
	
	this.mouseToCVV(mev);							// convert to CVV coordinates:
	                                  // (result in this.xCVV, this.yCVV)
	// display it on our webpage, too...
	document.getElementById('MouseAtResult').innerHTML = 
	  'gui.canvasClick() at CVV coords xCVV,yCVV = ' + 
	  gui.xCVV.toFixed(5) + ', ' + gui.yCVV.toFixed(5);
///	console.log('gui.canvasClick(): xCVV,yCVV== ' + 
//              gui.xCVV.toFixed(5) + ', ' + gui.yCVV.toFixed(5));

}
*/
//=====================
//
//    KEYBOARD
//
//=====================


GUIbox.prototype.keyDown = function(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode (varies for different countries & alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
// The 'keypress' event captures the combined effects of alphanumeric keys and
// the SHIFT, ALT, and CTRL modifiers. It translates pressed keys into ordinary
// ASCII codes; you'll get uppercase 'S' if you hold shift & press the 's' key.
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
	document.getElementById('KeyPressResult').innerHTML = ''; // clear old result
			
	switch(kev.keyCode) {			
	// keycodes !=ASCII, but are very consistent for nearly all non-alphanumeric
	// keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'GUIbox.keyDown(): Left Arrow:keyCode='+kev.keyCode;
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'GUIbox.keyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'GUIbox.keyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'GUIbox.keyDown(): Down Arrow:keyCode='+kev.keyCode;
  		break;
		default:
			console.log('myKeyDown()--keycode=', kev.keyCode, ', charCode=', kev.charCode);
  		document.getElementById('KeyDownResult').innerHTML =
  			'GUIbox.keyDown()-- keyCode='+kev.keyCode;
			break;
	}
}

GUIbox.prototype.keyUp = function(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// You probably don't want to use this ('myKeyDown()' explains why). Instead, 
// you'll find myKeyPress() handles most or all keyboard-interface needs.

//	console.log('GUIbox.keyUp()--keyCode='+kev.keyCode+' released.');
}

GUIbox.prototype.keyPress = function(kev) {
//============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  Use this instead of keyDown(), keyUp() if
// you don't need to respond separately to key-down and key-up events.

// CLEAR on-screen display.
	myChar = kev.key.charAt(0); // get the char held in 'key' String

	switch(myChar) {
		//------------------Ray Tracing----------------------
		case 't':	
		case 'T':
			console.log("TRACE a new image!\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'GUIbox.keyPress() found t/T key. TRACE!';
      g_myScene.makeRayTracedImage(); // run the ray-tracer		
      rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
      rayView.reload();     // re-transfer VBO contents and texture-map contents
      drawAll();            // redraw BOTH viewports
			break;
		case 'c':
		case 'C':
//			console.log("CLEAR the ray-traced image buffer.\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'GUIbox.keyPress() found c/C key. CLEAR!';
			g_myPic.setTestPattern(1);      // solid orange.
			g_sceneNum = 1;       // (re-set onScene() button-handler, too)
      rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
      rayView.reload();     // re-transfer VBO contents and texture-map contents
      drawAll();
			break;
		//------------------WASD navigation-----------------
		case 'a':
		case 'A':
//			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'GUIbox.keyPress() found a/A key. Strafe LEFT!';
			this.camStrafe_L();
			break;
		case 'd':
		case 'D':
//			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyPressResult').innerHTML = 
			'GUIbox.keyPress() found d/D key. Strafe RIGHT!';
			this.camStrafe_R();
			break;
		case 's':
		case 'S':
//			console.log("s/S key: Move REV!\n");
			document.getElementById('KeyPressResult').innerHTML = 
			'GUIbox.keyPress() found s/S key. Move REV!';
			this.camRev();
			break;
		case 'w':
		case 'W':
//			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'GUIbox.keyPress() found w/W key. Move FWD!';
			this.camFwd();
			break;		
		default:
			console.log('GUIbox.keyPress(): Ignored key: '+myChar);
			// Report EVERYTHING about this pressed key in the webpage 
			// in the <div> element with id='Result':r 
  		document.getElementById('KeyPressResult').innerHTML = 
    'GUIbox.keyPress(): UNUSED char= '+ myChar 		 + ', keyCode= '+ kev.keyCode 	+ 
   			    ', charCode= '+ kev.charCode + ', shift= '	 + kev.shiftKey 	+ 
   			    ', ctrl= '		+ kev.shiftKey + ', altKey= ' + kev.altKey 		+ 
   			    ', metaKey= '	+ kev.metaKey;
			break;
	}
}


GUIbox.prototype.camFwd = function() {
//==============================================================================
// Move the camera FORWARDS in the aiming direction, but without changing
// the aiming direction. (If you're tilting up or down, you'll move up or down)
  var fwd = vec4.create();
  vec4.sub(fwd,this.camAimPt, this.camEyePt);   // Eye-to-Aim point vector
  vec4.normalize(fwd, fwd);                     // make it unit-length
                                                // (careful! normalize includes w)
  vec4.scale(fwd, fwd, this.camSpeed);          // scale length to set velocity
  vec4.add(this.camAimPt, this.camAimPt, fwd);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, fwd);
  drawAll();
}

GUIbox.prototype.camRev = function() {
//==============================================================================
// Move the camera BACKWARDS, in the reverse aiming direction (don't change aim)
  var rev = vec4.create();
  vec4.sub(rev,this.camEyePt, this.camAimPt);   // Aim-to-Eye point vector
  vec4.normalize(rev,rev);                      // make it unit-length
                                                // (careful! normalize includes w)
  vec4.scale(rev, rev, this.camSpeed);          // scale length to set velocity
  vec4.add(this.camAimPt, this.camAimPt, rev);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rev);
  drawAll();
}

GUIbox.prototype.camStrafe_L = function() {
//==============================================================================
// Move horizontally left-wards, perpendicular to aiming direction, without
// changing aiming direction or height above ground.
  // 'rtSide' vector points rightwards, perpendicular to aiming direction.
  var rtSide = vec4.fromValues(  Math.sin(this.camYaw), // x
                                -Math.cos(this.camYaw), // y
                                0,0); // z, w
  // rtSide is already unit length; no need to normalize.
  vec4.scale(rtSide, rtSide, -this.camSpeed);  // scale length to set velocity,
  vec4.add(this.camAimPt, this.camAimPt, rtSide);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rtSide);
  drawAll();
}

GUIbox.prototype.camStrafe_R = function() {
//==============================================================================
// Move horizontally left-wards, perpendicular to aiming direction, without
// changing aiming direction or height above ground.
  // 'rtSide' vector points rightwards, perpendicular to aiming direction.
  var rtSide = vec4.fromValues(  Math.sin(this.camYaw), // x
                                -Math.cos(this.camYaw), // y
                                0,0); // z,w  (vector, not point; w=0)
  // rtSide is already unit length; no need to normalize.
  vec4.scale(rtSide, rtSide, this.camSpeed);  // scale length to set velocity,
  vec4.add(this.camAimPt, this.camAimPt, rtSide);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rtSide);
  drawAll();
}
