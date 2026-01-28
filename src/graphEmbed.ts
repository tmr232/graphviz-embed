import {
  fromDot,
  toDot,
  type NodeModel,
  type RootGraphModel,
} from "ts-graphviz";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

const GRAPHVIZ_PPI = 72;

export class EmbeddingRenderer {
  private graphviz: Graphviz;
  private constructor(graphviz: Graphviz) {
    this.graphviz = graphviz;
  }

  public static async load(): Promise<EmbeddingRenderer> {
    const graphviz = await Graphviz.load();
    return new EmbeddingRenderer(graphviz);
  }

  public render(
    dot: string | RootGraphModel,
    embeddings: Map<string, Element>,
  ): SVGElement {
    const svgFromDot = (dotString: string) => this.graphviz.dot(dotString);
    return renderWithEmbeddings(dot, embeddings, svgFromDot);
  }
}

export function renderWithEmbeddings(
  dot: string | RootGraphModel,
  embeddings: Map<string, Element>,
  svgFromDot: (dot: string) => string,
): SVGElement {
  const graph = (() => {
    if (typeof dot === "string") {
      return fromDot(dot);
    }
    return dot;
  })();

  const nodesByDotId = new Map<string, NodeModel>();

  for (const node of graph.nodes) {
    const dotId = node.attributes.get("id");
    if (!dotId) {
      continue;
    }
    nodesByDotId.set(dotId, node);
  }

  // Remove graph background
  graph.attributes.graph.set("bgcolor", "invis");

  for (const [nodeId, nodeEmbedding] of embeddings.entries()) {
    // const node = graph.getNode(nodeId);
    const node = nodesByDotId.get(nodeId);
    if (!node) {
      throw new Error(
        `Node ID ${nodeId} provided for embedding, but no such node ID exists in the graph.`,
      );
    }

    const boundingRect = nodeEmbedding.getBoundingClientRect();
    // Graphviz specifies sizes in points & inches, so we need to convert our sizes accordingly.
    node.attributes.set("width", boundingRect.width / GRAPHVIZ_PPI);
    node.attributes.set("height", boundingRect.height / GRAPHVIZ_PPI);
    node.attributes.set("fixedsize", "1");

    // Make sure a <polygon> gets created
    node.attributes.set("shape", "rect");
    // Hide the node itself
    node.attributes.set("color", "invis");
    node.attributes.set("label", "");
  }

  const svg = svgFromDot(toDot(graph));

  const graphElement = svgToElement(`<div>${svg}</div>`);
  if (!(graphElement instanceof Element)) {
    throw new Error("Failed creating SVG element");
  }

  for (const [nodeId, nodeEmbedding] of embeddings.entries()) {
    const svgNode = graphElement.querySelector(`#${nodeId} polygon`) as
      | SVGPolygonElement
      | undefined
      | null;
    if (!svgNode) {
      throw new Error(`Failed to find rendered SVG node for node ID ${nodeId}`);
    }
    const nodeRect = getNodeRect(svgNode);

    const { width, height } = nodeEmbedding.getBoundingClientRect();
    const foreignObject: SVGForeignObjectElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject",
    );
    foreignObject.appendChild(nodeEmbedding);
    foreignObject.setAttribute("width", `${width}px`);
    foreignObject.setAttribute("height", `${height}px`);
    foreignObject.setAttribute(
      "transform",
      `translate(${nodeRect.x} ${nodeRect.y})`,
    );

    svgNode.parentElement?.appendChild(foreignObject);
  }

  return graphElement;
}

/**
 * Calculate the bounding-box of an SVG polygon.
 * Does not require the SVG element to be drawn.
 */
function getNodeRect(polygon: SVGPolygonElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  let first = true;
  for (const point of polygon.points) {
    if (first) {
      first = false;
      minX = point.x;
      maxX = minX;
      minY = point.y;
      maxY = minY;
    } else {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function svgToElement(svg: string): SVGElement {
  const template = document.createElement("template");
  template.innerHTML = svg;
  const svgElement = template.content.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG element generated from input string.");
  }
  return svgElement;
}
