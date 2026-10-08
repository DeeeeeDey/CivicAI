export const springConfig = {
  type: "spring",
  stiffness: 260,
  damping: 28
};

export const fadeEase = [0.22, 1, 0.36, 1];

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: fadeEase } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 }
  }
};

export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: fadeEase }
};

export const hoverCard = {
  whileHover: { y: -4, boxShadow: "0 20px 40px rgba(110, 85, 50, 0.12)" },
  transition: springConfig
};
