////////////////////
// POINTER LOCK
////////////////////

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
  
  var element = document.body;
  
  var pointerlockchange = function (event) {
    
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
      
      mPortalController.enable();
      
      blocker.style.display = 'none';
      
    } else {
      
      mPortalController.disable();
      
      blocker.style.display = '-webkit-box';
      blocker.style.display = '-moz-box';
      blocker.style.display = 'box';
      
      instructions.style.display = '';
      
    }
    
  }
  
  var pointerlockerror = function (event) {
    
    instructions.style.display = '';
    
  }
  
  // Hook pointer lock state change events
  document.addEventListener('pointerlockchange', pointerlockchange, false);
  document.addEventListener('mozpointerlockchange', pointerlockchange, false);
  document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
  
  document.addEventListener('pointerlockerror', pointerlockerror, false);
  document.addEventListener('mozpointerlockerror', pointerlockerror, false);
  document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
  
  instructions.addEventListener('click', function (event) {
    
    instructions.style.display = 'none';
    
    // Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    
    if (/Firefox/i.test(navigator.userAgent)) {
      
      var fullscreenchange = function (event) {
        
        if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
          
          document.removeEventListener('fullscreenchange', fullscreenchange);
          document.removeEventListener('mozfullscreenchange', fullscreenchange);
          
          element.requestPointerLock();
        }
        
      }
      
      document.addEventListener('fullscreenchange', fullscreenchange, false);
      document.addEventListener('mozfullscreenchange', fullscreenchange, false);
      
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
      
      element.requestFullscreen();
      
    } else {
      
      element.requestPointerLock();
      
    }
    
  }, false);
  
} else {
  instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

////////////////////
// INIT
////////////////////

// THREE stuff
var mRenderer,
  mCamera,
  mClock;

// the portal controller is where the magic happens
var mPortalController;

// scenes
var mScene1,
  mScene2;

window.onload = function () {
  initTHREE();
  initScenes();
  initPortals();
  
  window.addEventListener('resize', resize);
  resize();
  
  requestAnimationFrame(loop);
};

function initTHREE() {
  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mClock = new THREE.Clock();
  
  document.body.appendChild(mRenderer.domElement);
}

function initScenes() {
  initScene1();
  initScene2();
}

function initScene1() {
  mScene1 = new THREE.Scene();
  
  // place some objects in the scene
  var geometry, material, mesh, light;
  
  // sky
  geometry = new THREE.SphereGeometry(1000);
  material = new THREE.MeshBasicMaterial({color: 0xaaaaaa, side: THREE.BackSide});
  mesh = new THREE.Mesh(geometry, material);
  mScene1.add(mesh);
  
  // a box in the center
  geometry = new THREE.BoxGeometry(400, 25, 20);
  material = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 12.5, -10);
  mScene1.add(mesh);
  
  // something fancy to look at
  geometry = new THREE.TorusKnotGeometry(10, 1, 64, 8, 3, 5);
  material = new THREE.MeshBasicMaterial({color: 0x00FF00});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 20, 75);
  mScene1.add(mesh);
  
  geometry = new THREE.TorusKnotGeometry(10, 1, 64, 8, 7, 11);
  material = new THREE.MeshBasicMaterial({color: 0x00FF00});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 20, -75);
  mScene1.add(mesh);
  
  // the floor
  geometry = new THREE.PlaneBufferGeometry(400, 400);
  material = new THREE.MeshBasicMaterial({color: 0x0000ff});
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI * 1.5;
  mScene1.add(mesh);
  
  // lights
  light = new THREE.DirectionalLight(0x000000, 1);
  light.position.set(1, 1, -1).normalize();
  mScene1.add(light);
  
  light = new THREE.AmbientLight(0x101010);
  mScene1.add(light);
}

function initScene2() {
  mScene2 = new THREE.Scene();
  
  // place some objects in the scene
  var geometry, material, mesh, light;
  
  // sky
  geometry = new THREE.SphereGeometry(1000);
  material = new THREE.MeshBasicMaterial({color: 0xeeeeee, side: THREE.BackSide});
  mesh = new THREE.Mesh(geometry, material);
  mScene2.add(mesh);
  
  // a box in the center
  geometry = new THREE.BoxGeometry(40, 25, 20);
  material = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 12.5, 10);
  mScene2.add(mesh);
  
  // something fancy to look at
  geometry = new THREE.TorusKnotGeometry(10, 4, 64, 8, 2, 3);
  material = new THREE.MeshBasicMaterial({color: 0xFF0000});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 20, -75);
  mScene2.add(mesh);
  
  // the floor
  geometry = new THREE.PlaneBufferGeometry(400, 400);
  material = new THREE.MeshBasicMaterial({color: 0xff00ff});
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI * 1.5;
  mScene2.add(mesh);
  
  // lights
  light = new THREE.DirectionalLight(0x000000, 1);
  light.position.set(1, 1, -1).normalize();
  mScene2.add(light);
  
  light = new THREE.AmbientLight(0x101010);
  mScene2.add(light);
}

function initPortals() {
  // first create the controller
  mPortalController = new THREE.PortalController({
    camera: mCamera,
    renderer: mRenderer
  });
  
  // then register the scenes
  mPortalController.registerScene('scene-1', mScene1);
  mPortalController.registerScene('scene-2', mScene2);
  
  // then create the portals
  var portal1 = mPortalController.createPortal(20, 20, 'scene-1');
  portal1.position.set(-50, 10, 0);
  
  var extraPortal = mPortalController.createPortal(20, 20, 'scene-1');
  extraPortal.position.set(50, 10, 0);
  
  var portal2 = mPortalController.createPortal(20, 20, 'scene-2');
  portal2.position.set(0, 10, 0);
  portal2.rotateY(Math.PI);
  
  // then link the portals (portals don't have to be bi-directional)
  portal1.setDestinationPortal(portal2);
  portal2.setDestinationPortal(portal1);
  extraPortal.setDestinationPortal(portal1);
  
  // then set the starting scene
  mPortalController.setCurrentScene('scene-1');
  
  // set the starting camera position
  mPortalController.setCameraPosition(0, 0, 60);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function update() {
  mPortalController.update(mClock.getDelta());
}

function render() {
  mPortalController.render();
}

function resize() {
  mPortalController.setSize(window.innerWidth, window.innerHeight);
}
