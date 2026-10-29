import * as THREE from "../frontend/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../frontend/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import fs from "fs";
import path from "path";

const loader = new GLTFLoader();
const filePath = path.resolve("frontend/public/models/Xbot.glb");
const data = fs.readFileSync(filePath);
const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

loader.parse(arrayBuffer, "", (gltf) => {
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  console.log("Bounding box min:", box.min);
  console.log("Bounding box max:", box.max);
  console.log("Model Size (W, H, D):", size);
  console.log("Model Center:", center);

  let headBone, neckBone, spine2Bone;
  gltf.scene.traverse((c) => {
    if (c.isBone) {
      if (c.name.includes("Head") && !c.name.includes("Top")) headBone = c;
      if (c.name.includes("Neck")) neckBone = c;
      if (c.name.includes("Spine2")) spine2Bone = c;
    }
  });

  const headPos = new THREE.Vector3();
  headBone.getWorldPosition(headPos);
  console.log("Head Bone World Position:", headPos);

  const neckPos = new THREE.Vector3();
  neckBone.getWorldPosition(neckPos);
  console.log("Neck Bone World Position:", neckPos);

  const spinePos = new THREE.Vector3();
  spine2Bone.getWorldPosition(spinePos);
  console.log("Spine2 Bone World Position:", spinePos);
});
