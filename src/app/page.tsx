'use client';

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

const HomePage = () => {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    router.push(`/generator?prompt=${encodeURIComponent(prompt)}`);
  };

  const words = [
    {
      text: "Design",
      className: "text-white"
    },
    {
      text: "Your",
      className: "text-white"
    },
    {
      text: "Dream",
      className: "text-white"
    },
    {
      text: "Website",
      className: "text-white"
    },
    {
      text: "with AI",
      className: "text-[#F14A00]",
    },
  ];

  const subHeading = "Transform your ideas into stunning websites in seconds";

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      {/* Main Content */}
      <div className="relative z-20 h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Heading */}
          <div className="mb-12 relative">
            <div className="text-4xl md:text-7xl font-bold text-center mb-6">
              <TypewriterEffectSmooth words={words} />
            </div>
            <div className="mt-4 text-lg md:text-xl text-gray-300 font-medium">
              {subHeading}
            </div>
          </div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl mx-auto relative z-30"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F14A00]/20 to-[#F14A00]/10 backdrop-blur-sm" />
                <div className="absolute inset-0">
                  {/* <SparklesCore
                    background="transparent"
                    minSize={0.2}
                    maxSize={0.8}
                    particleDensity={600}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                  /> */}
                </div>
                <Input
                  className="relative flex-1 h-14 bg-transparent border-[#F14A00]/20 text-white placeholder-gray-400 text-lg shadow-lg focus:border-[#F14A00]/50 focus:ring-[#F14A00]/30"
                  placeholder="Describe your website idea..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F14A00]/30 to-[#F14A00]/20 backdrop-blur-sm" />
                <div className="absolute inset-0">
                  <SparklesCore
                    background="transparent"
                    minSize={0.4}
                    maxSize={1}
                    particleDensity={800}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="relative h-14 px-8 bg-[#F14A00]/60 hover:bg-[#D93F00] text-white font-medium text-lg transition-all duration-200 shadow-lg border border-[#F14A00]/30"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;