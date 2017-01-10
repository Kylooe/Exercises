var Color = {
    fog: 0xdbdfce,
    ambient: 0xc6c6c6,
    sea: 0xb67768,
    planeMain: 0xaa3311,
    planeSub: 0xdc7b17,
    //coin: 0xf2e3c4
    coin: 0x68c3c0,
    stone: 0x59332e
};

var newTime = new Date().getTime(),
    oldTime = new Date().getTime(),
    deltaTime = 0,
    dis = 0,
    energy = 100,
    status = "playing";

var width, height, scene, camera, renderer;
function createScene() {
    width = window.innerWidth;
    height = window.innerHeight;
    var fov = 60,
        aspect = width / height,
        near = 1,
        far = 10000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.y = 100;
    camera.position.z = 200;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(Color.fog, 100, 900); // hex, near, far

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true // 抗锯齿
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    var container = document.getElementById("world");
    container.appendChild(renderer.domElement);

    window.addEventListener("resize", resize, false);
}

function resize() {
    var width = window.innerWidth,
        height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function createLight() {
    var ambientLight = new THREE.AmbientLight(Color.ambient);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(150, 350, 300);
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -400;
    directionalLight.shadow.camera.right = 400;
    directionalLight.shadow.camera.top = 400;
    directionalLight.shadow.camera.bottom = -400;
    directionalLight.shadow.mapSize.width = 2048;  // 分辨率最好还是到2048级别，否则机翼下的阴影会很奇怪……
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.castShadow = true;
    scene.add(ambientLight);
    scene.add(directionalLight);
}

var sea;
function createSea() {
    var geom = new THREE.CylinderGeometry(800, 800, 400, 60, 10);
    var rotation = new THREE.Matrix4().makeRotationX(-Math.PI/2);
    geom.applyMatrix(rotation);
    geom.mergeVertices();  // 获取分段后的每个顶点
    var length = geom.vertices.length;
    for(var i=0; i<length; i++) {
        var vert = geom.vertices[i];
        var ang = Math.PI * 2 * Math.random(),
            ins = 10 + 10 * Math.random();
        vert.x += Math.cos(ang) * ins;
        vert.y += Math.sin(ang) * ins;
    }

    var mat = new THREE.MeshPhongMaterial({
        color: Color.sea,
        opacity: 0.5,
        transparent: true,
        shading: THREE.FlatShading
    });

    sea = new THREE.Mesh(geom, mat);
    sea.receiveShadow = true;
    sea.position.y = -780;
    sea.geometry.verticesNeedUpdate = true;
    scene.add(sea);
}


var Cloud = function(){
    this.mesh = new THREE.Object3D();
    var geom = new THREE.BoxGeometry(20, 20, 20);
    var mat = new THREE.MeshPhongMaterial({color: 0xffffff});
    var n = 3 + Math.round(Math.random() * 3);
    for(var i=0; i<n; i++) {
        var cube = new THREE.Mesh(geom, mat);
        cube.position.x = i * 15;
        cube.position.y = Math.random() * 10;
        cube.position.z = Math.random() * 10;
        cube.rotation.y = Math.random() * Math.PI * 2;
        cube.rotation.z = Math.random() * Math.PI * 2;
        var scale = 0.3 + Math.random() * 0.7;
        cube.scale.set(scale, scale, scale);
        this.mesh.add(cube);
    }
}

var sky;
function createSky() {
    sky = new THREE.Object3D();
    var num = 18;
    for(var i=0; i<num; i++) {
        var cloud = new Cloud();
        var ang = Math.PI * 2 / num * i,
            height = 1200 + (-1+Math.random()*2) * 200;
        cloud.mesh.position.x = height * Math.cos(ang);
        cloud.mesh.position.y = height * Math.sin(ang);
        cloud.mesh.position.z = -Math.random() * 200 -500;
        cloud.mesh.rotation.z = ang + Math.PI/2;  // 旋转每朵云使之后云的移动显得正常
        var scale = Math.random() * 3 + 1;
        cloud.mesh.scale.set(scale, scale, scale);
        sky.add(cloud.mesh);
    }
    sky.position.y = -850;
    scene.add(sky);
}



// 生成得分点与处理碰撞得分

var Coin = function() {
    var geom = new THREE.BoxGeometry(5, 5, 5),
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

var Coins = function(){
    this.mesh = new THREE.Object3D();
    this.array = [];
    var n = 1 + Math.round(Math.random()*9),
        height = 920 + 50 * (-1+Math.random()*2),
        amp = 15 + Math.round(Math.random()*10);  // 为了每个coin的排布不单调，添加排列的振幅
    for(var i=0; i<n; i++) {
        var coin = new Coin();
        this.mesh.add(coin.mesh);
        this.array.push(coin);
        coin.ang = - (i*0.02);
        coin.dis = height + Math.cos(i*0.5)*amp;  // 每个coin距地心的距离
    }
}

Coins.prototype.update = function() {
    for(var i=this.array.length-1; i>=0; i--) {
        var coin = this.array[i];
        coin.ang += 0.005;
        if(coin.ang > Math.PI*2) {
            coin.ang -= Math.PI*2;
        }
        coin.mesh.position.x = Math.cos(coin.ang) * coin.dis;
        coin.mesh.position.y = Math.sin(coin.ang) * coin.dis - 800;
        coin.mesh.position.z = 0;
        coin.mesh.rotation.x += Math.random() * 0.1;
        coin.mesh.rotation.y += Math.random() * 0.1;
        var spacing = plane.mesh.position.clone().sub(coin.mesh.position.clone()).length();
        if(spacing<12 || coin.ang>Math.PI) {
            this.array.splice(i,1);
            this.mesh.remove(coin.mesh);
            if(spacing<12) {
                chips.generate(coin.mesh.position.clone(), 5, Color.coin, 0.8);
                scene.add(chips.mesh);
                addEnergy();
            }
        }
    }
}

var coins;
function createCoins() {
    coins = new Coins();
    scene.add(coins.mesh);
}


function addEnergy(){
    energy += 2;
    energy = Math.min(energy, 100);
}


// 障碍物
var Stone = function() {
    var geom = new THREE.TetrahedronGeometry(8,2),
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

var Stones = function() {
    this.mesh = new THREE.Object3D();
    this.array = [];
    var n = 1 + Math.round(Math.random()*3);
    for(var i=0; i<n; i++) {
        var stone = new Stone();
        stone.ang = -(i*0.15);
        stone.dis = 850 + 100 * Math.random();
        this.mesh.add(stone.mesh);
        this.array.push(stone);
    }
}

Stones.prototype.update = function() {
    for(var i=this.array.length-1; i>=0; i--) {
        var stone = this.array[i];
        stone.ang += 0.008;
        stone.mesh.position.x = Math.cos(stone.ang) * stone.dis;
        stone.mesh.position.y = Math.sin(stone.ang) * stone.dis - 800;
        stone.mesh.position.z = 0;
        stone.mesh.rotation.x += Math.random() * 0.1;
        stone.mesh.rotation.y += Math.random() * 0.1;

        var pos = plane.mesh.position.clone().sub(stone.mesh.position.clone()),
            spacing = pos.length();
        if(spacing<15 || stone.ang>Math.PI) {
            this.array.splice(i,1);
            this.mesh.remove(stone.mesh);
            if(spacing<15) {
                chips.generate(stone.mesh.position.clone(), 15, Color.stone, 2);
                reduceEnergy();
            }
        } 
    }
}

var stones;
function createStones() {
    stones = new Stones();
    scene.add(stones.mesh);
}


function reduceEnergy() {
    energy -= 10;
    energy = Math.max(0, energy);
}


// 碰撞后产生碎片
var Chip = function() {
    var geom = new THREE.TetrahedronGeometry(2,0),
        mat = new THREE.MeshPhongMaterial({
        shininess: 0,
        specular: Color.ambient,
        shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom,mat);
}

Chip.prototype.explode = function(position, scale) {
    this.mesh.scale.set(scale, scale, scale);
    var x = position.x + (-1 + Math.random()*2)*80,
        y = position.y + (-1 + Math.random()*2)*80,
        time = 12 + Math.floor(Math.random()*4),
        i = 0;
    var that = this;
    var id = setInterval(function() {
        that.mesh.rotation.x += Math.random()*15 / time;
        that.mesh.rotation.y += Math.random()*15 / time;
        that.mesh.scale.set(scale+(0.1-scale)/time*i, scale+(0.1-scale)/time*i, scale+(0.1-scale)/time*i);
        that.mesh.position.x += (x-that.mesh.position.x)/time;
        that.mesh.position.y += (y-that.mesh.position.y)/time;
        i++;
        if(i===time) {
            that.mesh.parent.remove(that.mesh);
            chipsPool.unshift(that);
            that.mesh.scale.set(1,1,1);
            clearInterval(id);
        }
    },50);
};

/*
var Chips = function(position, n, color, scale) {
    this.mesh = new THREE.Object3D();
    for(var i=0; i<n; i++) {
        var chip = new Chip(color);
        this.mesh.add(chip.mesh);
        chip.mesh.visible = true;
        chip.mesh.position.x = position.x;
        chip.mesh.position.y = position.y;
        chip.explode(position, scale);
    }
}
*/
var Chips = function() {
    this.mesh = new THREE.Object3D();
    this.array = [];
}

var chipsPool = [];
Chips.prototype.generate = function(position, n, color, scale) {
    for(var i=0; i<n; i++) {
        var chip = chipsPool.length ? chipsPool.pop() : new Chip(color);
        chip.mesh.material.color = new THREE.Color(color);
        chip.mesh.material.needsUpdate = true;
        this.mesh.add(chip.mesh);
        chip.mesh.visible = true;
        chip.mesh.position.x = position.x;
        chip.mesh.position.y = position.y;
        chip.explode(position, scale);
    }
}

function createChips(){
    for (var i=0; i<10; i++){
        var chip = new Chip();
        chipsPool.push(chip);
    }
    chips = new Chips();
    scene.add(chips.mesh);
}



// 生成飞机模型
var Plane = function(){
    this.mesh = new THREE.Object3D();

    // 机舱
    var geomCabin = new THREE.BoxGeometry(35, 25, 25);
    var matMain = new THREE.MeshPhongMaterial({
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
    var cabin = new THREE.Mesh(geomCabin, matMain);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);
    
    var shape = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 25), matMain);
    shape.position.set(10, -10, 0);
    this.mesh.add(shape);

    // 前轮
    var geomWheel = new THREE.BoxGeometry(6, 5, 5);
    var matWheel = new THREE.MeshPhongMaterial({
        color: 0x23190f,
        shading: THREE.FlatShading
    });
    var wheelLeft = new THREE.Mesh(geomWheel, matWheel);
    wheelLeft.position.set(10, -14, 7);
    this.mesh.add(wheelLeft);
    var wheelRight = new THREE.Mesh(geomWheel, matWheel);
    wheelRight.position.set(10, -14, -7);
    this.mesh.add(wheelRight);

    // 机翼
    var wing = new THREE.Mesh(new THREE.BoxGeometry(15, 3, 70), matMain);
    wing.position.y = 3;
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);

    // 机头
    var geomEngine = new THREE.BoxGeometry(10, 25, 25);
    var matSub = new THREE.MeshPhongMaterial({
         color: Color.planeSub,
         shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matSub);
    engine.position.x = 20;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // 螺旋桨支柱
    var matPropeller = new THREE.MeshPhongMaterial({
       color: 0x23190f,
       shading: THREE.FlatShading
    });
    this.pillar = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 3), matPropeller);
    this.pillar.position.x = 25;
    this.pillar.castShadow = true;
    this.pillar.receiveShadow = true;
    this.mesh.add(this.pillar);

    // 螺旋桨桨叶
    var blade0 = new THREE.Mesh(new THREE.BoxGeometry(1, 40, 5), matPropeller);
    blade0.position.x = 5;
    blade0.castShadow = true;
    blade0.receiveShadow = true;
    var blade1 = blade0.clone();
    blade1.rotation.x = Math.PI/2;
    blade1.castShadow = true;
    blade1.receiveShadow = true;
    this.pillar.add(blade0);
    this.pillar.add(blade1);

    // 机尾
    var tail = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 5), matSub);
    tail.position.set(-20, 8, 0);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);

    // 后轮
    var wheel = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), matWheel);
    wheel.position.set(-17, -10, -3);
    this.mesh.add(wheel);

    var link = new THREE.Mesh(new THREE.BoxGeometry(2, 10 ,2), matMain);
    link.position.set(1.5, 5, 0);
    link.rotation.z = -0.3;
    wheel.add(link);
}

