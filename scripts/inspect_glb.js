import fs from "fs";
import path from "path";

// Simple GLTF binary header parser
const filePath = path.resolve("frontend/public/models/Xbot.glb");
const buf = fs.readFileSync(filePath);

// Header: magic (4), version (4), length (4)
const magic = buf.readUInt32LE(0);
const version = buf.readUInt32LE(4);
const length = buf.readUInt32LE(8);

// Chunk 0: json length (4), chunk type (4 = 0x4E4F534A)
const jsonChunkLength = buf.readUInt32LE(12);
const jsonChunkType = buf.readUInt32LE(16);
const jsonBuf = buf.slice(20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonBuf.toString("utf8"));

console.log("=== GLTF NODES & BONES ===");
const boneNodes = (gltf.nodes || []).map((n, i) => ({ idx: i, name: n.name, children: n.children }));
console.log("Total nodes:", gltf.nodes.length);
console.log("Nodes list:", boneNodes.filter(n => n.name).map(n => n.name));

console.log("=== GLTF MESHES & MATERIALS ===");
console.log("Meshes:", (gltf.meshes || []).map(m => m.name));
console.log("Materials:", (gltf.materials || []).map(m => m.name));
console.log("Skins:", gltf.skins ? JSON.stringify(gltf.skins, null, 2) : "None");
console.log("Animations:", (gltf.animations || []).map(a => a.name));
