import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { Language, Room } from '../types';
import { getAllRooms } from '../services/supabaseService';

interface BreakoutRoomsProps {
  onJoinRoom: (roomId: string) => void;
  lang: Language;
}

export const BreakoutRooms: React.FC<BreakoutRoomsProps> = ({ onJoinRoom, lang }) => {
  const t = TRANSLATIONS[lang].rooms;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const fetchedRooms = await getAllRooms();
        setRooms(fetchedRooms);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 h-full flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-slate-400">{t.subtitle}</p>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <p>No rooms available at the moment</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <div key={room.id} className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-900/20 flex flex-col">
                    <div className="relative aspect-video">
                        <img src={room.thumbnail} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                        <div className="absolute top-3 left-3">
                             {room.isMainStage ? (
                                 <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">Main Stage</span>
                             ) : (
                                 <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">Breakout</span>
                             )}
                        </div>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
                             <Users className="w-3 h-3" />
                             <span>{room.viewers}</span>
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{room.name}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{room.topic} with {room.speaker}</p>
                        
                        <div className="mt-auto">
                          <button 
                              onClick={() => onJoinRoom(room.id)}
                              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all group-hover:translate-x-1"
                          >
                              <span>{t.join}</span>
                              <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        )}
      </div>
    </div>
  );
};