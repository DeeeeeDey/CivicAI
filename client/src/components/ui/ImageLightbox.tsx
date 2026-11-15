import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

interface LightboxContextType {
  openImage: (src: string, title?: string) => void;
}

const LightboxContext = createContext<LightboxContextType>({ openImage: () => {} });

export const useLightbox = () => useContext(LightboxContext);

export const LightboxProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeImg, setActiveImg] = useState<{ src: string; title?: string } | null>(null);

  const openImage = (src: string, title?: string) => {
    setActiveImg({ src, title });
  };

  const closeImage = () => {
    setActiveImg(null);
  };

  return (
    <LightboxContext.Provider value={{ openImage }}>
      {children}
      <AnimatePresence>
        {activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-ink-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={closeImage}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
                <span className="font-bold text-sm text-ink-900">{activeImg.title || 'Photo Evidence'}</span>
                <button
                  onClick={closeImage}
                  className="p-1.5 rounded-full hover:bg-ink-900/10 text-ink-500 hover:text-ink-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-auto p-2 bg-black/5 flex items-center justify-center max-h-[calc(90vh-60px)]">
                <img
                  src={activeImg.src}
                  alt={activeImg.title || 'Evidence preview'}
                  className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
};

export const Thumbnail = ({
  src,
  alt = 'Evidence',
  title,
  className = 'h-24 w-32'
}: {
  src?: string | null;
  alt?: string;
  title?: string;
  className?: string;
}) => {
  const { openImage } = useLightbox();

  if (!src) return null;

  return (
    <div
      onClick={() => openImage(src, title || alt)}
      className={`relative rounded-xl overflow-hidden border border-border bg-ink-900/5 cursor-pointer group shadow-sm shrink-0 transition-transform active:scale-95 ${className}`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
      <div className="absolute inset-0 bg-ink-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
        <ZoomIn size={18} />
      </div>
    </div>
  );
};
