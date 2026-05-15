"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import { 
    Layers, 
    Map as MapIcon, 
    ChevronDown, 
    ChevronRight, 
    Info, 
    Database, 
    Activity, 
    Users, 
    AlertTriangle,
    Search,
    X,
    Filter
} from "lucide-react";
import L from "leaflet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const predefinedColors = [
    "#99cc00", "#ff9900", "#339866", "#800080",
    "#ffcc99", "#33cccc", "#008080", "#666699",
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
];

const CHOROPLETH_CONFIG: Record<string, any> = {
    "ageb": {
        column: "e_idsm",
        mapping: {
            "Muy bajo": "#4b2c7f",
            "Bajo": "#3b509d",
            "Medio": "#d15c7a",
            "Alto": "#e17061",
            "Muy alto": "#9bb2c0",
            "Sin información": "#ffffff",
            "Sin informacin": "#ffffff"
        },
        legendTitle: "Estratos IDS",
        headerTitle: "Índice de Desarrollo Social (IDS) de la Ciudad de México por AGEB, 2020"
    },
    "marginacion": {
        column: "GM_2020",
        mapping: {
            "Muy alto": "#4b2c7f",
            "Alto": "#3b509d",
            "Medio": "#d15c7a",
            "Bajo": "#e17061",
            "Muy bajo": "#9bb2c0",
        },
        legendTitle: "Grado de Marginación",
        headerTitle: "Grado de Marginación por Colonia, 2020"
    }
};

