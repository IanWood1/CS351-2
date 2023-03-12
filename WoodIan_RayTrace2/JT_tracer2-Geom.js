//=============================================================================
// Allowable values for CGeom.shapeType variable.  Add some of your own!
const RT_GNDPLANE = 0;    // An endless 'ground plane' surface in xy plane
const RT_DISK     = 1;    // a circular disk in xy plane, radius 'diskRad'
const RT_SPHERE   = 2;    // A sphere, radius 1, centered at origin.
const RT_BOX      = 3;    // An axis-aligned cube, corners at (+/-1, +/-1,+/-1)
const RT_CYLINDER = 4;    // A cylinder with user-settable radius at each end
                        // and user-settable length.  radius of 0 at either
                        // end makes a cone; length of 0 with nonzero
                        // radius at each end makes a disk.
const RT_TRIANGLE = 5;    // a triangle with 3 vertices.
const RT_BLOBBY   = 6;    // Implicit surface:Blinn-style Gaussian 'blobbies'.

function CGeom(shapeSelect) {
//=============================================================================
// Generic object for a geometric shape, including its worldRay2model matrix
// used to transform any ray we wish to trace against it.
// Each instance describes just one shape, but you can select from several 
// different kinds of shapes by setting the 'shapeType' member.  CGeom can 
// describe ANY shape, including sphere, box, cone, quadric, etc. and it holds 
// all/any variables needed for each shapeType.
//
// Advanced Version: try it!
//        Ray tracing lets us position and distort these shapes in a new way;
// instead of transforming the shape itself for 'hit' testing against a traced
// ray, we transform the 3D ray by the matrix 'world2model' before a hit-test.
// This matrix simplifies our shape descriptions, because we don't need
// separate parameters for position, orientation, scale, or skew.  For example,
// RT_SPHERE and RT_BOX need NO parameters--they each describe a unit sphere or
// unit cube centered at the origin.  To get a larger, rotated, offset sphere
// or box, just set the parameters in world2model matrix. Note that you can 
// scale the box or sphere differently in different directions, forming 
// ellipsoids for the unit sphere and rectangles (or prisms) from the unit box.
	if(shapeSelect == undefined) shapeSelect = RT_GNDPLANE;	// default
	this.shapeType = shapeSelect;
	
	// Get clever:  create 'traceMe()' function that calls the tracing function
	// needed by the shape held in this CGeom object.
	switch(shapeSelect) {
	  case RT_GNDPLANE:
	    this.traceMe = function(inR,hit) { this.traceGrid(inR,hit);   }; break;
	  case RT_DISK:
	    this.traceMe = function(inR,hit) { this.traceDisk(inR,hit);   }; break;
	  case RT_SPHERE:
	    this.traceMe = function(inR,hit) { this.traceSphere(inR,hit); }; break;
	  case RT_BOX:
	    this.traceMe = function(inR,hit) { this.traceBox(inR,hit);    }; break;
	  case RT_CYLINDER:
	    this.traceMe = function(inR,hit) { this.traceCyl(inR,hit);    }; break;
	  case RT_TRIANGLE:
	    this.traceMe = function(inR,hit) { this.traceTri(inR,hit);    }; break;
	  case RT_BLOBBY:
	    this.traceMe = function(inR,hit) { this.traceBlobby(inR,hit); }; break;
	  default:
	    console.log("CGeom() constructor: ERROR! INVALID shapeSelect:", shapeSelect);
	    return;
	    break;
	}
	
	// Ray transform functions: setIdent, rayTranslate(), rayRotate(), rayScale()
	// sets values for BOTH of these matrices
	this.worldRay2model = mat4.create();  // the matrix used to transform rays 
	                                  // from world coord sys to model coord sys;
	                                  // This matrix sets shape size, position,
	                                  // orientation, and squash/stretch amount.
  this.normal2world = mat4.create();    // == worldRay2model^T
                                    // This matrix transforms MODEL-space
                                    // normals (where they're easy to find)
                                    // to WORLD-space coords (where we need
                                    // them for lighting calcs.)
	// 'Line-grid' defaults:------------------------------------------------------
	this.xgap = 1.0;	// line-to-line spacing
	this.ygap = 1.0;
	this.lineWidth = 0.1;	// fraction of xgap used for grid-line width
	this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);  // RGBA green(A==opacity)
	this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);  // near-white
	this.skyColor = vec4.fromValues( 0.3,1.0,1.0,1.0);  // cyan/bright blue
	
	// 2D Disk defaults:----------------------------------------------------------
	// uses many of the same parameters as Ground-plane grid, except:
	this.diskRad = 1.5;   // radius of disk centered at origin
	// Disk line-spacing is set to 61/107 xgap,ygap  (ratio of primes)
	// disk line-width is set to 3* lineWidth, and it swaps lineColor & gapColor.
}

