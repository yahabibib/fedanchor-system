import { Cartesian3, Color } from "cesium";

// 1. 模拟的中国东海专属经济区 (EEZ) 边界
// 注意：这是为了演示简化的坐标，真实 EEZ 边界非常复杂
export const EEZ_BOUNDARY_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "中国东海专属经济区",
        type: "EEZ",
        description: "China Exclusive Economic Zone (East China Sea Sector)"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [122.5, 29.0], // 起点
            [126.0, 29.0], // 向东延伸
            [127.5, 27.0], // 东南方向
            [125.0, 25.5], // 向南
            [122.0, 26.5], // 西南
            [122.5, 29.0]  // 闭合
          ]
        ]
      }
    }
  ]
};

// 2. 入侵船只的初始位置 (位于 EEZ 边缘外)
export const INTRUDER_SHIP = {
  id: "intruder-001",
  name: "未知国籍科考船",
  position: Cartesian3.fromDegrees(126.5, 28.5, 0), // 经度, 纬度, 高度
  color: Color.RED,
  description: "检测到未报备的测量行为"
};