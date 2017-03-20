const Color = {
    fog: 0xdbdfce,
    ambient: 0xc6c6c6,
    sea: 0xb67768,
    planeMain: 0xaa3311,
    planeSub: 0xdc7b17,
    coin: 0x68c3c0,
    stone: 0x59332e
};

var game = {},
    deltaTime = 0;

var newTime = new Date().getTime(),
    oldTime = new Date().getTime();

function reset() {
  game = {
    status: "playing",
    dis: 0,
    speed: 0.01,
    energy: 100,

    planeDefaultHeight: 100,
    planeAmp: 60,
    planeCollisionDisplacementX:0,
    planeCollisionSpeedX:0,
    planeCollisionDisplacementY:0,
    planeCollisionSpeedY:0,

    coinMin: 15,  //碰撞得分最短距离
    disForCoins: 60,  //生成coin距离
    lastCoin: 0,
    coinSpeed: 0.006,
    coinValue: 3,

    stoneMin: 15,
    disForStones: 40,
    lastStone: 0,
    stoneSpeed: 0.008,
    stoneValue: 10,

    seaRadius: 600,
    waveSpeed: 0.002,
    waveAmp: 15
  };
}

var width, height, scene, camera, renderer;
function createScene() {
  width = window.innerWidth;
  height = window.innerHeight;
  let fov = 60,
      aspect = width / height,
      near = 1,
      far = 10000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.y = game.planeDefaultHeight;
  camera.position.z = 200;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(Color.fog, 100, 900);  //hex, near, far

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true  //抗锯齿
  });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;

  const container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", resize, false);
}

function resize() {
    let width = window.innerWidth,
        height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// 设置光线
function createLight() {
    let ambientLight = new THREE.AmbientLight(Color.ambient),
        directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(150, 350, 300);
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -400;
    directionalLight.shadow.camera.right = 400;
    directionalLight.shadow.camera.top = 400;
    directionalLight.shadow.camera.bottom = -400;
    directionalLight.shadow.mapSize.width = 2048;  //分辨率最好还是到2048级别，否则机翼下的阴影会很奇怪……
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.castShadow = true;
    scene.add(ambientLight);
    scene.add(directionalLight);
}

// 生成飞机模型
class Plane {
  constructor() {
    this.mesh = new THREE.Object3D();

    // 机舱
    let geomCabin = new THREE.BoxGeometry(35, 25, 25),
        matMain = new THREE.MeshPhongMaterial({
          color: Color.planeMain,
          shading: THREE.FlatShading
        });
    geomCabin.vertices[4].y -= 5;
    geomCabin.vertices[4].z += 10;
    geomCabin.vertices[5].y -= 5;
    geomCabin.vertices[5].z -= 10;
    geomCabin.vertices[6].y += 8;
    geomCabin.vertices[6].z += 10;
    geomCabin.vertices[7].y += 8;
    geomCabin.vertices[7].z -= 10;
    let cabin = new THREE.Mesh(geomCabin, matMain);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);
    
    let shape = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 25), matMain);
    shape.position.set(10, -10, 0);
    this.mesh.add(shape);

    // 前轮
    let geomWheel = new THREE.BoxGeometry(6, 5, 5),
        matWheel = new THREE.MeshPhongMaterial({
          color: 0x23190f,
          shading: THREE.FlatShading
        });
    let wheelLeft = new THREE.Mesh(geomWheel, matWheel);
    wheelLeft.position.set(10, -14, 7);
    this.mesh.add(wheelLeft);
    let wheelRight = new THREE.Mesh(geomWheel, matWheel);
    wheelRight.position.set(10, -14, -7);
    this.mesh.add(wheelRight);

    // 机翼
    let wing = new THREE.Mesh(new THREE.BoxGeometry(15, 3, 70), matMain);
    wing.position.y = 3;
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);

    // 机头
    let geomEngine = new THREE.BoxGeometry(10, 25, 25),
        matSub = new THREE.MeshPhongMaterial({
          color: Color.planeSub,
          shading: THREE.FlatShading
        });
    let engine = new THREE.Mesh(geomEngine, matSub);
    engine.position.x = 20;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // 螺旋桨支柱
    let matPropeller = new THREE.MeshPhongMaterial({
       color: 0x23190f,
       shading: THREE.FlatShading
    });
    this.pillar = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 3), matPropeller);
    this.pillar.position.x = 25;
    this.pillar.castShadow = true;
    this.pillar.receiveShadow = true;
    this.mesh.add(this.pillar);

    // 螺旋桨桨叶
    let blade0 = new THREE.Mesh(new THREE.BoxGeometry(1, 40, 5), matPropeller);
    blade0.position.x = 5;
    blade0.castShadow = true;
    blade0.receiveShadow = true;
    let blade1 = blade0.clone();
    blade1.rotation.x = Math.PI/2;
    blade1.castShadow = true;
    blade1.receiveShadow = true;
    this.pillar.add(blade0);
    this.pillar.add(blade1);

    // 机尾
    let tail = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 5), matSub);
    tail.position.set(-20, 8, 0);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);

    // 后轮
    let wheel = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), matWheel);
    wheel.position.set(-17, -10, -3);
    this.mesh.add(wheel);

    let link = new THREE.Mesh(new THREE.BoxGeometry(2, 10 ,2), matMain);
    link.position.set(1.5, 5, 0);
    link.rotation.z = -0.3;
    wheel.add(link);
  }
}


