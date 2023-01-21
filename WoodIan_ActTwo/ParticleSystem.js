// enum for particle types
const PARTICLE_TYPE = {
    MULTI_BOUNCY: 1,
    // ...
};

const SOLVER_TYPE = {
    EULER: 1,
    REVERSE_TIME: 2,
}



class ParticleSystem {

    
    constructor(particalType, count){


        switch(particalType){
            case PARTICLE_TYPE.MULTI_BOUNCY:
                this.timeStep = 1/60;
                this.numParticles = count;
                this.elementsPerParticle = 4;
                this.particalType = PARTICLE_TYPE.MULTI_BOUNCY;
        
        
                // each particle is a 7-element array of floats:
                //  x,y,z position, vx,vy,vz velocity, mass, fx,fy,fz force accumulator.
                this.particleArray = new Float32Array(this.numParticles * this.elementsPerParticle);
                
                // create a array of particle objects
                this.s1 = [];
                this.s2 = [];
                for (let i = 0; i < this.numParticles; i++) {
                    var x = Math.random() * 2 - 1;
                    var y = Math.random() * 2 - 1;
                    var z = Math.random() * 2;

                    // random velocity
                    var vx = Math.random() * 10 - 1;
                    var vy = Math.random() * 10 - 1;
                    var vz = Math.random() * 10 - 1;

                    let p = new Particle(x, y, z, vx, vy, vz, 1);
                    this.s1.push(p);
                }
                this.s2 = this.s1.slice(0);
                this.sdot = this.s1.slice(0);
        
                this.gravity = new ForceGravity();
                this.drag = new ForceDrag();
        
                this.forceList = [this.gravity, this.drag];
                this.constraintList = [new BoxConstraint()];
                break;
            default:
                throw new Error("Unknown particle type");
        }

    }


    applyForces(){
        for (let particle of this.s1) {
            for (let force of this.forceList) {
                force.applyForce(particle);
            }
        }

    }

    dotFinder(state){
        for (let i = 0; i < state.length; i++) {
            let p = state[i];
            let dp = new Particle(
                p.vx, p.vy, p.vz,
                p.fx / p.mass, p.fy / p.mass, p.fz / p.mass,
                0);
            this.sdot[i] = dp;  
        }

    }

    solver(solverType){
        // 'reverse time' solver
        switch(solverType){
            case SOLVER_TYPE.REVERSE_TIME:
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].vz -= 9.8 * this.timeStep;
                    this.s2[i].vx *= 0.99;
                    this.s2[i].vy *= 0.99;
                    this.s2[i].vz *= 0.99;
                    this.s2[i].x  += this.s2[i].vx * this.timeStep;
                    this.s2[i].y  += this.s2[i].vy * this.timeStep;
                    this.s2[i].z  += this.s2[i].vz * this.timeStep;
                }
                break;
                
            case SOLVER_TYPE.EULER:
                for (let i = 0; i < this.numParticles; i++) {
                    this.s2[i].x  = this.s1[i].x  + this.sdot[i].x  * this.timeStep;
                    this.s2[i].y  = this.s1[i].y  + this.sdot[i].y  * this.timeStep;
                    this.s2[i].z  = this.s1[i].z  + this.sdot[i].z  * this.timeStep;
                    this.s2[i].vx = this.s1[i].vx + this.sdot[i].vx * this.timeStep;
                    this.s2[i].vy = this.s1[i].vy + this.sdot[i].vy * this.timeStep;
                    this.s2[i].vz = this.s1[i].vz + this.sdot[i].vz * this.timeStep;
                }
                break;

        }
    }

    doConstraints(){
        for (let constraint of this.constraintList) {
            for (let particle of this.s2) {
                constraint.applyConstraint(particle);
            }
        }
    }



    step(){
        this.applyForces();
        this.dotFinder(this.s1);
        this.solver(SOLVER_TYPE.REVERSE_TIME);
        this.doConstraints();

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


    render(gl){
        var s1arry = this.getCurrentStateArray();
        gl.bufferSubData(gl.ARRAY_BUFFER,  // specify the 'binding target': either
									   //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
									   // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
									0, // offset: # of bytes to skip at the start of the VBO before 
									   // we begin data replacement.
                                    s1arry); // Float32Array data source.)
        gl.drawArrays(gl.POINTS, 0, s1arry.length/4);

    }


}
