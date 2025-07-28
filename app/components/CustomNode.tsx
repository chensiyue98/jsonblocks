// components/CustomNode.tsx
'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  const [draggedProperty, setDraggedProperty] = useState<number | null>(null);
  const [isCommandPressed, setIsCommandPressed] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const propertyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cleanupFunctions = useRef(new WeakMap<HTMLDivElement, () => void>());

  // Listen for Command key press/release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey) {
        setIsCommandPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey) {
        setIsCommandPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up direct event listeners on property elements
  useEffect(() => {
    const setupPropertyListeners = () => {
      propertyRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const handleMouseDown = (event: MouseEvent) => {
          if (!event.metaKey) return;
          
          console.log('Direct mousedown on property:', index);
          
          // IMMEDIATELY prevent all propagation
          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
          
          setDraggedProperty(index);
          
          const startX = event.clientX;
          const startY = event.clientY;
          dragStartPos.current = { x: startX, y: startY };
          
            const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (!dragStartPos.current) return;
            
            const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
            
            if (!isDragging.current && (deltaX > 3 || deltaY > 3)) {
              isDragging.current = true;
              
              const dragVisual = document.createElement('div');
              dragVisual.id = 'property-drag-visual';
              dragVisual.textContent = `${data.properties[index].key}: ${JSON.stringify(data.properties[index].value)}`;
              dragVisual.style.cssText = `
                position: fixed;
                background: rgba(51, 51, 51, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                pointer-events: none;
                z-index: 10000;
                transform: translate(-50%, -50%);
                border: 2px solid #007acc;
              `;
              document.body.appendChild(dragVisual);
              
              console.log('Started visual dragging for property:', index);
            }
            
            const dragVisual = document.getElementById('property-drag-visual');
            if (dragVisual && isDragging.current) {
              dragVisual.style.left = e.clientX + 'px';
              dragVisual.style.top = e.clientY + 'px';
              
              // Check if we're over a valid drop target and update visual feedback
              const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
              const dropTarget = elementBelow?.closest('.custom-node');
              const targetNodeId = dropTarget?.getAttribute('data-node-id');
              
              if (dropTarget && targetNodeId && targetNodeId !== id) {
                // Over a valid drop target
                dragVisual.style.borderColor = '#4caf50';
                dragVisual.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
                (dropTarget as HTMLElement).style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                
                // Clear previous highlights
                document.querySelectorAll('.custom-node').forEach(node => {
                  if (node !== dropTarget && node.getAttribute('data-node-id') !== id) {
                    (node as HTMLElement).style.backgroundColor = '';
                  }
                });
              } else {
                // Not over a valid drop target
                dragVisual.style.borderColor = '#007acc';
                dragVisual.style.backgroundColor = 'rgba(51, 51, 51, 0.9)';
                
                // Clear all highlights
                document.querySelectorAll('.custom-node').forEach(node => {
                  if (node.getAttribute('data-node-id') !== id) {
                    (node as HTMLElement).style.backgroundColor = '';
                  }
                });
              }
            }
          };          const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('Mouse up at:', e.clientX, e.clientY);
            
            const dragVisual = document.getElementById('property-drag-visual');
            if (dragVisual) {
              document.body.removeChild(dragVisual);
            }
            
            // Clean up all visual highlights
            document.querySelectorAll('.custom-node').forEach(node => {
              if (node.getAttribute('data-node-id') !== id) {
                (node as HTMLElement).style.backgroundColor = '';
              }
            });
            
            if (isDragging.current) {
              // Hide the drag visual temporarily to get the element below
              const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
              console.log('Element below cursor:', elementBelow);
              
              // Look for any custom-node element (could be the node itself or any child)
              const dropTarget = elementBelow?.closest('.custom-node');
              console.log('Drop target found:', dropTarget);
              
              if (dropTarget) {
                const targetNodeId = dropTarget.getAttribute('data-node-id');
                console.log('Target node ID:', targetNodeId, 'Source node ID:', id);
                
                if (targetNodeId && targetNodeId !== id && data.onRowTransfer) {
                  console.log('Executing property transfer from', id, 'to', targetNodeId, 'property index:', index);
                  try {
                    data.onRowTransfer(id, targetNodeId, index);
                    console.log('Property transfer completed successfully');
                  } catch (error) {
                    console.error('Error during property transfer:', error);
                  }
                } else if (targetNodeId === id) {
                  console.log('Cannot drop on same node');
                } else if (!targetNodeId) {
                  console.log('No target node ID found');
                } else if (!data.onRowTransfer) {
                  console.log('No onRowTransfer callback provided');
                }
              } else {
                console.log('No drop target found - dropped outside valid area');
              }
            } else {
              console.log('Mouse up without dragging');
            }
            
            isDragging.current = false;
            dragStartPos.current = null;
            setDraggedProperty(null);
            
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
          };
          
          document.addEventListener('mousemove', handleMouseMove, true);
          document.addEventListener('mouseup', handleMouseUp, true);
        };

        // Add the listener with capture to intercept before ReactFlow
        ref.addEventListener('mousedown', handleMouseDown, true);
        
        // Store cleanup function
        cleanupFunctions.current.set(ref, () => {
          ref.removeEventListener('mousedown', handleMouseDown, true);
        });
      });
    };

    setupPropertyListeners();

    return () => {
      // Cleanup all listeners
      propertyRefs.current.forEach(ref => {
        if (ref) {
          const cleanup = cleanupFunctions.current.get(ref);
          if (cleanup) {
            cleanup();
            cleanupFunctions.current.delete(ref);
          }
        }
      });
    };
  }, [data.properties, id, data.onRowTransfer]);

  const onDragOverNode = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  // Prevent node dragging when we're dragging a property
  const handleNodeMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (draggedProperty !== null || isDragging.current) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, [draggedProperty]);

  const handleNodePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (draggedProperty !== null || isDragging.current) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, [draggedProperty]);

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
      data-node-id={id}
      onDragOver={onDragOverNode}
      onMouseDown={handleNodeMouseDown}
      onPointerDown={handleNodePointerDown}
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
          userSelect: 'none', // Prevent text selection
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
        {properties.length > 0 && (
          <span style={{ 
            color: '#ccc', 
            fontSize: '10px', 
            marginLeft: '8px',
            opacity: 0.7 
          }}>
            ⌘+drag to move property
          </span>
        )}
      </div>

      {/* 属性列表，行间用细线分隔 */}
      <div style={{ padding: '8px' }}>
        {properties.map((p: PropWithHandle, i: number) => (
          <div
            key={p.key}
            ref={(el) => {
              propertyRefs.current[i] = el;
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: i < properties.length - 1 ? '1px solid #444' : 'none',
              position: 'relative',
              cursor: isCommandPressed ? 'grab' : 'default', // Show grab cursor only when Cmd is pressed
              transition: 'background-color 0.2s, border-color 0.2s',
              padding: '4px 6px', // 增加内边距使行更容易点击
              borderRadius: 2,
              userSelect: 'none', // Prevent text selection during drag
              opacity: draggedProperty === i ? 0.5 : 1,
              backgroundColor: draggedProperty === i ? '#2d2d2d' : 'transparent',
              border: isCommandPressed ? '1px solid #007acc' : '1px solid transparent', // Show blue border when Cmd is pressed
            }}
            onMouseOver={(e) => {
              if (draggedProperty === null) {
                e.currentTarget.style.backgroundColor = isCommandPressed ? '#1a3a52' : '#2d2d2d';
              }
            }}
            onMouseOut={(e) => {
              if (draggedProperty === null) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
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