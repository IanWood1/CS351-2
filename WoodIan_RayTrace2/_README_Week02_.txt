Week02 Starter Code:
=============================

Disk 25:
=======
1) RENAME: 'trace-supplement.js' --> JT_tracer-Lib.js'
2) REFACTOR: Our entire ray-tracer was crammed into just one function:
	 CGeom.makeRayTracedImage(), and it's getting unweildy. 
 
Let's re-organize; put our ray-tracer into a  'CScene' object so that we can:
	a) break it up into multiple methods/attributes within CScene as
		our ray-tracer gets more capable & complex, but
	b) keep the entire ray-tracer as one global object
	   declared above main(): e.g. var g_myScene = new CScene.
	c) This one global object (g_myScene) lets any function access any part 
		of the ray-tracer.  Now the GUIbox object can easily control
		both the ray-tracer and the webGL preview -- start by tying the
		webGL preview to the ray-tracer by calling its 'raylookAt()'
		fcn and its 'rayFrustum()' functions.  Later we can also
		connect the WebGL preview to the ray-tracer by accessing other
		CScene internal objects too (shapes & transforms, lights, 
		materials, etc.).
	d) As a CScene object contains an entire, complete ray-tracer, we can
		later create multiple ray-tracers working in parallel
		(e.g. for animation sequences)

2) Simple at first: move CImgBuf.makeRayTracedImage() contents to 
	CScene.makeRayTracedImage(imgBuf), and make sure 't' key calls it
	using using the global CImgBuf object g_myPic as the argument.
	(Make this work before making any other changes.)

3) Next, replace its important local vars with new CScene members, including:
	eyeRay --> this.eyeRay
	myCam  --> this.rayCam
	myGrid --> this.myGrid.

4) Next, add a new CCamera function: CCamera.setSize(nuXmax, nuYmax), so that
	the camera can gracefully adjust to other output image sizes.
	(easy -- we update xmax,ymax and re-calculate ufrac,vfrac).
	
5) Next, add a new CScene function: 'setImgBuf(nuImg)' to let us change the
	output-image buffer to any CImgBuf object of any size at any time. 
	(We will usually set it to our one global CImgBuf object 'g_myPic', but
	 but now we can change it, and/or re-size g_myPic). 
	To do this:
	--make a new CScene member 'imgBuf' set to nuImg (won't create any new
	   CImgBuf objects; 'imgBuf' is just a reference to the one we will fill)
	--adjust the CScene object's camera to match the new 'imgBuf' object,
	--adjust any other CScene members affected by output image size, if any.
	This lets us simplify:
	--Remove the CImgBuf argument to the CScene.makeRayTracedImage() fcn, &
	--Remove the CImgBuf argument to the CScene constructor
	(instead we will call setImgBuf() in the CScene.setScene() fcn below)
6) Add a new CScene function: 'setScene(num)'   to create a complete 3D scene 
	(CGeom objects, materials, lights, camera, etc) for viewing in both the 
	WebGL previewer and the ray-tracer.
	 num == 0: basic ground-plane grid;
	     == 1: ground-plane grid + round 'disc' object;
	     == 2: ground-plane grid + sphere
	     == 3: ground-plane grid + sphere + 3rd shape, etc.
Disk26:
=========
1) Unify our cameras, make them interactive:
 be sure that ONLY the GUIbox functions init(), mouseMove(), and keyPress() 
initialize and update/change all camera settings:
		INTRINSIC: gui.camFovy, gui.camAspect, gui.camNear
                EXTRINSIC: gui.camEyePt, gui.camAimPt, gui.camUpVec 
and that both the WebGL preview (VBObox0) & ray-tracing camera CScene.rayCam
get initialized to these values and updated when user revises camera settings.
(e.g. VBObox0.adjust()
  -- Hmmm. can't use the CScene constructor to initialize the ray-tracing cam
	because the GUIbox's camera settings (INTRINSIC, EXTRINSIC) aren't
	defined until after we call gui.init. 
  -- SOLUTION: let's re-name CScene.setScene() to CScene initScene(num), and
	call it in main() after we call gui.init().  Remove the call to
	setScene() inside the CScene constructor.
	-- we can call this function anytime we want to change our ray-tracer's
	3D scene (and it, in turn, can call scene-changing functions in the
	VBObox0 object that makes the WebGL preview image on left side). 
	-- we won't need to call this function until AFTER we call gui.init(),
	so we can put our ray-trace camera initializing here.
  -- SOLUTION: update the ray-trace camera parameters at the start of
	CScene.makeRayTracedImage() to ensure ray-tracer matches webGL preview.
2) Set a more reasonable default camera in GUIbox.init() try 45 deg. fovy.

