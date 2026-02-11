import * as turf from '@turf/turf';
import { COUNTRIES, ZONE_TYPES } from '../features/LayerControl/config';
import { getGeoJSONPaths } from '../utils/fileRegistry';

export interface GeoAnalysisResult {
  countryKey: string;
  countryName: string;
  zoneSuffix: string;
  zoneLabel: string;
  geometry: any;
}

class GeoEngineService {
  private cache: Map<string, any> = new Map();

  async analyzePosition(lon: number, lat: number): Promise<GeoAnalysisResult | null> {
    const point = turf.point([lon, lat]);
    console.log(`[GeoEngine] 🛰️ 开始分析坐标: [${lon}, ${lat}]`);

    // 排序：优先判断 12海里，最后判断 200海里
    const sortedZones = [...ZONE_TYPES].sort((a, b) => parseInt(a.suffix) - parseInt(b.suffix));

    for (const country of COUNTRIES) {
      for (const zone of sortedZones) {
        const layerId = `${country.key}_${zone.suffix}`;
        
        let geoData = this.cache.get(layerId);
        if (!geoData) {
          geoData = await this.loadGeoJSON(country.key, zone.suffix);
          if (geoData) {
            this.cache.set(layerId, geoData);
          }
        }

        if (geoData && geoData.features.length > 0) {
          for (const feature of geoData.features) {
            try {
              // 确保只计算多边形
              if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
                continue;
              }

              const isInside = turf.booleanPointInPolygon(point, feature);
              if (isInside) {
                console.log(`[GeoEngine] ✅ 命中目标: ${country.label} - ${zone.label}`);
                return {
                  countryKey: country.key,
                  countryName: country.label,
                  zoneSuffix: zone.suffix,
                  zoneLabel: zone.label,
                  geometry: feature.geometry
                };
              }
            } catch (e) {
              // 忽略极少数计算错误的几何体
            }
          }
        }
      }
    }

    console.log(`[GeoEngine] 🌊 未命中任何区域，判定为公海`);
    return null;
  }

  private async loadGeoJSON(countryKey: string, zoneSuffix: string): Promise<any> {
    const urls = getGeoJSONPaths(countryKey, zoneSuffix);
    if (urls.length === 0) return null;

    try {
      const responses = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));
      
      // --- 核心修复：适配 GeometryCollection ---
      const allFeatures = responses.flatMap(json => {
        // 情况 1: 标准 FeatureCollection
        if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
          return json.features;
        } 
        
        // 情况 2: GeometryCollection (你的数据格式)
        else if (json.type === 'GeometryCollection' && Array.isArray(json.geometries)) {
          // 将 GeometryCollection 里的每个 geometry 包装成 Feature
          return json.geometries.map((geom: any) => ({
            type: 'Feature',
            properties: {}, // 补全空的 properties
            geometry: geom
          }));
        }

        // 情况 3: 单个 Feature
        else if (json.type === 'Feature') {
          return [json];
        } 

        // 情况 4: 裸 Geometry (Polygon/MultiPolygon)
        else if (json.coordinates && (json.type === 'Polygon' || json.type === 'MultiPolygon')) {
           return [{ type: 'Feature', properties: {}, geometry: json }];
        }
        
        return [];
      });

      if (allFeatures.length > 0) {
        console.log(`[GeoEngine] 加载 ${countryKey}_${zoneSuffix}: 成功读取 ${allFeatures.length} 个特征`);
      }
      
      return {
        type: "FeatureCollection",
        features: allFeatures
      };
    } catch (error) {
      console.error(`[GeoEngine] ❌ 加载失败: ${countryKey}_${zoneSuffix}`, error);
      return null;
    }
  }
}

export const GeoEngine = new GeoEngineService();