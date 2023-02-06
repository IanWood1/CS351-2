class ParticlesVBO {
    constructor(gl, particleArray) {
        this.VSHADER_SOURCE =
        `precision mediump float;					// req'd in OpenGL ES if we use 'float'
        //
        uniform   int u_runMode; 					// particle system state: 
                                                                              // 0=reset; 1= pause; 2=step; 3=run
        attribute vec4 a_Position;
        uniform   mat4 u_mvpMat;
        varying   vec4 v_Color; 
        void main() {
          gl_PointSize = 3.0;
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
              v_Color = vec4(0.0, 0.0, 0.9, 1.0); 	// green: >3==run
                   } 
        }`;

        this.FSHADER_SOURCE =
            `precision mediump float; 
            varying vec4 v_Color;
            uniform int u_isBall; 
            void main() {
            if(u_isBall > 0){ 
                float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); 
                if(dist < 0.5) { 
                        gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);
                    } 
                    else { discard; }
                } 
            else { // NOT drawing a ball; just use vertex color.
                gl_FragColor = v_Color; 
                }
            }`;

        this.vboContents = particleArray;
        this.vboVerts = particleArray.length / 4;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
        this.vboBytes = this.vboContents.length * this.FSIZE;
        this.vboStride = this.vboBytes / this.vboVerts;
        this.vboOffset = 0;

        this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE, this.FSHADER_SOURCE);
        if (!this.shaderLoc) {
            console.log(this.constructor.name + '.constructor() failed to create executable Shaders on the GPU. Bye!');
            return;
        }

        gl.program = this.shaderLoc;
        this.vboLoc = gl.createBuffer();
        if (!this.vboLoc) {
            console.log(this.constructor.name + '.constructor() failed to create VBO in GPU. Bye!');
            return;
        }
        this.mvp_Mat = new Matrix4();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);

        
        gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.DYNAMIC_DRAW);
        
        this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
        if (this.a_PosLoc < 0) {
            console.log(this.constructor.name + '.constructor() failed to get the GPU storage location of a_Position');
            return;
        }

        this.u_isBallLoc = gl.getUniformLocation(this.shaderLoc, 'u_isBall');
        if(!this.u_isBallLoc) {
            console.log('Failed to get u_isBallLoc variable location');
            return;
        }

        this.u_runMode = gl.getUniformLocation(this.shaderLoc, 'u_runMode');
        if(!this.u_runMode) {
            console.log('Failed to get u_runMode variable location');
            return; 
        }

        this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
        if (!this.u_mvpMatLoc) {
            console.log(this.constructor.name + '.constructor() failed to get GPU location for u_mvpMat uniform');
            return;
        }
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 4*this.FSIZE, this.vboOffset);
    }

    switchToMe(gl) {
        gl.useProgram(this.shaderLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 4*this.FSIZE, this.vboOffset);
        gl.enableVertexAttribArray(this.a_PosLoc);
    }

    isReady() {
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
            console.log(this.constructor.name + '.isReady() false: shader program at this.shaderLoc not in use!');
            return false;
        }
        if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + '.isReady() false: vbo at this.vboLoc not in use!');
            return false;
        }
        return true;
    }

    reload(gl, particleArray, mvpMat) {
        if (particleArray.length != this.vboContents.length){
            console.log('ERROR! ParticlesVBO.reload() received new particle array of different size!'
            + '\n\told array size: ' + this.vboContents.length + '; new array size: ' + particleArray.length);
        }
        this.vboContents = particleArray;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vboContents);
        this.mvp_Mat.setIdentity();
        this.mvp_Mat.set(mvpMat);
        gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvp_Mat.elements);
        gl.uniform1i(this.u_isBallLoc, true);		// keyboard callbacks set 'myRunMode'
        gl.uniform1i(this.u_runMode, myRunMode);	// keyboard callbacks set 'myRunMode'

    }

    draw(gl) {
        if (!this.isReady()) {
            console.log('ERROR! before' + this.constructor.name + '.draw() call you needed to call this.switchToMe()!!');
        }
        gl.drawArrays(gl.POINTS, 0, this.vboVerts);
    }



}

