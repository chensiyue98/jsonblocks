import { Node, Edge } from 'reactflow';

interface PropWithHandle {
  key: string;
  value: any;
  handleId?: string;
}


/**
 * 构建 ReactFlow 节点/边：
 * - 每个分支节点（Object/Array）作为独立节点，
 * - 叶子属性内联到 properties 中
 */
export function flattenTreeForFlow(tree: any) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let idx = 0;
function dfs(n: any, depth = 0, pid: string | null = null) {
    const props: PropWithHandle[] = [];
    // 存 child 节点＋它对应用哪个 handleId
    const childrenWithHandle: { node: any; handleId: string }[] = [];

    for (const c of n.children || []) {
      // 拆出 key 和 “: value” 部分
      const [k, ...rest] = c.label.split(': ');
      if (c.children && c.children.length > 0) {
        // 是分支节点
        const handleId = `${n.id}-${k}`;  
        if (c.label.includes('[Array]')) {
          // 数组：摘要内联，然后把子节点直接扁平挂
          props.push({ key: k, value: `[${c.children.length} items]`, handleId });
          for (const gc of c.children) {
            // 把原来的 “0: …” label 拆成 index + rest，然后重写成 “products (0): …”
            const [childKey, ...childRest] = gc.label.split(': ');
            gc.label = `${k} [${childKey}]${childRest.length ? ': ' + childRest.join(': ') : ''}`;
            childrenWithHandle.push({ node: gc, handleId });
          }
        } else {
          // 对象：摘要内联，子节点保留为分支
          props.push({ key: k, value: `{${c.children.length} keys}`, handleId });
          childrenWithHandle.push({ node: c, handleId });
        }
      } else {
        // 叶子
        props.push({ key: k, value: rest.join(': ') });
      }
    }

    // 造节点
    nodes.push({
      id: n.id,
      type: 'custom',
      data: {
        label: n.label,
        properties: props,
        isRoot: pid === null,
      },
      position: { x: depth * 250, y: idx++ * 120 },
    });

    // 造连线，用 sourceHandle 精确到行
    for (const { node: child, handleId } of childrenWithHandle) {
      edges.push({
        id: `${n.id}-${child.id}`,
        source: n.id,
        sourceHandle: handleId,
        target: child.id,
        targetHandle: 'target',
      });
      dfs(child, depth + 1, n.id);
    }
  }

  dfs(tree);
  return { nodes, edges };
}

export function reparentNode(tree: any, nodeId: string, newParentId: string) {
  const copy = JSON.parse(JSON.stringify(tree));
  let moving: any = null;
  function remove(n: any) {
    n.children = n.children?.filter((c: any) => {
      if (c.id === nodeId) { moving = c; return false; }
      return true;
    }) || [];
    n.children.forEach(remove);
  }
  remove(copy);
  if (!moving) return tree;
  function insert(n: any) {
    if (n.id === newParentId) {
      n.children = [...(n.children || []), moving];
      return true;
    }
    return n.children?.some(insert);
  }
  insert(copy);
  return copy;
}