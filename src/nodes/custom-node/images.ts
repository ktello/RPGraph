import type { Edge } from '@xyflow/react';
import type { ChatImageAttachment, WorkflowNode } from '../../types';
import { dependsOnUserInputImage } from '../shared/imageInputs';
import type { CustomNodeDefinition } from './model';

export type CustomNodeImageInputs = Record<string, ChatImageAttachment[]>;

export function customNodeImageInputsFromGraph(
  definition: CustomNodeDefinition,
  node: WorkflowNode,
  context: {
    nodes: WorkflowNode[];
    edges: Edge[];
    inputImages: ChatImageAttachment[];
  },
): CustomNodeImageInputs {
  return Object.fromEntries(
    definition.inputs
      .filter((port) => port.valueType === 'image')
      .map((port) => {
        const edge = context.edges.find(
          (candidate) => candidate.target === node.id && candidate.targetHandle === port.id,
        );
        const images = edge && dependsOnUserInputImage(edge.source, edge.sourceHandle, context)
          ? context.inputImages
          : [];
        return [port.id, images];
      }),
  );
}

export function customNodeImageInputMetadata(imageInputs: CustomNodeImageInputs) {
  return Object.fromEntries(
    Object.entries(imageInputs).map(([inputId, images]) => [
      inputId,
      images.map((image) => ({
        id: image.id,
        name: image.name,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
      })),
    ]),
  );
}

export function customNodeImagesForRequest(
  requestedImages: boolean | string | string[] | undefined,
  imageInputs: CustomNodeImageInputs,
) {
  if (requestedImages === true) {
    return uniqueImages(Object.values(imageInputs).flat());
  }
  if (typeof requestedImages === 'string') {
    return imageInputs[requestedImages] ?? [];
  }
  if (Array.isArray(requestedImages)) {
    return uniqueImages(requestedImages.flatMap((inputId) => imageInputs[inputId] ?? []));
  }
  return undefined;
}

function uniqueImages(images: ChatImageAttachment[]) {
  return Array.from(new Map(images.map((image) => [image.id, image])).values());
}