class FireVBO {
    constructor(gl, particleArray) {
        this.VSHADER_SOURCE =
        `precision mediump float;					// req'd in OpenGL ES if we use 'float'
        //
        uniform   int u_runMode; 					// particle system state: 
                                                                              // 0=reset; 1= pause; 2=step; 3=run
        attribute vec4 a_Position;
        attribute vec3 a_Color;
        uniform   mat4 u_mvpMat;
        varying   vec3 v_Color; 
        void main() {
          gl_PointSize = a_Color.r * 3.5;
             gl_Position = u_mvpMat * a_Position; 	
          // Let u_runMode determine particle color:
        
            v_Color = a_Color.rgb;
        }`;

        this.FSHADER_SOURCE =
            `precision mediump float; 
            varying vec3 v_Color;
            uniform int u_isBall; 
            void main() {
            if(u_isBall > 0){ 
                float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); 
                if(dist < 0.5) { 
                        gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);
                    } 
                    else { discard; }
                } 
            else { // NOT drawing a ball; just use vertex color.
                gl_FragColor = vec4(v_Color.rgb, 1.0); 
                }
            }`;

        this.vboContents = particleArray;
        this.vboVerts = particleArray.length / 7;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
        this.vboBytes = this.vboContents.length * this.FSIZE;
        this.vboStride = this.vboBytes / this.vboVerts;
        this.vboOffset = 0;
        this.vboOffset_color = 4 * this.FSIZE;

        this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE, this.FSHADER_SOURCE);
        if (!this.shaderLoc) {
            console.log(this.constructor.name + '.constructor() failed to create executable Shaders on the GPU. Bye!');
            return;
        }

        gl.program = this.shaderLoc;
        this.vboLoc = gl.createBuffer();
        if (!this.vboLoc) {
            console.log(this.constructor.name + '.constructor() failed to create VBO in GPU. Bye!');
            return;
        }
        this.mvp_Mat = new Matrix4();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);

        
        gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.DYNAMIC_DRAW);
        
        this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
        if (this.a_PosLoc < 0) {
            console.log(this.constructor.name + '.constructor() failed to get the GPU storage location of a_Position');
            return;
        }

        this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
        if (this.a_ColorLoc < 0) {
            console.log(this.constructor.name + '.constructor() failed to get the GPU storage location of a_Color');
            return;
        }

        this.u_isBallLoc = gl.getUniformLocation(this.shaderLoc, 'u_isBall');
        if(!this.u_isBallLoc) {
            console.log('Failed to get u_isBallLoc variable location');
            return;
        }

        this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
        if (!this.u_mvpMatLoc) {
            console.log(this.constructor.name + '.constructor() failed to get GPU location for u_mvpMat uniform');
            return;
        }
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 4*this.FSIZE, this.vboOffset);
    }

    switchToMe(gl) {
        gl.useProgram(this.shaderLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, this.vboStride, 0);
        gl.vertexAttribPointer(this.a_ColorLoc, 3, gl.FLOAT, false, this.vboStride, this.vboOffset_color);
        gl.enableVertexAttribArray(this.a_PosLoc);
    }

    isReady() {
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
            console.log(this.constructor.name + '.isReady() false: shader program at this.shaderLoc not in use!');
            return false;
        }
        if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + '.isReady() false: vbo at this.vboLoc not in use!');
            return false;
        }
        return true;
    }

    reload(gl, particleArray, mvpMat) {
        if (particleArray.length != this.vboContents.length){
            console.log('ERROR! ParticlesVBO.reload() received new particle array of different size!'
            + '\n\told array size: ' + this.vboContents.length + '; new array size: ' + particleArray.length);
        }
        this.vboContents = particleArray;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vboContents);
        this.mvp_Mat.setIdentity();
        this.mvp_Mat.set(mvpMat);
        gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvp_Mat.elements);
        gl.uniform1i(this.u_isBallLoc, true);		// keyboard callbacks set 'myRunMode'

    }

    draw(gl) {
        if (!this.isReady()) {
            console.log('ERROR! before' + this.constructor.name + '.draw() call you needed to call this.switchToMe()!!');
        }
        gl.drawArrays(gl.POINTS, 0, this.vboVerts);
    }



}


