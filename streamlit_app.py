import streamlit as st
import os

# Page Configuration
st.set_page_config(layout="wide", page_title="CDMX Map Viewer")

try:
    import folium
    from streamlit_folium import st_folium
    import geopandas as gpd
except ImportError as e:
    st.error(f"Error importing libraries: {e}")
    st.info("Intentando instalar dependencias faltantes...")
    # Fallback or detailed error
    st.stop()
except Exception as e:
    st.error(f"An unexpected error occurred during imports: {e}")
    st.stop()

# --- CUSTOM CSS ---
st.markdown("""
    <style>
    /* Main App Background */
    .stApp {
        background-color: #f8f9fa;
    }
    
    /* Sidebar Styling */
    [data-testid="stSidebar"] {
        background-color: white !important;
        border-right: 1px solid #e9ecef;
        padding-top: 0rem;
    }
    
    /* Hide Default Header and Footer */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Sidebar Content Colors */
    [data-testid="stSidebar"] .stMarkdown h2, 
    [data-testid="stSidebar"] .stMarkdown h1 {
        color: #581845 !important;
        font-family: 'Inter', sans-serif;
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    
    [data-testid="stSidebar"] .stMarkdown p {
        color: #581845 !important;
        font-family: 'Inter', sans-serif;
    }

    /* Info Box */
    .info-box {
        background-color: #e3f2fd;
        padding: 1.25rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(187, 222, 251, 0.5);
        margin-bottom: 2rem;
    }
    .info-box p {
        color: #581845 !important;
        margin: 0;
        font-weight: 500;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    /* Expanders */
    .streamlit-expanderHeader {
        background-color: transparent !important;
        border: none !important;
        color: #581845 !important;
        font-weight: 700 !important;
        font-size: 1.05rem !important;
    }
    .streamlit-expanderContent {
        background-color: #f8f9fa !important;
        border-radius: 0.5rem !important;
        margin-top: 0.25rem !important;
    }
    
    /* Checkboxes */
    .stCheckbox label p {
        color: #581845 !important;
        font-weight: 500 !important;
        font-size: 0.9rem !important;
    }
    
    /* Map Container */
    .map-container {
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
    }
    
    /* Legend */
    .legend-card {
        position: fixed;
        bottom: 2.5rem;
        right: 2.5rem;
        z-index: 1000;
        background-color: white;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e2e8f0;
        min-width: 200px;
    }
    .legend-title {
        font-weight: 900;
        color: #581845;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }
    .legend-color {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0,0,0,0.05);
    }
    .legend-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #581845;
    }
    
    /* Top Bar */
    .top-bar {
        background-color: #1a1c1e;
        height: 3.5rem;
        display: flex;
        align-items: center;
        padding: 0 1.5rem;
        margin-bottom: 0;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .top-bar-title {
        color: white;
        font-weight: 700;
        font-size: 1.1rem;
        letter-spacing: -0.02em;
    }
    </style>
    """, unsafe_allow_html=True)

# Top Bar
st.markdown("""
    <div class="top-bar">
        <div class="top-bar-title">🗺️ Visor CDMX</div>
    </div>
    <div style="height: 3.5rem;"></div>
""", unsafe_allow_html=True)
@st.cache_data
def load_and_process_shapefile(filepath):
    """Loads a shapefile, fixes CRS if missing, and returns a GeoDataFrame."""
    try:
        gdf = gpd.read_file(filepath)
        
        # Handle missing CRS (Naive geometries)
        if gdf.crs is None and not gdf.empty:
            # Check bounds to guess if it's Projected (meters) or Geographic (degrees)
            x_min = gdf.total_bounds[0]
            if x_min < -180 or x_min > 180:
                # Assume UTM Zone 14N (EPSG:32614) - Common for CDMX data
                gdf.set_crs(epsg=32614, inplace=True)
            else:
                # Assume WGS84 (EPSG:4326)
                gdf.set_crs(epsg=4326, inplace=True)

        # Reproject to EPSG:4326 for Folium
        if gdf.crs and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs(epsg=4326)
            
        return gdf
    except Exception as e:
        return None

# Choropleth Configuration based on the provided image
CHOROPLETH_CONFIG = {
    "ids_ageb_cdmx.shp": {
        "column": "e_idsm",
        "mapping": {
            "Muy bajo": "#4b2c7f",
            "Bajo": "#3b509d",
            "Medio": "#d15c7a",
            "Alto": "#e17061",
            "Muy alto": "#9bb2c0",
            "Sin información": "#ffffff",
            "Sin informacin": "#ffffff"
        },
        "legend_title": "Estratos IDS",
        "header_title": "Índice de Desarrollo Social (IDS) de la Ciudad de México por AGEB, 2020"
    },
    "GradoMarginación.shp": {
        "column": "GM_2020",
        "mapping": {
            "Muy alto": "#4b2c7f",
            "Alto": "#3b509d",
            "Medio": "#d15c7a",
            "Bajo": "#e17061",
            "Muy bajo": "#9bb2c0",
        },
        "legend_title": "Grado de Marginación",
        "header_title": "Grado de Marginación por Colonia, 2020"
    }
}

