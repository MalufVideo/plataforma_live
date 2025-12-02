import React, { useState, useEffect } from 'react';
import {
  Globe, Users, Eye, Clock, TrendingUp, TrendingDown,
  Monitor, Smartphone, Tv, MapPin, Activity, Zap,
  Play, Pause, BarChart3, PieChart, ChevronLeft, X
} from 'lucide-react';

interface DashboardTabProps {
  viewers: number;
  isPremium: boolean;
}

// Brazilian states with viewer data and cities
interface StateData {
  name: string;
  code: string;
  viewers: number;
  cities: { name: string; viewers: number; trend: number }[];
}

const STATES_DATA: Record<string, StateData> = {
  'SP': {
    name: 'São Paulo', code: 'SP', viewers: 4520, cities: [
      { name: 'São Paulo', viewers: 2800, trend: 12 },
      { name: 'Campinas', viewers: 520, trend: 8 },
      { name: 'Santos', viewers: 380, trend: 5 },
      { name: 'Ribeirão Preto', viewers: 320, trend: 15 },
      { name: 'São José dos Campos', viewers: 280, trend: 7 },
      { name: 'Sorocaba', viewers: 220, trend: -2 },
    ]
  },
  'RJ': {
    name: 'Rio de Janeiro', code: 'RJ', viewers: 2850, cities: [
      { name: 'Rio de Janeiro', viewers: 1950, trend: 8 },
      { name: 'Niterói', viewers: 320, trend: 12 },
      { name: 'Duque de Caxias', viewers: 210, trend: 3 },
      { name: 'Nova Iguaçu', viewers: 180, trend: -1 },
      { name: 'Petrópolis', viewers: 120, trend: 6 },
    ]
  },
  'MG': {
    name: 'Minas Gerais', code: 'MG', viewers: 1650, cities: [
      { name: 'Belo Horizonte', viewers: 980, trend: 15 },
      { name: 'Uberlândia', viewers: 220, trend: 10 },
      { name: 'Contagem', viewers: 150, trend: 4 },
      { name: 'Juiz de Fora', viewers: 140, trend: 8 },
      { name: 'Betim', viewers: 90, trend: 2 },
    ]
  },
  'BA': {
    name: 'Bahia', code: 'BA', viewers: 980, cities: [
      { name: 'Salvador', viewers: 620, trend: -3 },
      { name: 'Feira de Santana', viewers: 140, trend: 5 },
      { name: 'Vitória da Conquista', viewers: 95, trend: 8 },
      { name: 'Camaçari', viewers: 70, trend: 2 },
    ]
  },
  'RS': {
    name: 'Rio Grande do Sul', code: 'RS', viewers: 890, cities: [
      { name: 'Porto Alegre', viewers: 520, trend: 7 },
      { name: 'Caxias do Sul', viewers: 140, trend: 12 },
      { name: 'Pelotas', viewers: 95, trend: 3 },
      { name: 'Canoas', viewers: 80, trend: 5 },
    ]
  },
  'PR': {
    name: 'Paraná', code: 'PR', viewers: 720, cities: [
      { name: 'Curitiba', viewers: 450, trend: 5 },
      { name: 'Londrina', viewers: 120, trend: 8 },
      { name: 'Maringá', viewers: 85, trend: 10 },
      { name: 'Ponta Grossa', viewers: 40, trend: 2 },
    ]
  },
  'PE': {
    name: 'Pernambuco', code: 'PE', viewers: 580, cities: [
      { name: 'Recife', viewers: 380, trend: 10 },
      { name: 'Jaboatão dos Guararapes', viewers: 85, trend: 4 },
      { name: 'Olinda', viewers: 65, trend: 6 },
      { name: 'Caruaru', viewers: 35, trend: 8 },
    ]
  },
  'CE': {
    name: 'Ceará', code: 'CE', viewers: 450, cities: [
      { name: 'Fortaleza', viewers: 320, trend: -2 },
      { name: 'Caucaia', viewers: 55, trend: 5 },
      { name: 'Juazeiro do Norte', viewers: 45, trend: 12 },
      { name: 'Maracanaú', viewers: 20, trend: 3 },
    ]
  },
  'SC': {
    name: 'Santa Catarina', code: 'SC', viewers: 380, cities: [
      { name: 'Florianópolis', viewers: 180, trend: 8 },
      { name: 'Joinville', viewers: 95, trend: 6 },
      { name: 'Blumenau', viewers: 60, trend: 10 },
      { name: 'Itajaí', viewers: 30, trend: 4 },
    ]
  },
  'GO': {
    name: 'Goiás', code: 'GO', viewers: 320, cities: [
      { name: 'Goiânia', viewers: 220, trend: 5 },
      { name: 'Aparecida de Goiânia', viewers: 55, trend: 8 },
      { name: 'Anápolis', viewers: 30, trend: 3 },
    ]
  },
  'DF': {
    name: 'Distrito Federal', code: 'DF', viewers: 290, cities: [
      { name: 'Brasília', viewers: 290, trend: 18 },
    ]
  },
  'AM': {
    name: 'Amazonas', code: 'AM', viewers: 180, cities: [
      { name: 'Manaus', viewers: 165, trend: 4 },
      { name: 'Parintins', viewers: 10, trend: 15 },
    ]
  },
  'PA': {
    name: 'Pará', code: 'PA', viewers: 220, cities: [
      { name: 'Belém', viewers: 160, trend: 6 },
      { name: 'Ananindeua', viewers: 35, trend: 3 },
      { name: 'Santarém', viewers: 18, trend: 8 },
    ]
  },
  'MA': {
    name: 'Maranhão', code: 'MA', viewers: 140, cities: [
      { name: 'São Luís', viewers: 110, trend: 5 },
      { name: 'Imperatriz', viewers: 22, trend: 7 },
    ]
  },
  'MT': {
    name: 'Mato Grosso', code: 'MT', viewers: 160, cities: [
      { name: 'Cuiabá', viewers: 110, trend: 4 },
      { name: 'Várzea Grande', viewers: 35, trend: 6 },
    ]
  },
  'MS': {
    name: 'Mato Grosso do Sul', code: 'MS', viewers: 130, cities: [
      { name: 'Campo Grande', viewers: 95, trend: 5 },
      { name: 'Dourados', viewers: 25, trend: 8 },
    ]
  },
  'ES': {
    name: 'Espírito Santo', code: 'ES', viewers: 280, cities: [
      { name: 'Vitória', viewers: 150, trend: 6 },
      { name: 'Vila Velha', viewers: 80, trend: 4 },
      { name: 'Serra', viewers: 35, trend: 8 },
    ]
  },
  'RN': {
    name: 'Rio Grande do Norte', code: 'RN', viewers: 180, cities: [
      { name: 'Natal', viewers: 140, trend: 7 },
      { name: 'Mossoró', viewers: 28, trend: 5 },
    ]
  },
  'PB': {
    name: 'Paraíba', code: 'PB', viewers: 160, cities: [
      { name: 'João Pessoa', viewers: 120, trend: 6 },
      { name: 'Campina Grande', viewers: 30, trend: 9 },
    ]
  },
  'AL': {
    name: 'Alagoas', code: 'AL', viewers: 120, cities: [
      { name: 'Maceió', viewers: 95, trend: 4 },
      { name: 'Arapiraca', viewers: 18, trend: 6 },
    ]
  },
  'PI': {
    name: 'Piauí', code: 'PI', viewers: 90, cities: [
      { name: 'Teresina', viewers: 75, trend: 5 },
      { name: 'Parnaíba', viewers: 10, trend: 8 },
    ]
  },
  'SE': {
    name: 'Sergipe', code: 'SE', viewers: 85, cities: [
      { name: 'Aracaju', viewers: 70, trend: 6 },
      { name: 'Nossa Senhora do Socorro', viewers: 10, trend: 4 },
    ]
  },
  'RO': {
    name: 'Rondônia', code: 'RO', viewers: 65, cities: [
      { name: 'Porto Velho', viewers: 50, trend: 5 },
      { name: 'Ji-Paraná', viewers: 10, trend: 7 },
    ]
  },
  'TO': {
    name: 'Tocantins', code: 'TO', viewers: 55, cities: [
      { name: 'Palmas', viewers: 42, trend: 8 },
      { name: 'Araguaína', viewers: 10, trend: 5 },
    ]
  },
  'AC': {
    name: 'Acre', code: 'AC', viewers: 35, cities: [
      { name: 'Rio Branco', viewers: 30, trend: 4 },
    ]
  },
  'AP': {
    name: 'Amapá', code: 'AP', viewers: 28, cities: [
      { name: 'Macapá', viewers: 25, trend: 6 },
    ]
  },
  'RR': {
    name: 'Roraima', code: 'RR', viewers: 22, cities: [
      { name: 'Boa Vista', viewers: 20, trend: 5 },
    ]
  },
};