class LinesVBO {
    constructor(gl, particleArray, color) {
        this.VSHADER_SOURCE =
        `precision mediump float;					// req'd in OpenGL ES if we use 'float'
        //
                                                                              // 0=reset; 1= pause; 2=step; 3=run
        attribute vec4 a_Position;
        uniform   mat4 u_mvpMat;
        varying   vec4 v_Color; 
        uniform vec4 a_Color;
        void main() {
          gl_PointSize = 10.0;
             gl_Position = u_mvpMat * a_Position; 	
            v_Color = a_Color;
        }`;

        this.FSHADER_SOURCE =
            `precision mediump float; 
            varying vec4 v_Color;
            uniform mat4 u_mvpMat; 
            uniform int u_isBall; 
            void main() {
                gl_FragColor = v_Color; 
            }`;

        this.color = color? color : new Float32Array([0.1, 0.6, 0.1, 1.0]);

        this.vboContents = particleArray;
        this.vboVerts = particleArray.length / 4;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
        this.vboBytes = this.vboContents.length * this.FSIZE;
        this.vboStride = this.vboBytes / this.vboVerts;
        this.vboOffset = 0;

        this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE, this.FSHADER_SOURCE);
        if (!this.shaderLoc) {
            console.log(this.constructor.name + '.constructor() failed to create executable Shaders on the GPU. Bye!');
            return;
        }

        gl.program = this.shaderLoc;
        this.vboLoc = gl.createBuffer();
        if (!this.vboLoc) {
            console.log(this.constructor.name + '.constructor() failed to create VBO in GPU. Bye!');
            return;
        }
        this.mvp_Mat = new Matrix4();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);

        
        gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.DYNAMIC_DRAW);
        
        this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
        if (this.a_PosLoc < 0) {
            console.log(this.constructor.name + '.constructor() failed to get the GPU storage location of a_Position');
            return;
        }


        this.a_ColorLoc = gl.getUniformLocation(this.shaderLoc, 'a_Color');
        if(!this.a_ColorLoc) {
            console.log('Failed to get a_ColorLoc variable location');
            return;
        }


        this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
        if (!this.u_mvpMatLoc) {
            console.log(this.constructor.name + '.constructor() failed to get GPU location for u_mvpMat uniform');
            return;
        }
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, this.vboStride, this.vboOffset);
    }

    switchToMe(gl) {
        gl.useProgram(this.shaderLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
        gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, this.vboStride, this.vboOffset);
        gl.enableVertexAttribArray(this.a_PosLoc);
        gl.uniform1i(this.u_isBallLoc, true);		// keyboard callbacks set 'myRunMode'

    }

    isReady() {
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
            console.log(this.constructor.name + '.isReady() false: shader program at this.shaderLoc not in use!');
            return false;
        }
        if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + '.isReady() false: vbo at this.vboLoc not in use!');
            return false;
        }
        return true;
    }

    reload(gl, particleArray, mvpMat) {
        if (particleArray.length != this.vboContents.length){
            console.log('ERROR! ParticlesVBO.reload() received new particle array of different size!'
            + '\n\told array size: ' + this.vboContents.length + '; new array size: ' + particleArray.length);
        }
        this.vboContents = particleArray;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vboContents);
        this.mvp_Mat.setIdentity();
        this.mvp_Mat.set(mvpMat);
        gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvp_Mat.elements);
        gl.uniform4fv(this.a_ColorLoc, this.color);
    }   

    draw(gl) {
        if (!this.isReady()) {
            console.log('ERROR! before' + this.constructor.name + '.draw() call you needed to call this.switchToMe()!!');
        }
        gl.drawArrays(gl.LINES, 0, this.vboVerts);
    }



}