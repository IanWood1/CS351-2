// enum for particle types
const PARTICLE_TYPE = {
    MULTI_BOUNCY: 1,
    FULLY_CONNECTED_SPRING: 2,
    CLOTH: 3,
    FIRE: 4,
    BOID: 5,
    // ...
};

const SOLVER_TYPE = {
    EULER: "EULER",
    VELOCITY_VERLET: "VELOCITY_VERLET",
    MIDPOINT: "MIDPOINT",
    ADAMS_BASHFORTH: "ADAMS_BASHFORTH",
}

var g_max_age;




class ParticleSystem {

    
    constructor(particalType, count, gl){
        this.timeStep = 1/60;
        this.numParticles = count;
        this.elementsPerParticle = 4;
        // each particle is a 7-element array of floats:
        //  x,y,z position, vx,vy,vz velocity, mass, fx,fy,fz force accumulator.
        this.particleArray = new Float32Array(this.numParticles * this.elementsPerParticle);
        
        // create a array of particle objects
        this.s1 = [];
        this.s2 = [];

        switch(particalType){
            case PARTICLE_TYPE.MULTI_BOUNCY:
                
                this.particalType = PARTICLE_TYPE.MULTI_BOUNCY;
        
                for (let i = 0; i < this.numParticles; i++) {
                    var z = Math.random() * 2;
                    var x = z* Math.random() * 0.4 - 0.2;
                    var y = z*Math.random() * 0.4 - 0.2;

                    // random velocity
                    var vx = 0// Math.random() * 10 - 1;
                    var vy = 0//Math.random() * 10 - 1;
                    var vz = 0//Math.random() * 10 - 1;

                    let p = new Particle(x, y, z, vx, vy, vz, 1);
                    this.s1.push(p);
                }
                this.BOX = new ParticlesVBO(gl, this.getCurrentStateArray());
                this.s2 = this.s1.slice(0);
                this.sdot = this.s1.slice(0);
        
                this.gravity = new ForceGravity();
                this.drag = new ForceDrag();
        
                this.forceList = [this.gravity, this.drag, new TornadoForce(0, 0, 5 )];
                this.constraintList = [new BoxConstraint(),
                    new SphereConstraint(g_spherer, g_spherex, g_spherey, g_spherez) ,
                    new ExclusionCubeConstraint()];
                break;

            case PARTICLE_TYPE.FULLY_CONNECTED_SPRING:
                this.particalType = PARTICLE_TYPE.FULLY_CONNECTED_SPRING;
                if (this.numParticles != 4) {
                    throw new Error("Fully connected spring system must have 4 particles");
                }
                // create a tetrahedron of particles
                this.s1[0] = new Particle(1.1, 1.1, 4, -1, 0, 0, 1);
                this.s1[1] = new Particle(-1, -1, 4, 0, 0, 0, 1);
                this.s1[2] = new Particle(-1, 1, 2, 0, 0, 0, 1);
                this.s1[3] = new Particle(1, -1, 2, 0, 0, 0, 1);
                this.s1[0].x += 4;
                this.s1[1].x += 4;
                this.s1[2].x += 4;
                this.s1[3].x += 4;




                this.s2 = this.s1.slice(0);
                this.spring = new ForceFullyConnectedSpring(200, 10, 1);
                this.forceList = [this.spring, new ForceDrag(), new ForceGravity()];
                this.constraintList = [new AboveGroundConstraint()];
                break;

            case PARTICLE_TYPE.CLOTH:
                this.particalType = PARTICLE_TYPE.CLOTH;
                
                // create a sqrt(numParticles) x sqrt(numParticles) grid of particles
                let numParticlesPerSide = Math.sqrt(this.numParticles);
                if (numParticlesPerSide % 1 != 0) {
                    throw new Error("Number of particles must be a perfect square");
                }
                let spacing = 0.1;
                let startX = -spacing * (numParticlesPerSide - 1) / 2 + 4;
                let startZ = -spacing * (numParticlesPerSide - 1) / 2 + 5;
                let startY = 0.5;
                let connections = [];
                let diaganolConnections = [];
                let fixedPoints = [];
                this.connectedParticles = [];
                let p;

                for (let i = 0; i < numParticlesPerSide; i++) {
                    for (let j = 0; j < numParticlesPerSide; j++) {
                        let x = startX + spacing * i * 1.2;
                        let y = startY - spacing * j;
                        let z = startZ + spacing * j * 0.1;
                        let vxRand = 0
                        let vyRand = 0
                        let vzRand = 0
                        p = new Particle(x, y, z, vxRand, vyRand, vzRand, 1);
                        this.s1[i * numParticlesPerSide + j] = p;

                        // if on top row of particles, fix it
                        if (j == numParticlesPerSide - 1) {
                            fixedPoints.push(i * numParticlesPerSide + j);
                        }

                        // connect particle to the one below it
                        if (j < numParticlesPerSide - 1) {
                            connections.push([i * numParticlesPerSide + j, i * numParticlesPerSide + j + 1]);
                            this.connectedParticles.push([i * numParticlesPerSide + j, i * numParticlesPerSide + j + 1])
                        }

                        // connect particle to the one to the right of it
                        if (i < numParticlesPerSide - 1) {
                            connections.push([i * numParticlesPerSide + j, (i + 1) * numParticlesPerSide + j]);
                            this.connectedParticles.push([i * numParticlesPerSide + j, (i + 1) * numParticlesPerSide + j]);
                        }

                        // connect particle to the one to the bottom right of it
                        if (i < numParticlesPerSide - 1 && j < numParticlesPerSide - 1) {
                            diaganolConnections.push([i * numParticlesPerSide + j, (i + 1) * numParticlesPerSide + j + 1]);
                            this.connectedParticles.push([i * numParticlesPerSide + j, (i + 1) * numParticlesPerSide + j + 1])
                        }

                        // connect particle to the one to the bottom left of it
                        if (i > 0 && j < numParticlesPerSide - 1) {
                            diaganolConnections.push([i * numParticlesPerSide + j, (i - 1) * numParticlesPerSide + j + 1]);
                            this.connectedParticles.push([i * numParticlesPerSide + j, (i - 1) * numParticlesPerSide + j + 1]);
                        }
                    }
                }
                this.BOX = new ParticlesVBO(gl, this.getCurrentStateArray());
                this.LinesBOX = new LinesVBO(gl, this.getClothLines(), new Float32Array([100/225, 10/225, 10/225, 1], false));
                this.s2 = this.s1.slice(0);
                this.spring2 = new SelectiveSpringForce(100, 1, spacing * Math.sqrt(2), diaganolConnections);
                this.spring = new SelectiveSpringForce(1000, 1, spacing, connections);
                this.forceList = [ this.spring, this.spring2, new ForceDrag(), new ForceGravity()];
                this.constraintList = [new AboveGroundConstraint(), 
                    new FixedPointsConstraint(this.s1, fixedPoints),
                    new SelectivePairsConstraint(spacing*1.5, connections) ,
                    new SphereConstraint(g_spherer, g_spherex, g_spherey, g_spherez) ,
                    new ExclusionCubeConstraint()
                ];
                break;


            case PARTICLE_TYPE.FIRE:
                this.particalType = PARTICLE_TYPE.FIRE;
                this.s1 = [];
                this.s2 = [];

                this.spawnX = -4;
                this.spawnY = 0;
                let initialVelocity = 10;

                for (let i = 0; i < this.numParticles; i++) {
                    let x = this.spawnX;
                    let y = this.spawnY;
                    let z = 0;
                    let vxRand = Math.random() * 2 - 1;
                    let vyRand = Math.random() * 2 - 1;
                    let vzRand = Math.random() * initialVelocity;
                    let p = new Particle(x, y, z, vxRand, vyRand, vzRand, 1);
                    p.age = Math.floor(Math.random() * 60);
                    this.s1.push(p);
                }
                this.BOX = new FireVBO(gl, this.getCurrentStateArrayFire());
                this.s2 = this.s1.slice(0);
                g_max_age =40;
                this.constraintList = [new AboveGroundConstraint(), 
                    new FireConstraint(this.spawnX, this.spawnY, 0, g_max_age, initialVelocity),
                    new SphereConstraint(g_spherer, g_spherex, g_spherey, g_spherez) ,
                    new ExclusionCubeConstraint()];
                this.forceList = [new ForceDrag(), new ForceGravity()];
                break;


            case PARTICLE_TYPE.BOID:
                this.particalType = PARTICLE_TYPE.BOID;
                this.s1 = [];
                this.s2 = [];

                this.spawnX = -7;
                this.spawnY = 0;

                for (let i = 0; i < this.numParticles; i++) {
                    let x = this.spawnX + Math.random() * 2 - 1;
                    let y = this.spawnY + Math.random() * 2 - 1;
                    let z = 0;
                    let vxRand = Math.random() * 10 - 5;
                    let vyRand = Math.random() * 10 - 5;
                    let vzRand = Math.random() * 10 - 5;
                    let p = new Particle(x, y, z, vxRand, vyRand, vzRand, 1);
                    this.s1.push(p);
                }
                this.BOX = new ParticlesVBO(gl, this.getCurrentStateArray());
                let boxConstraint = new BoxConstraint(-8, -6, -2, 2, 0, 4);
                this.s2 = this.s1.slice(0);
                this.constraintList = [new AboveGroundConstraint(),
                    boxConstraint,
                    new SphereConstraint(g_spherer, g_spherex, g_spherey, g_spherez) ,
                    new ExclusionCubeConstraint()];
                this.forceList = [new BoidsForce(1,1,1,10,0.2, boxConstraint),
                    new ForceRandom(10,10,50),
                    new ForceDrag()];
                break;




            default:
                throw new Error("Unknown particle type:" + particleType);   
        }
        this.s0 = this.s1.slice(0);

    }