class Cloud {
  constructor() {
    this.mesh = new THREE.Object3D();
    const geom = new THREE.BoxGeometry(20, 20, 20),
          mat = new THREE.MeshPhongMaterial({color: 0xffffff}),
          n = 3 + Math.round(Math.random()*3);
    for(let i=0; i<n; i++) {
      const cube = new THREE.Mesh(geom, mat);
      cube.position.x = i * 15;
      cube.position.y = Math.random() * 10;
      cube.position.z = Math.random() * 10;
      cube.rotation.y = Math.random() * Math.PI * 2;
      cube.rotation.z = Math.random() * Math.PI * 2;
      const scale = 0.3 + Math.random() * 0.7;
      cube.scale.set(scale, scale, scale);
      this.mesh.add(cube);
    }
  }
}

class Sea {
  constructor() {
    let geom = new THREE.CylinderGeometry(game.seaRadius, game.seaRadius, 400, 60, 10),
        rotation = new THREE.Matrix4().makeRotationX(-Math.PI/2);
    geom.applyMatrix(rotation);
    geom.mergeVertices();  //获取分段后的每个顶点
    const len = geom.vertices.length;
    this.waves = [];
    geom.vertices.forEach((vert, i) => {
      this.waves.push({
        x: vert.x,
        y: vert.y,
        ang: Math.PI * 2 * Math.random(),
        amp: game.waveAmp * Math.random(),
        speed: game.waveSpeed * Math.random()
      });
    });
    let mat = new THREE.MeshPhongMaterial({
      color: Color.sea,
      opacity: 0.5,
      transparent: true,
      shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }

  move() {
    let verts = this.mesh.geometry.vertices;
    verts.forEach((vert, i) => {
      let wave = this.waves[i];
      vert.x = wave.x + Math.cos(wave.ang)*wave.amp;
      vert.y = wave.y + Math.sin(wave.ang)*wave.amp;
      wave.ang += wave.speed * deltaTime;
      this.mesh.geometry.verticesNeedUpdate = true;
    });
  }
}

// 生成得分点与处理碰撞得分
class Coin {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(6,0),
          mat = new THREE.MeshPhongMaterial({
            color: Color.coin,
            shininess: 0,  // 发光
            specular: 0xffffff,  // 反射
            shading: THREE.FlatShading
          });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow = true;
    this.ang = 0;
    this.dis = 0;
  }
}

class Coins {
  constructor(n) {
    this.mesh = new THREE.Object3D();
    this.coinsToUse = [];
    this.coinsPool = [];
    for(let i=0; i<n; i++){
      let coin = new Coin();
      this.coinsPool.push(coin);
    }
  }

  spawn(){
    const n = 1 + Math.floor(Math.random()*9),
          d = game.seaRadius + game.planeDefaultHeight + (-1+Math.random()*2) * 50,
          amp = 10 + Math.round(Math.random()*10);  //为了每个coin的排布不单调，添加排列的振幅
    for(let i=0; i<n; i++) {
      let coin = this.coinsPool.length ? this.coinsPool.pop() : new Coin();
      this.mesh.add(coin.mesh);
      this.coinsToUse.push(coin);
      coin.ang = -(i*0.05);
      coin.dis = d + Math.cos(i*0.5)*amp;   //每个coin距地心的距离
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.ang)*coin.dis;
      coin.mesh.position.x = Math.cos(coin.ang)*coin.dis;
    }
  }

