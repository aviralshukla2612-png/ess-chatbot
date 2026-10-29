"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Flagship NexusAI Photorealistic Humanoid Robot
 * - Exact match to reference screenshot:
 *   - Perfectly bent, raised arm pose (elbows tucked down at waist, forearms bent up & forward)
 *   - Sleek companion micro-LED matrix eyes seamlessly integrated at eye level (no square patch boxes)
 *   - Soft luxury studio lighting with subtle satin sheen (no blown-out chest hotspots)
 *   - High-impact bust crop (hips/pelvis hidden below frame, head centered with ROBO watermark)
 *   - Smooth cursor tracking and organic breathing animation
 */
export default function RobotHeroCanvas({ className = "", onPoseChange = null }) {
  const containerRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect WebGL support
    try {
      const canvasTest = document.createElement("canvas");
      const gl = canvasTest.getContext("webgl") || canvasTest.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    // 2. Check reduced-motion preference
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 3. Scene, Camera, Renderer Setup
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 620;

    const scene = new THREE.Scene();

    // Perspective camera framing head, carbon shoulders, and raised hands (pelvis/hips cropped below)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.44, 1.48);
    camera.lookAt(0, 0.42, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. STUDIO LIGHTING SETUP (Soft luxury studio monochrome - NO blown out hotspots)
    const ambientLight = new THREE.AmbientLight(0x181c22, 1.6);
    scene.add(ambientLight);

    // Overhead top key softbox: sculpted rim across helmet top and shoulders
    const topKeyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    topKeyLight.position.set(0, 3.8, 1.2);
    scene.add(topKeyLight);

    // Front soft diffused fill: delicate fill that reveals carbon weave without blowing out chest
    const frontFillLight = new THREE.DirectionalLight(0xe2e8f0, 0.85);
    frontFillLight.position.set(0, 0.6, 2.8);
    scene.add(frontFillLight);

    // Dual white studio rim lights for crisp silhouette definition
    const rimLightLeft = new THREE.DirectionalLight(0xffffff, 3.6);
    rimLightLeft.position.set(-3.2, 1.6, -1.0);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xffffff, 3.6);
    rimLightRight.position.set(3.2, 1.6, -1.0);
    scene.add(rimLightRight);

    // Subtle upward bounce fill under chin and elbows
    const underFill = new THREE.DirectionalLight(0x475569, 0.8);
    underFill.position.set(0, -2.0, 1.0);
    scene.add(underFill);

    // 5. PROCEDURAL 2x2 TWILL CARBON-FIBER TEXTURE
    let carbonTexture = null;
    try {
      const texCanvas = document.createElement("canvas");
      texCanvas.width = 128;
      texCanvas.height = 128;
      const ctx = texCanvas.getContext("2d");
      ctx.fillStyle = "#121418";
      ctx.fillRect(0, 0, 128, 128);

      const blockSize = 8;
      for (let y = 0; y < 128; y += blockSize) {
        for (let x = 0; x < 128; x += blockSize) {
          const isAlt = (Math.floor(x / blockSize) + Math.floor(y / blockSize)) % 2 === 0;
          const gradient = ctx.createLinearGradient(x, y, x + blockSize, y + blockSize);
          if (isAlt) {
            gradient.addColorStop(0, "#2c313a");
            gradient.addColorStop(0.5, "#181b22");
            gradient.addColorStop(1, "#0d0f13");
          } else {
            gradient.addColorStop(0, "#0d0f13");
            gradient.addColorStop(0.5, "#1c1f26");
            gradient.addColorStop(1, "#282d36");
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, blockSize, blockSize);

          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, blockSize, blockSize);
        }
      }

      carbonTexture = new THREE.CanvasTexture(texCanvas);
      carbonTexture.wrapS = THREE.RepeatWrapping;
      carbonTexture.wrapT = THREE.RepeatWrapping;
      carbonTexture.repeat.set(14, 14);
    } catch (e) {
      // Fallback
    }

    // 6. PHYSICALLY BASED MATERIALS (PBR)
    // Satin carbon shell with smooth specular highlights (prevents white flare)
    const carbonArmorShell = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0e1014),
      metalness: 0.50,
      roughness: 0.36,
      bumpMap: carbonTexture,
      bumpScale: 0.002,
      clearcoat: 0.45,
      clearcoatRoughness: 0.20,
      reflectivity: 0.90,
    });

    const gunmetalJoints = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1a1e26),
      metalness: 0.92,
      roughness: 0.28,
    });

    const polishedChrome = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf8fafc),
      metalness: 0.98,
      roughness: 0.05,
    });

    // Brilliant White Micro-LED Ocular Display (Two Eyes)
    const microLedMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 8.0,
      roughness: 0.05,
    });

    const eyeCenterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 10.5,
      roughness: 0.05,
    });

    // 7. SKELETAL SYSTEM STATE
    let headBone = null;
    let neckBone = null;
    let spine2Bone = null;
    let boneMap = {};

    const loader = new GLTFLoader();
    loader.load(
      "/models/Xbot.glb",
      (gltf) => {
        const model = gltf.scene;
        // Position model so head, shoulders, and raised hands fill bust crop
        model.position.set(0, -0.98, 0);
        model.scale.set(1.0, 1.0, 1.0);
        scene.add(model);

        // Traverse hierarchy: customize materials & locate skeletal bones
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.name === "Beta_Surface") {
              child.material = carbonArmorShell;
            } else if (child.name === "Beta_Joints") {
              child.material = gunmetalJoints;
            }
          }

          if (child.isBone) {
            boneMap[child.name] = child;
            if (child.name.includes("Head") && !child.name.includes("Top")) {
              headBone = child;
            } else if (child.name.includes("Neck")) {
              neckBone = child;
            } else if (child.name.includes("Spine2")) {
              spine2Bone = child;
            }
          }
        });

        // 8. ATTACH CHROME HELMET COWL & TWO EXPRESSIVE WHITE LED DOT MATRIX EYES ON HEAD BONE
        // Note: Head bone local coordinates: Y ~ 5.5 is eye level, Z ~ 13.8 is visor surface
        if (headBone) {
          // Chrome Cranial Shell (enclosing back & top of skull, framing faceplate)
          const chromeDome = new THREE.Mesh(
            new THREE.SphereGeometry(9.6, 32, 24, Math.PI * 0.45, Math.PI * 1.1, 0, Math.PI * 0.72),
            polishedChrome
          );
          chromeDome.position.set(0, 6.5, -0.6);
          headBone.add(chromeDome);

          // Side Chrome Ear Sensor Modules
          [-1, 1].forEach((dir) => {
            const earGroup = new THREE.Group();
            earGroup.position.set(dir * 8.6, 7.8, 0.4);

            const outerRing = new THREE.Mesh(
              new THREE.CylinderGeometry(2.3, 2.3, 1.1, 24),
              polishedChrome
            );
            outerRing.rotation.z = Math.PI / 2;
            earGroup.add(outerRing);

            const innerAccent = new THREE.Mesh(
              new THREE.TorusGeometry(1.3, 0.2, 16, 24),
              gunmetalJoints
            );
            innerAccent.rotation.y = Math.PI / 2;
            innerAccent.position.set(dir * 0.6, 0, 0);
            earGroup.add(innerAccent);

            headBone.add(earGroup);
          });

          // FUNCTION TO BUILD EACH EYE (Two distinct eye clusters: Left Eye & Right Eye)
          const createEye = (isRight) => {
            const eyeGroup = new THREE.Group();
            const dir = isRight ? 1 : -1;
            // Positioned at natural eye height and depth
            eyeGroup.position.set(dir * 3.4, 5.5, 13.8);
            eyeGroup.rotation.set(-0.06, dir * 0.15, dir * 0.08);

            // Subtle dark flush backing for maximum optical contrast
            const eyeBacking = new THREE.Mesh(
              new THREE.CylinderGeometry(1.5, 1.5, 0.05, 24),
              new THREE.MeshBasicMaterial({ color: 0x020305 })
            );
            eyeBacking.rotation.x = Math.PI / 2;
            eyeBacking.position.set(0, 0, -0.04);
            eyeGroup.add(eyeBacking);

            // Sleek 7x4 matrix of glowing micro-LED dots (Reference companion robot eyes)
            const pattern = [
              [0, 1, 1, 1, 1, 1, 0],
              [1, 1, 2, 2, 2, 1, 1],
              [1, 1, 2, 2, 2, 1, 1],
              [0, 1, 1, 1, 1, 1, 0],
            ];
            const dotGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 14);

            pattern.forEach((row, r) => {
              row.forEach((val, c) => {
                if (val > 0) {
                  const dot = new THREE.Mesh(dotGeo, val === 2 ? eyeCenterMat : microLedMat);
                  dot.rotation.x = Math.PI / 2;
                  dot.position.set((c - 3) * 0.34, (1.5 - r) * 0.34, 0.02);
                  eyeGroup.add(dot);
                }
              });
            });

            return eyeGroup;
          };

          const leftEye = createEye(false);
          const rightEye = createEye(true);
          headBone.add(leftEye);
          headBone.add(rightEye);

          // Dedicated white point light casting clean gleam right in front of the eyes
          const eyePointLight = new THREE.PointLight(0xffffff, 2.2, 1.2);
          eyePointLight.position.set(0, 6.0, 15.5);
          headBone.add(eyePointLight);
        }

        // 9. ATTACH CHROME MECHANICAL COLLAR TO NECK BONE
        if (neckBone) {
          const neckAssembly = new THREE.Group();
          neckAssembly.position.set(0, 3.8, 0);

          const collarRing = new THREE.Mesh(
            new THREE.TorusGeometry(4.8, 0.45, 16, 32),
            polishedChrome
          );
          collarRing.rotation.x = Math.PI / 2;
          neckAssembly.add(collarRing);

          const lowerRing = new THREE.Mesh(
            new THREE.TorusGeometry(5.2, 0.35, 16, 32),
            gunmetalJoints
          );
          lowerRing.rotation.x = Math.PI / 2;
          lowerRing.position.set(0, -2.4, 0);
          neckAssembly.add(lowerRing);

          neckBone.add(neckAssembly);
        }

        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.warn("Failed to load /models/Xbot.glb, keeping fallback:", error);
      }
    );

    // 10. POINTER TRACKING STATE & NORMALIZATION
    let pointerTargetX = 0; // -1 to +1
    let pointerTargetY = 0; // -1 to +1
    let isHovering = false;

    // Smoothed spring lerp rotations
    let currentHeadYaw = 0;
    let currentHeadPitch = 0;
    let currentNeckYaw = 0;
    let currentNeckPitch = 0;
    let currentArmYaw = 0;
    let currentArmPitch = 0;

    const handlePointerMove = (e) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (
        clientX >= rect.left - 100 &&
        clientX <= rect.right + 100 &&
        clientY >= rect.top - 100 &&
        clientY <= rect.bottom + 100
      ) {
        isHovering = true;
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        pointerTargetX = Math.max(-1.1, Math.min(1.1, normX));
        pointerTargetY = Math.max(-1.0, Math.min(1.0, normY));

        if (onPoseChange) {
          if (normX < -0.3) onPoseChange("left");
          else if (normX > 0.3) onPoseChange("right");
          else if (normY > 0.3) onPoseChange("up");
          else onPoseChange("front");
        }
      } else {
        isHovering = false;
        pointerTargetX = 0;
        pointerTargetY = 0;
        if (onPoseChange) onPoseChange("front");
      }
    };

    const handlePointerLeave = () => {
      isHovering = false;
      pointerTargetX = 0;
      pointerTargetY = 0;
      if (onPoseChange) onPoseChange("front");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // Touch support for tablets & mobile
    const handleTouchMove = (e) => {
      if (prefersReducedMotion || !e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const normX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      pointerTargetX = Math.max(-0.8, Math.min(0.8, normX));
      pointerTargetY = Math.max(-0.8, Math.min(0.8, normY));
      isHovering = true;
    };

    const handleTouchEnd = () => {
      isHovering = false;
      pointerTargetX = 0;
      pointerTargetY = 0;
      if (onPoseChange) onPoseChange("front");
    };

    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    // 11. Responsive Camera Scaling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;

      if (newW < 640) {
        camera.position.set(0, 0.40, 1.82);
      } else if (newW < 1024) {
        camera.position.set(0, 0.42, 1.60);
      } else {
        camera.position.set(0, 0.44, 1.48);
      }

      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // 12. ANIMATION & RENDER LOOP
    let animationFrameId = null;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // 1. Organic Hand & Arm Movement (Bent raised pose matching reference Image 2)
      const breathTime = elapsedTime * 1.8;
      const breath = Math.sin(breathTime);

      currentArmYaw += (pointerTargetX - currentArmYaw) * 0.05;
      currentArmPitch += (pointerTargetY - currentArmPitch) * 0.05;

      // Base arm angles: elbows tucked down beside waist, forearms bent up and forward
      const baseLeftArm = [0.15, 0.25, -1.28];
      const baseRightArm = [0.15, -0.25, 1.28];
      const baseLeftForeArm = [0.10, -2.15, 0.45];
      const baseRightForeArm = [0.10, 2.15, -0.45];
      const baseLeftHand = [0.20, 0.40, -0.30];
      const baseRightHand = [0.20, -0.40, 0.30];

      // Dynamic Upper Arms (tucked elbows + organic breathing + cursor reaction)
      if (boneMap["mixamorigLeftArm"]) {
        boneMap["mixamorigLeftArm"].rotation.set(
          baseLeftArm[0] + breath * 0.015 + currentArmPitch * 0.04,
          baseLeftArm[1] - currentArmYaw * 0.04,
          baseLeftArm[2] + breath * 0.02 - currentArmYaw * 0.03
        );
      }
      if (boneMap["mixamorigRightArm"]) {
        boneMap["mixamorigRightArm"].rotation.set(
          baseRightArm[0] + breath * 0.015 + currentArmPitch * 0.04,
          baseRightArm[1] - currentArmYaw * 0.04,
          baseRightArm[2] - breath * 0.02 - currentArmYaw * 0.03
        );
      }

      // Dynamic Forearms (bent UP in front of chest + gentle breathing flex)
      if (boneMap["mixamorigLeftForeArm"]) {
        boneMap["mixamorigLeftForeArm"].rotation.set(
          baseLeftForeArm[0] + currentArmPitch * 0.03,
          baseLeftForeArm[1] - breath * 0.03 + currentArmYaw * 0.04,
          baseLeftForeArm[2] + breath * 0.015
        );
      }
      if (boneMap["mixamorigRightForeArm"]) {
        boneMap["mixamorigRightForeArm"].rotation.set(
          baseRightForeArm[0] + currentArmPitch * 0.03,
          baseRightForeArm[1] + breath * 0.03 + currentArmYaw * 0.04,
          baseRightForeArm[2] - breath * 0.015
        );
      }

      // Dynamic Hands (curved inward facing chest + subtle wrist float)
      if (boneMap["mixamorigLeftHand"]) {
        boneMap["mixamorigLeftHand"].rotation.set(
          baseLeftHand[0] + breath * 0.02,
          baseLeftHand[1] + currentArmYaw * 0.04,
          baseLeftHand[2] + breath * 0.02
        );
      }
      if (boneMap["mixamorigRightHand"]) {
        boneMap["mixamorigRightHand"].rotation.set(
          baseRightHand[0] + breath * 0.02,
          baseRightHand[1] + currentArmYaw * 0.04,
          baseRightHand[2] - breath * 0.02
        );
      }

      // Natural curved finger pose
      ["Left", "Right"].forEach((side) => {
        const isLeft = side === "Left";
        const dir = isLeft ? -1 : 1;
        ["Thumb", "Index", "Middle", "Ring", "Pinky"].forEach((finger) => {
          for (let k = 1; k <= 3; k++) {
            const b = boneMap[`mixamorig${side}Hand${finger}${k}`];
            if (b) {
              const baseCurl = finger === "Thumb" ? 0.35 : 0.50;
              const fingerPulse = Math.sin(breathTime + k * 0.4) * 0.025;
              b.rotation.z = dir * (baseCurl + fingerPulse);
            }
          }
        });
      });

      // 2. Interactive Head & Neck Tracking
      const targetHeadYaw = pointerTargetX * 0.32;
      const targetHeadPitch = -pointerTargetY * 0.20;

      const targetNeckYaw = pointerTargetX * 0.11;
      const targetNeckPitch = -pointerTargetY * 0.08;

      const lerpFactor = 0.065;
      currentHeadYaw += (targetHeadYaw - currentHeadYaw) * lerpFactor;
      currentHeadPitch += (targetHeadPitch - currentHeadPitch) * lerpFactor;

      currentNeckYaw += (targetNeckYaw - currentNeckYaw) * (lerpFactor * 0.85);
      currentNeckPitch += (targetNeckPitch - currentNeckPitch) * (lerpFactor * 0.85);

      if (headBone) {
        headBone.rotation.y = currentHeadYaw;
        headBone.rotation.x = currentHeadPitch;
      }

      if (neckBone) {
        neckBone.rotation.y = currentNeckYaw;
        neckBone.rotation.x = currentNeckPitch;
      }

      // 3. Subtle Chest/Spine Breathing
      if (spine2Bone) {
        spine2Bone.rotation.x = Math.sin(elapsedTime * 1.5) * 0.015;
      }

      // 4. Subtle Micro-LED Eye Luminescence Shimmer & Natural Micro-Blink
      if (microLedMat && eyeCenterMat) {
        const cycle = elapsedTime % 4.8;
        if (cycle > 4.62) {
          // Rapid eyelid blink dip
          microLedMat.emissiveIntensity = 0.8;
          eyeCenterMat.emissiveIntensity = 1.0;
        } else {
          // Sentient digital luminescence
          const pulse = 8.0 + Math.sin(elapsedTime * 3.0) * 0.8;
          microLedMat.emissiveIntensity = pulse;
          eyeCenterMat.emissiveIntensity = pulse + 2.5;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);

      scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      if (carbonTexture) carbonTexture.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
        style={{ minHeight: "520px" }}
      />

      {/* Loading State */}
      {!isLoaded && webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white animate-pulse">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">
            Loading Neural 3D Agent...
          </span>
        </div>
      )}

      {/* WebGL Fallback */}
      {!webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-neutral-950/90 backdrop-blur-xs rounded-3xl border border-neutral-800">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white mb-3 shadow-md">
            🤖
          </div>
          <h3 className="font-bold text-sm text-white">WebGL Required</h3>
          <p className="text-xs text-neutral-400 max-w-xs mt-1">
            Hardware acceleration is required to render the real-time 3D interactive robot.
          </p>
        </div>
      )}
    </div>
  );
}
