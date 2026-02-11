import React, { useState } from 'react';
import { Viewer } from 'cesium';
import { Checkbox, Collapse, Spin, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { COUNTRIES, ZONE_TYPES } from './config';
import { useGeoJSONLayers } from './hooks/useGeoJSONLayers';

const { Panel } = Collapse;

interface LayerPanelProps {
  viewer: Viewer | null;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ viewer }) => {
  const { 
    activeLayers, 
    loadingLayers, 
    toggleLayer, 
    toggleCountry 
  } = useGeoJSONLayers(viewer);

  // 辅助函数：计算全选框状态
  const getCountryCheckboxState = (countryKey: string) => {
    const allIds = ZONE_TYPES.map(z => `${countryKey}_${z.suffix}`);
    const activeCount = allIds.filter(id => activeLayers.has(id)).length;
    return {
      checked: activeCount === allIds.length,
      indeterminate: activeCount > 0 && activeCount < allIds.length
    };
  };

  return (
    <div 
      className="custom-scroll"
      style={{
        width: '100%',
        height: '100%', // 撑满父容器(TechCard)
        overflowY: 'auto',
        // 背景色由 TechCard 接管，这里透明即可
        background: 'transparent', 
      }}
    >
      <Collapse 
        ghost 
        expandIconPosition="end"
      >
        {COUNTRIES.map(country => {
          const { checked, indeterminate } = getCountryCheckboxState(country.key);

          return (
            <Panel 
              key={country.key}
              header={
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Checkbox 
                    checked={checked}
                    indeterminate={indeterminate}
                    onChange={(e) => toggleCountry(country.key, e.target.checked)}
                    style={{ color: '#fff' }}
                  />
                  <span style={{ color: '#fff', fontWeight: 500 }}>{country.label}</span>
                </div>
              }
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '24px' }}>
                {ZONE_TYPES.map(zone => {
                  const layerId = `${country.key}_${zone.suffix}`;
                  const isLoading = loadingLayers.has(layerId);
                  const isActive = activeLayers.has(layerId);

                  return (
                    <div key={zone.suffix} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Checkbox 
                        checked={isActive}
                        disabled={isLoading}
                        onChange={(e) => toggleLayer(country.key, zone.suffix, e.target.checked)}
                        style={{ color: '#cbd5e1', fontSize: '13px' }}
                      >
                        {zone.label}
                      </Checkbox>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 14, color: '#00f0ff' }} spin />} />}
                        <div style={{ 
                          width: '24px', 
                          height: '4px', 
                          borderRadius: '2px',
                          background: zone.color.toCssColorString(),
                          boxShadow: `0 0 5px ${zone.color.toCssColorString()}`
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default LayerPanel;