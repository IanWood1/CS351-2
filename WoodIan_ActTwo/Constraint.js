class Constraint {
    applyConstraint(particle) {
    }
};



// 2x2x2 with the bottom on z = 0 centered at the origin
class BoxConstraint{



    applyConstraint(particle){
        console.log("HERE")
        console.log(particle.z)
        console.log(particle.vz)
        if(particle.x < -1 && particle.vx < 0){
            particle.vx = -particle.vx;
        }
        if(particle.x > 1 && particle.vx > 0){
            particle.vx = -particle.vx;
        }
        if(particle.y < -1 && particle.vy < 0){
            particle.vy = -particle.vy;
        }
        if(particle.y > 1 && particle.vy > 0){
            particle.vy = -particle.vy;
        }
        if(particle.z < 0 && particle.vz < 0){
            particle.vz = -particle.vz;
        }
        if(particle.z > 2 && particle.vz > 0){
            particle.vz = -particle.vz;
        }
    }
}