var plane;
function createPlane() {
    plane = new Plane();
    plane.mesh.position.x = -50;
    plane.mesh.position.y = 100;
    plane.mesh.scale.set(0.6, 0.6, 0.6);
    scene.add(plane.mesh);
}



// 鼠标控制飞机上下
var targetY = 0;
function mousemove(event) {
    if(event.clientY < (height/2)) {
        targetY = 100 + ((height/2)-event.clientY) / height * 150;
    } else {
        targetY = 100 - ( (event.clientY-(height/2)) / height * 100);
    }
}


function updateEnergy(){
  energy -= deltaTime*0.002;
  energy = Math.max(0, energy);
  energyBar.style.right = (100-energy)+"%";
  energyBar.style.backgroundColor = (energy<50)? "#f25346" : "#68c3c0";

  if (energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (energy <1){
    status = "gameover";
  }
}


// 帧处理
function loop() {
    newTime = new Date().getTime();
    deltaTime = newTime-oldTime;
    oldTime = newTime;
    if(status=="playing") {
        dis += 0.005 * deltaTime;
        distance.innerHTML = Math.floor(dis);

        if(Math.floor(dis)%35===0) {
            createCoins();
        }

        if(Math.floor(dis)%25===0) {
            createStones();
        }

        sea.rotation.z += 0.008;
        sky.rotation.z += 0.005;

        plane.pillar.rotation.x += 0.3;
        plane.mesh.position.y += (targetY - plane.mesh.position.y) * 0.1;
        plane.mesh.rotation.z = (targetY - plane.mesh.position.y) * 0.02;
        
    }else {
        sky.rotation.z += 0.002;
        if(status=="gameover"){
            plane.mesh.rotation.z += (-Math.PI/2 - plane.mesh.rotation.z)*0.02;
            plane.mesh.rotation.x += 0.0003*deltaTime;
            plane.mesh.position.y -= 2;
            if (plane.mesh.position.y < -100){
                replayMessage.style.display = "block";
            }
        }else {
            
        }
    }

    coins.update();
    stones.update();
    updateEnergy();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}


window.onload = function() {
    var distance = document.getElementById("distance"),
        energyBar = document.getElementById("energyBar"),
        replayMessage = document.getElementById("replayMessage");
    createScene();
    createLight();
    createSea();
    createSky();
    createPlane();
    createChips();
    document.addEventListener("mousemove", mousemove, false);
    loop();
}