  rotate() {
    for(let i=0; i<this.coinsToUse.length; i++) {
      let coin = this.coinsToUse[i];
      coin.ang += game.coinSpeed;
      if(coin.ang > Math.PI*2) coin.ang -= Math.PI*2;
      coin.mesh.position.x = Math.cos(coin.ang)*coin.dis;
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.ang)*coin.dis;
      coin.mesh.rotation.y += Math.random()*0.1;
      coin.mesh.rotation.z += Math.random()*0.1;

      let diffPos = plane.mesh.position.clone().sub(coin.mesh.position.clone()),
          d = diffPos.length();
      if(d<game.coinMin || coin.ang>Math.PI) {
        this.coinsPool.unshift(this.coinsToUse.splice(i,1)[0]);
        this.mesh.remove(coin.mesh);
        if(d<game.coinMin) {  //碰撞条件
            particles.spawn(coin.mesh.position.clone(), 5, 0x009999, .8);
            addEnergy();
        }
        i--;
      }
    }
  }

}


// 障碍物
class Stone {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(8,2),
          mat = new THREE.MeshPhongMaterial({
            color: Color.stone,
            shininess: 0,
            specular: Color.ambient,
            shading: THREE.FlatShading
          });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow = true;
    this.ang = 0;
    this.dis = 0;
  }
}

class Stones {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.stonesToUse = [];
  }

  spawn(){
    let n = 1+Math.random()*3;
    for(let i=0; i<n; i++) {
      let stone = stonesPool.length ? stonesPool.pop() : new Stone();
      stone.ang = -(i*0.2);
      stone.dis = game.seaRadius + game.planeDefaultHeight + (-1+Math.random()*2) * game.planeAmp;
      stone.mesh.position.x = Math.cos(stone.ang)*stone.dis;
      stone.mesh.position.y = -game.seaRadius + Math.sin(stone.ang)*stone.dis;
      this.mesh.add(stone.mesh);
      this.stonesToUse.push(stone);
    }
  }

  rotate(){
    this.stonesToUse.forEach((stone, i) => {
      stone.ang += game.stoneSpeed;
      if(stone.ang>Math.PI*2) stone.ang -= Math.PI*2;
      stone.mesh.position.x = Math.cos(stone.ang)*stone.dis;
      stone.mesh.position.y = -game.seaRadius + Math.sin(stone.ang)*stone.dis;
      stone.mesh.rotation.y += Math.random()*.1;
      stone.mesh.rotation.z += Math.random()*.1;
      
      let diffPos = plane.mesh.position.clone().sub(stone.mesh.position.clone()),
          d = diffPos.length();
      if(d<game.stoneMin) {
        particles.spawn(stone.mesh.position.clone(), 15, Color.stone, 3);
        stonesPool.unshift(this.stonesToUse.splice(i,1)[0]);
        this.mesh.remove(stone.mesh);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        reduceEnergy();
        i--;
      }else if(stone.ang > Math.PI){
        stonesPool.unshift(this.stonesToUse.splice(i,1)[0]);
        this.mesh.remove(stone.mesh);
        i--;
      }
    });
  }

}

// 碰撞后产生碎片
class Particle {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(2,0),
            mat = new THREE.MeshPhongMaterial({
            shininess: 0,
            specular: Color.ambient,
            shading: THREE.FlatShading
          });
    this.mesh = new THREE.Mesh(geom,mat);
  }

  explode(position, scale) {
    this.mesh.scale.set(scale, scale, scale);
    let parent = this.mesh.parent,
        x = position.x + (-1 + Math.random()*2)*80,
        y = position.y + (-1 + Math.random()*2)*80,
        speed = 0.6+Math.random()*0.2;
    TweenMax.to(this.mesh.rotation, speed, { x:Math.random()*12, y:Math.random()*12 });
    TweenMax.to(this.mesh.scale, speed, { x:0.1, y:0.1, z:0.1 });
    TweenMax.to(this.mesh.position, speed, { x:x, y:y, delay:Math.random()*0.1, ease:Power2.easeOut, onComplete:() => {
        if(parent) parent.remove(this.mesh);
        this.mesh.scale.set(1,1,1);
        particlesPool.unshift(this);
    }});
  }

}

class Particles {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.array = [];
  }

  spawn(position, n, color, scale) {
    for(let i=0; i<n; i++) {
      let particle = particlesPool.length ? particlesPool.pop() : new Particle();
      particle.mesh.material.color = new THREE.Color(color);
      particle.mesh.material.needsUpdate = true;
      this.mesh.add(particle.mesh);
      particle.mesh.visible = true;
      particle.mesh.position.x = position.x;
      particle.mesh.position.y = position.y;
      particle.explode(position, scale);
    }
  }
}

var sea;
function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

