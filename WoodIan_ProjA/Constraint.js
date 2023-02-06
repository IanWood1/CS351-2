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
            let dx = particle.x - this.x;
            let dy = particle.y - this.y;
            let dz = particle.z - this.z;
            let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

            // if the particle is inside the sphere
            // set the particle to the surface of the sphere
            // and reverse the velocity 
            if (distance < this.radius){
                let scale = this.radius / distance;
                particle.x = this.x + dx * scale;
                particle.y = this.y + dy * scale;
                particle.z = this.z + dz * scale;
                particle.vx = -particle.vx;
                particle.vy = -particle.vy;
                particle.vz = -particle.vz;
            }
        }
    }

}

class FireConstraint{
    constructor(x, y, z, lifespan){
        this.x = x;
        this.y = y;
        this.z = z;
        this.lifespan = lifespan;
    }


    applyConstraint(particles){
        for (let particle of particles) {
            particle.age += 1;
            if (particle.age > this.lifespan){
                particle.x = this.x;
                particle.y = this.y;
                particle.z = this.z;
                particle.vz = Math.random() * 2 + 4;
                particle.age = Math.floor(Math.random() * this.lifespan);
                particle.vx = Math.random() * 1 - 0.5;
                particle.vy = Math.random() * 1 - 0.5;
            }
        }
    }
}