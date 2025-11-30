import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDVideoOverlayProps {
  isActive: boolean;
  containerWidth: number;
  containerHeight: number;
}

export const ThreeDVideoOverlay: React.FC<ThreeDVideoOverlayProps> = ({
  isActive,
  containerWidth,
  containerHeight
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Setup renderer with transparency
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(containerWidth, containerHeight);
    rendererRef.current = renderer;

    // Create geometric shapes
    const geometries = [
      new THREE.TorusGeometry(1, 0.3, 16, 100),
      new THREE.OctahedronGeometry(1.2),
      new THREE.IcosahedronGeometry(1),
    ];

    const materials = [
      new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      }),
      new THREE.MeshBasicMaterial({
        color: 0xff0088,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      }),
      new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      }),
    ];

    const meshes: THREE.Mesh[] = [];
    geometries.forEach((geometry, index) => {
      const mesh = new THREE.Mesh(geometry, materials[index]);
      mesh.position.x = (index - 1) * 2.5;
      scene.add(mesh);
      meshes.push(mesh);
    });
    meshesRef.current = meshes;

    // Add ambient particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 100;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Rotate meshes
      meshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.01 * (index + 1);
        mesh.rotation.y += 0.01 * (index + 1);
        mesh.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5;
      });

      // Rotate particles
      particlesMesh.rotation.y += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      meshes.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });

      particlesGeometry.dispose();
      particlesMaterial.dispose();

      renderer.dispose();
    };
  }, [isActive, containerWidth, containerHeight]);

  // Update canvas size when container dimensions change
  useEffect(() => {
    if (rendererRef.current && cameraRef.current && isActive) {
      rendererRef.current.setSize(containerWidth, containerHeight);
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [containerWidth, containerHeight, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
    />
  );
};
