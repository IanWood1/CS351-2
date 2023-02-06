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
        this.x = g_spherex;
        this.y = g_spherey;
        this.z = g_spherez;
        this.radius = g_spherer;
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
                
                let toCenterx = this.x - particle.x;
                let toCentery = this.y - particle.y;
                let toCenterz = this.z - particle.z;

                // project the velocity onto the vector from the particle to the center of the sphere
                let dot = particle.vx * toCenterx + particle.vy * toCentery + particle.vz * toCenterz;
                particle.vx = particle.vx - dot * 2* toCenterx;
                particle.vy = particle.vy - dot *2* toCentery;
                particle.vz = particle.vz - dot *2* toCenterz;

            }
        }
    }

}

class FireConstraint{
    constructor(x, y, z, lifespan, vx){
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = 0.3;
        this.lifespan = lifespan;
        this.vx = vx
    }


    applyConstraint(particles){
        for (let particle of particles) {
            particle.age += 1;
            if (particle.age > this.lifespan){
                // particle.x and particle.y are within the circle
                particle.x = this.x + (Math.random() * 4 - 1) * this.r;
                particle.y = this.y + (Math.random() * 4 - 1) * this.r;
                particle.z = this.z;
                particle.vz = Math.random() * this.vx + 2;
                particle.age = Math.floor(Math.random() * this.lifespan);
                particle.vx = Math.random() * 1 - 0.5;
                particle.vy = Math.random() * 1 - 0.5;
            }
        }
    }
}