//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// BouncyBall.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//  BouncyBall01:---------------
//		--converted to 2D->4D; 
//		--3  verts changed to 'vCount' particles in one Vertex Buffer Object 
//			(VBO) in initVertexBuffers() function
//		--Fragment shader draw POINTS primitives as round and 'soft'
//			by using the built-in variable 'gl_PointCoord' that exists ONLY for
//			drawing WebGL's 'gl.POINTS' primitives, and no others.
//
// BouncyBall02:----------------
//		--modified animation: removed rotation, added better animation comments, 
//				replaced 'currentAngle' with 'timeStep'.
//		--added keyboard & mouse controls:from EECS 351-1 Winter 2014 starter-code 
//				'5.04jt.ControlMulti.html'  (copied code almost verbatim)
//				(for now, 1,2,3 keys just controls the color of our 3 particles) 
//		--Added 'u_runMode' uniform to control particle-system animation.
//
//	BouncyBall03:---------------
//		--Eliminated 'obsolete' junk commented out in BouncyBall02
//		--initVertexBuffer() reduced to just one round particle; 
//		--added 'uniform' vec4 'u_ballOffset' for that particle's position
//		--in draw(), computed that offset as described in class in Week 1.
//		--implement user controls: 
//				--r or R key to 'restart' the bouncy ball;
//				--p or P key to pause/unpause the bouncy ball;
//				--SPACE BAR to single-step the bouncy ball.

//	BouncyBall04.01:--------------- Improved By Teaching Assistant Jipeng Sun
//		--Remove the 'a_Position + u_ballShift' ball position way in BouncyBall03. 
// 			Instead, use a general 'a_Position' attribute to decide the ball position.
//		--Add an identity Mat4 matrix 'u_mvpMat' as a placeholder to help students
//			transform the 2D world to 3D.
//		--Maintain a Float32 Arrary s1 to record the ball position. Use 
//			'gl.bufferSubData' to update the vertex array buffer
//		--Allocate space for drawing rectangle in vertex buffer. Intentionally
//			leave the shader program unchanged to show why previous shader program
//			fail to display primitives other than POINTS.

//		NEXT TASKS:
//		--Convert to MKS units (meters-kilograms-seconds)
//		--Add 3D perspective camera; add user-controls to position & aim camera
//		--Add ground-plane (xy==ground; +z==up)
//		--extend particle system to 'bounce around' in a 3D box in world coords
//		--THE BIG TASK for Week 2: 'state-variable' formulation!
//			explore, experiment: how can we construct a 'state variable' that we
//			store and calculate and update on the graphics hardware?  How can we 
//			avoid transferring state vars from JavaScript to the graphics system
//			on each and every timestep?
//			-True, vertex shaders CAN'T modify attributes or uniforms (input only),
//			-But we CAN make a global array of floats, of structs ...
//				how could you use them?
//				can you use Vertex Buffer objects to initialize those arrays, then
//				use those arrays as your state variables?
//				HINT: create an attribute that holds an integer 'particle number';
//				use that as your array index for that particle... 
//
//==============================================================================
const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_WPOS     = 3;            // (why include w? for matrix transforms; 
                                    // for vector/point distinction


const MAXVAR      = 4;  // Size of array S1 uses to store its values.

// Vertex shader program:
var VSHADER_SOURCE =
 `precision mediump float;				// req'd in OpenGL ES if we use 'float'
  //
  uniform   int u_runMode;				// particle system state: 
																	// 0=reset; 1= pause; 2=step; 3=run
  attribute vec4 a_Position;
  uniform   mat4 u_mvpMat;
  varying   vec4 v_Color; 
  void main() {
    gl_PointSize = 10.0;
  	 gl_Position = u_mvpMat * a_Position; 
	// Let u_runMode determine particle color:
    if(u_runMode == 0) { 
		   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	// red: 0==reset
	  	 } 
	  else if(u_runMode == 1) {  
	    v_Color = vec4(1.0, 1.0, 0.0, 1.0); 	// yellow: 1==pause
	    } 
	  else if(u_runMode == 2) { 
	    v_Color = vec4(1.0, 1.0, 1.0, 1.0); 	// white: 2==step
      } 
	  else { 
	    v_Color = vec4(0.2, 1.0, 0.2, 1.0); 	// green: >3==run
			 } 
  }`;
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function. 

