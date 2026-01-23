
import React from 'react';
import { PoetryItem } from '../types';
import { Heart, Share2, Bookmark } from 'lucide-react';

interface PoetryCardProps {
  item: PoetryItem;
}

const PoetryCard: React.FC<PoetryCardProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6 transition-all hover:shadow-lg border-r-4 border-aruuz-primary">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-aruuz-accent/20 flex items-center justify-center text-aruuz-primary font-bold text-xl">
            {item.author[0]}
          </div>
          <div>
            <h4 className="text-lg font-bold urdu-text leading-tight">{item.author}</h4>
            <div className="flex gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-aruuz-accent">
          <Bookmark size={20} />
        </button>
      </div>

      <div className="urdu-text text-2xl text-center py-6 border-y border-gray-50 space-y-4">
        {item.lines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span className="naskh-text italic">{item.meter}</span>
        <div className="flex gap-4">
          <button className="flex items-center gap-1 hover:text-red-500">
            <Heart size={18} />
            <span>{item.likes}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-aruuz-accent">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoetryCard;
