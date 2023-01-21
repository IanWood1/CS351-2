class Constraint {
    applyConstraint(particle) {
    }
};



// 2x2x2 with the bottom on z = 0 centered at the origin
class BoxConstraint{



    applyConstraint(particle){
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
}