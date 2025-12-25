import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticleEffect({ trigger, emoji = '✨', count = 20, color = '#fbbf24' }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
      }));
      setParticles(newParticles);

      setTimeout(() => setParticles([]), 2000);
    }
  }, [trigger, count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: '50vw',
              y: '50vh',
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: `calc(50vw + ${particle.x}vw)`,
              y: `calc(50vh + ${particle.y}vh)`,
              scale: particle.scale,
              rotate: particle.rotation,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute text-4xl"
            style={{ color }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}