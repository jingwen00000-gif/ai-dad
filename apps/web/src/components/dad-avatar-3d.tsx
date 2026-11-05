"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import type { AvatarState } from "@/lib/avatar";

/**
 * 3D 爸爸（VRM 模型，例如用 VRoid Studio 捏的）。状态与 2D 版一致：
 * idle 呼吸、眨眼、轻微摆头 · waving 挥手 · listening 歪头 · thinking 抬眼看上方 ·
 * talking 口型 · happy 笑 + 轻跳。眼睛默认看着镜头（也就是看着孩子）。
 */
export default function DadAvatar3D({
  data,
  state,
  onError,
  onReady,
}: {
  data: ArrayBuffer;
  state: AvatarState;
  onError?: () => void;
  onReady?: (vrm: VRM) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AvatarState>(state);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onError?.(); // 设备不支持 WebGL：退回 2D
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 20);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(0.6, 1.8, 2.5);
    scene.add(key, new THREE.AmbientLight(0xffffff, 1.4));

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lookUpTarget = new THREE.Object3D();
    scene.add(lookUpTarget);
    let vrm: VRM | null = null;
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = createAnimator(reduceMotion);

    parseVrm(data)
      .then((v) => {
        if (disposed) {
          VRMUtils.deepDispose(v.scene);
          return;
        }
        vrm = v;
        scene.add(v.scene);
        // 镜头对准头部和肩膀
        v.scene.updateMatrixWorld(true);
        const head = new THREE.Vector3();
        (v.humanoid.getRawBoneNode("head") ?? v.scene).getWorldPosition(head);
        camera.position.set(0, head.y - 0.05, 2.2);
        camera.lookAt(0, head.y - 0.17, 0);
        lookUpTarget.position.set(0.4, head.y + 0.9, 1.0);
        if (v.lookAt) v.lookAt.target = camera;
        setReady(true);
        onReady?.(v);
      })
      .catch(() => onError?.());

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.1);
      if (document.hidden) return;
      if (vrm) {
        const s = stateRef.current;
        if (vrm.lookAt) vrm.lookAt.target = s === "thinking" ? lookUpTarget : camera;
        animate(vrm, s, dt, clock.elapsedTime);
        vrm.update(dt);
      }
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (vrm) VRMUtils.deepDispose(vrm.scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // onError / onReady 只在加载时用一次，不作为依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // 尺寸写成内联样式：不依赖页面 CSS 也能铺满容器
  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} data-3d-ready={ready ? "true" : "false"} />;
}

export async function parseVrm(data: ArrayBuffer): Promise<VRM> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync(data, "");
  const vrm = gltf.userData.vrm as VRM | undefined;
  if (!vrm) throw new Error("This file is not a VRM avatar");
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  VRMUtils.rotateVRM0(vrm); // 旧版 VRM 0.x 朝向不同，统一成面向镜头
  vrm.scene.traverse((o) => {
    o.frustumCulled = false;
  });
  return vrm;
}

/** 每帧根据状态平滑地驱动表情和骨骼 */
function createAnimator(reduceMotion: boolean) {
  const cur: Record<string, number> = {};
  let nextBlink = 1.5;
  let blinkT = -1;
  let mouthTarget = 0;
  let mouthTimer = 0;

  // 平滑过渡到目标值
  const ease = (k: string, target: number, dt: number, speed = 8) => {
    const v = cur[k] ?? 0;
    cur[k] = v + (target - v) * (1 - Math.exp(-dt * speed));
    return cur[k];
  };

  return (vrm: VRM, state: AvatarState, dt: number, t: number) => {
    const bone = (name: Parameters<VRM["humanoid"]["getNormalizedBoneNode"]>[0]) =>
      vrm.humanoid.getNormalizedBoneNode(name);
    const em = vrm.expressionManager;
    const motion = reduceMotion ? 0 : 1;

    // ---- 表情 ----
    const happy = state === "happy" || state === "waving" ? 0.85 : state === "talking" ? 0.25 : 0.15;
    em?.setValue("happy", ease("happy", happy, dt, 6));
    em?.setValue("surprised", ease("surprised", state === "thinking" ? 0.15 : 0, dt, 6));

    // 眨眼（开心时眼睛已经眯起来，不眨）
    if (!reduceMotion) {
      nextBlink -= dt;
      if (nextBlink <= 0 && blinkT < 0) {
        blinkT = 0;
        nextBlink = 2.5 + Math.random() * 3;
      }
    }
    let blink = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      blink = Math.sin(Math.min(blinkT / 0.16, 1) * Math.PI);
      if (blinkT > 0.16) blinkT = -1;
    }
    em?.setValue("blink", happy > 0.5 ? 0 : blink);

    // 口型：说话时按音节节奏开合
    if (state === "talking") {
      mouthTimer -= dt;
      if (mouthTimer <= 0) {
        mouthTarget = reduceMotion ? 0.5 : Math.random() < 0.18 ? 0.05 : 0.3 + Math.random() * 0.7;
        mouthTimer = 0.09 + Math.random() * 0.06;
      }
    } else {
      mouthTarget = 0;
    }
    const mouth = ease("mouth", mouthTarget, dt, 18);
    em?.setValue("aa", mouth * 0.8);
    em?.setValue("oh", mouth > 0.6 ? (mouth - 0.6) * 0.8 : 0);

    // ---- 身体 ----
    const breathe = Math.sin(t * 1.6) * 0.02 * motion;
    const chest = bone("chest") ?? bone("spine");
    if (chest) chest.rotation.x = breathe;

    const neck = bone("neck");
    const head = bone("head");
    const tilt = ease("tilt", state === "listening" ? 0.18 : 0, dt, 5);
    const lookUp = ease("lookUp", state === "thinking" ? -0.12 : 0, dt, 5);
    if (neck) {
      neck.rotation.z = tilt + Math.sin(t * 0.7) * 0.03 * motion;
      neck.rotation.y = Math.sin(t * 0.45) * 0.05 * motion;
    }
    if (head) {
      head.rotation.x = lookUp + (state === "talking" ? Math.sin(t * 5) * 0.02 * motion : 0);
    }

    // 开心时轻轻跳
    const bounce = state === "happy" ? Math.abs(Math.sin(t * 7)) * 0.015 * motion : 0;
    vrm.scene.position.y = ease("bounce", bounce, dt, 20);

    // 手臂：默认自然下垂（VRM 默认是 T 字姿势）；挥手时右上臂抬到略高于肩，前臂竖起左右摆
    // 归一化骨骼里：左臂 z 负 = 放下，右臂 z 正 = 放下
    const lUpper = bone("leftUpperArm");
    const rUpper = bone("rightUpperArm");
    const lLower = bone("leftLowerArm");
    const rLower = bone("rightLowerArm");
    const wave = state === "waving";
    if (lUpper) lUpper.rotation.z = ease("lUpper", -1.2, dt);
    if (lLower) lLower.rotation.z = ease("lLower", -0.1, dt);
    if (rUpper) rUpper.rotation.z = ease("rUpper", wave ? -0.75 : 1.2, dt, 7);
    if (rLower) {
      rLower.rotation.z = ease("rLowerZ", wave ? -1.1 + Math.sin(t * 9) * 0.35 * motion : 0.1, dt, wave ? 20 : 7);
    }
  };
}
