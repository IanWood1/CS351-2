Week03_RESCUE README.txt
=============================
Try 'change scene' button.

This is more than 'starter code'; it's 'rescue code' -- you can ignore it if you 
successfully completed the tasks I asked you to do in your Week 2 Ray-Tracer.

However, 
--if you are flummoxed in your attempts to ray-trace transformed disks
and 
--if your 'CGeom.traceSphere()' function isn't working right due to confusion
about the half-chord intersection method (lecture notes D),
--if you haven't had time to improve your WebGL preview to show disks, spheres, etc.
--and if you're worried that you're running out of time before Demo Day,
then this code is for you!

1) use a file-comparison tool 
(e.g. built-in VSCode file-compare feature (https://www.mytecbits.com/microsoft/dot-net/compare-contents-of-two-files-in-vs-code), or WinMerge (my favorite graphical Windows-based free tool), or 
Apple's FileMerge or opendiff tools built into Xcode, or anything you like:
https://en.wikipedia.org/wiki/Comparison_of_file_comparison_tools )
to COMPARE earlier versions with this 'rescue' code.

2) You'll find that:
	a) the html file is identical except for JS filenames, but
	b) The files were re-organized; one class/prototype per file, and
	c) It traces transformed disks and spheres, and
	d) It draws them as 'wireframe' objects in the webGL preview, and
	e) we added 'vertical strafe' directions up/down with q, e keys.

3) You can now work on shading -
-- first, work to add simple shadows 
	(create a light source; trace ray to it in ’findShade(); 
	use a ‘shadow’ color if the ray is blocked) 
-- next, add Phong lighting; makes everything pretty!
-- next, add mirror-like reflection (recursive ray-tracing)...

