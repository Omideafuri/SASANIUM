import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticlesProps {
  velocityRef: React.RefObject<number>;
  paused?: boolean;
}

function createDustTexture(): THREE.CanvasTexture | null {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 232, 185, 1)');
  grad.addColorStop(0.35, 'rgba(212, 163, 89, 0.55)');
  grad.addColorStop(1, 'rgba(212, 163, 89, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export default function Particles({ velocityRef, paused = false }: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const count = window.innerWidth < 768 ? 55 : 110;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.2 + Math.random() * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const texture = createDustTexture();
    const material = new THREE.PointsMaterial({
      size: 0.14,
      map: texture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.35;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    };
    window.addEventListener('resize', onResize, { passive: true });

    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);
      if (document.hidden || pausedRef.current) {
        lastTime = now;
        return;
      }

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const vel = Math.max(-40, Math.min(40, velocityRef.current ?? 0));
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

      for (let i = 0; i < count; i++) {
        let x = posAttr.getX(i) + Math.sin(now * 0.0003 + i) * dt * 0.08;
        let y = posAttr.getY(i) + dt * speeds[i] * 0.14 - vel * dt * 0.015;

        if (y > 5.5) y = -5.5;
        if (y < -5.5) y = 5.5;
        if (x > 8.5) x = -8.5;
        if (x < -8.5) x = 8.5;

        posAttr.setXY(i, x, y);
      }
      posAttr.needsUpdate = true;

      camera.position.x += (mouseX - camera.position.x) * 0.03;
      camera.position.y += (-mouseY - camera.position.y) * 0.03;

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [velocityRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-10 ${paused ? 'invisible' : 'visible'}`}
    />
  );
}
