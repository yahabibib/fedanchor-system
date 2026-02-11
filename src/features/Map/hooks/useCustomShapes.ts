import { useRef, useCallback } from 'react';
import { 
  Viewer, 
  Cartesian3, 
  Color, 
  ScreenSpaceEventHandler, 
  ScreenSpaceEventType, 
  defined,
  PolylineDashMaterialProperty,
  HeadingPitchRange,
  Cartographic,
  Math as CesiumMath,
  VerticalOrigin,
  HorizontalOrigin,
  LabelStyle
} from 'cesium';
import { message } from 'antd';
import { useSystemStore } from '../../../stores/useSystemStore';

export const useCustomShapes = (viewer: Viewer | null) => {
  const customEntities = useRef<any[]>([]);
  const hoveringEntity = useRef<{ id: string; originalText: string } | null>(null);

  // 1. 部署点位
  const deployPoint = useCallback((input: string, description: string) => {
    if (!viewer) return;
    try {
      const [lon, lat] = input.split(/[,，\s]+/).map(Number);
      if (isNaN(lon) || isNaN(lat)) throw new Error("坐标格式错误");

      const labelText = description ? description : "📍 研判点";

      const entity = viewer.entities.add({
        id: `custom-point-${Date.now()}`,
        name: "研判目标点",
        position: Cartesian3.fromDegrees(lon, lat),
        point: {
          pixelSize: 15,
          color: Color.GOLD,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: labelText,
          font: "bold 16px 'Rajdhani', 'Microsoft YaHei', sans-serif", // 加粗字体
          style: LabelStyle.FILL_AND_OUTLINE, // 填充+描边，保证无背景也能看清
          fillColor: Color.GOLD,
          outlineColor: Color.BLACK,
          outlineWidth: 5, // [优化] 描边加粗，代替背景框的作用
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM, 
          pixelOffset: { x: 0, y: -20 },
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          
          // [核心修改] 去除背景框
          showBackground: false, 
          // backgroundColor: Color.BLACK.withAlpha(0.6), // 这一行删掉或注释
        },
        properties: {
          originalDesc: labelText,
          coordinates: `E ${lon.toFixed(3)}°, N ${lat.toFixed(3)}°`
        }
      });

      customEntities.current.push(entity);

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, 250000), 
        orientation: {
          heading: 0.0,
          pitch: -Math.PI / 2,
          roll: 0.0
        },
        duration: 1.5 
      });

      message.success("目标点位已部署");

    } catch (e) {
      message.error("解析失败：请使用 '经度,纬度' 格式");
    }
  }, [viewer]);

  // 2. 部署航线 (保持不变)
  const deployRoute = useCallback((input: string, description: string) => {
    if (!viewer) return;
    try {
      const parts = input.split(/[;；\n]+/).filter(s => s.trim());
      const positions = parts.map(part => {
        const [lon, lat] = part.split(/[,，\s]+/).map(Number);
        return Cartesian3.fromDegrees(lon, lat);
      });

      if (positions.length < 2) throw new Error("航线至少需要两个坐标点");

      const entity = viewer.entities.add({
        id: `custom-route-${Date.now()}`,
        name: "拟定航线",
        polyline: {
          positions: positions,
          width: 4,
          material: new PolylineDashMaterialProperty({
            color: Color.GOLD,
            dashLength: 20
          }),
          clampToGround: true
        },
        description: description || "用户规划的模拟航线"
      });

      customEntities.current.push(entity);
      
      viewer.flyTo(entity, {
        duration: 1.5,
        offset: new HeadingPitchRange(0, -Math.PI / 2, 500000)
      });

      message.success(`航线已部署，包含 ${positions.length} 个节点`);

    } catch (e) {
      message.error("解析失败：坐标之间请用分号 ';' 或换行分隔");
    }
  }, [viewer]);

  // 3. 清除所有
  const clearAll = useCallback(() => {
    if (!viewer) return;
    customEntities.current.forEach(entity => viewer.entities.remove(entity));
    customEntities.current = [];
    viewer.scene.requestRender();
    message.info("已清除所有自定义研判图层");
  }, [viewer]);

  // 4. 事件监听 (交互逻辑保持不变)
  const setupInteraction = useCallback(() => {
    if (!viewer) return;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    
    // 点击
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      if (defined(picked) && picked.id) {
        if (typeof picked.id.id === 'string' && picked.id.id.startsWith('custom-')) {
          console.log("🎯 选中:", picked.id.name);
          const entity = picked.id;
          const position = entity.position?.getValue(viewer.clock.currentTime);
          let descText = "";
          if (entity.properties && entity.properties.originalDesc) {
             descText = entity.properties.originalDesc.getValue();
          }
          if (position) {
            const cartographic = Cartographic.fromCartesian(position);
            const lon = CesiumMath.toDegrees(cartographic.longitude);
            const lat = CesiumMath.toDegrees(cartographic.latitude);
            const store = useSystemStore.getState();
            store.setSelectedTarget(picked.id.id);
            store.startAnalysis(lon, lat, descText); 
            message.loading("正在进行 GIS 空间与法律研判...", 1.5);
          }
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    // 悬浮
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.endPosition);
      
      if (hoveringEntity.current) {
        if (!defined(picked) || !picked.id || picked.id.id !== hoveringEntity.current.id) {
          const ent = viewer.entities.getById(hoveringEntity.current.id);
          if (ent && ent.label) {
            ent.label.text = hoveringEntity.current.originalText as any;
            ent.label.fillColor = Color.GOLD;
            ent.label.outlineColor = Color.BLACK; // 恢复黑色描边
            ent.point.pixelSize = 15 as any;
          }
          hoveringEntity.current = null;
          viewer.canvas.style.cursor = 'default';
          viewer.scene.requestRender();
        }
      }

      if (defined(picked) && picked.id) {
        const entity = picked.id;
        if (typeof entity.id === 'string' && entity.id.startsWith('custom-point')) {
          if (hoveringEntity.current?.id !== entity.id) {
            const originalText = entity.label.text.getValue();
            const coordText = entity.properties.coordinates.getValue();

            hoveringEntity.current = { id: entity.id, originalText };

            entity.label.text = coordText;
            entity.label.fillColor = Color.CYAN; 
            entity.label.outlineColor = Color.BLUE.withAlpha(0.5); // 悬浮时描边也可以变色
            entity.point.pixelSize = 20;
            
            viewer.canvas.style.cursor = 'pointer';
            viewer.scene.requestRender();
          }
        }
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return () => handler.destroy();
  }, [viewer]);

  return { deployPoint, deployRoute, clearAll, setupInteraction };
};