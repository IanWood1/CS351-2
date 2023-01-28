class Force {
}


class ForceGravity extends Force {
    constructor() {
        super();
        this.force = [0, 0, -10];
    }


    applyForce(particle) {
        particle.fx += this.force[0] * particle.mass;
        particle.fy += this.force[1] * particle.mass;
        particle.fz += this.force[2] * particle.mass;
    }

}

class ForceDrag extends Force {
    constructior() {
    }

    applyForce(particle) {
        this.drag = 0.1;
        particle.fx -= this.drag * particle.vx;
        particle.fy -= this.drag * particle.vy;
        particle.fz -= this.drag * particle.vz;
        
    }
}