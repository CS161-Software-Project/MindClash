import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Clock, Award, Trophy, Activity, Zap, Medal, Target, UserCircle } from 'lucide-react';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn("No token found");
          setLoading(false);
          return;
        }

        const res = await fetch('https://mindclash-mm6g.onrender.com/api/profile/', {
          headers: {
            Authorization: `Token ${token}`
          }
        });

        const data = await res.json();
        if (data.success) {
          setStats(data.profile);
        } else {
          console.error("Failed to load profile stats");
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-white text-xl">Loading your stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-white text-xl">Could not load stats. Please try again later.</div>
      </div>
    );
  }

  const { 
    best_streak = 0, 
    correct_answers = 0, 
    average_time = 0, 
    total_questions = 0,
    username = "Player",
    avatar_url = null,
    fastest_time = null,
    global_rank = null
  } = stats;

  const accuracy = total_questions ? ((correct_answers / total_questions) * 100).toFixed(1) : '0.0';
  const avgTimeFormatted = parseFloat(average_time).toFixed(1);
  const level = Math.floor(correct_answers / 5) + 1;
  const nextLevelProgress = (correct_answers % 5) / 5 * 100;

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${nextLevelProgress}%`,
      transition: {
        duration: 1.2,
        ease: "easeInOut",
        delay: 0.3
      }
    }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <div className="min-h-screen w-full py-10 px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <motion.div 
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Player Statistics
          </h1>
          <p className="text-lg text-gray-300">Track your progress and achievements</p>
        </motion.div>

        <motion.div 
          className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl p-6 mb-10 shadow-xl border border-gray-700 flex flex-col md:flex-row items-center md:items-start gap-6"
          variants={itemVariants}
        >
          <motion.div 
            className="relative"
            variants={pulseVariants}
            animate="animate"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              {avatar_url ? (
                <model-viewer 
                  src={avatar_url} 
                  alt="3D Avatar" 
                  camera-controls 
                  auto-rotate 
                  style={{ width: '100%', height: '100%' }} 
                />
              ) : (
                <span className="text-5xl font-bold">{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2">
              <Trophy size={20} className="text-white" />
            </div>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{username}</h2>
            {global_rank !== null && (
              <p className="text-blue-400 font-medium mt-1">Global Rank: #{global_rank}</p>
            )}
            <p className="text-gray-400 mb-4">Joined 3 months ago</p>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-md font-medium text-gray-300">Level {level}</span>
                <span className="text-sm text-gray-400">{correct_answers % 5}/5 to Level {level + 1}</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  variants={progressVariants}
                  initial="initial"
                  animate="animate"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="bg-indigo-900 bg-opacity-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Medal size={14} className="text-indigo-400" />
                <span className="text-sm font-medium">Beginner</span>
              </div>
              <div className="bg-green-900 bg-opacity-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Flame size={14} className="text-green-400" />
                <span className="text-sm font-medium">Streak Master</span>
              </div>
              <div className="bg-purple-900 bg-opacity-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Target size={14} className="text-purple-400" />
                <span className="text-sm font-medium">Quiz Expert</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: <Flame size={24} />, label: "Best Streak", value: best_streak, color: "from-red-500 to-orange-500", desc: "Your longest consecutive correct answers" },
            { icon: <Star size={24} />, label: "Correct Answers", value: correct_answers, color: "from-yellow-500 to-amber-500", desc: "Total correct answers given" },
            { icon: <Clock size={24} />, label: "Average Time", value: `${avgTimeFormatted}s`, color: "from-blue-500 to-cyan-500", desc: "Average time per question" },
            { icon: <Activity size={24} />, label: "Accuracy", value: `${accuracy}%`, color: "from-green-500 to-emerald-500", desc: "Percentage of correct answers" }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="relative overflow-hidden bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br opacity-20 blur-xl"
                style={{ backgroundImage: `linear-gradient(${stat.color})` }}
              ></div>
              <div className={`inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br ${stat.color}`}>
                {stat.icon}
              </div>
              <h3 className="text-xl font-semibold mb-1">{stat.label}</h3>
              <p className="text-gray-400 text-sm mb-3">{stat.desc}</p>
              <div className="text-3xl font-bold">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-700 mb-10"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Award size={20} className="text-blue-400" />
            <span>Detailed Performance</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Questions", value: total_questions },
              { label: "Completion Rate", value: `${((total_questions / 20) * 100).toFixed(0)}%` },
              { label: "Fastest Answer", value: fastest_time ? `${fastest_time}s` : "—" },
              { label: "Questions Per Day", value: "3.5" }
            ].map((item, index) => (
              <div key={index} className="border-l-2 border-blue-500 pl-4">
                <p className="text-gray-400 text-sm">{item.label}</p>
                <p className="text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Stats;