'use client'

import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface MotionWrapperProps {
  children: React.ReactNode
  className?: string
  initial?: object
  animate?: object
  exit?: object
  transition?: object
  delay?: number
  staggerChildren?: number
}

const defaultInitial = { opacity: 0, y: 20 }
const defaultAnimate = { opacity: 1, y: 0 }
const defaultTransition = { duration: 0.5 }

export function MotionWrapper({
  children,
  className,
  initial = defaultInitial,
  animate = defaultAnimate,
  exit,
  transition = defaultTransition,
  delay,
  staggerChildren,
}: MotionWrapperProps) {
  const variants = {
    hidden: initial,
    visible: {
      ...animate,
      transition: {
        ...transition,
        delay,
        when: staggerChildren ? "beforeChildren" : undefined,
        staggerChildren: staggerChildren,
      },
    },
    exit: exit,
  }

  return (
    <AnimatePresence>
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function FadeIn({
  children,
  className,
  delay,
  staggerChildren,
  duration = 0.5,
  yOffset = 20,
  xOffset = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  staggerChildren?: number
  duration?: number
  yOffset?: number
  xOffset?: number
}) {
  return (
    <MotionWrapper
      className={className}
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: duration }}
      delay={delay}
      staggerChildren={staggerChildren}
    >
      {children}
    </MotionWrapper>
  )
}

export function SlideIn({
  children,
  className,
  delay,
  staggerChildren,
  duration = 0.5,
  from = "bottom", // 'bottom', 'top', 'left', 'right'
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  staggerChildren?: number
  duration?: number
  from?: "bottom" | "top" | "left" | "right"
}) {
  let initial = {}
  if (from === "bottom") initial = { opacity: 0, y: 50 }
  if (from === "top") initial = { opacity: 0, y: -50 }
  if (from === "left") initial = { opacity: 0, x: -50 }
  if (from === "right") initial = { opacity: 0, x: 50 }

  return (
    <MotionWrapper
      className={className}
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: duration, ease: "easeInOut" }}
      delay={delay}
      staggerChildren={staggerChildren}
    >
      {children}
    </MotionWrapper>
  )
}