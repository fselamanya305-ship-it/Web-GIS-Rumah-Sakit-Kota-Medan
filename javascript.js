// Inisialisasi peta
var map = L.map("map", {
  center: [3.595212759958394, 98.67064684660357], // Lokasi Kota Medan
  zoom: 13,
});

// === Basemap ===
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

var esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
  });

var cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; CartoDB",
  subdomains: "abcd",
  maxZoom: 19,
});

var topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});

// Custom Icon (opsional)
var rsIcon = L.icon({
  iconUrl: 'aset/iconrs.png', // opsional
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

var baseMaps = {
  "Open Street Map": osm,
  "Esri World Imagery": esriSat,
  "CartoDB Light": cartoLight,
  "Open Topo Map": topoMap,
};

L.control.layers(baseMaps).addTo(map);

// === Geocoder (Search Box) ===
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Cari lokasi...",
  position: "topleft",
}).addTo(map);

// === Scale Bar ===
L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// === Geolocation ===
map.locate({ setView: true, maxZoom: 14 });

function onLocationFound(e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup("Lokasi Anda").openPopup();
}

map.on('locationfound', onLocationFound);

// Load data GeoJSON
fetch('Rumahsakit_geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon:rsIcon });
      },
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const popupContent = `
<b><strong>${props["Nama Rumah Sakit"]}</strong></b><br/>
<b>Tipe:</b> ${props["Tipe"]}<br/>
<b>Kepemilikan:</b> ${props["Kepemilikan"]}<br/>
<b>Alamat:</b> ${props["Alamat"]}<br/>
<b>Rating Google Maps:</b> ${props["Rating/Ulasan di Google Maps"]}<br/>
<b>Nomor Telepon:</b> ${props["Nomor Telepon"]}<br/>
<b>Latitude:</b> ${feature.geometry.coordinates[1]}<br/>
<b>Longitude:</b> ${feature.geometry.coordinates[0]}<br/>
<b>Google Maps:</b> 
<a href="${props["Link"]}" target="_blank">Lihat Lokasi</a>
`;
         
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Style umum untuk garis dan polygon
const styleBatasKec = { color: '#ffd47f', weight: 1.5, dashArray: '3' };
const styleBatasKabLine = { color: '#000000', weight: 2, dashArray: '5' };
const styleSungai = { color: '#3399FF', weight: 0.1 };

// Fungsi untuk menentukan warna berdasarkan nama kecamatan
function getColorByKecamatan(name) {
  const colors = {
    'MEDAN BARAT': '#ff9999',
    'MEDAN TIMUR': '#99ccff',
    'MEDANBARU': '#99ff99',
    'MEDANDELI': '#ffcc99',
    'MEDANHELVETIA': '#cc99ff',
    'MEDANKOTA': '#ffff99',
    'MEDANMAIMUN': '#ff99cc',
    'MEDANPETISAH': '#66ccff',
    'MEDANPOLONIA': '#66ffcc',
    'MEDANSUNGGAL': '#ff9966',
    'MEDANAREA': '#ccff66',
    'MEDANPERJUANGAN': '#ff6666',
    'MEDANTEMBUNG': '#66ff66',
    'MEDANAMPLAS': '#6666ff',
    'MEDANDENAI': '#ff66ff',
    'MEDANJOHOR': '#66ffff',
    'MEDANSELAYANG': '#cccc66',
    'MEDANBELAWAN': '#ff3333',
    'MEDANLABUHAN': '#33cc33',
    'MEDANMARELAN': '#3333cc',
    'MEDANTUNTUNGAN': '#cc6633'
  };
  return colors[name] || '#999999'; // Warna default jika tidak ada kecocokan
}

// Style jalan berdasarkan klasifikasi "highway"
function styleJalan(feature) {
  const klasifikasi = feature.properties.highway;

  switch (klasifikasi) {
    case 'trunk':
      return { color: 'hsl(0, 91%, 48%)', weight: 2 }; // merah untuk jalan utama
    case 'secondary':
      return { color: 'rgb(226, 95, 13)', weight: 1.5 }; // oranye untuk jalan sekunder
    case 'tertiary':
      return { color: 'rgb(235, 222, 46)', weight: 1 }; // kuning untuk jalan tersier
    default:
      return { color: 'rgba(226, 232, 233, 0.72)', weight: 0.2 }; // abu-abu untuk jalan lainnya
  }
}

// Batas Kecamatan (Polygon)
fetch('data/adminidtrasikotamedan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { 
      style: function(feature) {
        return {
          fillColor: getColorByKecamatan(feature.properties.NAMOBJ),
          fillOpacity: 1,
          color: '#000000',
          weight: 2           
        };
      },
      onEachFeature: function (feature, layer) {
        const namaKecamatan = feature.properties.NAMOBJ;

        // Tambahkan popup jika dibutuhkan
        layer.bindPopup('<strong>Kecamatan ${namaKecamatan}</strong>');

        // Tambahkan label di tengah polygon
        const center = layer.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'label-kecamatan',
            html: `<b>${namaKecamatan}</b>`,
            iconSize: [100, 20]
          })
        });
        label.addTo(map);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Batas Kecamatan (Line)
fetch('data/batas_kecamatan_line.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKec }).addTo(map);
  });

// Batas Kabupaten (Line)
fetch('data/batas_kabupaten_line.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKabLine }).addTo(map);
  });

  // Jalan
fetch('data/jalan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleJalan }).addTo(map);
  });

// Sungai
fetch('data/sungai.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleSungai }).addTo(map);
  });

// ================= LEGENDA =================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  var div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <b>Legenda</b><br>
    🏥 Rumah Sakit<br>
    <span style="color:#f7801e">━━</span> Jalan Utama<br>
    <span style="color:#c6e20d">━━</span> Jalan Sekunder<br>
    <span style="color:#cf48bd">━━</span> Jalan Tersier<br>
    <span style="color:#3399FF">━━</span> Sungai
  `;

  return div;
};

legend.addTo(map);