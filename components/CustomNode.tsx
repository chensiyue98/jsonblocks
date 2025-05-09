'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function CustomNode({ data }: { data: { label: string; properties: { key: string; value: any }[]; isRoot?: boolean } }) {
  const { label, properties, isRoot } = data;
  // 确定 header 颜色
  let headerColor = '#388e3c';            // 默认对象绿
  if (label.includes('[Array]')) headerColor = '#283593';   // 数组藏青
  if (isRoot) headerColor = '#6a1b9a';     // 根节点紫色

  // 清理标签显示文本
  const displayLabel = label.replace(/ \[Array\]| \{Object\}/g, '');

  return (
    <div style={{ width: 220, fontFamily: 'monospace', borderRadius: 4, overflow: 'hidden', background: '#212121', boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
      {/* 连入 Handle */}
      <Handle type="target" position={Position.Left} style={{ background: headerColor }} />
      <Handle type="target" position={Position.Top} style={{ background: headerColor }} />

      {/* Header */}
      <div style={{ background: headerColor, color: '#fff', padding: '4px 8px', fontSize: 12, fontWeight: 'bold' }}>
        {`{${displayLabel}}`}
      </div>

      {/* 属性列表 */}
      <div style={{ padding: '8px 12px', color: '#eee', fontSize: 12, lineHeight: '1.4' }}>
        {properties.map((p) => (
          <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#90caf9' }}>{p.key}</span>
            <span style={{ color: typeof p.value === 'number' ? '#ffeb3b' : typeof p.value === 'boolean' ? (p.value ? '#66bb6a' : '#ef5350') : '#fff' }}>
              {JSON.stringify(p.value)}
            </span>
          </div>
        ))}
      </div>

      {/* 连出 Handle */}
      <Handle type="source" position={Position.Right} style={{ background: headerColor }} />
      <Handle type="source" position={Position.Right} style={{ background: headerColor }} />
    </div>
  );
}