    getClothLines(){
        let lines = [];
        for (let particlePairIndex of this.connectedParticles){
            let index1 = particlePairIndex[0];
            let index2 = particlePairIndex[1];
            let p1 = this.s1[index1];
            let p2 = this.s1[index2];
            lines.push(p1.x, p1.y, p1.z, 1);
            lines.push(p2.x, p2.y, p2.z, 1);
        }
        return Float32Array.from(lines);
    }


    applyForces(state){
        // set all forces to zero
        for (let particle of state) {
            particle.fx = 0;
            particle.fy = 0;
            particle.fz = 0;
        }
        for (let force of this.forceList) {
            force.applyForce(state);
        }

    }

    dotFinder(state){
        let new_sdot = [];
        for (let i = 0; i < state.length; i++) {
            let p = state[i];
            let dp = new Particle(
                p.vx, p.vy, p.vz,
                p.fx / p.mass, p.fy / p.mass, p.fz / p.mass,
                0);
            new_sdot.push(dp); 
        }
        return new_sdot;
    }

    solver(solverType){
        // 'reverse time' solver
        switch(solverType){
            case SOLVER_TYPE.REVERSE_TIME:
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].vz -= 9.8 * this.timeStep;
                    this.s2[i].vx *= 0.98;
                    this.s2[i].vy *= 0.98;
                    this.s2[i].vz *= 0.98;
                    this.s2[i].x  += this.s2[i].vx * this.timeStep;
                    this.s2[i].y  += this.s2[i].vy * this.timeStep;
                    this.s2[i].z  += this.s2[i].vz * this.timeStep;
                }
                break;
                
