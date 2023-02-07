class Constraint {

};



// 2x2x2 with the bottom on z = 0 centered at the origin
class BoxConstraint{
    constructor(xWall1, xWall2, yWall1, yWall2, zWall1, zWall2) {
        this.xWall1 = xWall1 != undefined ? xWall1 : -1;
        this.xWall2 = xWall2 != undefined ? xWall2 : 1;
        this.yWall1 = yWall1 != undefined ? yWall1 : -1;
        this.yWall2 = yWall2 != undefined ? yWall2 : 1;
        this.zWall1 = zWall1 != undefined ? zWall1 : 0;
        this.zWall2 = zWall2 != undefined ? zWall2 : 2;
    }

    applyConstraintHelper(particle){
        if (particle.x < this.xWall1 && particle.vx < 0) {

            particle.vx = -particle.vx;
            particle.x = this.xWall1;
        }
        if (particle.x > this.xWall2 && particle.vx > 0) {

            particle.vx = -particle.vx;
            particle.x = this.xWall2;
        }
        if (particle.y < this.yWall1 && particle.vy < 0) {

            particle.vy = -particle.vy;
            particle.y = this.yWall1;
        }
        if (particle.y > this.yWall2 && particle.vy > 0) {

            particle.vy = -particle.vy;
            particle.y = this.yWall2;
        }
        if (particle.z < this.zWall1 && particle.vz < 0) {

            particle.vz = -particle.vz;
            particle.z = this.zWall1;
        }
        if (particle.z > this.zWall2 && particle.vz > 0) {
            particle.vz = -particle.vz;
            particle.z = this.zWall2;
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

                // apply friction
                particle.vx *= 0.9;
                particle.vy *= 0.9;
                particle.vz *= 0.9;


            }
        }
    }

}

class ExclusionCubeConstraint{
    constructor(){

    }

    applyConstraint(particles){
        let centerX = g_spherex + 6;
        let centerY = g_spherey ;
        let centerZ = g_spherez;
        let radius = 1;
        for (let particle of particles) {
            // check if the particle is inside the cube
            if (particle.x > centerX - radius && particle.x < centerX + radius &&
                particle.y > centerY - radius && particle.y < centerY + radius &&
                particle.z > centerZ - radius && particle.z < centerZ + radius){
                
                // push the particle to a face of the cube
                let distanceToLeftFace = particle.x - (centerX - radius);
                let distanceToRightFace = (centerX + radius) - particle.x;
                let distanceToBottomFace = particle.y - (centerY - radius);
                let distanceToTopFace = (centerY + radius) - particle.y;
                let distanceToBackFace = particle.z - (centerZ - radius);
                let distanceToFrontFace = (centerZ + radius) - particle.z;

                let minDistance = Math.min(distanceToLeftFace, distanceToRightFace, distanceToBottomFace, distanceToTopFace, distanceToBackFace, distanceToFrontFace);
                if (minDistance == distanceToLeftFace){
                    particle.x = centerX - radius;
                }
                if (minDistance == distanceToRightFace){
                    particle.x = centerX + radius;
                }
                if (minDistance == distanceToBottomFace){
                    particle.y = centerY - radius;
                }
                if (minDistance == distanceToTopFace){
                    particle.y = centerY + radius;
                }
                if (minDistance == distanceToBackFace){
                    particle.z = centerZ - radius;
                }
                if (minDistance == distanceToFrontFace){
                    particle.z = centerZ + radius;
                }
                particle.vx = 0;
                particle.vy = 0;
                particle.vz = 0;

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
            particle.vz -= 0.1;
            if (particle.age > this.lifespan){
                // particle.x and particle.y are within the circle
                particle.x = this.x + (Math.random() * 4 - 1) * this.r;
                particle.y = this.y + (Math.random() * 4 - 1) * this.r;
                particle.z = this.z;
                particle.vz = Math.random() * this.vx + 4;
                particle.age = Math.floor(Math.random() * this.lifespan);
                particle.vx = Math.random() * 1 - 0.5;
                particle.vy = Math.random() * 1 - 0.5;
            }
        }
    }
}



class SelectivePairsConstraint extends Force {
    constructor(length, connectedIndexes) {
        super();
        this.length = length;
        this.connectedIndexes = connectedIndexes;
    }

    applyConstraint(particles) {
        // enforce that each pair is no more than length apart
        for (let i = 0; i < this.connectedIndexes.length; i++) {
            let p1 = particles[this.connectedIndexes[i][0]];
            let p2 = particles[this.connectedIndexes[i][1]];
            let dx = p1.x - p2.x;
            let dy = p1.y - p2.y;
            let dz = p1.z - p2.z;
            let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (distance > this.length){
                let scale = this.length / distance;
                p1.x = p2.x + dx * scale;
                p1.y = p2.y + dy * scale;
                p1.z = p2.z + dz * scale;
            }
        }
    }
}