// components/CustomNode.tsx
'use client';

import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

type PropWithHandle = {
  key: string;
  value: any;
  handleId?: string;
};

type CustomNodeData = {
  label: string;
  properties: PropWithHandle[];
  isRoot?: boolean;
  onRowTransfer?: (sourceNodeId: string, targetNodeId: string, propertyIndex: number) => void;
};

// 根据键名生成一致的 HSL 颜色
function getColorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},60%,40%)`;
}

const CustomNode = ({ data, id, isConnectable, ...props }: NodeProps<CustomNodeData>) => {
  const onDragStartRow = useCallback((event: React.DragEvent<HTMLDivElement>, propertyIndex: number) => {
    // Prevent parent node drag when dragging a row
    event.stopPropagation();
    
    // Set the drag data with the source node ID and property index
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      nodeId: id,
      propertyIndex,
      type: 'property-row'
    }));
    
    event.dataTransfer.effectAllowed = 'move';
  }, [id]);

  const onDragOverNode = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropRow = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      
      if (payload.type === 'property-row' && payload.nodeId !== id) {
        // Call the onRowTransfer handler provided in data
        if (data.onRowTransfer) {
          data.onRowTransfer(payload.nodeId, id, payload.propertyIndex);
        }
      }
    } catch (error) {
      console.error('Error processing drop event:', error);
    }
  }, [id, data]);

  const { label, properties, isRoot } = data;

  // 清理标签后缀，只保留纯名称，用于颜色和展示
  const displayLabel = label.replace(/ \[Array\]| \{Object\}/g, '');
  const displayLabelTemp = displayLabel.split(/[: {\[]/)[0];

  // 计算 headerColor：
  // - 根节点：固定紫色
  // - 数组节点：根据数组名着色
  // - 数组子节点：根据数组名着色
  // - 其他对象节点：固定绿色
  let headerColor: string;
  if (isRoot) {
    headerColor = '#6a1b9a';
  } else {
    // 数组节点自身标记带有 "[Array]" 原始标签
    if (label.includes('[Array]')) {
      headerColor = getColorForKey(displayLabelTemp);
    }
    // 数组子节点，匹配 "name (index)"
    else if (/^.+ \(\d+\)$/.test(displayLabelTemp)) {
      // 提取数组名
      const match = displayLabelTemp.match(/^(.+) \(\d+\)$/);
      const arrayName = match ? match[1] : displayLabelTemp;
      headerColor = getColorForKey(arrayName);
    } else {
      headerColor = '#388e3c';
    }
  }

  return (
    <div
      className="custom-node"
      onDragOver={onDragOverNode}
      onDrop={onDropRow}
      style={{
        width: 300,
        fontFamily: 'monospace',
        borderRadius: 4,
        background: '#212121',
        boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
        position: 'relative',
      }}
    >
      {/* 表头区域，左侧 target handle */}
      <div
        style={{
          background: headerColor,
          padding: '6px 8px',
          borderRadius: '4px 4px 0 0',
          position: 'relative',
          cursor: 'move', // 指示表头可拖动
        }}
      >
        <Handle
          type="target"
          id="target"
          position={Position.Left}
          style={{
            background: headerColor,
            top: '14px',
            left: -8,
          }}
        />
        <span style={{ color: '#fff', fontWeight: 'bold' }}>
          {displayLabel}
        </span>
      </div>

      {/* 属性列表，行间用细线分隔 */}
      <div style={{ padding: '8px' }}>
        {properties.map((p: PropWithHandle, i: number) => (
          <div
            key={p.key}
            draggable
            onDragStart={(e) => onDragStartRow(e, i)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              // padding: '4px 0',
              borderBottom: i < properties.length - 1 ? '1px solid #444' : 'none',
              position: 'relative',
              cursor: 'grab', // 指示行可拖拽
              transition: 'background-color 0.2s',
              padding: '4px 6px', // 增加内边距使行更容易点击
              borderRadius: 2,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2d2d2d')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span style={{ color: '#90caf9' }}>{p.key}</span>
            <span
              style={{
                color:
                  typeof p.value === 'number'
                    ? '#ffd54f'
                    : typeof p.value === 'boolean'
                    ? p.value
                      ? '#66bb6a'
                      : '#ef5350'
                    : '#fff',
              }}
            >
              {JSON.stringify(p.value)}
            </span>

            {p.handleId && (
              <Handle
                type="source"
                id={p.handleId}
                position={Position.Right}
                style={{
                  background: headerColor,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                  right: -8,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomNode;