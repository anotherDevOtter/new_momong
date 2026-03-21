'use client';

import { Check } from 'lucide-react';

interface FashionStyleCardProps {
  title: string;
  images: string[];
  selected: boolean;
  onClick: () => void;
}

export const FashionStyleCard = ({ title, images, selected, onClick }: FashionStyleCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div className={`
        relative overflow-hidden transition-all duration-300
        ${selected
          ? 'border-2 border-[#111111]'
          : 'border border-transparent hover:border-[#555555]'
        }
      `}>
        {images.length === 1 ? (
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-0.5 aspect-[3/4]">
            {images.map((img, idx) => (
              <div key={idx} className="overflow-hidden h-full">
                <img
                  src={img}
                  alt={`${title} ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-rows-2 gap-0.5 aspect-[3/4]">
            <div className="overflow-hidden h-full">
              <img
                src={images[0]}
                alt={`${title} 1`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="grid grid-cols-2 gap-0.5 h-full">
              <div className="overflow-hidden h-full">
                <img
                  src={images[1]}
                  alt={`${title} 2`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="overflow-hidden h-full">
                <img
                  src={images[2]}
                  alt={`${title} 3`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        )}

        {selected && (
          <div className="absolute inset-0 bg-white/20 pointer-events-none" />
        )}

        {selected && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-[#111111] flex items-center justify-center z-10">
            <Check size={18} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className={`
        mt-3 text-center transition-colors duration-200
        ${selected ? 'text-[#111111] font-semibold' : 'text-[#555555] group-hover:text-[#111111]'}
      `}>
        <span className="tracking-tight">{title}</span>
      </div>
    </button>
  );
};
