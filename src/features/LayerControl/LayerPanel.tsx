// 替换文件: src/features/LayerControl/LayerPanel.tsx
import React, { useState } from 'react';
import { Viewer } from 'cesium'; // 引入 Viewer 类型
import { Select, Checkbox, Button, Divider, message } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import { useGeoJSONLayers } from './hooks/useGeoJSONLayers';

const { Option } = Select;

// 明确接收父组件传来的 viewer
interface LayerPanelProps {
  viewer: Viewer | null;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ viewer }) => {
  const [selectedPort, setSelectedPort] = useState<string | undefined>(undefined);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // 将 viewer 传递给底层的 Hook
  const { loadComplianceLayer, isLoading } = useGeoJSONLayers(viewer);

  const portOptions = [
    { value: 'Singapore', label: '新加坡港 (Singapore)' },
    { value: 'Rotterdam', label: '鹿特丹港 (Rotterdam)' },
    { value: 'Shanghai', label: '上海港 (Shanghai)' },
  ];

  const complianceOptions = [
    { value: 'ECA_Zone', label: 'IMO排放控制区 (ECA)' },
    { value: 'Safe_Channel', label: '高频商业安全航道' },
    { value: 'Speed_Limit', label: '港口限速管辖区' },
  ];

  const handleRiskScan = async () => {
    if (!selectedPort) {
      message.warning({ content: '请先选择目标协同港口', style: { marginTop: '10vh' } });
      return;
    }
    if (selectedTypes.length === 0) {
      message.warning({ content: '请至少选择一项合规监管类型', style: { marginTop: '10vh' } });
      return;
    }

    try {
      await loadComplianceLayer(selectedPort, selectedTypes);
      message.success({ content: `成功加载 ${selectedPort} 区域的合规风控图层`, style: { marginTop: '10vh' } });
    } catch (error) {
      message.error({ content: '加载合规图层失败，请检查空间数据源', style: { marginTop: '10vh' } });
    }
  };

  const labelStyle: React.CSSProperties = { 
    color: '#00f0ff', marginBottom: '8px', display: 'block', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px'
  };
  
  const checkboxStyle: React.CSSProperties = { color: '#cbd5e1', fontSize: '13px' };

  return (
    <div 
      className="custom-scroll"
      style={{
        width: '100%', height: '100%', overflowY: 'auto', background: 'transparent', 
        padding: '10px 5px', display: 'flex', flexDirection: 'column', gap: '20px'
      }}
    >
      <div>
        <span style={labelStyle}>全球枢纽港口锚定</span>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择国际监管港口"
          allowClear
          onChange={(value) => setSelectedPort(value)}
          dropdownStyle={{ background: '#0b1018', border: '1px solid #00f0ff' }}
        >
          {portOptions.map(port => (
            <Option key={port.value} value={port.value}>
              <span style={{ color: '#cbd5e1' }}>{port.label}</span>
            </Option>
          ))}
        </Select>
      </div>

      <div>
        <span style={labelStyle}>合规监管类型配置</span>
        <Checkbox.Group 
          onChange={(checkedValues) => setSelectedTypes(checkedValues as string[])}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '4px' }}
        >
          {complianceOptions.map(opt => (
            <Checkbox key={opt.value} value={opt.value} style={checkboxStyle}>
              {opt.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>

      <Divider style={{ borderColor: 'rgba(0, 240, 255, 0.2)', margin: '4px 0' }} />

      <Button 
        type="primary" 
        icon={<ScanOutlined />} 
        block 
        size="large"
        loading={isLoading}
        onClick={handleRiskScan}
        style={{ 
          backgroundColor: 'rgba(0, 240, 255, 0.1)', borderColor: '#00f0ff', color: '#00f0ff',
          fontWeight: 'bold', boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', letterSpacing: '1px'
        }}
      >
        风险扫描与合规渲染
      </Button>
    </div>
  );
};

export default LayerPanel;