3) Make a 'disk' object to CGeom by making a re-named copy of the 'grid' object:
--add CGeom.traceDisk() function that's identical to 'traceGrid(), except that
any hit-point > 'diskRad' distance from the origin is a 'miss'.  Put in some
different scaling for lines so the disk looks different from gnd-plane, and
put disk at z= zGrid/2.
--Extend CScene's makeRayTracedImage() to trace the disk first: use disk color 
if we 'hit', and if we miss, trace the ground-plane object to get it's color.
--In the WebGL preview in VBObox0, create a 'appendDisk()' function to draw
create vertices for a disk of lines centered at the origin; its transforms
will be matched to the ray-tracer's CGeom disk object.

4) Changed ray-tracer resolution to 512x512 (note: WebGL 1.0 texture-maps must
have power-of-two sizes. WebGL 2.0 escapes this limitation); changed ONLY the
declaration of g_myPic.  YES--calls to rayCam.setSize() keep ray-tracer.
Set resolution to 128x128 to avoid waiting too long for diagnostic printing
of each ray we trace.

5) *** pixelFlag: A GOOD IDEA *** In the CScene.makeRayTracedImage() function, 
	let's create 'g_myScene.pixelFlag' whose value = 1 for just one 
	selected pixel (e.g. pixel at middle of image), and is zero otherwise. 
	Use 'pixFlag' for diagnostic printing of 1 ray or pixel.
 
6) Add this.worldRay2model matrix (mat4) to CGeom constructor (see lecture 
notes C), and add raySetIdent(), rayTranslate(), rayRotate() and rayScale() fcns.
	In CGeom.traceGrid() and CGeom.traceDisk() functions, transform the
given inRay before use (e.g. transform the ray's origin point & dir vector).
Initialize worldRay2model matrix to identity; should have no effect on-screen,
but it DOES-- I get a weird blank line-color-only image.  WHY?

6a) Debug: be sure to use vec4.copy() function rather than assign operator.
	WHY? In Javascript, assign ('=') sets a reference; 
		glMatrix 'copy()' function does memory-to-memory copy.
	DON'T do this: var rayT = CRay.create(); rayT = eyeRay;  // now rayT
	is just a REFERENCE to eyeRay: change rayT & you change eyeRay too!
	Do this instead: var rayT = CRay.create(); vec4.copy(rayT,eyeRay);

6b) Debug:  -- FOUND A BIG ERROR! -- 
CCamera.eyePt is vec4 object, but we uses vec3 versions of eyePt in 
GUIbox.init() and elsewhere (e.g. CCamera) for simplicity. 
THAT'S THE TROUBLE---> In CCamera.makeEyeRay() the mixup between vec3 and vec4 
version of eyePt causes us to make an eyeRay with an invalid origin; 
'w' value was 'NaN', causing ray-tracing failures when we tried ANY transforms 
of the eye ray, even transform by identity matrix! 
To fix this and prevent any future vec3/vec4 confusions,
//========================================
LETS MAKE A PERMANENT RULE:
//========================================
  ***NO*** vec3s (except as local vars for local calculations!)
  *** Use vec4 for EVERYTHING! *****
  *** Surprise! vec4.normalize() includes 'w', but 'w'==0 for vectors.
  *** Surprise! vec3.cross() and vec3.dot() will accept vec4 arguments; they
	just IGNORE the 'w' values of all arguments & leave them unchanged.
//========================================
Global search for vec3 in GUIbox found we could eliminate ALL of them:
	--GUIbox camAimPt, camEyePt, camUpVec; change vec3->vec4; check usage.
	--GUIbox fwd, rev, vectors changed from vec3 to vec4
Global search for vec3 in VBObox1 found local vec3 'trans', needed to call the
	mat4.translate() matrix maker; otherwise all vec3s converted easily to vec4s