var sky;
function createSky() {
  sky = new THREE.Object3D();
  const num = 18;
  for(var i=0; i<num; i++) {
      var cloud = new Cloud();
      var ang = Math.PI * 2 / num * i,
          height = 1200 + (-1+Math.random()*2) * 200;
      cloud.mesh.position.x = height * Math.cos(ang);
      cloud.mesh.position.y = height * Math.sin(ang);
      cloud.mesh.position.z = -Math.random() * 200 -500;
      cloud.mesh.rotation.z = ang + Math.PI/2;  //旋转每朵云使之后云的移动显得正常
      var scale = Math.random() * 3 + 1;
      cloud.mesh.scale.set(scale, scale, scale);
      sky.add(cloud.mesh);
  }
  sky.position.y = -game.seaRadius;
  scene.add(sky);
}

var plane;
function createPlane() {
    plane = new Plane();
    plane.mesh.position.y = game.planeDefaultHeight;
    plane.mesh.scale.set(0.6, 0.6, 0.6);
    scene.add(plane.mesh);
}

var coins;
function createCoins(){
  coins = new Coins(20);
  scene.add(coins.mesh)
}

var stones, stonesPool = [];
function createStones(){
  for(let i=0; i<10; i++){
    let stone = new Stone();
    stonesPool.push(stone);
  }
  stones = new Stones();
  scene.add(stones.mesh)
}

var particles, particlesPool = [];
function createParticles(){
  for(let i=0; i<10; i++){
    let particle = new Particle();
    particlesPool.push(particle);
  }
  particles = new Particles();
  scene.add(particles.mesh)
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function reduceEnergy(){
  game.energy -= game.stoneValue;
  game.energy = Math.max(0, game.energy);
}

//鼠标控制飞机上下
var ratioY = 0;
function mousemove(event) {
  ratioY = ((height/2)-event.clientY) / height;
}

function updatePlane() {
  plane.pillar.rotation.x += 0.3;
  let targetX = -50,
      targetY = game.planeDefaultHeight + ratioY*150;
  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;
  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  plane.mesh.position.x += (targetX - plane.mesh.position.x) * deltaTime * 0.005;
  plane.mesh.position.y += (targetY - plane.mesh.position.y) * deltaTime * 0.005;

  plane.mesh.rotation.z = (targetY - plane.mesh.position.y) * deltaTime * 0.001;

  game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)* deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY) * deltaTime * 0.01;
}

// 与coin碰撞后得分
function updateEnergy(){
  game.energy -= deltaTime*0.002;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy) + "%";
  energyBar.style.backgroundColor = (game.energy<50) ? "#f25346" : "#68c3c0";
  energyBar.style.animationName = (game.energy<30) ? "blink" : "none";
  if(game.energy<1) {
      game.status = "gameover";
  }
}

// 帧处理
function loop() {
  newTime = new Date().getTime();
  deltaTime = newTime - oldTime;
  oldTime = newTime;
  if(game.status=="playing") {
    game.dis += game.speed * deltaTime;
    distance.innerHTML = Math.floor(game.dis);

    //每经过game.disForCoins的距离生成coins
    if(Math.floor(game.dis)%game.disForCoins==0 && Math.floor(game.dis)>game.lastCoin){
      game.lastCoin = Math.floor(game.dis);
      coins.spawn();
    }

    if(Math.floor(game.dis)%game.disForStones==0 && Math.floor(game.dis)>game.lastStone){
      game.lastStone = Math.floor(game.dis);
      stones.spawn();
    }

    updatePlane();
    updateEnergy();

    sky.rotation.z += 0.005;
    sea.mesh.rotation.z += 0.008;
  }else {
    game.speed *= 0.9;
      sky.rotation.z += 0.001;
      sea.mesh.rotation.z += 0.003;
      plane.mesh.rotation.z += (-Math.PI/2 - plane.mesh.rotation.z)*0.02;
      plane.mesh.rotation.x += 0.0003*deltaTime;
      plane.mesh.position.y -= 2;
      if (plane.mesh.position.y < -100){
          replayMessage.style.display = "block";
      }
    
  }
  
  sea.move();
  
  coins.rotate();
  stones.rotate();
  
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function replay() {
  if(game.status=="gameover") {
    replayMessage.style.display = "none";
    reset();
    plane.mesh.rotation.x = 0;
  }
}

window.onload = function() {
  const distance = document.getElementById("distance"),
        energyBar = document.getElementById("energyBar"),
        replayMessage = document.getElementById("replayMessage");
  reset();
  createScene();
  createLight();
  createSea();
  createSky();
  createPlane();
  createCoins();
  createStones();
  createParticles();
  document.addEventListener("mousemove", mousemove, false);
  document.addEventListener("click", replay, false);
  loop();
}