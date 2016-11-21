window.addEventListener("load", init, false);
function init() {
    createScene();
    createLight();
    createSea();
    createSky();
    createPlane();
    document.addEventListener("mousemove", mousemove, false);
    loop();
}

var Color = {
    fog: 0xf9ecd6,
    ambient: 0xc6c6c6,
    sea: 0x68c3c0,
    plane: 0xf25346
};

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

    var container = document.getElementById("container");
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
    sea.position.y = -800;
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
    var num = 15;
    for(var i=0; i<num; i++) {
        var cloud = new Cloud();
        var ang = Math.PI * 2 / num * i,
            height = 1200 + Math.random() * 200;
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

var Plane = function(){
    this.mesh = new THREE.Object3D();
    // 机舱
    var geomCabin = new THREE.BoxGeometry(35, 25, 25);
    var matCabin = new THREE.MeshPhongMaterial({
        color: Color.plane,
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
    var cabin = new THREE.Mesh(geomCabin, matCabin);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);
    
    var geom = new THREE.BoxGeometry(10, 5, 25);
    var mat = new THREE.MeshPhongMaterial({
        color: Color.plane,
        shading: THREE.FlatShading
    });
    var shape = new THREE.Mesh(geom, mat);
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
    var geomWing = new THREE.BoxGeometry(15, 3, 70);
    var matWing = new THREE.MeshPhongMaterial({
         color: Color.plane,
         shading: THREE.FlatShading
    });
    var wing = new THREE.Mesh(geomWing, matWing);
    wing.position.y = 3;
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);
    // 机头
    var geomEngine = new THREE.BoxGeometry(10, 25, 25);
    var matEngine = new THREE.MeshPhongMaterial({
         color: 0xffffff,
         shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 20;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);
    // 螺旋桨支柱
    var geomPillar = new THREE.BoxGeometry(8, 3, 3);
    var matPillar = new THREE.MeshPhongMaterial({
       color: 0x59332e,
       shading: THREE.FlatShading
    });
    this.pillar = new THREE.Mesh(geomPillar, matPillar);
    this.pillar.position.x = 25;
    this.pillar.castShadow = true;
    this.pillar.receiveShadow = true;
    this.mesh.add(this.pillar);
    // 螺旋桨桨叶
    var geomBlade = new THREE.BoxGeometry(1, 40, 5);
    var matBlade = new THREE.MeshPhongMaterial({
       color: 0x59332e,
       shading: THREE.FlatShading
    });
    var blade0 = new THREE.Mesh(geomBlade, matBlade);
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
    var geomTail = new THREE.BoxGeometry(6, 10, 5);
    var matTail = new THREE.MeshPhongMaterial({
         color: Color.plane,
         shading: THREE.FlatShading
    });
    var tail = new THREE.Mesh(geomTail, matTail);
    tail.position.set(-20, 8, 0);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);
    // 后轮
    var wheel = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), matWheel);
    wheel.position.set(-17, -10, -3);
    this.mesh.add(wheel);

    var geomLink = new THREE.BoxGeometry(2, 10 ,2);
    var matLink = new THREE.MeshPhongMaterial({
        color: Color.plane,
        shading: THREE.FlatShading
    });
    var link = new THREE.Mesh(geomLink, matLink);
    link.position.set(1.5, 5, 0);
    link.rotation.z = -0.3;
    wheel.add(link);
}
var plane;
function createPlane() {
    plane = new Plane();
//    plane.mesh.position.x = -50;
    plane.mesh.position.y = 100;
//    plane.mesh.scale.set(0.5, 0.5, 0.5);
    scene.add(plane.mesh);
}

function loop() {
    sea.rotation.z += 0.01;
    sky.rotation.z += 0.005;
    plane.pillar.rotation.x += 0.3;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

function mousemove(event) {
    var y;
    if(event.clientY < (height/2)) {
        y = 100 + ((height/2)-event.clientY) / height * 150;
    } else {
        y = 100 - ( (event.clientY-(height/2)) / height * 100);
    }
    plane.mesh.position.y = y;
}