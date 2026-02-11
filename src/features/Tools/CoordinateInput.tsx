import React, { useEffect, useState } from 'react';
import { Viewer } from 'cesium';
import { Input, Button, Radio, Form, Tooltip } from 'antd';
import { 
  CompassOutlined, 
  NodeIndexOutlined, 
  SendOutlined, 
  DeleteOutlined,
  BookOutlined 
} from '@ant-design/icons';
import { useCustomShapes } from '../Map/hooks/useCustomShapes';

const { TextArea } = Input;

interface Props {
  viewer: Viewer | null;
}

const CoordinateInput: React.FC<Props> = ({ viewer }) => {
  const [mode, setMode] = useState<'point' | 'route'>('point');
  const [form] = Form.useForm();
  
  const { deployPoint, deployRoute, clearAll, setupInteraction } = useCustomShapes(viewer);

  useEffect(() => {
    if (viewer) {
      const cleanup = setupInteraction();
      return cleanup;
    }
  }, [viewer, setupInteraction]);

  const handleDeploy = (values: any) => {
    if (mode === 'point') {
      deployPoint(values.coords, values.desc);
    } else {
      deployRoute(values.coords, values.desc);
    }
  };

  return (
    <Form form={form} onFinish={handleDeploy} layout="vertical" style={{ width: '100%' }}>
      {/* 模式选择 */}
      <Form.Item style={{marginBottom: '15px'}}>
        <Radio.Group 
          value={mode} 
          onChange={e => setMode(e.target.value)}
          buttonStyle="solid"
          style={{width: '100%', display: 'flex'}}
        >
          <Radio.Button value="point" style={{flex:1, textAlign:'center'}}>
            <CompassOutlined /> 单点定位
          </Radio.Button>
          <Radio.Button value="route" style={{flex:1, textAlign:'center'}}>
            <NodeIndexOutlined /> 航线模拟
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      {/* 坐标输入 */}
      <Form.Item 
        name="coords" 
        label={<span style={{color: '#cbd5e1'}}>
          {mode === 'point' ? '坐标 (经度, 纬度)' : '航线节点 (分号分隔)'}
        </span>}
        rules={[{ required: true, message: '请输入坐标数据' }]}
      >
        <TextArea 
          rows={4} 
          placeholder={mode === 'point' 
            ? "例: 124.5, 26.8" 
            : "例: \n123.0, 26.0;\n124.0, 27.0;\n125.0, 25.5"
          }
          style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #475569' }}
        />
      </Form.Item>

      {/* 案件备注 */}
      <Form.Item name="desc" label={<span style={{color: '#cbd5e1'}}>备注/案情关键词</span>}>
         <Input 
           placeholder="例: 渔船非法作业" 
           prefix={<BookOutlined style={{color:'#64748b'}} />}
           style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #475569' }}
         />
      </Form.Item>

      {/* 操作按钮 */}
      <div style={{display: 'flex', gap: '10px'}}>
        <Button 
          type="primary" 
          htmlType="submit" 
          icon={<SendOutlined />}
          block
          style={{ background: '#faad14', borderColor: '#faad14', color: '#000', fontWeight: 'bold' }}
        >
          部署
        </Button>
        
        <Tooltip title="清除地图上的所有研判标记">
          <Button 
            icon={<DeleteOutlined />} 
            onClick={clearAll}
            style={{ background: 'transparent', borderColor: '#475569', color: '#ef4444' }}
          />
        </Tooltip>
      </div>
    </Form>
  );
};

export default CoordinateInput;