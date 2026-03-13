// 替换文件: src/features/LayerControl/hooks/useGeoJSONLayers.ts
import { useState } from 'react';
import * as Cesium from 'cesium';

// 通过参数接收 viewer
export const useGeoJSONLayers = (viewer: Cesium.Viewer | null) => {
  const [isLoading, setIsLoading] = useState(false);

  const loadComplianceLayer = async (port: string, complianceTypes: string[]) => {
    // 增加严格的校验拦截
    if (!viewer) {
      console.error('Cesium Viewer 未初始化，请等待底图加载完成。');
      return;
    }

    setIsLoading(true);

    try {
      // 1. 清理该模块之前加载的旧图层
      viewer.dataSources.removeAll(); 

      // 2. 遍历加载 GeoJSON
      for (const type of complianceTypes) {
        const geoJsonUrl = `/mock-data/${port}/${type}.geojson`; 

        let polygonFillColor;
        let outlineColor = Cesium.Color.WHITE;

        if (type === 'ECA_Zone') {
          polygonFillColor = Cesium.Color.RED.withAlpha(0.4);
          outlineColor = Cesium.Color.RED.withAlpha(0.8);
        } else if (type === 'Safe_Channel') {
          polygonFillColor = Cesium.Color.GREEN.withAlpha(0.4);
          outlineColor = Cesium.Color.GREEN.withAlpha(0.8);
        } else if (type === 'Speed_Limit') {
          polygonFillColor = Cesium.Color.YELLOW.withAlpha(0.3);
          outlineColor = Cesium.Color.YELLOW.withAlpha(0.8);
        } else {
          polygonFillColor = Cesium.Color.BLUE.withAlpha(0.3);
        }

        const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
          stroke: outlineColor,          
          fill: polygonFillColor,        
          strokeWidth: 3,                
        });

        dataSource.name = `${port}_${type}`;
        await viewer.dataSources.add(dataSource);
      }
      
      // 强制触发一次重绘，确保画面立即更新
      viewer.scene.requestRender();

    } catch (error) {
      console.error('动态解析 GeoJSON 渲染三维地图失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { loadComplianceLayer, isLoading };
};