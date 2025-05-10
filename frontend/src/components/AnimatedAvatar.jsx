import React from 'react';
import { motion } from 'framer-motion';

const AnimatedAvatar = ({ isDarkMode }) => {
  return (
    <motion.div
      className="w-full h-full relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src="/assets/avatar.png"
        alt="Default Avatar"
        className="w-full h-full object-cover"
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default AnimatedAvatar; 