import {
  BaseEdge,
  Position,
  getBezierEdgeCenter,
  type EdgeProps,
} from '@xyflow/react';

const workflowEdgeCurvature = 0.3;
const minimumSideControlOffset = 70;

function bezierControlOffset(distance: number) {
  if (distance >= 0) {
    return distance * 0.5;
  }
  return workflowEdgeCurvature * 25 * Math.sqrt(-distance);
}

function controlOffset(distance: number) {
  return Math.max(bezierControlOffset(distance), minimumSideControlOffset);
}

function controlPoint(
  position: Position,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  switch (position) {
    case Position.Left:
      return [x1 - controlOffset(x1 - x2), y1] as const;
    case Position.Right:
      return [x1 + controlOffset(x2 - x1), y1] as const;
    case Position.Top:
      return [x1, y1 - bezierControlOffset(y1 - y2)] as const;
    case Position.Bottom:
      return [x1, y1 + bezierControlOffset(y2 - y1)] as const;
    default:
      return [x1, y1] as const;
  }
}

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerStart,
  markerEnd,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  interactionWidth,
}: EdgeProps) {
  const resolvedSourcePosition = sourcePosition ?? Position.Bottom;
  const resolvedTargetPosition = targetPosition ?? Position.Top;
  const [sourceControlX, sourceControlY] = controlPoint(
    resolvedSourcePosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
  );
  const [targetControlX, targetControlY] = controlPoint(
    resolvedTargetPosition,
    targetX,
    targetY,
    sourceX,
    sourceY,
  );
  const [labelX, labelY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
  });
  const edgePath = `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      markerStart={markerStart}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={interactionWidth}
    />
  );
}
