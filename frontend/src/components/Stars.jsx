import React from 'react'
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Preload } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { useRef } from 'react';

const Stars = (props) => {
    const ref = useRef();
  
    const sphere = random.inSphere(new Float32Array(5000), { radius: 1.2})
  
    // For Stars rotation frame by frame
    useFrame((state, delta) => {
      ref.current.rotation.x -= delta/10;
      ref.current.rotation.y -= delta/15;
    })
  
    return (
      <group rotation={[0, 0, Math.PI / 4]}>
        <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props} >
          <PointMaterial 
            transparent
            color="#f272c8"
            size={0.003}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      </group>
    )
  }
export default Stars;