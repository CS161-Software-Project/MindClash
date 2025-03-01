import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Test = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const starsRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    // Initialize scene
    sceneRef.current = new THREE.Scene();

    // Add camera
    const aspect = window.innerWidth / window.innerHeight;
    cameraRef.current = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    cameraRef.current.position.z = 5;

    // Create renderer with better error handling
    try {
      rendererRef.current = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true, // Enable antialiasing for smoother points
        precision: 'highp', // Higher precision for better rendering
      });

      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Add event listener for context loss
      canvasRef.current.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.log('WebGL context lost. Trying to restore...');
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Try to restore after a delay
        setTimeout(() => {
          if (isActive && rendererRef.current) {
            rendererRef.current.forceContextRestore();
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Error creating WebGL renderer:', error);
      return; // Exit if we can't create the renderer
    }

    // Create stars with better random distribution
    const starCount = Math.min(3000, Math.floor(window.innerWidth * window.innerHeight / 500)); // Adjust count dynamically

    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 5 + Math.random() * 5; // Random radius between 5 and 10
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03, // Smaller size to look like stars
      sizeAttenuation: true, // Ensures stars scale correctly with distance
      transparent: true,
      opacity: 0.9,
    });

    starsRef.current = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(starsRef.current);

    // Animation function
    const animate = () => {
      if (!isActive) return;

      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005;
        starsRef.current.rotation.x += 0.0002;
      }

      try {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      } catch (error) {
        console.error('Error during rendering:', error);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      window.removeEventListener('resize', handleResize);

      // Dispose resources
      if (starsRef.current) {
        sceneRef.current.remove(starsRef.current);
        starsRef.current.geometry.dispose();
        starsRef.current.material.dispose();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default Test;
