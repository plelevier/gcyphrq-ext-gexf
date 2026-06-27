import type { GraphInputExtension, GraphInputExtensionContext, GraphInput } from 'gcyphrq';
import { parse } from 'graphology-gexf';
import Graph from 'graphology';

/**
 * Convert a Graphology graph (created by graphology-gexf) into the
 * GraphInput shape that gcyphrq expects.
 *
 * GEXF stores the relationship type in the edge `label` attribute.
 * We map it to the gcyphrq convention (`type` by default, or the
 * custom property name from `ctx.edgeTypeProperty`).
 *
 * For mixed graphs, `graphology-gexf` separates directed and undirected
 * edges internally. We collect both and mark undirected ones so that
 * gcyphrq's engine can traverse them bidirectionally.
 */
function graphologyToGraphInput(
  graph: InstanceType<typeof Graph>,
  edgeTypeProperty: string,
): GraphInput {
  const nodes: GraphInput['nodes'] = [];
  const edges: GraphInput['edges'] = [];

  for (const id of graph.nodes()) {
    const attrs = graph.getNodeAttributes(id) as Record<string, unknown>;
    nodes.push({ key: id, attributes: attrs });
  }

  const isMixed = graph.type === 'mixed';

  // In mixed graphs, graphology-gexf stores undirected edges separately.
  // We iterate undirected edges first to mark them, then add all edges.
  const undirectedEdgeIds = new Set<string>();
  if (isMixed && typeof graph.forEachUndirectedEdge === 'function') {
    graph.forEachUndirectedEdge((edgeId) => {
      undirectedEdgeIds.add(edgeId);
    });
  }

  graph.forEachEdge((edgeId, attrs, source, target) => {
    const edgeAttrs = { ...attrs } as Record<string, unknown>;
    // GEXF stores the relationship type in the edge "label" attribute.
    // Map it to gcyphrq's edge type property (default: "type").
    if (edgeAttrs.label !== undefined) {
      edgeAttrs[edgeTypeProperty] = edgeAttrs.label;
      delete edgeAttrs.label;
    }
    const isUndirected = undirectedEdgeIds.has(edgeId) || edgeAttrs.undirected === true;
    edges.push({
      key: edgeId,
      source,
      target,
      ...(isUndirected ? { undirected: true } : {}),
      attributes: edgeAttrs,
    });
  });

  return { nodes, edges };
}

const gexfExtension: GraphInputExtension = {
  async convert(ctx: GraphInputExtensionContext): Promise<GraphInput> {
    const content = typeof ctx.content === 'string' ? ctx.content : ctx.content.toString();
    const edgeTypeProperty = ctx.edgeTypeProperty ?? 'type';

    // graphology-gexf needs a Graph constructor that supports all graph types
    // (directed, undirected, mixed). We pass the base Graph constructor which
    // the parser uses to instantiate the right graph type based on the GEXF
    // defaultedgetype attribute.
    try {
      const graph = parse(Graph, content);
      const result = graphologyToGraphInput(graph, edgeTypeProperty);

      // Surface the graph type from the GEXF defaultedgetype attribute
      // so gcyphrq creates the correct Graphology graph.
      const graphType = graph.type;
      if (graphType !== 'directed') {
        result.options = { type: graphType };
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse GEXF file "${ctx.filePath}": ${message}`);
    }
  },
};

export default gexfExtension;
