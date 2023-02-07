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

class ForceRandom extends Force{
    constructor(strengthX, strengthY, strengthZ) {
        super();
        this.strengthX = strengthX;
        this.strengthY = strengthY;
        this.strengthZ = strengthZ;
    }

    applyForce(particles) {
        for (let particle of particles) {
            particle.fx += Math.random() * this.strengthX - this.strengthX / 2;
            particle.fy += Math.random() * this.strengthY - this.strengthY / 2;
            particle.fz += Math.random() * this.strengthZ - this.strengthZ / 2;
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
                // project the velocity of particle1 onto the vector from particle1 to particle2
                let proj = (particle1.vx * x + particle1.vy * y + particle1.vz * z) / (distance * distance);
                let vxproj = proj * x;
                let vyproj = proj * y;
                let vzproj = proj * z;
                particle1.fx -= this.d * vxproj;
                particle1.fy -= this.d * vyproj;
                particle1.fz -= this.d * vzproj;
            }
        }
        
    }

}


class SelectiveSpringForce extends Force {
    constructor(k, d, length, connectedIndexes) {
        super();
        this.k = k;
        this.d = d;
        this.length = length;
        this.connectedIndexes = connectedIndexes;
        this.force = new ForceFullyConnectedSpring(k, d, length);
    }

    applyForce(particles) {
        for (let i = 0; i < this.connectedIndexes.length; i++) {
            let index1 = this.connectedIndexes[i][0];
            let index2 = this.connectedIndexes[i][1];
            let particle1 = particles[index1];
            let particle2 = particles[index2];
            this.force.applyForce([particle1, particle2]);
        }
    }
}



class FountainForce extends Force {
    constructor(centerx, centery, strength) {
        super();
        this.centerx = centerx;
        this.centery = centery;
        this.strength = strength;
    }

    applyForce(particles) {
        for (let particle of particles) {
            let x = particle.x - this.centerx;
            let y = particle.y - this.centery;
            let distance = Math.sqrt(x*x + y*y);
            let force = this.strength / distance;
            let fz = force / particle.mass;
            particle.fz += fz;

            // apply slight random force in x and y direction
            let fx = (Math.random() - 0.5) * 10
            let fy = (Math.random() - 0.5) * 10
            particle.fx += fx;
            particle.fy += fy;

        }
    }
    
}


class TornadoForce extends Force {
    constructor(centerx, centery, strength) {
        super();
        this.actualCenterx = centerx;
        this.actualCentery = centery;
        // center of the tornado is moving in a circle (r=0.5)
        // around the actual center
        this.t = 0;
        this.centerx = Math.sin(this.t) * 0.5 + this.actualCenterx;
        this.centery = Math.cos(this.t) * 0.5 + this.actualCentery;
        this.strength = strength;
    }

    applyForce(particles) {
        this.t+=0.01;
        this.centerx = Math.sin(this.t) * 0.5 + this.actualCenterx;
        this.centery = Math.cos(this.t) * 0.5 + this.actualCentery;
        for (let particle of particles) {
            let x = particle.x - this.centerx;
            let y = particle.y - this.centery;
            
            // force is perpendicular to the vector from the center to the particle
            let fx = -y * this.strength;
            let fy = x * this.strength;
            particle.fx += fx;
            particle.fy += fy;

            

            let distance = Math.sqrt(x*x + y*y);
            let fz = this.strength * 3 / distance;
            particle.fz += fz;

            // apply slight random force in x and y direction
            let fx2 = (Math.random() - 0.5) * 10
            let fy2 = (Math.random() - 0.5) * 10
            particle.fx += fx2;
            particle.fy += fy2;

            // apply force towards the center
            let fx3 = x * this.strength * -15 / (particle.z + 1);
            let fy3 = y * this.strength * -15 / (particle.z + 1);
            particle.fx += fx3;
            particle.fy += fy3;

        }
    }
}


class ConstantDirectionForce extends Force {
    constructor(x, y, z, strength) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.strength = strength;
    }

    applyForce(particles) {
        for (let particle of particles) {
            particle.fx += this.x * this.strength;
            particle.fy += this.y * this.strength;
            particle.fz += this.z * this.strength;
        }
    }
}


class BlowingDirectionForce extends Force {
    constructor(x, y, z, strength) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.strength = strength;
        this.t = 0;
    }

    applyForce(particles) {
        // effective strength is a function of time (sinusoidal)
        this.t += 0.01;
        let effectiveStrength = this.strength * Math.sin(this.t);
        for (let particle of particles) {
            particle.fx += this.x * effectiveStrength;
            particle.fy += this.y * effectiveStrength;
            particle.fz += this.z * effectiveStrength;
        }
    }
}


class BoidsForce extends Force {
    constructor(seperation, alignment, cohesion, avoidance, radius, boxConstraint) {
        super();
        this.seperation = seperation;
        this.alignment = alignment;
        this.cohesion = cohesion;
        this.radius = radius;
        this.avoidance = avoidance;
        this.boxConstraint = boxConstraint;
    }

    applyForce(particles) {
        for (let particle of particles){
            // find neighbours
            let neighbours = [];
            for (let otherParticle of particles) {
                if (otherParticle != particle) {
                    let x = particle.x - otherParticle.x;
                    let y = particle.y - otherParticle.y;
                    let z = particle.z - otherParticle.z;
                    let distance = Math.sqrt(x*x + y*y + z*z);
                    if (distance < this.radius) {
                        neighbours.push(otherParticle);
                    }
                }
            }

            // apply allignment (adjust velocity to match neighbours)
            let avgvx = 0;
            let avgvy = 0;
            let avgvz = 0;
            for (let neighbour of neighbours) {
                avgvx += neighbour.vx;
                avgvy += neighbour.vy;
                avgvz += neighbour.vz;
            }
            avgvx /= neighbours.length;
            avgvy /= neighbours.length;
            avgvz /= neighbours.length;
            particle.vx += (avgvx - particle.vx) * this.alignment;
            particle.vy += (avgvy - particle.vy) * this.alignment;
            particle.vz += (avgvz - particle.vz) * this.alignment;


            // apply cohesion (apply force towards the center of mass of neighbours)
            let avgx = 0;
            let avgy = 0;
            let avgz = 0;
            for (let neighbour of neighbours) {
                avgx += neighbour.x;
                avgy += neighbour.y;
                avgz += neighbour.z;
            }
            avgx /= neighbours.length;
            avgy /= neighbours.length;
            avgz /= neighbours.length;
            let x = avgx - particle.x;
            let y = avgy - particle.y;
            let z = avgz - particle.z;
            let distance = Math.sqrt(x*x + y*y + z*z);
            let fx = x * this.cohesion / distance;
            let fy = y * this.cohesion / distance;
            let fz = z * this.cohesion / distance;
            particle.fx += fx;
            particle.fy += fy;
            particle.fz += fz;


            // apply seperation (apply force away from neighbours)
            for (let neighbour of neighbours) {
                let x = particle.x - neighbour.x;
                let y = particle.y - neighbour.y;
                let z = particle.z - neighbour.z;
                let distance = Math.sqrt(x*x + y*y + z*z);
                let fx = x * this.seperation / distance;
                let fy = y * this.seperation / distance;
                let fz = z * this.seperation / distance;
                particle.fx += fx;
                particle.fy += fy;
                particle.fz += fz;
            }

            // avoid box constraint note: boxConstraint.xWall1 is the right (-x) wall and boxConstraint.xWall2 is the left (+x) wall
            let distToxWall1 = Math.abs(particle.x - this.boxConstraint.xWall1);
            let radiusMultiplier = 2;
            if(distToxWall1 < this.radius * radiusMultiplier){
                particle.fx += this.avoidance;
            } 
            let distToxWall2 = Math.abs(particle.x - this.boxConstraint.xWall2);
            if(distToxWall2 < this.radius* radiusMultiplier){
                particle.fx -= this.avoidance;
            }
            let distToyWall1 = Math.abs(particle.y - this.boxConstraint.yWall1);
            if(distToyWall1 < this.radius* radiusMultiplier){
                particle.fy += this.avoidance;
            }
            let distToyWall2 = Math.abs(particle.y - this.boxConstraint.yWall2);
            if(distToyWall2 < this.radius* radiusMultiplier){
                particle.fy -= this.avoidance;
            }
            let distTozWall1 = Math.abs(particle.z - this.boxConstraint.zWall1);
            if(distTozWall1 < this.radius* radiusMultiplier){
                particle.fz += this.avoidance;
            }
            let distTozWall2 = Math.abs(particle.z - this.boxConstraint.zWall2);
            if(distTozWall2 < this.radius* radiusMultiplier){

                particle.fz -= this.avoidance;
            }
        }
    }
}