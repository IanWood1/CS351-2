class Force {
}


class ForceGravity extends Force {
    constructor() {
        super();
        this.force = [0, 0, -10];
    }


    applyForce(particle) {
        particle.fx += this.force[0];
        particle.fy += this.force[1];
        particle.fz += this.force[2];
    }

}

class ForceDrag extends Force {
    constructior() {
        this.drag = 0.05;
    }

    applyForce(particle) {
        this.drag = 0.05;


        // force proportional to velocity
        particle.fx -= this.drag * particle.vx;
        particle.fy -= this.drag * particle.vy;
        particle.fz -= this.drag * particle.vz;
    }
}