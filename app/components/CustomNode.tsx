// components/CustomNode.tsx
'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

type PropWithHandle = {
  key: string;
  value: any;
  handleId?: string;
};

type CustomNodeData = {
  label: string;
  properties: PropWithHandle[];
  isRoot?: boolean;
};

export default function CustomNode({
  data,
}: {
  data: CustomNodeData;
}) {
  const { label, properties, isRoot } = data;

  // 根节点紫色，数组节点深蓝，其它绿色
  let headerColor = '#388e3c';
  if (label.includes('[Array]')) headerColor = '#283593';
  if (isRoot) headerColor = '#6a1b9a';

  // 清理标签后缀，只保留纯名称
  const displayLabel = label.replace(/ \[Array\]| \{Object\}/g, '');

  return (
    <div
      style={{
        width: 300,
        fontFamily: 'monospace',
        borderRadius: 4,
        background: '#212121',
        boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
        position: 'relative',
      }}
    >
      {/* 表头区域 */}
      <div
        style={{
          background: headerColor,
          padding: '6px 8px',
          borderRadius: '4px 4px 0 0',
          position: 'relative',
        }}
      >
        {/* Target Handle 在表头左侧 */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: headerColor,
            top: '14px',  // 表头高度约28px，居中
            left: -8      // 拉到节点左侧外
          }}
        />
        <span style={{ color: '#fff', fontWeight: 'bold' }}>
          {displayLabel}
        </span>
      </div>

      {/* 属性列表，行间用细线分隔 */}
      <div style={{ padding: '8px' }}>
        {properties.map((p, i) => (
          <div
            key={p.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: i < properties.length - 1 ? '1px solid #444' : 'none',
              position: 'relative',
            }}
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

            {/* Source Handle 在行尾右侧 */}
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
}