//==============================================================================
// Fragment shader program:
var FSHADER_SOURCE =
 `precision mediump float;
  varying vec4 v_Color; 
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); 
    if(dist < 0.5) { 
	  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);
	  } else { discard; }
  }`;
// --Each instance computes all the on-screen attributes for just one PIXEL.
// --Draw large POINTS primitives as ROUND instead of square.  HOW?
//   See pg. 377 in  textbook: "WebGL Programming Guide".  The vertex shaders' 
// gl_PointSize value sets POINTS primitives' on-screen width and height, and
// by default draws POINTS as a square on-screen.  In the fragment shader, the 
// built-in input variable 'gl_PointCoord' gives the fragment's location within
// that 2D on-screen square; value (0,0) at squares' lower-left corner, (1,1) at
// upper right, and (0.5,0.5) at the center.  The built-in 'distance()' function
// lets us discard any fragment outside the 0.5 radius of POINTS made circular.
// (CHALLENGE: make a 'soft' point: color falls to zero as radius grows to 0.5)?
// -- NOTE! gl_PointCoord is UNDEFINED for all drawing primitives except POINTS;
// thus our 'draw()' function can't draw a LINE_LOOP primitive unless we turn off
// our round-point rendering.  
// -- All built-in variables: http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables
// =========================


var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.

// Define just one 'bouncy ball' particle
var xposNow =  0.0;		var yposNow =  0.0;		var zposNow =  0.0;		
var xvelNow =  0.0;		var yvelNow =  0.0;		var zvelNow =  0.0;
var INIT_VEL = 0.15;		// adjusted by ++Start, --Start buttons.

// For keyboard, mouse-click-and-drag:		
var myRunMode = 3;	// particle system state: 0=reset; 1= pause; 2=step; 3=run

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var s1 =  new Float32Array([-0.9,-0.9,0.0,1.0]);

var mvpMat = new Matrix4();
var u_mvpMat_loc;

//var g_EyeX = 0.0; var g_EyeY = 0.0; var g_EyeZ = 1.0;        // eye position
//var g_LookX = 0.0; var g_LookY = 0.0; var g_LookZ = 0.0;