# Sidebar
with st.sidebar:
    st.markdown('<div style="height: 1rem;"></div>', unsafe_allow_html=True)
    st.header("Menús Disponibles")
    st.markdown("""
        <div class="info-box">
            <p>Seleccione las categorías para visualizar las capas.</p>
        </div>
    """, unsafe_allow_html=True)

# Initialize Map
m = folium.Map(location=[19.4326, -99.1332], zoom_start=11, tiles="CartoDB positron", control_scale=True)

# Remove the focus outline (bounding box) that appears when clicking map elements
css = """
<style>
    .leaflet-container .leaflet-interactive:focus {
        outline: none !important;
    }
    path.leaflet-interactive:focus {
        outline: none !important;
    }
</style>
"""
m.get_root().html.add_child(folium.Element(css))

# Global state for active choropleth
if 'active_choropleth' not in st.session_state:
    st.session_state.active_choropleth = None

# Function to render legend
def render_legend(config_key):
    st.session_state.active_choropleth = config_key

# Load Shapefiles
shapefiles_dir = "shapefiles"
if os.path.exists(shapefiles_dir):
    colors = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', 
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', 
        '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', 
        '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
    ]
    
    shp_files = sorted([f for f in os.listdir(shapefiles_dir) if f.endswith(".shp")])
    
    # 1. Handle Base Layer (09mun) separately
    base_layer_input = [f for f in shp_files if f.lower().startswith("09mun")]
    if base_layer_input:
        base_file = base_layer_input[0]
        base_path = os.path.join(shapefiles_dir, base_file)
        base_gdf = load_and_process_shapefile(base_path)
        
        if base_gdf is not None:
            folium.GeoJson(
                base_gdf,
                name="Límites Municipales",
                style_function=lambda x: {
                    'color': '#333333',
                    'weight': 1.5,
                    'fillOpacity': 0,
                    'dashArray': '5, 5'
                }
            ).add_to(m)

    LAYER_CONFIG = {
        "Sociales": {
            "Bicicletas Estacionamientos": "Social/Biciestacionamientos_Final.shp",
            "Motos Estacionamientos": "Social/Estacionamientos_Moto.shp",
            "Pilares": "Social/Pilares.shp",
            "UT": "Social/UT.shp",
            "Utopías": "Social/utopias.shp",
            "Centros de Justicia": "Social/Centros_de_justicia.shp"
        },
        "Delitos": {
            "Delitos a personas": {
                "Homicidios": "Delitos/Delitos a personas/Homicidios.shp",
                "Violaciones": "Delitos/Delitos a personas/VIOLACIONES.shp",
                "Robo a Cuentahabiente": "Delitos/Delitos a personas/ROBO A CUENTAHABIENTE.shp",
                "Robo a Casa Habitación": "Delitos/Delitos a personas/ROBO A CASA HABITACIÓN .shp",
                "Robo a Negocio con Violencia": "Delitos/Delitos a personas/ROBO A NEGOCIO CON VIOLENCIA.shp"
            },
            "Delitos con vehículos implicados": {
                "Robo a Pasajero en Microbús": "Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE MICROBUS.shp",
                "Robo a Pasajero en Taxi": "Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE TAXI.shp",
                "Robo a Pasajero en Metro": "Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DEL METRO.shp",
                "Robo a Repartidor": "Delitos/Delitos con vehiculos implicados/ROBO A REPARTIDOR.shp",
                "Robo a Transportista": "Delitos/Delitos con vehiculos implicados/ROBO A TRASPORTISTA.shp",
                "Robo de Motocicleta con Violencia": "Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA CON VIOLENCIA.shp",
                "Robo de Motocicleta sin Violencia": "Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA SIN VIOLENCIA.shp",
                "Robo de Vehículo Particular con Violencia": "Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PARTICULAR CON VIOLENCIA.shp",
                "Robo de Vehículo Público sin Violencia": "Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PÚBLICO SIN VIOLENCIA.shp",
                "Robo de Vehículo": "Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO.shp"
            }
        },
        "Registros (Ni una menos)": {
            "Acoso y Agresión": "Ni una menos/Acoso y agresióin.shp",
            "Asaltos": "Ni una menos/Asaltos.shp",
            "Fraudes": "Ni una menos/Fraudes .shp",
            "Intento de Asalto": "Ni una menos/Intento de asalto.shp"
        },
        "Socio Demografícas": {
            "ids_agen_cdmx": "Socio demografico/ids_ageb_cdmx.shp",
            "Grado de Marginación": "Socio demografico/GradoMarginación.shp"
        }
    }

    # Function to render a layer
    def render_layer(display_name, rel_path):
        full_path = os.path.join(shapefiles_dir, rel_path)
        filename = os.path.basename(rel_path)
        
        if os.path.exists(full_path):
            show_layer = st.checkbox(display_name, value=False, key=full_path)
            if show_layer:
                gdf = load_and_process_shapefile(full_path)
                if gdf is not None and not gdf.empty:
                    fg = folium.FeatureGroup(name=display_name)
                    
                    # Check if this file has choropleth config
                    if filename in CHOROPLETH_CONFIG:
                        config = CHOROPLETH_CONFIG[filename]
                        column = config["column"]
                        mapping = config["mapping"]
                        
                        # Show legend and update header
                        render_legend(filename)
                        st.markdown(f"""
                            <div style="background-color: #581845; padding: 10px; border-radius: 5px; margin-top: 10px; margin-bottom: 20px;">
                                <h3 style="color: white; text-align: center; margin: 0; font-size: 1.2rem;">{config['header_title']}</h3>
                            </div>
                        """, unsafe_allow_html=True)

                        def choropleth_style(feature):
                            val = feature['properties'].get(column, "Sin información")
                            color = mapping.get(val, "#ffffff")
                            return {
                                'fillColor': color,
                                'color': '#666666',
                                'weight': 1,
                                'fillOpacity': 0.7
                            }

                        folium.GeoJson(
                            gdf,
                            name=display_name,
                            style_function=choropleth_style,
                            tooltip=folium.GeoJsonTooltip(
                                fields=[column] + [c for c in gdf.columns if c != column][:4],
                                aliases=[column] + [c for c in gdf.columns if c != column][:4],
                                localize=True
                            )
                        ).add_to(fg)
                    else:
                        layer_color = colors[abs(hash(display_name)) % len(colors)]
                        geom_type = gdf.geom_type.iloc[0]
                        
                        if geom_type == 'Point' or geom_type == 'MultiPoint':
                            if len(gdf) > 2000:
                                st.warning(f"Capa '{display_name}' tiene muchos puntos ({len(gdf)}). Mostrando primeros 2000.")
                                gdf_to_plot = gdf.iloc[:2000]
                            else:
                                gdf_to_plot = gdf
                                
                            for idx, row in gdf_to_plot.iterrows():
                                if row.geometry is None: continue
                                try:
                                    if row.geometry.geom_type == 'Point':
                                        lat, lon = row.geometry.y, row.geometry.x
                                    else:
                                        centroid = row.geometry.centroid
                                        lat, lon = centroid.y, centroid.x
                                except AttributeError: continue
                                tooltip_text = "<br>".join([f"<b>{col}:</b> {str(row[col])}" for col in gdf.columns[:5]])
                                folium.CircleMarker(
                                    location=[lat, lon], radius=5, color=layer_color,
                                    fill=True, fill_color=layer_color, fill_opacity=0.7,
                                    tooltip=tooltip_text
                                ).add_to(fg)
                        else:
                            folium.GeoJson(
                                gdf, name=display_name,
                                style_function=lambda x, color=layer_color: {
                                    'color': color, 'weight': 2, 'fillOpacity': 0.4
                                },
                                tooltip=folium.GeoJsonTooltip(
                                    fields=list(gdf.columns)[:5],
                                    aliases=list(gdf.columns)[:5],
                                    localize=True
                                )
                            ).add_to(fg)
                    fg.add_to(m)
                else:
                    st.error(f"Error cargando {display_name}")
        else:
            st.markdown(f"<span style='color: #d15c7a; font-size: 0.8rem;'>{display_name} (Archivo no encontrado)</span>", unsafe_allow_html=True)

    # Iterate through the menus
    for menu_name, content in LAYER_CONFIG.items():
        with st.sidebar.expander(menu_name, expanded=(menu_name == "Socio Demografícas")):
            first_val = next(iter(content.values()))
            if isinstance(first_val, dict):
                for sub_menu, layers in content.items():
                    st.markdown(f"**{sub_menu}**")
                    for display_name, rel_path in layers.items():
                        render_layer(display_name, rel_path)
            else:
                for display_name, rel_path in content.items():
                    render_layer(display_name, rel_path)

# Render Map
st_folium(m, width="100%", height=800, returned_objects=[])

# Render Legend if active
if st.session_state.active_choropleth:
    config = CHOROPLETH_CONFIG[st.session_state.active_choropleth]
    legend_items = "".join([f'<div class="legend-item"><div class="legend-color" style="background-color: {c}"></div><div class="legend-label">{l}</div></div>' for l, c in config["mapping"].items()])
    st.markdown(f'<div class="legend-card"><div class="legend-title">{config["legend_title"]}</div>{legend_items}</div>', unsafe_allow_html=True)

# Footer
st.markdown('<div style="text-align: center; color: #64748b; font-size: 0.75rem; padding: 2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Fiscalía General de Justicia CDMX</div>', unsafe_allow_html=True)