CGeom.prototype.setIdent = function() {
//==============================================================================
// Discard worldRay2model contents, replace with identity matrix (world==model).
  mat4.identity(this.worldRay2model);  
  mat4.identity(this.normal2world);
}

CGeom.prototype.rayLoadIdentity = function() {
  this.worldRay2model[0] = 1.0; this.worldRay2model[1] = 0.0; this.worldRay2model[2] = 0.0; this.worldRay2model[3] = 0.0;
  this.worldRay2model[4] = 0.0; this.worldRay2model[5] = 1.0; this.worldRay2model[6] = 0.0; this.worldRay2model[7] = 0.0;
  this.worldRay2model[8] = 0.0; this.worldRay2model[9] = 0.0; this.worldRay2model[10] = 1.0; this.worldRay2model[11] = 0.0;
  this.worldRay2model[12] = 0.0; this.worldRay2model[13] = 0.0; this.worldRay2model[14] = 0.0; this.worldRay2model[15] = 1.0;
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.rayTranslate = function(x,y,z) {
//==============================================================================
//  Translate ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'offV3' vector amount
  var a = mat4.create();   // construct INVERSE translation matrix [T^-1]
  a[12] = -x; // x  
  a[13] = -y; // y
  a[14] = -z; // z.
  //print_mat4(a,'translate()');
  mat4.multiply(this.worldRay2model,      // [new] =
                a, this.worldRay2model);  // =[T^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.rayRotate = function(rad, ax, ay, az) {
//==============================================================================
// Rotate ray-tracing's current drawing axes (defined by worldRay2model) around
// the vec3 'axis' vector by 'rad' radians.
// (almost all of this copied directly from glMatrix mat4.rotate() function)
    var x = ax, y = ay, z = az,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON) { 
      console.log("CGeom.rayRotate() ERROR!!! zero-length axis vector!!");
      return null; 
      }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(-rad);     // INVERSE rotation; use -rad, not rad
    c = Math.cos(-rad);
    t = 1 - c;
    // Construct the elements of the 3x3 rotation matrix. b_rowCol
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;
    var b = mat4.create();  // build 4x4 rotation matrix from these
    b[ 0] = b00; b[ 4] = b01; b[ 8] = b02; b[12] = 0.0; // row0
    b[ 1] = b10; b[ 5] = b11; b[ 9] = b12; b[13] = 0.0; // row1
    b[ 2] = b20; b[ 6] = b21; b[10] = b22; b[14] = 0.0; // row2
    b[ 3] = 0.0; b[ 7] = 0.0; b[11] = 0.0; b[15] = 1.0; // row3
//    print_mat4(b,'rotate()');
    mat4.multiply(this.worldRay2model,      // [new] =
                  b, this.worldRay2model);  // [R^-1][old]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world

}

CGeom.prototype.rayScale = function(sx,sy,sz) {
//==============================================================================
//  Scale ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'scl' vector amount
  if(Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sz) < glMatrix.GLMAT_EPSILON) {
     console.log("CGeom.rayScale() ERROR!! zero-length scale!!!");
     return null;
     }
  var c = mat4.create();   // construct INVERSE scale matrix [S^-1]
  c[ 0] = 1/sx; // x  
  c[ 5] = 1/sy; // y
  c[10] = 1/sz; // z.
//  print_mat4(c, 'scale()')'
  mat4.multiply(this.worldRay2model,      // [new] =
                c, this.worldRay2model);  // =[S^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.traceGrid = function(inRay, myHit) {
//==============================================================================
// Find intersection of CRay object 'inRay' with grid-plane at z== 0, and
// if we find a ray/grid intersection CLOSER than CHit object 'hitMe', update
// the contents of 'hitMe' with all the new hit-point information.
// NO return value. 
// (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
// Set CHit.hitNum ==  -1 if ray MISSES the disk
//                 ==   0 if ray hits the disk BETWEEN lines
//                 ==   1 if ray hits the disk ON the lines  