LATER: MAKE A glMatrix_Supp.js library that will:
===============================================================================
	--add 'pretty-printing' functions (e.g. printMe()) to all types;
	--add new versions of the mat4 translate(), rotate(), scale() fcns that
		will accept scalar args (x,y,z), others to accept vec4 args
		to augment the existing fcns that accept only vec3 args.
	--add new 'vec4' versions of dot and cross product & other fcns that
		will accept vec4 versions and check for errors 
		(e.g. dot, cross-product for vec4 args that have w=1, etc.)
	--explain (in opening comments) why vec3 usage is risky and (for us)
	   entirely unnecessary. If we use vec4 for EVERYTHING, and never use
	   vec3s, we never have compatibility problems & or unflagged errors
	   cause by point/vector confusions (incorrect or undefined w values).
	--The glMatrix library provides vec3 for those who need the highest-
	   possible efficiency, those who ask: "why process 4 numbers (vec4) 
						when my program needs only 3? 
	  OUR answer: because using 4 numbers for everything (w always defined)
	    can greatly reduce debugging time; its built-in error-checking has
	    a very modest cost in storage & computing; probably much less than
	    you think!  Don't assume it's too slow without trying it first; use
	    actual measurements. mixed vec3/vec4 code is faster! 
	    --Write your entire program the easy way, using only vec4; you'll 
		get it working far sooner than mixed vec3/vec4 code.  
	    --Is it too slow?  Measure it with a profiler; what part of the
		program eats the most time?  Slow WebGL programs usually bog
		down due to GPU setup: too-frequent creation/destruction of 
		shader programs & VBOs, or or poor use of the GPU's many shader 
		units (e.g. too many drawArray() calls for too few vertices)
	    	But if the vec3/vec4 processing in JS is the culprit, then
		and only then should you convert to mixed vec3/vec4 code. Find
		the most-heavily used vec4s and replace them with vec3s one-by
		one, testing each time.
YES!  Now it works! Now each CGeom object has its own, separately-applied
worldRay2model matrix.  I can re-position the disk without affecting the grid.

Disk27:
========
1) As we now have CGeom transforms that work properly, 
	--remove zGrid, zDisk members of CGeomn (so that disk & grid are 
		defined at z==0 plane) and replace them with transformations in 
		CScene.initScene().
	--change initial camera position in GUIbox.init to get a nice view of
		horizon & upright disk.
	--add a 45deg. rotation to the disk so it's not aligned with gnd-plane.

2) Update our WebGL preview (VBObox0 object) to draw grid & disk objects 
(already defined at z==0) using the same transforms we used for CGeom objects.

3) Our ray-tracing library is getting too big; too much scrolling!
Give each JavaScript prototype its own separate file:
	JT_tracer1-Camera.js (also holds CRay)
	JT_tracer2-Geom.js  (later: split out JT_trace3-shading.js )
	JT_tracer3-ImgBuf.js
	JT_tracer0-Scene.js  (also holds CHit, CHitList)
Later we'll want to separate the WebGL preview (VBObox) geometry-making files
(appendGroundGrid(), appendDisk(), appendSphere(), etc.) as a 'ShapeBox-Lib.js'
file as well.

4) GENERALIZE CGeom colors.  
Set different colors for the 'grid' and 'disk' objects -- reveals bug in 
makeRayTracedImage() color-selection method. Also, in main(), call 
makeRayTracedImage() on startup to show initial ray-traced img.

5) GENERALIZE: We need to create an ARRAY of CGeom objects in CScene instead 
of individually-declared CGeom objects such as CScene.myGrid, CScene.myDisk, etc.
	--Create 'item[]' array in CScene constructor; use this to hold all
	  CGeom objects in the scene, and fill that 'item[]' array in the
	  CScene.initScene(num) function.

