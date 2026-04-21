/**
 * MAWEJA Motion System
 *
 * Source unique de vérité pour toutes les animations framer-motion.
 * - Respecte prefers-reduced-motion automatiquement via useReducedMotion
 * - Toutes les durées < 300ms, style premium discret
 * - Springs calibrés pour un feedback physique naturel
 * - Composants réutilisables : FadeIn, SlideUp, ScaleIn, StaggerList, StaggerItem
 */

import {
  motion,
  AnimatePresence,
  useReducedMotion as _useReducedMotion,
  type Variants,
} from "framer-motion";
import { type ReactNode } from "react";

/* ── Hook réduit motion ─────────────────────────────────────────────────── */
export function useAppReducedMotion(): boolean {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return _useReducedMotion() ?? false;
}

/* ── Presets de transition ──────────────────────────────────────────────── */
export const SPRING = {
  type: "spring",
  damping: 26,
  stiffness: 300,
  mass: 0.8,
} as const;

export const SPRING_SOFT = {
  type: "spring",
  damping: 22,
  stiffness: 200,
  mass: 1,
} as const;

export const EASE_OUT = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
} as const;

export const EASE_FAST = {
  duration: 0.14,
  ease: "easeOut" as const,
} as const;

/* ── Variants réutilisables ─────────────────────────────────────────────── */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: EASE_OUT },
  exit:   { opacity: 0, transition: EASE_FAST },
};

export const slideUpVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit:    { opacity: 0, y: 6, transition: EASE_FAST },
};

export const slideDownVariants: Variants = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit:    { opacity: 0, y: -6, transition: EASE_FAST },
};

export const scaleInVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: SPRING },
  exit:    { opacity: 0, scale: 0.96, transition: EASE_FAST },
};

export const drawerRightVariants: Variants = {
  hidden:  { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0, transition: SPRING_SOFT },
  exit:    { opacity: 0, x: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};

export const drawerBottomVariants: Variants = {
  hidden:  { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: SPRING_SOFT },
  exit:    { opacity: 0, y: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};

export const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

export const staggerContainerVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const staggerItemVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

export const kpiStaggerVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.0 } },
};

export const kpiItemVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

/* ── Composants utilitaires ─────────────────────────────────────────────── */

interface BaseMotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fade-in simple. Idéal pour sections, panneaux. */
export function FadeIn({ children, className, delay = 0 }: BaseMotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { ...EASE_OUT, delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Slide + fade depuis le bas. Idéal pour cartes, blocs principaux. */
export function SlideUp({ children, className, delay = 0 }: BaseMotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { ...SPRING, delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scale + fade. Idéal pour modals, empty states, icônes. */
export function ScaleIn({ children, className, delay = 0 }: BaseMotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, scale: 0.93 },
        visible: { opacity: 1, scale: 1, transition: { ...SPRING, delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Conteneur qui stagger-anime ses StaggerItem enfants. */
export function StaggerList({
  children,
  className,
  as: As = "div",
  stagger = 0.05,
}: BaseMotionProps & { as?: "div" | "ul" | "ol" | "section"; stagger?: number }) {
  const Tag = motion[As];
  return (
    <Tag
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Item à placer dans un StaggerList. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** Backdrop flouté animé pour drawers/modals. */
export function AnimatedBackdrop({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] ${className}`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
    />
  );
}

/** Wrapper AnimatePresence pour transitions d'état (filtre, onglet, liste). */
export function SwitchTransition({
  children,
  motionKey,
  className,
}: {
  children: ReactNode;
  motionKey: string | number;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0, transition: SPRING }}
        exit={{ opacity: 0, y: -4, transition: EASE_FAST }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Re-exports framer-motion ───────────────────────────────────────────── */
export { motion, AnimatePresence };
export type { Variants };