// HOW TO TRACE A GROUND-PLANE--------------------------------------------------
// 1) we parameterize the ray by 't', so that we can find any point on the
// ray by:
//          Ray(t) = ray.orig + t*ray.dir
// To find where the ray hit the plane, solve for t where Ray(t) = x,y,zGrid:
// Re-write:
//      Ray(t0).x = ray.orig[0] + t0*ray.dir[0] = x-value at hit-point (UNKNOWN!)
//      Ray(t0).y = ray.orig[1] + t0*ray.dir[1] = y-value at hit-point (UNKNOWN!)
//      Ray(t0).z = ray.orig[2] + t0*ray.dir[2] = zGrid    (we KNOW this one!)
//
//  solve for t0:   t0 = (zGrid - ray.orig[2]) / ray.dir[2]
//  From t0 we can find x,y value at the hit-point too.
//  Wait wait wait --- did we consider ALL possibilities?  No, not really:
//  If t0 <0, we can only hit the plane at points BEHIND our camera;
//  thus the ray going FORWARD through the camera MISSED the plane!.
//
// 2) Our grid-plane exists for all x,y, at the value z=zGrid, and is covered by
//    a grid of lines whose width is set by 'linewidth'.  The repeated lines of 
//    constant-x have spacing (repetition period) of xgap, and the lines of
//    constant-y have spacing of ygap.
//    GIVEN a hit-point (x,y,zGrid) on the grid-plane, find the color by:
//         if((x/xgap) has fractional part < linewidth  *OR*
//            (y/ygap) has fractional part < linewidth), you hit a line on
//            the grid. Use 'lineColor'.
//        otherwise, the ray hit BETWEEN the lines; use 'gapColor'

//------------------ Transform 'inRay' by this.worldRay2model matrx to make rayT
  var rayT = new CRay();    // create a local transformed-ray variable.
  vec4.copy(rayT.orig, inRay.orig);   // copy (if we're not going to transform)
  vec4.copy(rayT.dir, inRay.dir);
/* 
// OR, if we are going to transform our ground-grid (unusual!):
  vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
  vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
*/
  // Now use transformed ray 'rayT' for our ray-tracing.
//------------------End ray-transform.

  // find ray/grid-plane intersection: t0 == value where ray hits plane at z=0.
  var t0 = (-rayT.orig[2])/rayT.dir[2];    
    
  // The BIG QUESTION:  ? Did we just find a hit-point for inRay 
  // =================  ? that is CLOSER to camera than myHit?
  if(t0 < 0 || t0 > myHit.t0) {  
    return;   // NO. Hit-point is BEHIND us, or it's further away than myHit.
              // Leave myHit unchanged. Don't do any further calcs.   Bye!
  }
  // YES! we found a better hit-point!
  // Update myHit to describe it------------------------------------------------
  myHit.t0 = t0;             // record ray-length, and
  myHit.hitGeom = this;      // record the CGeom object that we hit, and
  // Compute the x,y,z,w point where rayT hit the grid-plane in MODEL coords:
                  // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
  vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
  // (this is ALSO the world-space hit-point, because we have no transforms)
  vec4.copy(myHit.hitPt, myHit.modelHitPt);   // copy world-space hit-point.
/* or if you wish:
// COMPUTE the world-space hit-point:
  vec4.scaleAndAdd(myHit.HitPt, inRay.orig, inRay.dir, myHit.t0);
*/
  vec4.negate(myHit.viewN, inRay.dir);     // reversed, normalized inRay.dir:
  // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
  // inRay MUST be a vector, not a point, to ensure w sign change has no effect)
  vec4.normalize(myHit.viewN, myHit.viewN); // make view vector unit-length.
  vec4.set(myHit.surfNorm, 0,0,1,0);    // surface normal FIXED at world +Z.
/* or if you wish:
  // COMPUTE the surface normal:  (needed if you transformed the gnd-plane grid)
  // in model space we know it's always +z,
  // but we need to TRANSFORM the normal to world-space, & re-normalize it.
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
  vec4.normalize(myHit.surfNorm, myHit.surfNorm);
*/

  // FIND COLOR at model-space hit-point---------------------------------                        
  var loc = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;    // keep >0 to form double-width line at yaxis.
//console.log("loc",loc, "loc%1", loc%1, "lineWidth", this.lineWidth);
  if(loc%1 < this.lineWidth) {    // hit a line of constant-x?
    myHit.hitNum = 1;       // yes.
    return;
  }
  loc = myHit.modelHitPt[1] / this.ygap;     // how many 'ygaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;    // keep >0 to form double-width line at xaxis.
  if(loc%1 < this.lineWidth) {   // hit a line of constant-y?
    myHit.hitNum = 1;       // yes.
    return;
  }
  myHit.hitNum = 0; // No.
  return;
}