const LAYER_CATEGORIES = [
    {
        id: "sociales",
        name: "Sociales",
        icon: <Users size={18} />,
        layers: [
            { id: "biciestacionamientos", name: "Biciestacionamientos", path: "/shapefiles/Social/Biciestacionamientos_Final" },
            { id: "centros_justicia", name: "Centros de justicia", path: "/shapefiles/Social/Centros_de_justicia" },
            { id: "motos", name: "Estacionamientos Moto", path: "/shapefiles/Social/Estacionamientos_Moto" },
            { id: "pilares", name: "Pilares", path: "/shapefiles/Social/Pilares" },
            { id: "ut", name: "UT", path: "/shapefiles/Social/UT" },
            { id: "utopias", name: "Utopias", path: "/shapefiles/Social/utopias" }
        ]
    },
    {
        id: "delitos",
        name: "Delitos",
        icon: <AlertTriangle size={18} />,
        subcategories: [
            {
                id: "delitos_personas",
                name: "Delitos a personas",
                layers: [
                    { id: "homicidios", name: "Homicidios", path: "/shapefiles/Delitos/Delitos a personas/Homicidios" },
                    { id: "robo_casa", name: "Robo a casa habitación", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CASA HABITACIÓN" },
                    { id: "robo_cuenta", name: "Robo a cuentahabiente", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CUENTAHABIENTE" },
                    { id: "robo_negocio", name: "Robo a negocio con violencia", path: "/shapefiles/Delitos/Delitos a personas/ROBO A NEGOCIO CON VIOLENCIA" },
                    { id: "violaciones", name: "Violaciones", path: "/shapefiles/Delitos/Delitos a personas/VIOLACIONES" }
                ]
            },
            {
                id: "delitos_vehiculos",
                name: "Delitos con vehículos implicados",
                layers: [
                    { id: "robo_pasajero_microbus", name: "Robo a pasajero en microbús", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE MICROBUS" },
                    { id: "robo_pasajero_taxi", name: "Robo a pasajero en taxi", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE TAXI" },
                    { id: "robo_pasajero_metro", name: "Robo a pasajero en metro", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DEL METRO" },
                    { id: "robo_repartidor", name: "Robo a repartidor", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A REPARTIDOR" },
                    { id: "robo_transportista", name: "Robo a transportista", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A TRASPORTISTA" },
                    { id: "robo_moto_violencia", name: "Robo de motocicleta con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA CON VIOLENCIA" },
                    { id: "robo_moto_sin_violencia", name: "Robo de motocicleta sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA SIN VIOLENCIA" },
                    { id: "robo_vehiculo_particular_violencia", name: "Robo de vehículo particular con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PARTICULAR CON VIOLENCIA" },
                    { id: "robo_vehiculo_publico_sin_violencia", name: "Robo de vehículo público sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PÚBLICO SIN VIOLENCIA" },
                    { id: "robo_vehiculo", name: "Robo de vehículo", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO" }
                ]
            }
        ]
    },
    {
        id: "ni_una_menos",
        name: "Registros (Ni una menos)",
        icon: <Activity size={18} />,
        layers: [
            { id: "acoso", name: "Acoso y agresión", path: "/shapefiles/Ni una menos/Acoso y agresióin" },
            { id: "asaltos", name: "Asaltos", path: "/shapefiles/Ni una menos/Asaltos" },
            { id: "fraudes", name: "Fraudes", path: "/shapefiles/Ni una menos/Fraudes" },
            { id: "intento_asalto", name: "Intento de asalto", path: "/shapefiles/Ni una menos/Intento de asalto" }
        ]
    },
    {
        id: "socio_demograficas",
        name: "Socio Demográficas",
        icon: <Database size={18} />,
        layers: [
            { id: "marginacion", name: "Grado de Marginación", path: "/shapefiles/Socio demografico/GradoMarginación" },
            { id: "ageb", name: "AGEB CDMX", path: "/shapefiles/Socio demografico/ids_ageb_cdmx" }
        ]
    }
];

function CustomSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mapPrimary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-mapPrimary" : "bg-gray-200"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                    checked ? "translate-x-5" : "translate-x-1"
                )}
            />
        </button>
    );
}

function BoundsManager({ geojson, fitBounds }: { geojson: any, fitBounds: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (geojson && fitBounds) {
            try {
                const bounds = L.geoJSON(geojson).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) { }
        }
    }, [geojson, fitBounds, map]);
    return null;
}

function Legend({ config }: { config: any }) {
    return (
        <div className="absolute bottom-6 right-6 z-[1000] glass-panel p-5 rounded-2xl shadow-premium border border-white/40 font-outfit min-w-[220px] animate-slide-in-from-bottom">
            <h3 className="text-xs font-black text-gray-800 mb-4 border-b border-gray-100 pb-2 tracking-widest uppercase">{config.legendTitle}</h3>
            <div className="space-y-3">
                {Object.entries(config.mapping).map(([label, color]: [string, any]) => {
                    if (label.includes("informaci")) return null;
                    return (
                        <div key={label} className="flex items-center gap-3 group">
                            <div
                                className="w-6 h-6 rounded-lg shadow-sm border border-white group-hover:scale-110 transition-all duration-300 ring-1 ring-black/5"
                                style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-[11px] font-bold text-gray-600 group-hover:text-black transition-colors uppercase tracking-tight">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MapViewer() {
    const [layers, setLayers] = useState<any[]>([]);
    const [baseLayer, setBaseLayer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const colorIndex = useRef(0);

    const [activePredefined, setActivePredefined] = useState<Record<string, boolean>>({});
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        sociales: true,
        delitos: false,
        ni_una_menos: false,
        socio_demograficas: false
    });

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getNextColor = () => {
        const c = predefinedColors[colorIndex.current % predefinedColors.length];
        colorIndex.current += 1;
        return c;
    };

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                const baseUrl = window.location.origin;
                const base = await shp(baseUrl + "/shapefiles/09mun");
                setBaseLayer(base);
            } catch (e) {
                console.error("Failed to load base layer", e);
            }
        };
        loadDefaults();
    }, []);

    const filteredCategories = LAYER_CATEGORIES.map(category => {
        const filteredLayers = category.layers?.filter(l => 
            l.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        const filteredSubcategories = category.subcategories?.map(sub => ({
            ...sub,
            layers: sub.layers.filter(l => 
                l.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(sub => sub.layers.length > 0);

        if ((filteredLayers && filteredLayers.length > 0) || (filteredSubcategories && filteredSubcategories.length > 0)) {
            return {
                ...category,
                layers: filteredLayers,
                subcategories: filteredSubcategories
            };
        }
        return null;
    }).filter(Boolean);

    const togglePredefinedLayer = async (layerConfig: any) => {
        const isCurrentlyActive = !!activePredefined[layerConfig.id];
        setActivePredefined(prev => ({ ...prev, [layerConfig.id]: !isCurrentlyActive }));

        if (layers.some(l => l.id === layerConfig.id)) {
            setLayers(prev => prev.map(l => l.id === layerConfig.id ? { ...l, active: !isCurrentlyActive, isNew: false } : l));
            return;
        }

        if (!isCurrentlyActive) {
            setLoading(true);
            try {
                const baseUrl = window.location.origin;
                const fullPath = baseUrl + encodeURI(layerConfig.path);
                const geojson = await shp(fullPath);
                const loadedLayer = {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    data: geojson,
                    color: layerConfig.color || getNextColor(),
                    active: true,
                    isNew: true,
                    isUserUpload: false
                };
                setLayers(prev => [...prev, loadedLayer]);
            } catch (err) {
                console.error(`Error loading predefined layer ${layerConfig.name}:`, err);
                setActivePredefined(prev => ({ ...prev, [layerConfig.id]: false }));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex h-screen w-full font-inter bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[380px] bg-white/90 backdrop-blur-xl shadow-premium z-20 flex flex-col border-r border-slate-200 h-full overflow-hidden shrink-0">
                {/* Brand Header */}
                <div className="p-8 bg-gradient-premium text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
                        <MapIcon size={160} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <MapIcon size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter">Visor CDMX</h1>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Sistemas de Información Geográfica</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mapPrimary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar capas o datos..."
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mapPrimary/20 focus:bg-white transition-all border border-transparent focus:border-mapPrimary/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Layer Categories */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} /> Capas Disponibles
                        </h2>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                            {Object.values(activePredefined).filter(Boolean).length} Activas
                        </span>
                    </div>

                    <div className="space-y-4">
                        {filteredCategories.map((category: any) => (
                            <div key={category.id} className="group/cat">
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                                        openCategories[category.id] 
                                            ? "bg-slate-50 shadow-sm border border-slate-100" 
                                            : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            openCategories[category.id] ? "bg-mapPrimary text-white" : "bg-slate-100 text-slate-500 group-hover/cat:bg-slate-200"
                                        )}>
                                            {category.icon}
                                        </div>
                                        <span className={cn(
                                            "font-extrabold text-sm tracking-tight transition-colors",
                                            openCategories[category.id] ? "text-slate-900" : "text-slate-600 group-hover/cat:text-slate-900"
                                        )}>
                                            {category.name}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "transition-transform duration-300",
                                        openCategories[category.id] ? "rotate-180 text-mapPrimary" : "text-slate-400"
                                    )}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>

                                {openCategories[category.id] && (
                                    <div className="mt-2 ml-4 pl-8 border-l-2 border-slate-100 space-y-4 py-2 animate-slide-in-from-top">
                                        {category.layers?.map(layer => (
                                            <div key={layer.id} className="flex items-center justify-between group/item pr-2 animate-fade-in">
                                                <span className={cn(
                                                    "text-sm font-semibold transition-colors",
                                                    activePredefined[layer.id] ? "text-slate-900" : "text-slate-500 group-hover/item:text-slate-700"
                                                )}>
                                                    {layer.name}
                                                </span>
                                                <CustomSwitch 
                                                    checked={!!activePredefined[layer.id]} 
                                                    onChange={() => togglePredefinedLayer(layer)} 
                                                />
                                            </div>
                                        ))}

                                        {category.subcategories?.map(sub => (
                                            <div key={sub.id} className="space-y-4 pt-4 border-t border-slate-50 first:pt-0 first:border-0">
                                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{sub.name}</h3>
                                                <div className="space-y-4">
                                                    {sub.layers.map(layer => (
                                                        <div key={layer.id} className="flex items-center justify-between group/item pr-2">
                                                            <span className={cn(
                                                                "text-sm font-semibold transition-colors",
                                                                activePredefined[layer.id] ? "text-slate-900" : "text-slate-500 group-hover/item:text-slate-700"
                                                            )}>
                                                                {layer.name}
                                                            </span>
                                                            <CustomSwitch 
                                                                checked={!!activePredefined[layer.id]} 
                                                                onChange={() => togglePredefinedLayer(layer)} 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3">
                        <Info className="text-mapPrimary shrink-0" size={16} />
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                            Los datos provienen del registro público de la Fiscalía General de Justicia de la CDMX.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Map Content */}
            <main className="flex-1 relative bg-slate-200 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center transition-all duration-500">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping rounded-full bg-mapPrimary/20"></div>
                                <div className="relative animate-spin rounded-full h-16 w-16 border-[5px] border-mapPrimary border-t-transparent shadow-xl"></div>
                            </div>
                            <p className="mt-6 font-black text-slate-900 uppercase tracking-widest text-xs">Analizando Datos</p>
                            <div className="mt-2 flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-mapPrimary animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-mapPrimary animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-mapPrimary animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}

                <MapContainer center={[19.4326, -99.1332]} zoom={11} className="h-full w-full grayscale-[0.2] contrast-[1.1]">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        maxZoom={20}
                    />

                    {baseLayer && (
                        <GeoJSON
                            data={baseLayer}
                            style={{
                                color: '#1e293b',
                                weight: 2,
                                fillOpacity: 0.05,
                                fillColor: '#1e293b',
                                dashArray: '8, 8'
                            }}
                        />
                    )}

                    {layers.filter(l => l.active).map(layer => (
                        <div key={layer.id}>
                            <BoundsManager geojson={layer.data} fitBounds={layer.isNew} />
                            <GeoJSON
                                data={layer.data}
                                pointToLayer={(feature, latlng) => {
                                    return L.circleMarker(latlng, {
                                        radius: 6,
                                        fillColor: layer.color,
                                        color: '#fff',
                                        weight: 2,
                                        opacity: 1,
                                        fillOpacity: 0.9
                                    });
                                }}
                                style={(feature) => {
                                    const config = CHOROPLETH_CONFIG[layer.id];
                                    if (config && feature) {
                                        const val = feature.properties?.[config.column] || "Sin información";
                                        const color = config.mapping[val] || "#ffffff";
                                        return {
                                            fillColor: color,
                                            color: '#fff',
                                            weight: 1.5,
                                            fillOpacity: 0.85
                                        };
                                    }
                                    return {
                                        color: layer.color,
                                        weight: 3,
                                        opacity: 1,
                                        fillOpacity: 0.5
                                    };
                                }}
                                onEachFeature={(feature, featureLayer) => {
                                    if (feature.properties) {
                                        const config = CHOROPLETH_CONFIG[layer.id];
                                        let html = '<div class="font-inter p-2 min-w-[280px]">';
                                        
                                        if (config && feature.properties[config.column]) {
                                            const val = feature.properties[config.column];
                                            const color = config.mapping[val] || "#333";
                                            html += `
                                                <div class="mb-5 p-4 rounded-2xl border border-slate-100 shadow-sm" style="background: linear-gradient(to right, ${color}10, transparent)">
                                                    <div class="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-[0.2em]">${config.legendTitle}</div>
                                                    <div class="text-xl font-black" style="color: ${color}">${val}</div>
                                                </div>
                                            `;
                                        }

                                        html += '<div class="space-y-2">';
                                        Object.entries(feature.properties).slice(0, 8).forEach(([k, v]) => {
                                            if (config && k === config.column) return;
                                            html += `
                                                <div class="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 gap-4">
                                                    <span class="font-black text-[9px] uppercase tracking-wider text-slate-400 shrink-0">${k}</span>
                                                    <span class="text-slate-800 font-bold text-xs text-right break-words">${v}</span>
                                                </div>
                                            `;
                                        });
                                        html += '</div></div>';
                                        
                                        featureLayer.bindPopup(html, {
                                            className: 'premium-popup',
                                            maxWidth: 320
                                        });
                                    }
                                }}
                            />
                        </div>
                    ))}
                </MapContainer>

                {/* Legend for Sociodemographic layers */}
                {layers.filter(l => l.active && CHOROPLETH_CONFIG[l.id]).map(layer => (
                    <Legend key={`legend-${layer.id}`} config={CHOROPLETH_CONFIG[layer.id]} />
                ))}

                {/* Top Banner for Sociodemographic titles */}
                {layers.some(l => l.active && CHOROPLETH_CONFIG[l.id]) && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-6 pointer-events-none">
                        <div className="glass-panel text-slate-900 px-8 py-5 rounded-[2rem] shadow-premium border border-white/40 text-center animate-zoom-in">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-mapPrimary mb-1">Capa Activa</div>
                            <h3 className="text-sm md:text-lg font-black tracking-tight leading-tight">
                                {CHOROPLETH_CONFIG[layers.findLast(l => l.active && CHOROPLETH_CONFIG[l.id])?.id]?.headerTitle}
                            </h3>
                        </div>
                    </div>
                )}
                
                {/* Statistics Overlay (Minimal) */}
                <div className="absolute bottom-8 left-8 z-[1000] flex gap-3 pointer-events-none">
                    <div className="glass-panel px-4 py-3 rounded-2xl shadow-premium border border-white/40 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sistema Activo</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
