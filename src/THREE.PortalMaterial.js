THREE.PortalMaterial = function () {
  THREE.MeshFaceMaterial.call(this, [
    new THREE.MeshBasicMaterial(),
    new THREE.MeshBasicMaterial({visible:false})
  ]);
};
THREE.PortalMaterial.prototype = Object.create(THREE.MeshFaceMaterial.prototype);
THREE.PortalMaterial.prototype.constructor = THREE.PortalMaterial;
