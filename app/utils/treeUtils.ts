import { Node, Edge } from 'reactflow';

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
    // 分离叶子属性
    const props: { key: string; value: any }[] = [];
    const childrenBranches: any[] = [];
    for (const c of n.children || []) {
      if (!c.children || c.children.length === 0) {
        // leaf: parse key/value
        const [k, ...rest] = c.label.split(': ');
        props.push({ key: k, value: rest.join(': ') });
      } else childrenBranches.push(c);
    }
    // Node data: label + properties
    nodes.push({
      id: n.id,
      type: 'custom',
      data: { label: n.label, properties: props },
      position: { x: depth * 250, y: idx++ * 120 },
    });
    if (pid) edges.push({ id: `${pid}-${n.id}`, source: pid, target: n.id });
    // recurse branches
    childrenBranches.forEach((b) => dfs(b, depth + 1, n.id));
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