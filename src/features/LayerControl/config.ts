import { Color } from "cesium";

// 1. 国家定义
export const COUNTRIES = [
  { key: 'China', label: '中国 (China)' },
  { key: 'Indonesia', label: '印度尼西亚 (Indonesia)' },
  { key: 'Malaysia', label: '马来西亚 (Malaysia)' },
  { key: 'Vietnam', label: '越南 (Vietnam)' },
  { key: 'Philippines', label: '菲律宾 (Philippines)' },
  { key: 'Brunei', label: '文莱 (Brunei)' },
  { key: 'India', label: '印度 (India)' },
];

// 2. 样式定义
export const ZONE_TYPES = [
  { 
    suffix: '12', 
    label: '12海里 领海', 
    // 领海要红得明显，透明度调高到 0.7
    color: Color.RED.withAlpha(0.7), 
    strokeWidth: 3, 
    fill: true,
    zIndex: 300 
  },
  { 
    suffix: '24', 
    label: '24海里 毗连区', 
    // 毗连区居中，0.5
    color: Color.ORANGE.withAlpha(0.5), 
    strokeWidth: 2, 
    fill: true, 
    zIndex: 2
  },
  { 
    suffix: '200', 
    label: '200海里 EEZ', 
    // [关键] EEZ 范围太大，颜色必须极淡，0.15 甚至 0.1
    // 这样它即使铺在下面，也不会把上面的红色染成紫色
    color: Color.CYAN.withAlpha(0.15), 
    strokeWidth: 1, 
    fill: true,
    zIndex: 1
  },
];