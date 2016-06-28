THREE.PortalController = function (settings) {
  this.camera = settings.camera;
  this.renderer = settings.renderer;
  this.renderer.autoClear = false;
  
  this.cameraControls = new THREE.PortalControls(this.camera);
  this.cameraControlsObject = this.cameraControls.getObject();
  
  this._stencilScene = new THREE.Scene();
  
  this._nameToSceneMap = {};
  this._sceneNameToPortalsMap = {};
  this._allPortals = [];
  this._singlePortal = [];
  
  this._raycaster = new THREE.Raycaster();
};
THREE.PortalController.prototype = {
  registerScene:function(name, scene) {
    scene.name = name;
    
    this._nameToSceneMap[scene.name] = scene;
    this._sceneNameToPortalsMap[scene.name] = [];
  },
  // createPortalFromPlane
  createPortal:function(width, height, sceneName) {
    var portal = new THREE.Portal(width, height);
    
    if (sceneName) {
      this.addPortalToScene(sceneName, portal);
    }
    
    return portal;
  },
  addPortalToScene:function(sceneOrName, portal) {
    var scene = (typeof sceneOrName === 'string') ? this._nameToSceneMap[sceneOrName] : sceneOrName;
    portal.setScene(scene);
    portal.parent = this._stencilScene;
    
    this._sceneNameToPortalsMap[scene.name].push(portal);
    this._allPortals.push(portal);
  },
  removePortal:function(portal) {
    
  },
  setCurrentScene:function(name) {
    this._currentScene = this._nameToSceneMap[name];
    this._currentScenePortals = this._sceneNameToPortalsMap[name];
  },
  setCameraPosition:function(x, y, z) {
    this.cameraControls.getObject().position.set(x || 0, y || 0, z || 0);
  },
  update:function(dt) {
    this.cameraControls.updateVelocity(dt * 1000);
    
    var i,
      portal,
      intersectedPortal;
    
    for (i = 0; i < this._allPortals.length; i++) {
      this._allPortals[i].updateMatrix();
      this._allPortals[i].updateMatrixWorld(true);
    }
    
    for (i = 0; i < this._currentScenePortals.length; i++) {
      portal = this._currentScenePortals[i];
      
      if (this.checkPortalIntersection(portal).length > 0) {
        intersectedPortal = portal;
      }
    }
    
    if (intersectedPortal) {
      this.teleport(intersectedPortal);
      this.setCurrentScene(intersectedPortal.destinationPortal.scene.name);
    }
    
    this.cameraControls.updatePosition();
  },
  checkPortalIntersection:(function() {
    var controlsVelocity = new THREE.Vector3(),
      controlsDirection = new THREE.Vector3(),
      controlsPosition = new THREE.Vector3();
    
    var rayDirection = new THREE.Vector3(),
      rayLength = 0,
      up = new THREE.Vector3(0, 1, 0);
    
    return function(portal) {
      this.cameraControls.getVelocity(controlsVelocity);
      this.cameraControls.getDirection(controlsDirection);
      this.cameraControls.getPosition(controlsPosition);
      
      // todo fix volume face toggle
      var portalPosition = portal.position.clone(),
        distance = portalPosition.sub(controlsPosition).length();
      
      if (distance < 10) {
        portal.toggleVolumeFaces(true);
      }
      else {
        portal.toggleVolumeFaces(false);
      }
      
      rayDirection.x = controlsVelocity.x;
      rayDirection.z = controlsVelocity.z;
      rayDirection.applyAxisAngle(up, this.cameraControlsObject.rotation.y).normalize();
      
      rayLength = controlsVelocity.length();
      
      this._raycaster.set(controlsPosition, rayDirection);
      this._raycaster.far = rayLength;
      
      return this._raycaster.intersectObject(portal, false);
    };
  })(),
  teleport:(function() {
    var m = new THREE.Matrix4(),
      p = new THREE.Vector4(),
      q = new THREE.Quaternion(),
      s = new THREE.Vector4(),
      e = new THREE.Euler(0, 0, -1, "YXZ");
    
    return function(portal) {
      e.set(0, 0, -1);
      m.copy(this.computePortalViewMatrix(portal));
      m.decompose(p, q, s);
      e.setFromQuaternion(q);
      
      this.cameraControlsObject.position.copy(p);
      this.cameraControls.setDirection(e);
    };
  })(),
  render:(function() {
    var cameraMatrixWorld = new THREE.Matrix4(),
      cameraProjectionMatrix = new THREE.Matrix4();
    
    return function() {
      var gl = this.renderer.context;
      
      // make sure camera matrix is up to date
      this.cameraControlsObject.updateMatrix();
      this.cameraControlsObject.updateMatrixWorld(true);
      
      // save camera matrices because they will be modified when rending a view through a portal
      cameraMatrixWorld.copy(this.camera.matrixWorld);
      cameraProjectionMatrix.copy(this.camera.projectionMatrix);
      
      // full clear (color, depth and stencil)
      this.renderer.clear(true, true, true);
      
      var portal,
        i,
        l = this._currentScenePortals.length;
      
      // render the view through a portal inside the portal shape
      // the portals will be rendered one a time
      // directly manipulating the children array is faster than using add/remove
      this._stencilScene.children = this._singlePortal;
      
      // enable stencil test
      gl.enable(gl.STENCIL_TEST);
      // disable stencil mask
      gl.stencilMask(0xFF);
      
      for (i = 0; i < l; i++) {
        portal = this._currentScenePortals[i];
        
        // set the portal as the only child of the stencil scene
        this._singlePortal[0] = portal;
        
        // disable color + depth
        // only the stencil buffer will be drawn into
        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        
        // the stencil test will always fail (this is cheaper to compute)
        gl.stencilFunc(gl.NEVER, 1, 0xFF);
        // fragments where the portal is drawn will have a stencil value of 1
        // other fragments will retain a stencil value of 0
        gl.stencilOp(gl.REPLACE, gl.KEEP, gl.KEEP);
        
        // render the portal shape using the settings above
        this.renderer.render(this._stencilScene, this.camera);
        
        // enable color + depth
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        
        // fragments with a stencil value of 1 will be rendered
        gl.stencilFunc(gl.EQUAL, 1, 0xff);
        // stencil buffer is not changed
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        
        // compute the view through the portal
        this.camera.matrixWorld.copy(this.computePortalViewMatrix(portal));
        this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
        this.camera.projectionMatrix.copy(this.computePortalProjectionMatrix(portal.destinationPortal));
        
        // render the view through  the portal
        this.renderer.render(portal.destinationPortal.scene, this.camera);
        
        // clear the stencil buffer for the next portal
        this.renderer.clear(false, false, true);
        
        // restore original camera matrices for the next portal
        this.camera.matrixWorld.copy(cameraMatrixWorld);
        this.camera.projectionMatrix.copy(cameraProjectionMatrix);
      }
      
      // after all portals have been drawn, we can disable the stencil test
      gl.disable(gl.STENCIL_TEST);
      
      // clear the depth buffer to remove the portal views' depth from the current scene
      this.renderer.clear(false, true, false);
      
      // all the current scene portals will be drawn this time
      this._stencilScene.children = this._currentScenePortals;
      
      // disable color
      gl.colorMask(false, false, false, false);
      // draw the portal shapes into the depth buffer
      // this will make the portals appear as flat shapes
      this.renderer.render(this._stencilScene, this.camera);
      
      // enable color
      gl.colorMask(true, true, true, true);
      
      // finally, render the current scene
      this.renderer.render(this._currentScene, this.camera);
    };
  })(),
  computePortalViewMatrix:(function() {
    var rotationYMatrix = new THREE.Matrix4().makeRotationY(Math.PI),
      dstInverse = new THREE.Matrix4(),
      srcToCam = new THREE.Matrix4(),
      srcToDst = new THREE.Matrix4(),
      result = new THREE.Matrix4();
    
    return function(portal) {
      var cam = this.camera,
        src = portal,
        dst = portal.destinationPortal;
      
      srcToCam.multiplyMatrices(cam.matrixWorldInverse, src.matrix);
      dstInverse.getInverse(dst.matrix);
      srcToDst.identity().multiply(srcToCam).multiply(rotationYMatrix).multiply(dstInverse);
      
      result.getInverse(srcToDst);
      
      return result;
    }
  })(),
  computePortalProjectionMatrix:(function() {
    var dstRotationMatrix = new THREE.Matrix4(),
      normal = new THREE.Vector3(),
      clipPlane = new THREE.Plane(),
      clipVector = new THREE.Vector4(),
      q = new THREE.Vector4(),
      projectionMatrix = new THREE.Matrix4();
    
    function sign(s) {
      if (s > 0) return 1;
      if (s < 0) return -1;
      return 0;
    }
    
    //for math, see http://www.terathon.com/code/oblique.html
    return function(dst) {
      dstRotationMatrix.identity();
      dstRotationMatrix.extractRotation(dst.matrix);
      
      normal.set(0, 0, 1).applyMatrix4(dstRotationMatrix);
      
      clipPlane.setFromNormalAndCoplanarPoint(normal, dst.position);
      clipPlane.applyMatrix4(this.camera.matrixWorldInverse);
      
      clipVector.set(clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant);
      
      projectionMatrix.copy(this.camera.projectionMatrix);
      
      q.x = (sign(clipVector.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
      q.y = (sign(clipVector.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
      q.z = -1.0;
      q.w = (1.0 + projectionMatrix.elements[10]) / this.camera.projectionMatrix.elements[14];
      
      clipVector.multiplyScalar(2 / clipVector.dot(q));
      
      projectionMatrix.elements[2] = clipVector.x;
      projectionMatrix.elements[6] = clipVector.y;
      projectionMatrix.elements[10] = clipVector.z + 1.0;
      projectionMatrix.elements[14] = clipVector.w;
      
      return projectionMatrix;
    }
  })(),
  setSize:function(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    for (var i = 0; i < this._allPortals.length; i++) {
      this._allPortals[i].setVolumeFromCamera(this.camera);
    }
    
    this.renderer.setSize(width, height);
  },
  enable:function() {
    this.cameraControls.enabled = true;
  },
  disable:function() {
    this.cameraControls.enabled = false;
  }
};
