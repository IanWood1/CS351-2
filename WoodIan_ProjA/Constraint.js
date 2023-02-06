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