6) REFACTOR: CScene.makeRayTracedImage() finds ray-colors in an ad-hoc way, 
and isn't suitable for large numbers of CGeom objects or large number of
CGeom shape-types. To upgrade, let us:
  --Create a 'CHit' prototype object to hold all useful ray/object
	intersection data. (What's in CHit? See assigned reading...), and
	update each 'trace' function (traceGrid(), traceDisk(), traceSphere(), etc.
	to accept a CHit object as an argument. Put all ray/CGeom intersection
	info in this CHit object instead of returning a scalar 0,1,-1 value.
   --First version: eliminate return values from traceGrid() and traceDisk(). 
	In CScene.makeRayTracedImage() create CHit objects hit0 and hit1; in
	each keep the 0,1,-1 value as CHit member 'hitNum' to help keep the 
	code changes simple, gradual, and testable at each step).
   --2nd version:  revise CGeom.traceGrid() & traceDisk() to replace local vars
	with CHit object members, one by one: 't0' value of hitpoint, the
	hit-point itself, the surface normal, the view ray, the model hit-point,
	and the color of the hit-point.  (SKIP 'hitItem' for now).
    -- NOW we need to compute surface-normals. Lecture Notes 'E' explain how.
	In CGeom object prototype, add a new mat4 member:  normal2world
	that transforms model-space surface-normal vectors (easy to find) into 
	the world-space surface-normal vectors we NEED for lighting calcs.
	--THEN in each of the CGeom ray-transform functions 
	(e.g. rayTranslate(), rayRotate(), rayScale(),setIdent()), after they
	find the new worldRay2model matrix, use it to find the normal matrix:
		[normal2world] = [worldRay2model]^T  . EASY!
	Then in traceDisk() function:
		-- we KNOW the model coords surface normal is (0,0,1), so
		-- compute CHit.surfNorm by transforming with CGeom.normal2world.
	And in traceGrid() function:
		-- we KNOW our ground-plane-grid at z=0 isn't getting transformed
		at all; world==model coord system, so its world-space surface
		normal vector is always CHit.surfNorm = (0,0,1);
    --Replace the ad-hoc color-finding method with a more-sensible one:
	find CHit object with the smallest 't0' (ray-length); use its color.


disk28:
========
REFACTOR cont'd:

7a) We've added two CHit objects: hit0 and hit1. We send hit0 as an argument 
into the traceGrid() function, and hit1 into traceDisk(), and will need yet-
another CHit object with each additional CGeom object. 
  ?? Then we have to search all those CHit objects to find the nearest one?!?!
!! That's ugly! and that's awkward!  
Instead, let's limit ourselves to just ONE CHit object:
   --Creat CHit.init() function that sets the CHit object to a 'default' hit-
	point in the sky, with impossibly-distant t0 (at g_t0_MAX; //1.23E16)
	on no CGeom item (hitGeom = null) and all members set to benign values. 
   --In CScene.makeRayTracedImage(), create a local CHit object 'myHit'.
	IMPORTANT:  EACH TIME we begin tracing for a new pixel, call myHit's 
	'init()' fcn; to 'clear' it -- to set all the 'default' values we will
	use if the ray we are about to trace hits nothing at all in the scene 
	(e.g. NONE of the CGeom shapes we keep in the CScene.item[] array).
   --Use this SAME myHit object as the CHit argument when we trace each of our
	CGeom objects, and
   --In each of the ray-tracing functions (CGeom.traceGrid(), CGeom.traceDisk(),
	CGeom.traceSphere(), CGeom.traceBox(), etc), update the contents of 
	that CHit object/argument ONLY when the ray-tracing finds a 'better' 
	hit-point, one that hits a CGeom surface in front of the camera (t0 >0) 
	and closer (smaller t0). (WHY? because this closer surface blocks the
	ray's ability to reach the previously-stored ray hit-point).
    --This 'keep the nearest hit' strategy ensures that myHit will always hold
	the ray's nearest hitpoint for all CGeom objects in the CScene.item[]
	stored in any order, viewed from any viewpoint.  If our CGeom objects
	are all opaque, then 'myHit' always describes the visible surface seen
	by each ray, so we use it to set the ray's color.

Do that first. Test. YES! It works!  

7b) In CScene.makeRayTracedImage() we find:
      this.item[0].traceGrid(this.eyeRay, myHit);   // trace ray to grid object
      this.item[1].traceDisk(this.eyeRay, myHit);   // trace ray to the disk object

We can't easily make a loop to 'trace' all the CGeom objects in the item[] 
array because every different CGeom shape may need to call a different one of
our shape-tracing functions.(e.g. traceGrid(), traceDisk(), traceBox(), 
traceSphere()...). 
UGLY SOLUTION: for each item[], use the CGeom.shapeSelect member in a big 
'switch()' statement to pick the right tracing function.  That's wasteful:
we execute the switch statement for every item for every ray for every pixel!

There's a better way: let CGeom object hold its own tracing function.
    --In the CGeom constructor:
	--ADD a new CGeom member var 'traceMe', and
	--Make a 'switch()' statement that uses CGeom.shapeSelect member to
	assign 'traceMe' the tracing function we need.  
		e.g. this.traceMe = traceDisk(myHit,inRay)
   --In CScene.makeRayTracedImage(), make a loop that calls the 'traceMe()'
	function for every CGeom element in the item[] array.

Try it. Test.  YES! it works!

