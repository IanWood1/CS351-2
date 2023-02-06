class Constraint {
    applyConstraint(particles) {
    }
};



// 2x2x2 with the bottom on z = 0 centered at the origin
class BoxConstraint{

    applyConstraintHelper(particle){
        if(particle.x < -1 && particle.vx < 0){
            particle.vx = -particle.vx;
            particle.x = -1;
        }
        if(particle.x > 1 && particle.vx > 0){
            particle.vx = -particle.vx;
            particle.x = 1;
        }
        if(particle.y < -1 && particle.vy < 0){
            particle.vy = -particle.vy;
            particle.y = -1;
        }
        if(particle.y > 1 && particle.vy > 0){
            particle.vy = -particle.vy;
            particle.y = 1;
        }
        if(particle.z < 0 && particle.vz < 0){
            particle.vz = -particle.vz;
            particle.z = 0;
        }
        if(particle.z > 2 && particle.vz > 0){
            particle.vz = -particle.vz;
            particle.z = 2;
        }
    }

    applyConstraint(particles){
        for (let particle of particles) {
            this.applyConstraintHelper(particle);
        }
    }
}

class AboveGroundConstraint{
    applyConstraintHelper(particle){
        if(particle.z < 0 && particle.vz < 0){
            particle.vz = -particle.vz;
            particle.z = 0;
        }
    }

    applyConstraint(particles){
        for (let particle of particles) {
            this.applyConstraintHelper(particle);
        }
    }

}


class FixedPointsConstraint{
    constructor(particles, fixedPoints){
        this.fixedParticles = JSON.parse(JSON.stringify(particles));
        this.fixedPoints = fixedPoints;
    }

    applyConstraint(particles){
        for (let i = 0; i < this.fixedParticles.length; i++) {
            if (this.fixedPoints.includes(i)){
                particles[i].x = this.fixedParticles[i].x;
                particles[i].y = this.fixedParticles[i].y;
                particles[i].z = this.fixedParticles[i].z;
                particles[i].vx = 0;
                particles[i].vy = 0;
                particles[i].vz = 0;
            }
        }
    }
}


class SphereConstraint{
    constructor(radius, x, y, z){
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    applyConstraint(particles){
        for (let particle of particles) {
            let x = particle.x - this.x;
            let y = particle.y - this.y;
            let z = particle.z - this.z;
            let distance = Math.sqrt(x*x + y*y + z*z);
            if (distance > this.radius){
                particle.x = this.x + x * this.radius / distance;
                particle.y = this.y + y * this.radius / distance;
                particle.z = this.z + z * this.radius / distance;
            }
        }
    }

}