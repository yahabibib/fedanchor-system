// 1. 使用 Vite 的 glob 功能获取所有 GeoJSON 文件的映射关系
// { as: 'url' } 关键！它告诉 Vite 不要打包 JSON 内容，而是返回文件的 URL 路径字符串
// eager: true 表示同步获取列表
const geoFiles = import.meta.glob('/src/assets/geo-data/**/*.json', { as: 'url', eager: true });

/**
 * 智能匹配文件路径
 * @param countryKey 国家 (e.g. "China")
 * @param zoneSuffix 海域 (e.g. "12", "200")
 * @returns 匹配到的所有文件 URL 数组
 */
export const getGeoJSONPaths = (countryKey: string, zoneSuffix: string): string[] => {
  const searchPattern = `${countryKey}_${zoneSuffix}`;
  
  // 遍历所有文件路径，寻找匹配项
  // 路径示例: "/src/assets/geo-data/China/China_200_1.json"
  const matchedUrls = Object.keys(geoFiles)
    .filter((filePath) => {
      const fileName = filePath.split('/').pop() || ''; // 拿到文件名
      
      // 核心匹配逻辑：
      // 1. 必须包含 "China_200"
      // 2. 必须是 .json 结尾
      // 3. 严格匹配：防止 "China_2" 匹配到 "China_200"
      
      // 我们可以用正则来精确匹配:
      // ^China_200(\_\d+)?\.json$ 
      // 解释：以 China_200 开头，后面可以是 (_数字)，也可以没有，最后以 .json 结尾
      const regex = new RegExp(`^${countryKey}_${zoneSuffix}(_\\d+)?\\.json$`);
      
      return regex.test(fileName);
    })
    .map((filePath) => geoFiles[filePath]); // 把 key (源码路径) 换成 value (构建后的 URL)

  return matchedUrls;
};