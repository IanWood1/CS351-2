class Force {
}


class ForceGravity extends Force {
    constructor() {
        super();
        this.force = [0, 0, -10];
    }


    applyForce(particles) {
        for (let particle of particles){
            particle.fx += this.force[0] * particle.mass;
            particle.fy += this.force[1] * particle.mass;
            particle.fz += this.force[2] * particle.mass;
        }
    }
}

class ForceDrag extends Force {
    constructior() {
    }

    applyForce(particles) {
        this.drag = 1;
        for (let particle of particles) {
            particle.fx -= this.drag * particle.vx;
            particle.fy -= this.drag * particle.vy;
            particle.fz -= this.drag * particle.vz;
        }
        
    }
}


class ForceFullyConnectedSpring extends Force {
    constructor(k, d, length) {
        super();
        this.k = k;
        this.d = d;
        this.length = length;
    }

    applyForce(particles) {
        for (let particle1 of particles){
            for (let particle2 of particles){
                if (particle1 == particle2) {
                    continue;
                }
                // only act on particle1, particle2 will be handled in a later iteration
                let x = particle1.x - particle2.x;
                let y = particle1.y - particle2.y;
                let z = particle1.z - particle2.z;
                let distance = Math.sqrt(x*x + y*y + z*z);
                let force = this.k * (this.length - distance);
                let fx = force * x / particle1.mass;
                let fy = force * y / particle1.mass;
                let fz = force * z / particle1.mass;
                particle1.fx += fx;
                particle1.fy += fy;
                particle1.fz += fz;

                // handle damping
                let vx_rel = particle1.vx - particle2.vx;
                let vy_rel = particle1.vy - particle2.vy;
                let vz_rel = particle1.vz - particle2.vz;
                let vx_to_particle2 = vx_rel * x / distance;
                let vy_to_particle2 = vy_rel * y / distance;
                let vz_to_particle2 = vz_rel * z / distance;
                let damping = this.d * (vx_to_particle2 + vy_to_particle2 + vz_to_particle2);
                particle1.fx -= damping * x / particle1.mass;
                particle1.fy -= damping * y / particle1.mass;
                particle1.fz -= damping * z / particle1.mass;
            }
        }
        
    }

}