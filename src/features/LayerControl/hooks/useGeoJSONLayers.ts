import { useState, useRef, useCallback, useEffect } from 'react';
import { Viewer, GeoJsonDataSource, Color, ConstantProperty } from 'cesium';
import { message } from 'antd';
import { ZONE_TYPES } from '../config';
import { getGeoJSONPaths } from '../../../utils/fileRegistry';

export const useGeoJSONLayers = (viewer: Viewer | null) => {
  const loadedDataMap = useRef<Map<string, GeoJsonDataSource[]>>(new Map());
  
  // 实时追踪选中状态，解决异步竞态
  const activeLayersRef = useRef<Set<string>>(new Set());
  
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    activeLayersRef.current = activeLayers;
  }, [activeLayers]);

  // --- 加载逻辑 ---
  const loadLayerLogic = useCallback(async (countryKey: string, zoneSuffix: string) => {
    if (!viewer) return;
    
    const layerId = `${countryKey}_${zoneSuffix}`;
    const styleConfig = ZONE_TYPES.find(z => z.suffix === zoneSuffix);
    if (!styleConfig) return;

    const urls = getGeoJSONPaths(countryKey, zoneSuffix);
    if (urls.length === 0) throw new Error("File not found");

    const promises = urls.map(url => 
      GeoJsonDataSource.load(url, {
        stroke: styleConfig.color.withAlpha(0.8), // 边框稍微深一点
        fill: styleConfig.fill ? styleConfig.color : Color.TRANSPARENT,
        strokeWidth: styleConfig.strokeWidth,
        clampToGround: true
      })
    );

    const dataSources = await Promise.all(promises);

    // Double Check: 加载完后如果用户取消了，直接销毁
    if (!activeLayersRef.current.has(layerId)) {
      console.log(`[LayerManager] 丢弃已取消图层: ${layerId}`);
      return; 
    }

    for (const ds of dataSources) {
      const entities = ds.entities.values;
      for (const entity of entities) {
        if (entity.polygon) {
           // [修复 2] 强制指定 zIndex，确保 12海里(3) > 24海里(2) > 200海里(1)
           // @ts-ignore
           entity.polygon.zIndex = new ConstantProperty(styleConfig.zIndex);
        }
      }
      await viewer.dataSources.add(ds);
    }

    loadedDataMap.current.set(layerId, dataSources);
    
    // [修复 1] 加载完成后，强制重绘一帧，确保画面立即显示
    viewer.scene.requestRender();

  }, [viewer]);

  // --- 移除逻辑 ---
  const removeLayerLogic = useCallback((countryKey: string, zoneSuffix: string) => {
    if (!viewer) return;
    const layerId = `${countryKey}_${zoneSuffix}`;
    const dataSources = loadedDataMap.current.get(layerId);
    
    if (dataSources && dataSources.length > 0) {
      dataSources.forEach(ds => {
        viewer.dataSources.remove(ds, true);
      });
      loadedDataMap.current.delete(layerId);
      
      // [修复 1] 移除完成后，强制重绘一帧，解决"鼠标动了才消失"的问题
      viewer.scene.requestRender();
      
      console.log(`[LayerManager] 已销毁并重绘: ${layerId}`);
    }
  }, [viewer]);

  // --- 切换逻辑 (保持不变) ---
  const toggleLayer = async (countryKey: string, zoneSuffix: string, checked: boolean) => {
    const layerId = `${countryKey}_${zoneSuffix}`;
    setActiveLayers(prev => {
      const next = new Set(prev);
      checked ? next.add(layerId) : next.delete(layerId);
      return next;
    });

    if (checked) {
      setLoadingLayers(prev => new Set(prev).add(layerId));
      try {
        await loadLayerLogic(countryKey, zoneSuffix);
        if (activeLayersRef.current.has(layerId)) {
           message.success(`${layerId} 加载成功`);
        }
      } catch (err) {
        // console.warn(err); // 找不到文件不报错，静默失败即可
        setActiveLayers(prev => { const next = new Set(prev); next.delete(layerId); return next; });
      } finally {
        setLoadingLayers(prev => { const next = new Set(prev); next.delete(layerId); return next; });
      }
    } else {
      removeLayerLogic(countryKey, zoneSuffix);
    }
  };

  const toggleCountry = (countryKey: string, checked: boolean) => {
    const allIds = ZONE_TYPES.map(z => `${countryKey}_${z.suffix}`);
    setActiveLayers(prev => {
      const next = new Set(prev);
      allIds.forEach(id => checked ? next.add(id) : next.delete(id));
      return next;
    });

    allIds.forEach(layerId => {
      const suffix = layerId.split('_')[1];
      const isLoaded = loadedDataMap.current.has(layerId);
      const isLoading = loadingLayers.has(layerId);

      if (checked) {
        if (!isLoaded && !isLoading) {
          setLoadingLayers(prev => new Set(prev).add(layerId));
          loadLayerLogic(countryKey, suffix)
            .catch(() => {})
            .finally(() => setLoadingLayers(prev => { const next = new Set(prev); next.delete(layerId); return next; }));
        }
      } else {
        removeLayerLogic(countryKey, suffix);
      }
    });
  };

  return { activeLayers, loadingLayers, toggleLayer, toggleCountry };
};