function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
	// You can do it this way:
	//	(textbooks' method found in cuon-utils.js; sets up debugging by default)
	//
	//	  gl = getWebGLContext(canvas);		
	//
	// Or this way (bypasses debugging help; may be a little faster)
	//
	//		gl = canvas.getContext("webgl");
	//
	// Or this way:
	//
	gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
	//
	// NOTE: this disables HTML-5's default screen-clearing, so that our draw() 
	// function will over-write previous on-screen results until we call the 
	// gl.clear(COLOR_BUFFER_BIT); function. )
  // Get the rendering context for WebGL

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
	// Register the Mouse & Keyboard Event-handlers-------------------------------
	// If users move, click or drag the mouse, or they press any keys on the 
	// the operating system will sense them immediately as 'events'.  
	// If you would like your program to respond to any of these events, you must 
	// tell JavaScript exactly how to do it: you must write your own 'event 
	// handler' functions, and then 'register' them; tell JavaScript WHICH 
	// events should cause it to call WHICH of your event-handler functions.
	//
	// First, register all mouse events found within our HTML-5 canvas:
	// when user's mouse button goes down call mouseDown() function,etc
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };				
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  					// NOTE! 'onclick' event is SAME as on 'mouseup' event
  					// in Chrome Brower on MS Windows 7, and possibly other 
  					// operating systems; use 'mouseup' instead.
  					
  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  // 			including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
  //			I find these most useful for arrow keys; insert/delete; home/end, etc.
  // The 'keyPress' events respond only to alpha-numeric keys, and sense any 
  //  		modifiers such as shift, alt, or ctrl.  I find these most useful for
  //			single-number and single-letter inputs that include SHIFT,CTRL,ALT.
	// END Mouse & Keyboard Event-Handlers-----------------------------------
	
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices into an array, transfer array contents to a 
  // Vertex Buffer Object created in the graphics hardware.
  var myVerts = initVertexBuffers(gl);
  if (myVerts < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.clearColor(0, 0, 0, 1);	  // RGBA color for clearing <canvas>
  
  // Get graphics system storage location of uniforms our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!u_runModeID) {
  	console.log('Failed to get u_runMode variable location');
  	return;
  }
	gl.uniform1i(u_runModeID, myRunMode);		// keyboard callbacks set 'myRunMode'

   u_mvpMat_loc = gl.getUniformLocation(gl.program, 'u_mvpMat');

   if(!u_mvpMat_loc) {
		console.log('Failed to get u_ModelMatrix variable location');
	return;
   }

	
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simple-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, and computing loads and respond to 
  //			on-screen window placement (skip battery-draining animation in any 
  //			window hidden behind others, or scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {
    timeStep = animate(timeStep);  // get time passed since last screen redraw.
//    draw(gl, myVerts, currentAngle, modelMatrix, u_ModelMatrix);  
  	draw(gl, myVerts, timeStep);	// compute new particle state at current time
    requestAnimationFrame(tick, canvas);  // Call us again 'at next opportunity',
    																			// within the 'canvas' HTML-5 element.
  };
  tick();
}

function animate(timeStep) {
//==============================================================================  
// How much time passed since we last updated the 'canvas' screen elements?
  var now = Date.now();	
  var elapsed = now - g_last;
  g_last = now;
  // Return the amount of time passed.
  return elapsed;
}

