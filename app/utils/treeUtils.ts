import { Node, Edge } from "reactflow";

interface PropWithHandle {
    key: string;
    value: any;
    handleId?: string;
}

// 扩展树节点接口，添加原始键和值
interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    // 新增属性，存储原始信息
    originalKey?: string;
    originalValue?: string;
    isArrayItem?: boolean;
    arrayIndex?: number;
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
    function dfs(n: TreeNode, depth = 0, pid: string | null = null) {
        const props: PropWithHandle[] = [];
        // 存 child 节点＋它对应用哪个 handleId
        const childrenWithHandle: { node: TreeNode; handleId: string }[] = [];

        for (const c of n.children || []) {
            // 如果没有原始键值信息，从标签初始化一次（兼容旧数据）
            if (c.originalKey === undefined) {
                const [k, ...rest] = c.label.split(": ");
                c.originalKey = k;
                c.originalValue = rest.join(": ");
                
                // 检查是否是数组项
                const indexMatch = k.match(/^(\d+)$/);
                if (indexMatch) {
                    c.isArrayItem = true;
                    c.arrayIndex = parseInt(indexMatch[1]);
                }
            }

            const k = c.originalKey || "";

            if (c.children && c.children.length > 0) {
                // 是分支节点
                const handleId = `${n.id}-${k}`;
                if (c.label.includes("[Array]")) {
                    // 数组：摘要内联，然后把子节点直接扁平挂
                    props.push({
                        key: k,
                        value: `[${c.children.length} items]`,
                        handleId,
                    });
                    for (const gc of c.children) {
                        // 确保子节点有原始键值（兼容旧数据）
                        if (gc.originalKey === undefined) {
                            const [childKey, ...childRest] = gc.label.split(": ");
                            gc.originalKey = childKey;
                            gc.originalValue = childRest.join(": ");
                            
                            // 检查是否是纯索引
                            const indexMatch = childKey.match(/^(\d+)$/);
                            if (indexMatch) {
                                gc.isArrayItem = true;
                                gc.arrayIndex = parseInt(indexMatch[1]);
                            }
                        }

                        // 使用数组名称和原始索引格式化标签
                        const index = gc.arrayIndex !== undefined ? gc.arrayIndex : gc.originalKey;
                        const value = gc.originalValue ? `: ${gc.originalValue}` : "";
                        
                        // 设置格式化后的标签
                        gc.label = `${k} [${index}]${value}`;
                        childrenWithHandle.push({ node: gc, handleId });
                    }
                } else {
                    // 对象：摘要内联，子节点保留为分支
                    props.push({
                        key: k,
                        value: `{${c.children.length} keys}`,
                        handleId,
                    });
                    childrenWithHandle.push({ node: c, handleId });
                }
            } else {
                // 叶子
                props.push({ key: k, value: c.originalValue || "" });
            }
        }

        // 造节点
        nodes.push({
            id: n.id,
            type: "custom",
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
                targetHandle: "target",
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
        n.children =
            n.children?.filter((c: any) => {
                if (c.id === nodeId) {
                    moving = c;
                    return false;
                }
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
