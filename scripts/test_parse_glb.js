import * as THREE from "../frontend/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../frontend/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import fs from "fs";
import path from "path";

const loader = new GLTFLoader();
const filePath = path.resolve("frontend/public/models/Xbot.glb");
const data = fs.readFileSync(filePath);
const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

loader.parse(arrayBuffer, "", (gltf) => {
  console.log("GLTF parsed successfully!");
  console.log("Scene children:", gltf.scene.children.map(c => c.name));
  console.log("Animations:", gltf.animations.map(a => a.name));

  let headBone, neckBone, spine2Bone;
  gltf.scene.traverse((c) => {
    if (c.isBone) {
      if (c.name.includes("Head") && !c.name.includes("Top")) headBone = c;
      if (c.name.includes("Neck")) neckBone = c;
      if (c.name.includes("Spine2")) spine2Bone = c;
    }
    if (c.isMesh) {
      console.log("Found mesh:", c.name, "geometry vertices:", c.geometry.attributes.position.count);
    }
  });

  console.log("Head bone:", headBone ? headBone.name : "None");
  console.log("Neck bone:", neckBone ? neckBone.name : "None");
  console.log("Spine2 bone:", spine2Bone ? spine2Bone.name : "None");
}, (err) => {
  console.error("Parse error:", err);
});
