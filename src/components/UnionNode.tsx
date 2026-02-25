"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

/**
 * An invisible "midpoint" node placed between a couple.
 * Child-descent edges originate from this node's bottom handle,
 * so children visually connect to the center of both parents.
 */
function UnionNodeComponent(_props: NodeProps) {
    return (
        <div className="union-node">
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export default memo(UnionNodeComponent);
