"use client";

import React, { useEffect, useRef } from "react";
// Named imports rather than `await import("three")` with a namespace object: a
// namespace access is not statically analysable, so the bundler had to ship all of
// three (~183 KB compressed) even though this file uses 21 classes. Named imports
// let the unused majority be dropped. The component itself is only loaded after
// first paint (see HomeClient), so none of this is on the critical path.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  EllipseCurve,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { useScroll } from "./ScrollProvider";

/**
 * The 3D backdrop: a particle shell around a wireframe core, with orbit rings.
 *
 * It is decoration with a job — it answers the scroll. Depth comes from a solid
 * dark core sphere that occludes the far half of the particle shell, so the
 * field reads as a volume rather than a flat scatter, and from parallax between
 * three layers that move at different rates as you scroll.
 *
 * Rendering is driven by the provider's single rAF loop, so there is exactly one
 * frame loop on the page. Everything is disposed on unmount and the whole
 * component opts out entirely under `prefers-reduced-motion`.
 */
export default function Scene3D({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const { subscribePhased, reducedMotion } = useScroll();

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let ready = false;
    let cleanup = () => {};

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    (() => {
      if (disposed) return;

      const mobile = window.innerWidth < 760;
      const shellCount = mobile ? 700 : 1700;
      const dustCount = mobile ? 140 : 340;

      const renderer: WebGLRenderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));

      const scene: Scene = new Scene();
      const camera: PerspectiveCamera = new PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 6.6);

      const root: Group = new Group();
      scene.add(root);

      // ── accent-driven materials ──────────────────────────────────────────
      const startColor = new Color(accentRef.current);
      const accentTarget = new Color(accentRef.current);

      // Soft round sprite, so points read as bokeh rather than squares.
      const spriteCanvas = document.createElement("canvas");
      spriteCanvas.width = spriteCanvas.height = 64;
      const ctx = spriteCanvas.getContext("2d");
      if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(255,255,255,0.55)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
      }
      const sprite = new CanvasTexture(spriteCanvas);

      // ── particle shell (fibonacci sphere, jittered radius) ───────────────
      const shellPos = new Float32Array(shellCount * 3);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < shellCount; i++) {
        const t = i / Math.max(shellCount - 1, 1);
        const inclination = Math.acos(1 - 2 * t);
        const azimuth = golden * i;
        const r = 2.7 + Math.random() * 2.6;
        const jitter = (Math.random() - 0.5) * 0.25;
        shellPos[i * 3] = Math.sin(inclination) * Math.cos(azimuth) * r + jitter;
        shellPos[i * 3 + 1] = Math.cos(inclination) * r * 0.78 + jitter;
        shellPos[i * 3 + 2] = Math.sin(inclination) * Math.sin(azimuth) * r + jitter;
      }
      const shellGeo = new BufferGeometry();
      shellGeo.setAttribute("position", new BufferAttribute(shellPos, 3));
      const shellMat = new PointsMaterial({
        size: 0.055,
        map: sprite,
        color: startColor.clone(),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      });
      const shell: Points = new Points(shellGeo, shellMat);
      root.add(shell);

      // ── near dust, one depth layer in front ─────────────────────────────
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 7.5;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
        dustPos[i * 3 + 2] = 1.6 + Math.random() * 3.2;
      }
      const dustGeo = new BufferGeometry();
      dustGeo.setAttribute("position", new BufferAttribute(dustPos, 3));
      const dustMat = new PointsMaterial({
        size: 0.035,
        map: sprite,
        color: 0xffffff,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      });
      const dust: Points = new Points(dustGeo, dustMat);
      root.add(dust);

      // ── wireframe core, with an opaque core sphere for real occlusion ────
      const coreGeo = new IcosahedronGeometry(1.3, 1);
      const coreEdges = new EdgesGeometry(coreGeo);
      const coreMat = new LineBasicMaterial({
        color: startColor.clone(),
        transparent: true,
        opacity: 0.5,
      });
      const core: LineSegments = new LineSegments(coreEdges, coreMat);
      root.add(core);

      const occluder = new Mesh(
        new SphereGeometry(1.24, 40, 40),
        new MeshBasicMaterial({ color: 0x0a0a0f })
      );
      const coreMesh: Mesh = occluder;
      root.add(coreMesh);

      // ── orbit rings ─────────────────────────────────────────────────────
      const rings: LineLoop[] = [];
      const ringMats: LineBasicMaterial[] = [];
      const ringSpec = [
        { r: 2.15, rx: 1.15, ry: 0.2, opacity: 0.16 },
        { r: 2.9, rx: -0.6, ry: 0.9, opacity: 0.1 },
        { r: 3.7, rx: 1.5, ry: -0.5, opacity: 0.07 },
      ];
      ringSpec.forEach((spec) => {
        const curve = new EllipseCurve(0, 0, spec.r, spec.r, 0, Math.PI * 2);
        const pts = curve
          .getPoints(96)
          .map((p: { x: number; y: number }) => new Vector3(p.x, p.y, 0));
        const geo = new BufferGeometry().setFromPoints(pts);
        const mat = new LineBasicMaterial({
          color: startColor.clone(),
          transparent: true,
          opacity: spec.opacity,
        });
        const ring: LineLoop = new LineLoop(geo, mat);
        ring.rotation.x = spec.rx;
        ring.rotation.y = spec.ry;
        rings.push(ring);
        ringMats.push(mat);
        root.add(ring);
      });

      // ── sizing ──────────────────────────────────────────────────────────
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      // ── per-frame render, driven by the provider's loop ──────────────────
      let elapsed = 0;
      let heroEl: HTMLElement | null = null;
      let heroLookup = 0;
      let heroProgress = 0;

      // Layout read — runs in the provider's measure phase, before any writes.
      const measure = () => {
        if (!heroEl || heroLookup++ % 120 === 0) {
          heroEl = document.querySelector<HTMLElement>(".hero-pin");
        }
        let hp = 0;
        if (heroEl) {
          const rect = heroEl.getBoundingClientRect();
          // Matches the hero's "pinExit" progress: travel is the whole wrapper,
          // so the core keeps swelling through the exit instead of stopping
          // when the pin releases.
          if (rect.height > 0) hp = Math.min(Math.max(-rect.top / rect.height, 0), 1);
        }
        heroProgress = hp;
      };

      const render = (snap: { progress: number; velocity: number }) => {
        if (!ready || disposed || document.visibilityState === "hidden") return;

        elapsed += 1 / 60;
        const p = snap.progress;
        const pulse = Math.min(Math.abs(snap.velocity) * 0.06, 0.05);
        const hp = heroProgress;

        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;

        root.rotation.y =
          elapsed * 0.045 + hp * 0.85 + p * Math.PI * 1.1 + pointer.x * 0.28;
        root.rotation.x =
          Math.sin(elapsed * 0.16) * 0.05 - pointer.y * 0.22 + hp * 0.3 + p * 0.34;
        root.scale.setScalar(1 + pulse + hp * 0.28);

        // The core swells toward the camera as the hero is scrubbed away.
        const coreScale = 1 + hp * 1.15;
        core.scale.setScalar(coreScale);
        coreMesh.scale.setScalar(coreScale);

        shell.rotation.y -= 0.0009;
        dust.rotation.y += 0.0016;
        core.rotation.x -= 0.0022 + hp * 0.006 + p * 0.003;
        core.rotation.z += 0.0014;

        rings.forEach((ring, i) => {
          ring.rotation.z += 0.0006 * (i + 1);
          ring.rotation.y += 0.0003 * (i % 2 === 0 ? 1 : -1);
        });

        camera.position.z = 6.6 - hp * 2.1 - p * 1.6;
        camera.position.y = pointer.y * -0.35 + p * 0.5;
        camera.position.x = pointer.x * 0.5;
        camera.lookAt(0, 0, 0);

        // Accent follows the active section.
        accentTarget.set(accentRef.current);
        shellMat.color.lerp(accentTarget, 0.035);
        coreMat.color.lerp(accentTarget, 0.045);
        ringMats.forEach((mat) => mat.color.lerp(accentTarget, 0.03));

        // The backdrop recedes as you travel down the page.
        canvas.style.opacity = String(Math.max(0.92 - p * 0.35, 0.34));

        renderer.render(scene, camera);
      };

      ready = true;
      const unsubscribe = subscribePhased(measure, render);
      measure();
      render({ progress: 0, velocity: 0 });

      cleanup = () => {
        unsubscribe();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        shellGeo.dispose();
        dustGeo.dispose();
        shellMat.dispose();
        dustMat.dispose();
        coreGeo.dispose();
        coreEdges.dispose();
        coreMat.dispose();
        rings.forEach((ring) => {
          ring.geometry.dispose();
          (ring.material as { dispose?: () => void }).dispose?.();
        });
        sprite.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // accent is read through a ref: changing section must not rebuild the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, subscribePhased]);

  return <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />;
}
