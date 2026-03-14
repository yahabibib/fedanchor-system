import React, { useEffect, useState } from 'react';
import { Button, Tag, Progress, Card, Divider, Typography, Tooltip, Segmented, Timeline } from 'antd';
import { 
  MenuUnfoldOutlined, MenuFoldOutlined, 
  SafetyCertificateOutlined, WarningOutlined, SyncOutlined, 
  FileTextOutlined, BookOutlined, LinkOutlined, GlobalOutlined, BankOutlined,
  RadarChartOutlined, EnvironmentOutlined, AppstoreOutlined, PartitionOutlined,
  HistoryOutlined, LinkOutlined as LinkIcon
} from '@ant-design/icons';
import { useSystemStore } from '../../stores/useSystemStore';
import TechCard from '../../components/TechCard';
import FedAnchorGraph from '../../components/FedAnchorGraph';
import legalKGData from '../../assets/legal_kg.json';

const { Paragraph } = Typography;

const RightPanel: React.FC = () => {
  const { selectedTargetId, analysisStatus, alignmentResult, geoResult } = useSystemStore();
  const [collapsed, setCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [graphSource, setGraphSource] = useState<'analysis' | 'knowledge'>('analysis');

  const PANEL_WIDTH = '480px';

  useEffect(() => {
    if (selectedTargetId) setCollapsed(false);
    else setCollapsed(true);
  }, [selectedTargetId]);

  const renderContent = () => {
    if (!selectedTargetId) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <SyncOutlined spin style={{ fontSize: '24px', marginBottom: '10px' }} />
          <p>系统在线<br/>请在地图上选择目标以启动分析</p>
        </div>
      );
    }

    if (analysisStatus === 'analyzing') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <h3 style={{ color: '#00f0ff', fontFamily: 'Rajdhani' }}>Compliance Engine</h3>
           <div style={{ margin: '30px 0' }}>
             <Progress type="circle" percent={72} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#00f0ff' }} format={() => <span style={{fontSize: '12px', color: '#fff'}}>Aligning</span>} />
           </div>
           <div style={{ textAlign: 'left', fontSize: '12px', color: '#94a3b8' }}>
             <p>✔ GIS: 空间定位锁定</p>
             <p style={{ color: '#00f0ff' }}><SyncOutlined spin style={{ marginRight: '8px' }} />正在执行本地沙箱与公域双向映射...</p>
             <p>⚡ RAG: 检索全球海事判例库...</p>
           </div>
        </div>
      );
    }

    if (analysisStatus === 'done' && alignmentResult) {
      const statusColor = alignmentResult.status === 'violation' ? '#ef4444' : alignmentResult.status === 'warning' ? '#f59e0b' : '#10b981';
      const StatusIcon = alignmentResult.status === 'violation' ? WarningOutlined : SafetyCertificateOutlined;

      return (
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
          
          {/* 1. 顶部状态卡片 */}
          <div style={{ flexShrink: 0 }}>
             <div style={{ 
               background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 0, 0, 0) 100%)', 
               borderLeft: '4px solid #00f0ff', padding: '8px 12px', marginBottom: '10px',
               display: 'flex', alignItems: 'center', justifyContent: 'space-between'
             }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '12px', color: '#94a3b8' }}><RadarChartOutlined /> GIS 空间定位</span>
                 <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', fontFamily: 'Rajdhani' }}>
                   {geoResult ? `${geoResult.countryName} · ${geoResult.zoneLabel}` : '公海 (High Seas)'}
                 </span>
               </div>
               <EnvironmentOutlined style={{ fontSize: '18px', color: '#00f0ff', opacity: 0.5 }} />
             </div>

             <div style={{ 
               background: `rgba(${alignmentResult.status === 'violation' ? '220, 38, 38' : '16, 185, 129'}, 0.1)`, 
               border: `1px solid ${statusColor}`, borderRadius: '4px', padding: '10px',
               display: 'flex', alignItems: 'start', gap: '10px'
             }}>
               <StatusIcon style={{ fontSize: '20px', color: statusColor, marginTop: '2px' }} />
               <div>
                 <div style={{ color: statusColor, fontWeight: 'bold', fontSize: '14px' }}>
                   {alignmentResult.status === 'violation' ? '严重违规' : alignmentResult.status === 'warning' ? '存在疑点' : '合规行为'}
                 </div>
                 <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>{alignmentResult.summary}</div>
               </div>
             </div>
          </div>

          {/* 2. 视图切换器 */}
          <div style={{ flexShrink: 0 }}>
            <Segmented
              options={[
                { label: '文本研判', value: 'text', icon: <AppstoreOutlined /> },
                { label: '双向映射图谱', value: 'graph', icon: <PartitionOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as 'text' | 'graph')}
              block
              style={{ background: '#334155', color: '#cbd5e1' }}
            />
          </div>

          {/* 3. 内容区 (可滚动) */}
          <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            
            {viewMode === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* 风险预警视窗 */}
                <div style={{ background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.4)', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ color: '#ff4d4f', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <WarningOutlined /> 风险预警视窗
                  </div>
                  <div style={{ color: '#ffccc7', fontSize: '12px', lineHeight: '1.6' }}>
                    {alignmentResult.riskWarnings?.map((warn, idx) => (
                      <div key={idx}>• {warn}</div>
                    ))}
                  </div>
                </div>

                {/* 核心对齐展示区：映射循环渲染 */}
                <div>
                  <div style={{ color: '#00f0ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PartitionOutlined /> 核心对齐结果 ({alignmentResult.alignments?.length || 0} 项发现)
                  </div>
                  
                  {alignmentResult.alignments?.map((align, index) => (
                    <div key={index} style={{ marginBottom: index === alignmentResult.alignments.length - 1 ? '0' : '24px' }}>
                      
                      {/* 上层: 企业沙箱 */}
                      <Card size="small" bordered={false} 
                        style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)' }}
                        headStyle={{ borderBottom: '1px solid rgba(0, 240, 255, 0.1)', color: '#00f0ff', fontSize: '12px', padding: '0 10px' }}
                        bodyStyle={{ padding: '10px' }}
                        title={<span><BankOutlined /> {align.enterpriseRule.source || '本地沙箱'}</span>}>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '12px', marginBottom: '4px' }}>{align.enterpriseRule.title}</div>
                        <Paragraph style={{ color: '#cbd5e1', fontSize: '12px', marginBottom: 0 }}>{align.enterpriseRule.clause}</Paragraph>
                      </Card>

                      {/* 中间: 对齐锚点 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '15px', borderLeft: '2px dashed rgba(0, 240, 255, 0.3)' }}></div>
                        <div style={{ 
                          background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', borderRadius: '20px', 
                          padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 10px rgba(0,240,255,0.2)' 
                        }}>
                          <LinkIcon style={{ color: '#00f0ff' }} />
                          <span style={{ color: '#e2e8f0', fontSize: '12px' }}>对齐度: <strong style={{ color: '#00f0ff' }}>{align.score}%</strong></span>
                          <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                          <span style={{ color: '#e2e8f0', fontSize: '12px' }}>锚点: <Tag color="cyan" style={{ border: 'none', background: 'transparent', margin: 0 }}>{align.anchorConcept}</Tag></span>
                        </div>
                        <div style={{ height: '15px', borderLeft: '2px dashed rgba(0, 240, 255, 0.3)' }}></div>
                      </div>

                      {/* 下层: 公域法规 */}
                      <Card size="small" bordered={false} 
                        style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', fontSize: '12px', padding: '0 10px' }}
                        bodyStyle={{ padding: '10px' }}
                        title={<span><GlobalOutlined /> {align.publicLaw.source || '公域节点'}</span>}>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '12px', marginBottom: '4px' }}>{align.publicLaw.title}</div>
                        <Paragraph style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 0 }}>{align.publicLaw.clause}</Paragraph>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* 历史研判参考区 */}
                <div>
                  <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#faad14', margin: '10px 0', fontSize: '12px' }}>
                    <HistoryOutlined /> 历史违规参考
                  </Divider>
                  <Timeline style={{ paddingLeft: '4px', marginTop: '10px' }}
                    items={alignmentResult.historicalCases?.map(item => ({
                      color: '#ff4d4f',
                      children: (
                        <div style={{ top: '-4px', position: 'relative' }}>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#fff', fontWeight: 500, marginRight: '8px' }}>{item.title}</span>
                            <span style={{ color: '#94a3b8' }}>{item.date}</span>
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>{item.description}</div>
                          <Tag color="error" style={{ border: 'none', background: 'rgba(255, 77, 79, 0.15)', color: '#ffccc7' }}>{item.penalty}</Tag>
                        </div>
                      ),
                    }))}
                  />
                </div>

              </div>
            )}

            {/* ================= 模式 B: 图谱模式 ================= */}
            {viewMode === 'graph' && (
               <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
                 <div style={{ flexShrink: 0, marginBottom: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                   <Button size="small" type={graphSource === 'analysis' ? 'primary' : 'dashed'} onClick={() => setGraphSource('analysis')} style={{ fontSize: '12px' }}>本次对齐</Button>
                   <Button size="small" type={graphSource === 'knowledge' ? 'primary' : 'dashed'} onClick={() => setGraphSource('knowledge')} style={{ fontSize: '12px' }}>海事全量知识图谱</Button>
                 </div>
                 
                 <div style={{ flex: 1, minHeight: 0 }}>
                    {/* 我们将带有 graphData 的 alignmentResult 传递过去 */}
                    <FedAnchorGraph data={graphSource === 'analysis' ? alignmentResult : legalKGData} mode={graphSource} width={420} height={320} />
                 </div>

                 <div style={{ flexShrink: 0, marginTop: '10px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                   <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: '2px', fontSize: '12px' }}> <PartitionOutlined /> 引擎研判说明</div>
                   <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.3' }}>
                     {graphSource === 'analysis' ? "中心节点代表本次提炼的核心语义锚点，青色虚线展示双向规则的向量对齐映射。" : "基于公域数据与企业私有数据构建的全局海事实体关系拓扑。"}
                   </div>
                 </div>
               </div>
            )}
          </div>
        </div>
      );
    };
    
    if (!renderContent()) return null;
    return null;
  };

  return (
    <div style={{ position: 'absolute', top: '100px', right: '20px', bottom: '100px', width: PANEL_WIDTH, zIndex: 1000, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ pointerEvents: 'auto', marginRight: '10px', marginTop: '20px', transition: 'all 0.5s', transform: collapsed ? `translateX(${PANEL_WIDTH})` : 'translateX(0)' }}>
        <Button type="primary" shape="circle" icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ background: '#00f0ff', borderColor: '#00f0ff', color: '#000', boxShadow: '0 0 10px #00f0ff' }} />
      </div>

      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: collapsed ? 'translateX(110%)' : 'translateX(0)', opacity: collapsed ? 0.5 : 1 }}>
        <TechCard title={<><FileTextOutlined /> 智能分析面板</>} height="100%">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '15px', overflow: 'hidden' }}>
            {selectedTargetId ? (
               <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {renderContent()}
               </div>
            ) : (
               renderContent()
            )}
          </div>
        </TechCard>
      </div>
    </div>
  );
};

export default RightPanel;