CGeom.prototype.traceDisk = function(inRay, myHit) { 
//==============================================================================
// Find intersection of CRay object 'inRay' with a flat, circular disk in the
// xy plane, centered at the origin, with radius this.diskRad,
// and store the ray/disk intersection information on CHit object 'hitMe'.
// NO return value. 
// (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
// Set CHit.hitNum ==  -1 if ray MISSES the disk
//                 ==   0 if ray hits the disk BETWEEN lines
//                 ==   1 if ray hits the disk ON the lines
//
//  Uses the EXACT SAME METHOD found in this.traceGrid(), EXCEPT:
//  if the hit-point is > diskRad distance from origin, the ray MISSED the disk.
//  The disk's parameters are modified versions of Ground-plane grid params:

	this.diskRad = 2.0;   // Set radius of disk centered at origin (default: 1.5)
	// Disk line-spacing is set to 61/107 xgap,ygap  (ratio of primes);
	var xdgap = this.xgap * 61/107;
	var ydgap = this.ygap * 61/107;
	// disk line-width is set to 3* lineWidth, and it swaps lineColor & gapColor.
	var dwid = 0.3;//this.lineWidth*3.0;

//------------------ NEW!! transform 'inRay' by this.worldRay2model matrix;
  var rayT = new CRay();    // create a local transformed-ray variable.
  vec4.copy(rayT.orig, inRay.orig);   // memory-to-memory copy. 
  vec4.copy(rayT.dir, inRay.dir);
                            // (DON'T do this: rayT = inRay; // that sets rayT
                            // as a REFERENCE to inRay. Any change to rayT is
                            // also a change to inRay (!!).
  vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
  vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
//------------------End ray-transform.
  // find ray/disk intersection: t0 == value where ray hits the plane at z=0.
  var t0 = -rayT.orig[2]/rayT.dir[2];   // (disk is in z==0 plane)  

  // The BIG QUESTION:  ? Did we just find a hit-point for inRay 
  // =================  ? that is CLOSER to camera than myHit?
  if(t0 < 0 || t0 > myHit.t0) {  
    return;   // NO. Hit-point is BEHIND us, or it's further away than myHit.
              // Leave myHit unchanged. Don't do any further calcs.   Bye!
  }
  // OK, so we hit the plane at (model space) z==0;
  // ? But did we hit the disk itself?
  // compute the x,y,z,w point where inRay hit the grid-plane in MODEL coords:
  // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
  var modelHit = vec4.create();
  vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0); 
  if(modelHit[0]*modelHit[0] + modelHit[1]*modelHit[1]  
        > this.diskRad*this.diskRad)  {     // ?Did ray hit within disk radius?
    return;   // NO.  Ray MISSED the disk.
              // Leave myHit unchanged. Don't do any further calcs. Bye!
  }
  // YES! we found a better hit-point!
  // Update myHit to describe it------------------------------------------------
  myHit.t0 = t0;             // record ray-length, and
  myHit.hitGeom = this;      // record the CGeom object that we hit, and
  vec4.copy(myHit.modelHitPt, modelHit);  // record the model-space hit-pt, and
  // compute the x,y,z,w point where inRay hit the grid-plane in WORLD coords:
  vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
  // set 'viewN' member to the reversed, normalized inRay.dir vector:
  vec4.negate(myHit.viewN, inRay.dir);     
  // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
  // inRay MUST be a vector, not a point, to ensure w sign change has no effect)
  vec4.normalize(myHit.viewN, myHit.viewN); // ensure a unit-length vector.
  // Now find surface normal: 
  // in model space we know it's always +z,
  // but we need to TRANSFORM the normal to world-space, & re-normalize it.
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
  vec4.normalize(myHit.surfNorm, myHit.surfNorm);
  
//-------------find hit-point color:----------------
  var loc = myHit.modelHitPt[0] / xdgap;     // how many 'xdgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;    // keep >0 to form double-width line at yaxis.
  if(loc%1 < dwid) {    // hit a line of constant-x?
    myHit.hitNum =  0;       // yes.
    return;
  }
  loc = myHit.modelHitPt[1] / ydgap;         // how many 'ydgaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;    // keep >0 to form double-width line at xaxis.
  if(loc%1 < dwid) {   // hit a line of constant-y?
    myHit.hitNum = 0;       // yes.
    return;
  }
  myHit.hitNum = 1;         // No.
  return;
}
