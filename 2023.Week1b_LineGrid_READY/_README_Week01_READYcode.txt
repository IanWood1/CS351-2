Week01_RESCUE README.txt
=============================
Try 'change scene' button.
Try the ‘t’ key.
Try re-sizing your browser window (try tall/skinny and short/wide).

This is ‘ready’ code -- it extends the raw Week01 'starter code' to create
our very first ray-traced image.  Please compare the week01 ‘starter’ code
to this ‘ready’ code, and then complete it:

TRY IT:
Can you make the ray-traced image on the right match the WebGL preview on the left?

1) use a file-comparison tool 
(e.g. WinMerge (my favorite graphical Windows-based free tool), or 
Apple's FileMerge or opendiff tools built into Xcode, or anything you like:
https://en.wikipedia.org/wiki/Comparison_of_file_comparison_tools )
to COMPARE the week01 starter code and this 'rescue' code.

You'll find that:
a) the html file is identical except for JS filenames 
(appended _READY) and the fact that I now include the 
	'Week01_traceSupplement.js' file. 
b) This added file holds all the ray-tracing objects I recommend, including:
 -- CImgBuf object (holds RGB image in both a floating-point & integer array), 
 -- CRay object (holds one ray you're using for ray-tracing)
 -- CCamera (ray-tracing camera, mostly complete), and 
 -- CGeom object (ray-traced shape-description object; you'll make one of 
	these for each 3D shape (later you'll make an array of these)
 -- CScene object (commented out; at bottom) This will eventually hold all the 
	mechanisms of your ray-tracer in one nice neat global object.

2) Use the file-comparison tool to look at the Week01_lineGrid_READY.js file.  
Start here: it contains our main() function, but above main() it also contains 
the global variables for each major part of our program, including:
 -- global object 'gl', the one-and-only webGL rendering context made in main(),
 -- global objects 'preView' and 'rayView', our 2 VBObox objects 
	(find their prototypes in JT_VBObox-Lib_RESCUE.js) 
	that hold what we need for drawing two halves of our on-screen display,
 -- global object 'gui', our one-and-only GUIbox object which holds everything 
	we need & use for graphical user interface, such as mouse and keyboard 
	callbacks (find its prototypes in JT_GUIbox-Lib_RESCUE.js).

3) Starting from main(), note how we initialize everything, then draw the 
on-screen image ONCE. There is no animation loop that tirelessly re-draws the
screen, nor should there be: instead we only re-draw (e.g. call drawAll() ) 
when user interactions need to update the browser window due to re-size, user 
pressing the 'T' key or others, by dragging the mouse, etc. (see GUIbox methods)...