function draw(gl, n, timeStep) {
//==============================================================================  
 
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
	

																					// update particle system state?
  if(myRunMode>1) {									// 0=reset; 1= pause; 2=step; 3=run
		if(myRunMode==2) myRunMode=1;				// (if 2, do just one step and pause.)
		//=YES!=========================================
		// Make our 'bouncy-ball' move forward by one timestep:
		// What happens when I rearrange the ordering of these steps? Why?
		//	IT WORKS BEAUTIFULLY!
		// -- apply acceleration due to gravity to current velocity:
		yvelNow -= 0.01;
		// -- apply drag: attenuate current velocity:
		xvelNow *= 0.985;
		yvelNow *= 0.985;

		// -- move our particle using current velocity:
		xposNow += xvelNow;
		yposNow += yvelNow; 
		
			// This looks OK, BUT*** 
				// do you see what's wrong with it? we applied acceleration
				// to current velocity ==> yields 'next' velocity (!).  Then
				// we applied 'drag' to this 'next' velocity.  Then we applied
				// 'next' velocity to 'current' position to find 'next' position.
				//  But that's not what physics says we should do!
				//	Recall that for timestep 'h',
				//		nextVel = currentVel + h*acc
				//		nextPos = currentPos + h*(currentVel + 0.5*h*acc)
				// What happens if we do that instead?
				// Uh Oh.  The ball never stops bouncing! WHY?!?!
				//	SEE bouncyBall04.01BAD....
		// -- 'bounce' our ball off the walls at (0,0), (1.8, 1.8):
		if(      xposNow < -0.9 && xvelNow < 0.0
		) {		// bounce on left wall.
			xvelNow = -xvelNow;
			console.log("flipped Xvel:", xvelNow);
		}
		else if (xposNow > 0.9 && xvelNow > 0.0
		) {		// bounce on right wall
			xvelNow = -xvelNow;
			console.log("flipped Xvel:", xvelNow);
		}
		
		if(      yposNow < -0.9 && yvelNow < 0.0
		) {		// bounce on floor
			yvelNow = -yvelNow;
			console.log("flipped Yvel:", yvelNow); 
		}
		else if( yposNow > 0.9 && yvelNow > 0.0
		) {		// bounce on ceiling
			yvelNow = -yvelNow;
			console.log("flipped Yvel:", yvelNow);
		}
		//  -- hard limit on 'floor' keeps y position >= 0;
		if(yposNow < -0.9) yposNow = -0.9;
		//============================================
	}

	gl.uniform1i(u_runModeID, myRunMode);		// run/step/pause the particle system

	// Assign value to mvpMatrix
	mvpMat.setIdentity();
	//mvpMat.setLookAt(g_EyeX, g_EyeY, g_EyeZ,        // eye position
	//	g_LookX, g_LookY, g_LookZ,   // look-at point 
	//	0, 0, 1);    
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);

	// Update s1 with current position
	s1[PART_XPOS] = xposNow;
	s1[PART_YPOS] = yposNow;

	gl.bufferSubData(gl.ARRAY_BUFFER,  // specify the 'binding target': either
									   //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
									   // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
									0, // offset: # of bytes to skip at the start of the VBO before 
									   // we begin data replacement.
									s1); // Float32Array data source.)

    
  // Draw our VBO's contents:
  gl.drawArrays(gl.POINTS, 0, n);
  FSIZE = s1.BYTES_PER_ELEMENT; // # bytes per floating-point value (global!)
  gl.drawArrays(gl.LINE_LOOP,  1, 4); // This line doesn't work and doubt location wrong in vertex buffer?
  // Try to change the 'gl.LINE_LOOP' to 'gl.POINTS'. You will see four balls in each corner. The position
  // is CORRECT but something wrong with our shader program! Solutions in next BouncyBall04.02GOOD version!
  
  // Report mouse-drag totals.
	document.getElementById('MouseResult0').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
}

function initVertexBuffers(gl) {
//==============================================================================
// Set up all buffer objects on our graphics hardware.
 
  var vcount = 1;   // The number of vertices
  FSIZE = s1.BYTES_PER_ELEMENT; // # bytes per floating-point value (global!)

  // Create a buffer object in the graphics hardware: get its ID# 
  var vertexBufferID = gl.createBuffer();
  if (!vertexBufferID) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of one selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we need 
  //			for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of values we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);

 // Write data from our JavaScript array to graphics systems' buffer object:

// Vertice of the rectangle.
 var boxVerts = new Float32Array([
	-0.92, -0.92, 0.0, 1.0,
	-0.92,  0.92, 0.0, 1.0,
	 0.92,  0.92, 0.0, 1.0,
	 0.92, -0.92, 0.0, 1.0 ]) // LOOP for the floor
	
// Calculate the size of vertex array buffer
 var vertSize = s1.length + boxVerts.length;

 var myVerts = new Float32Array(vertSize);

 myVerts[PART_XPOS] = s1[PART_XPOS];
 myVerts[PART_YPOS] = s1[PART_YPOS];
 myVerts[PART_ZPOS] = s1[PART_ZPOS];
 myVerts[PART_WPOS] = s1[PART_WPOS];

 for(i = 0; i < boxVerts.length; i++){
	 myVerts[i+MAXVAR] = boxVerts[i];
 }

  gl.bufferData(gl.ARRAY_BUFFER, myVerts, gl.DYNAMIC_DRAW);

  // Get the ID# for the a_Position variable in the graphics hardware
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader 
  // with values from the buffer object chosen by 'gl.bindBuffer()' command.
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(a_PositionID, 
                          4,  // # of values in this attrib (1,2,3,4) 
                          gl.FLOAT, // data type (usually gl.FLOAT)
                          false,    // use integer normalizing? (usually false)
                          4*FSIZE,  // Stride: #bytes from 1st stored value to next 
                          0*FSIZE); // Offset; #bytes from start of buffer to 
                                    // 1st stored attrib value we will actually use.
  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(a_PositionID);
  return vcount;
}