// Top cities for the sidebar (aggregated from all states)
const CITIES_DATA = Object.values(STATES_DATA)
  .flatMap(state => state.cities.map(city => ({ ...city, state: state.code })))
  .sort((a, b) => b.viewers - a.viewers)
  .slice(0, 10);

const MiniChart = ({ color, data }: { color: string; data?: number[] }) => {
  const chartData = data || [40, 60, 45, 70, 85, 65, 90, 80, 70, 60, 50, 65, 75, 80];
  return (
    <div className="flex items-end gap-0.5 h-8 w-full mt-2">
      {chartData.map((h, i) => (
        <div key={i} className={`flex-1 rounded-t-sm opacity-80 ${color}`} style={{ height: `${h}%` }}></div>
      ))}
    </div>
  );
};

// GeoJSON URL for Brazilian states
const BRAZIL_GEOJSON_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

// State code mapping (name to sigla)
const STATE_NAME_TO_CODE: Record<string, string> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
};

interface GeoFeature {
  type: string;
  properties: { name: string; sigla?: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

interface GeoData {
  type: string;
  features: GeoFeature[];
}

// Color scale based on viewer count
const getStateColor = (viewers: number, isSelected: boolean, isHovered: boolean) => {
  if (isSelected) return '#6366f1'; // indigo-500
  if (isHovered) return '#818cf8'; // indigo-400

  // Gradient from Deep Dark Blue to Light Green
  if (viewers > 2000) return '#4ade80'; // green-400 (Light Green)
  if (viewers > 1000) return '#22c55e'; // green-500
  if (viewers > 500) return '#0891b2'; // cyan-600
  if (viewers > 200) return '#1e40af'; // blue-800
  if (viewers > 100) return '#172554'; // blue-950 (Deep Dark Blue)
  return '#0f172a'; // slate-900 (Base)
};

interface BrazilMapProps {
  onStateSelect: (stateCode: string | null) => void;
  selectedState: string | null;
}

// Convert GeoJSON coordinates to SVG path
const coordsToPath = (coords: number[][][], scale: number, offsetX: number, offsetY: number): string => {
  return coords.map((ring, ringIndex) => {
    return ring.map((point, i) => {
      const x = (point[0] + 74) * scale + offsetX; // Brazil longitude offset
      const y = (-point[1] + 6) * scale + offsetY; // Brazil latitude offset (inverted)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }).join(' ');
};

// Calculate centroid of a polygon
const getCentroid = (coords: number[][][]): [number, number] => {
  let totalX = 0, totalY = 0, totalPoints = 0;
  coords.forEach(ring => {
    ring.forEach(point => {
      totalX += point[0];
      totalY += point[1];
      totalPoints++;
    });
  });
  return [totalX / totalPoints, totalY / totalPoints];
};

const InteractiveBrazilMap: React.FC<BrazilMapProps> = ({ onStateSelect, selectedState }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);

  const totalViewers = Object.values(STATES_DATA).reduce((sum, s) => sum + s.viewers, 0);
  const selectedData = selectedState ? STATES_DATA[selectedState] : null;

  // Load GeoJSON data
  useEffect(() => {
    fetch(BRAZIL_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load map data:', err);
        setLoading(false);
      });
  }, []);

  const scale = 11;
  const offsetX = 15;
  const offsetY = 15;

  if (loading) {
    return (
      <div className="relative w-full h-[420px] bg-[#0c1222] rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Carregando mapa...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] bg-[#0c1222] rounded-xl overflow-hidden border border-slate-800 flex">
      {/* Map Section */}
      <div className={`relative ${selectedState ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
        {/* Map SVG */}
        <svg
          viewBox="0 0 480 520"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* State paths */}
          <g style={{ filter: 'url(#shadow)' }}>
            {geoData?.features.map((feature) => {
              const stateName = feature.properties.name;
              const stateCode = STATE_NAME_TO_CODE[stateName] || feature.properties.sigla || '';
              const stateData = STATES_DATA[stateCode];
              const viewers = stateData?.viewers || 0;
              const isSelected = selectedState === stateCode;
              const isHovered = hoveredState === stateCode;

              // Handle both Polygon and MultiPolygon
              const coords = feature.geometry.type === 'MultiPolygon'
                ? (feature.geometry.coordinates as number[][][][]).flat()
                : feature.geometry.coordinates as number[][][];

              const pathD = coordsToPath(coords, scale, offsetX, offsetY);
              const [centLng, centLat] = getCentroid(coords);
              const labelX = (centLng + 74) * scale + offsetX;
              const labelY = (-centLat + 6) * scale + offsetY;

              return (
                <g key={stateName}>
                  <path
                    d={pathD}
                    fill={getStateColor(viewers, isSelected, isHovered)}
                    stroke={isSelected ? '#fff' : '#1e293b'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: isSelected ? 'url(#glow)' : 'none',
                      opacity: selectedState && !isSelected ? 0.3 : 1
                    }}
                    onClick={() => onStateSelect(isSelected ? null : stateCode)}
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State label */}
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    fill={isSelected || isHovered ? '#fff' : 'rgba(255,255,255,0.9)'}
                    style={{
                      opacity: selectedState && !isSelected ? 0.2 : 1,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
                    }}
                  >
                    {stateCode}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Header badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <span className="text-sm">🇧🇷</span> BRASIL
          </span>
          {selectedState && (
            <button
              onClick={() => onStateSelect(null)}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 transition-colors shadow-lg"
            >
              <ChevronLeft className="w-3 h-3" />
              Voltar
            </button>
          )}
        </div>

        {/* Total viewers / State info - only show when no state selected */}
        {!selectedState && (
          <div className="absolute top-3 right-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">Total Brasil</div>
            <div className="text-lg font-mono font-bold text-white">{totalViewers.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500">espectadores</div>
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredState && !selectedState && STATES_DATA[hoveredState] && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-2 shadow-2xl z-10">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-bold text-white">{STATES_DATA[hoveredState].name}</div>
                <div className="text-[10px] text-slate-400">{STATES_DATA[hoveredState].cities.length} cidades</div>
              </div>
              <div className="text-right border-l border-slate-700 pl-3">
                <div className="text-base font-mono font-bold text-indigo-400">{STATES_DATA[hoveredState].viewers.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500">espectadores</div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[8px] text-slate-400 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-sm bg-green-400"></div> &gt;2k</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-sm bg-green-500"></div> &gt;1k</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-sm bg-cyan-600"></div> &gt;500</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-sm bg-blue-800"></div> &gt;200</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-sm bg-blue-950"></div> &gt;100</span>
        </div>

        {/* Click hint */}
        {!selectedState && (
          <div className="absolute bottom-3 right-3 text-[9px] text-slate-500 italic bg-slate-900/60 px-2 py-1 rounded-lg">
            Clique em um estado para ver cidades
          </div>
        )}
      </div>

      {/* Cities Panel - Right Side */}
      {selectedState && selectedData && (
        <div className="w-1/2 h-full border-l border-slate-800 bg-[#0a0b14] overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#0c1222]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Cidades de {selectedData.name}</span>
              <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                {selectedData.cities.length} cidades
              </span>
            </div>
            <button
              onClick={() => onStateSelect(null)}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* State Summary */}
          <div className="p-3 border-b border-slate-800 bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-indigo-400 uppercase font-bold">{selectedData.name}</div>
                <div className="text-xl font-mono font-bold text-white">{selectedData.viewers.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">espectadores</div>
                <div className="text-sm text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{Math.floor(Math.random() * 15) + 5}%
                </div>
              </div>
            </div>
          </div>

          {/* Cities List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedData.cities.map((city, i) => {
              const percentage = Math.round((city.viewers / selectedData.viewers) * 100);
              return (
                <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{city.name}</span>
                    <span className={`text-[10px] flex items-center gap-0.5 ${city.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {city.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {city.trend >= 0 ? '+' : ''}{city.trend}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-mono font-bold text-indigo-400">{city.viewers.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{percentage}% do estado</span>
                  </div>
                  <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// City details panel when a state is selected
const StateCitiesPanel: React.FC<{ stateCode: string; onClose: () => void }> = ({ stateCode, onClose }) => {
  const stateData = STATES_DATA[stateCode];
  if (!stateData) return null;

  return (
    <div className="bg-[#14151f] rounded-lg border border-indigo-500/30 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-white">Cidades de {stateData.name}</span>
          <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
            {stateData.cities.length} cidades
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stateData.cities.map((city, i) => {
          const percentage = Math.round((city.viewers / stateData.viewers) * 100);
          return (
            <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{city.name}</span>
                <span className={`text-[10px] flex items-center gap-0.5 ${city.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {city.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(city.trend)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-indigo-400">{city.viewers.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">{percentage}% do estado</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({ viewers, isPremium }) => {
  const [liveViewers, setLiveViewers] = useState(viewers);
  const [peakViewers, setPeakViewers] = useState(viewers + 2340);
  const [avgWatchTime, setAvgWatchTime] = useState(847); // seconds
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => prev + Math.floor(Math.random() * 20) - 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Live Viewers</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono text-white">{liveViewers.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1 text-emerald-500 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>+12.5% vs last hour</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Peak Viewers</span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-mono text-white">{peakViewers.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">at 14:32:15</div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Avg Watch Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-mono text-white">
            {Math.floor(avgWatchTime / 60)}:{(avgWatchTime % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1 mt-1 text-emerald-500 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>+8.2% engagement</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Unique Sessions</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-mono text-white">18,432</div>
          <div className="text-xs text-slate-500 mt-1">Total registered: 24,500</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Geo Map - Premium Feature */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Distribuição Geográfica</span>
                {isPremium && (
                  <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">Tempo real • {Object.keys(STATES_DATA).length} estados</span>
            </div>

            {isPremium ? (
              <InteractiveBrazilMap
                selectedState={selectedState}
                onStateSelect={setSelectedState}
              />
            ) : (
              <div className="h-64 bg-slate-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Faça upgrade para Premium e veja analytics por região</p>
                  <button className="mt-3 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg font-bold">
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Locations */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-white">Principais Cidades</span>
            </div>
            <div className="space-y-3">
              {CITIES_DATA.map((city, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                    <span className="text-sm text-white">{city.name} <span className="text-slate-500 text-xs">({city.state})</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-slate-400">{city.viewers.toLocaleString()}</span>
                    <span className={`text-[10px] flex items-center gap-0.5 ${city.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {city.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(city.trend)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Device Breakdown</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <Monitor className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-lg font-mono text-white">68%</div>
                <div className="text-[10px] text-slate-500">Desktop</div>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-lg font-mono text-white">28%</div>
                <div className="text-[10px] text-slate-500">Mobile</div>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <Tv className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <div className="text-lg font-mono text-white">4%</div>
                <div className="text-[10px] text-slate-500">Smart TV</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Viewer Retention</span>
            </div>
            <div className="h-20">
              <MiniChart color="bg-emerald-600" data={[100, 95, 88, 82, 78, 75, 72, 70, 68, 65, 63, 62, 60, 58]} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500">
              <span>0:00</span>
              <span>Current: 58% retained</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
