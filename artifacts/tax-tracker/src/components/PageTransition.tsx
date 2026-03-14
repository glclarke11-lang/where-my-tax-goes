import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`w-full pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
