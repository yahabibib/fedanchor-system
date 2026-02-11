import { useEffect, useRef, useState } from 'react';
import { 
  Viewer, 
  Ion, 
  UrlTemplateImageryProvider, 
  Cartesian3, 
  Color 
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_TOKEN;
if (CESIUM_TOKEN) Ion.defaultAccessToken = CESIUM_TOKEN;

export const useCesiumMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewer) return;

    console.log("🌊 Hook: 初始化地图基础设施...");

    // 1. 初始化 Viewer (注意：这里先不传 imageryProvider)
    const newViewer = new Viewer(containerRef.current, {
      // 暂时设为 false，确保底图没加载出来前不传参数
      imageryProvider: undefined, 
      
      // UI 净化
      animation: false,
      timeline: false,
      homeButton: false,
      navigationHelpButton: false,
      baseLayerPicker: false, 
      sceneModePicker: false,
      geocoder: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      
      // 渲染优化
      // ⚠️ 调试建议：如果依然黑屏，先把这里改为 false 试试
      requestRenderMode: true, 
      maximumRenderTimeChange: Infinity,
      contextOptions: { webgl: { alpha: false } }
    });

    // 2. --- 核心修复：手动暴力添加底图 ---
    try {
      // 先清除可能存在的默认图层
      newViewer.imageryLayers.removeAll();

      // 定义 Dark Matter 底图
      const darkProvider = new UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19
      });

      // 手动添加并打印日志
      newViewer.imageryLayers.addImageryProvider(darkProvider);
      console.log("✅ 底图图层已手动添加");
    } catch (e) {
      console.error("❌ 底图添加失败:", e);
    }

    // 3. 场景美化
    const scene = newViewer.scene;
    scene.sun.show = false;
    scene.moon.show = false;
    scene.skyBox.show = false;
    scene.backgroundColor = Color.fromCssColorString("#0b1018");
    scene.fog.enabled = true;
    scene.fog.density = 0.0003;
    scene.skyAtmosphere.show = true;
    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.baseColor = Color.BLACK;

    // 4. 初始视角
    newViewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(124.0, 26.0, 8000000),
      orientation: {
        heading: 0.0, // 正北方向
        pitch: -Math.PI / 2, // 关键：垂直向下 (-90度)
        roll: 0.0
      },
      duration: 2 // 稍微给点飞行时间，让用户有空间感
    });
    
    // 5. 强制触发一次渲染 (防止 requestRenderMode 导致首帧不刷新)
    scene.requestRender();

    // 更新状态
    setViewer(newViewer);

    return () => {
      console.log("🛑 Hook: 销毁地图实例");
      newViewer.destroy();
      setViewer(null);
    };
  }, []); 

  return { containerRef, viewer };
};