            case SOLVER_TYPE.EULER:
                this.applyForces(this.s1);
                this.sdot = this.dotFinder(this.s1);
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].x  = this.s1[i].x  + this.sdot[i].x  * this.timeStep;
                    this.s2[i].y  = this.s1[i].y  + this.sdot[i].y  * this.timeStep;
                    this.s2[i].z  = this.s1[i].z  + this.sdot[i].z  * this.timeStep;
                    this.s2[i].vx = this.s1[i].vx + this.sdot[i].vx * this.timeStep;
                    this.s2[i].vy = this.s1[i].vy + this.sdot[i].vy * this.timeStep;
                    this.s2[i].vz = this.s1[i].vz + this.sdot[i].vz * this.timeStep;
                }
                break;
            case SOLVER_TYPE.VELOCITY_VERLET:
                this.applyForces(this.s1);
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].x = this.s1[i].x + this.s1[i].vx * this.timeStep + this.s1[i].fx / this.s1[i].mass * this.timeStep * this.timeStep / 2;
                    this.s2[i].y = this.s1[i].y + this.s1[i].vy * this.timeStep + this.s1[i].fy / this.s1[i].mass * this.timeStep * this.timeStep / 2;
                    this.s2[i].z = this.s1[i].z + this.s1[i].vz * this.timeStep + this.s1[i].fz / this.s1[i].mass * this.timeStep * this.timeStep / 2;
                }
                this.applyForces(this.s2);
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].vx = this.s1[i].vx + (this.s1[i].fx + this.s2[i].fx) / this.s1[i].mass * this.timeStep / 2;
                    this.s2[i].vy = this.s1[i].vy + (this.s1[i].fy + this.s2[i].fy) / this.s1[i].mass * this.timeStep / 2;
                    this.s2[i].vz = this.s1[i].vz + (this.s1[i].fz + this.s2[i].fz) / this.s1[i].mass * this.timeStep / 2;

                }
                break;
            
            case SOLVER_TYPE.MIDPOINT:
                this.applyForces(this.s1);
                this.sdot = this.dotFinder(this.s1);
                let s1_midpoint = [];
                
                for (let i = 0; i < this.numParticles; i++) {
                    let p = this.s1[i];
                    let dp = this.sdot[i];
                    let p_midpoint = new Particle(
                        p.x  + dp.x  * this.timeStep / 2,
                        p.y  + dp.y  * this.timeStep / 2,
                        p.z  + dp.z  * this.timeStep / 2,
                        p.vx + dp.vx * this.timeStep / 2,
                        p.vy + dp.vy * this.timeStep / 2,
                        p.vz + dp.vz * this.timeStep / 2,
                        p.mass);
                    s1_midpoint.push(p_midpoint);
                }
                this.applyForces(s1_midpoint);
                s1_midpoint = this.dotFinder(s1_midpoint);
                for (let i = 0; i < this.numParticles; i++) {
                    let p = this.s1[i];
                    let dp = s1_midpoint[i];
                    this.s2[i].x  = p.x  + dp.x  * this.timeStep;
                    this.s2[i].y  = p.y  + dp.y  * this.timeStep;
                    this.s2[i].z  = p.z  + dp.z  * this.timeStep;
                    this.s2[i].vx = p.vx + dp.vx * this.timeStep;
                    this.s2[i].vy = p.vy + dp.vy * this.timeStep;
                    this.s2[i].vz = p.vz + dp.vz * this.timeStep;
                }
                break;

            case SOLVER_TYPE.ADAMS_BASHFORTH:
                this.applyForces(this.s1);
                this.applyForces(this.s0);
                var sdot0 = this.dotFinder(this.s0);
                var sdot1 = this.dotFinder(this.s1);
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i] = new Particle(
                        this.s1[i].x  + this.timeStep * (1.5 * sdot1[i].x  - 0.5 * sdot0[i].x ),
                        this.s1[i].y  + this.timeStep * (1.5 * sdot1[i].y  - 0.5 * sdot0[i].y ),
                        this.s1[i].z  + this.timeStep * (1.5 * sdot1[i].z  - 0.5 * sdot0[i].z ),
                        this.s1[i].vx + this.timeStep * (1.5 * sdot1[i].vx - 0.5 * sdot0[i].vx),
                        this.s1[i].vy + this.timeStep * (1.5 * sdot1[i].vy - 0.5 * sdot0[i].vy),
                        this.s1[i].vz + this.timeStep * (1.5 * sdot1[i].vz - 0.5 * sdot0[i].vz),
                        this.s1[i].mass);
                    this.s2[i].age = this.s1[i].age
                }
                break;


            default:
                throw new Error("Unknown solver type: " + solverType);
        }
    }

    doConstraints(){
        for (let constraint of this.constraintList) {
            constraint.applyConstraint(this.s2);
        }
    }



    step(){
        this.solver(g_solverType);
        this.doConstraints();
        this.s0 = this.s1.slice(0);
        this.s1 = this.s2.slice(0);
    }



    getCurrentStateArray(){
        var stateArray = new Float32Array(this.numParticles * 4);
        for (let i = 0; i < this.numParticles; i++) {
            let p = this.s1[i];
            stateArray[i * this.elementsPerParticle] = p.x;
            stateArray[i * this.elementsPerParticle + 1] = p.y;
            stateArray[i * this.elementsPerParticle + 2] = p.z;
            stateArray[i * this.elementsPerParticle + 3] = 1;
        }
        return stateArray;
    }

    getCurrentStateArrayFire(){
        this.elementsPerParticle = 7;
        var stateArray = new Float32Array(this.numParticles * 8);
        for (let i = 0; i < this.numParticles; i++) {
            let p = this.s1[i];
            stateArray[i * this.elementsPerParticle] = p.x;
            stateArray[i * this.elementsPerParticle + 1] = p.y;
            stateArray[i * this.elementsPerParticle + 2] = p.z;
            stateArray[i * this.elementsPerParticle + 3] = 1;
            stateArray[i * this.elementsPerParticle + 4] = (g_max_age - p.age)/g_max_age * 3.5;
            stateArray[i * this.elementsPerParticle + 5] = 0;
            stateArray[i * this.elementsPerParticle + 6] = 0;
        }
        return stateArray;

    }


    render(gl, mvpMat){
        // var s1arry = this.getCurrentStateArray();
        // gl.bufferSubData(gl.ARRAY_BUFFER,  // specify the 'binding target': either
		// 							   //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
		// 							   // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
		// 							0, // offset: # of bytes to skip at the start of the VBO before 
		// 							   // we begin data replacement.
        //                             s1arry); // Float32Array data source.)
        // gl.drawArrays(gl.POINTS, 0, s1arry.length/4);

        if (this.LinesBOX != null){
            this.LinesBOX.switchToMe(gl);
            this.LinesBOX.reload(gl, this.getClothLines(), mvpMat);
            this.LinesBOX.draw(gl);
            return;
        }

        if (this.particalType == PARTICLE_TYPE.FIRE){
            this.BOX.switchToMe(gl);
            this.BOX.reload(gl, this.getCurrentStateArrayFire(), mvpMat);
            this.BOX.draw(gl);
            return;
        }

        this.BOX.switchToMe(gl);
        this.BOX.reload(gl, this.getCurrentStateArray(), mvpMat);
        this.BOX.draw(gl);

        


    }


}