//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
		document.getElementById('MouseResult1').innerHTML = 
	'myMouseDown() at CVV coords x,y = '+x+', '+y+'<br>';
};


function myMouseMove(ev,gl,canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev,gl,canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
	// Put it on our webpage too...
	document.getElementById('MouseResult1').innerHTML = 
	'myMouseUp(       ) at CVV coords x,y = '+x+', '+y+'<br>';
};


function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode (varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//	 The 'keypress' event captures the combined effects of alphanumeric keys and 
// the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get uppercase 'S' if you hold shift and press the 's' key.
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//

/*
	switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
	//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyResult').innerHTML =
  			' Left Arrow:keyCode='+ev.keyCode;
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			'   Up Arrow:keyCode='+ev.keyCode;
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			'Right Arrow:keyCode='+ev.keyCode;
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			' Down Arrow:keyCode='+ev.keyCode;
  		break;
		default:
			console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
  		document.getElementById('KeyResult').innerHTML =
  			'myKeyDown()--keyCode='+ev.keyCode;
			break;
	}
*/
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// You probably don't want to use this ('myKeyDown()' explains why); you'll find
// myKeyPress() can handle nearly all your keyboard-interface needs.
/*
	console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
*/
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  Use this instead of myKeyDown(), myKeyUp() if
// you don't need to respond separately to key-down and key-up events.

/*
	// Report EVERYTHING about this pressed key in the console:
	console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
												', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
												', altKey='   +ev.altKey   +
												', metaKey(Command key or Windows key)='+ev.metaKey);
*/
	myChar = String.fromCharCode(ev.keyCode);	//	convert code to character-string
	// Report EVERYTHING about this pressed key in the webpage 
	// in the <div> element with id='Result':r 
  document.getElementById('KeyResult').innerHTML = 
   			'char= ' 		 	+ myChar 			+ ', keyCode= '+ ev.keyCode 	+ 
   			', charCode= '+ ev.charCode + ', shift= '	 + ev.shiftKey 	+ 
   			', ctrl= '		+ ev.shiftKey + ', altKey= ' + ev.altKey 		+ 
   			', metaKey= '	+ ev.metaKey 	+ '<br>' ;
  			
  // update particle system state? myRunMode 0=reset; 1= pause; 2=step; 3=run
	switch(myChar) {
		case '0':	
			myRunMode = 0;			// RESET!
			break;
		case '1':
			myRunMode = 1;			// PAUSE!
			break;
		case '2':
			myRunMode = 2;			// STEP!
			break;
		case '3':							// RUN!
			myRunMode = 3;
			break;
		case 'R':  // HARD reset: position AND velocity.
		  myRunMode = 0;			// RESET!
			xposNow =  0.0;				yposNow =  0.0;				zposNow =  0.0;	
			xvelNow =  INIT_VEL;	yvelNow =  INIT_VEL;	zvelNow =  0.0;
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			if(xvelNow > 0.0) xvelNow += INIT_VEL; else xvelNow -= INIT_VEL;
			if(yvelNow > 0.0) yvelNow += INIT_VEL; else yvelNow -= INIT_VEL;
			break;	
		case 'p':
		case 'P':			// toggle pause/run:
			if(myRunMode==3) myRunMode = 1;		// if running, pause
									else myRunMode = 3;		// if paused, run.
			break;
		case ' ':			// space-bar: single-step
			myRunMode = 2;
			break;
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			break;
	}
}

function onPlusButton() {
//==============================================================================
	INIT_VEL *= 1.2;		// increase
	console.log('Initial velocity: '+INIT_VEL);
}

function onMinusButton() {
//==============================================================================
	INIT_VEL /= 1.2;		// shrink
	console.log('Initial velocity: '+INIT_VEL);
}
