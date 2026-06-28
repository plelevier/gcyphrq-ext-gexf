# gcyphrq-ext-gexf

GEXF graph format extension for [gcyphrq](https://github.com/plelevier/gcyphrq).

Converts [GEXF](http://gexf.net/) files (produced by Gephi, NetworkX, igraph, etc.) into gcyphrq's in-memory graph format.

## Install

### Global CLI install

Install `gcyphrq` and this extension globally so the `gcyphrq` command is available everywhere:

```bash
npm install -g gcyphrq gcyphrq-ext-gexf
```

### Project dependency install

Install both as project dependencies:

```bash
npm install gcyphrq gcyphrq-ext-gexf
```

## Usage

### CLI

```bash
gcyphrq -g my-graph.gexf --ext gexf -e 'MATCH (n) RETURN n'
```

### Library

```ts
import { convertWithExtension, executeQuery } from 'gcyphrq';
import { readFileSync } from 'fs';

const content = readFileSync('my-graph.gexf', 'utf-8');
const graphData = await convertWithExtension('gexf', {
  content,
  filePath: 'my-graph.gexf',
});

const results = await executeQuery(graphData, 'MATCH (n) RETURN n');
```

## Supported formats

- `.gexf` files (GEXF 1.2 and 1.3)
- `.xml` files with GEXF content

Parses directed, undirected, and mixed graphs. Supports node/edge attributes, edge labels, and typed attribute models.

## Examples

See the `examples/` directory for sample GEXF files:

### Simple directed graph

```bash
# List all persons
gcyphrq -g examples/simple-directed.gexf --ext gexf -e 'MATCH (n:Person) RETURN n.name'

# Find who Alice knows
gcyphrq -g examples/simple-directed.gexf --ext gexf -e 'MATCH (a:Person {name: "Alice"})-[r]->(b:Person) RETURN b.name, type(r)'

# Find all relationships
gcyphrq -g examples/simple-directed.gexf --ext gexf -e 'MATCH (a:Person)-[r]->(b:Person) RETURN a.name, type(r), b.name'
```

### Graph with typed attributes

```bash
# Find all engineers
gcyphrq -g examples/with-attributes.gexf --ext gexf -e 'MATCH (n:Employee) WHERE n.role = "engineer" RETURN n.name, n.age'

# Find edges with weight > 0.8
gcyphrq -g examples/with-attributes.gexf --ext gexf -e 'MATCH (a:Employee)-[r]->(b:Employee) WHERE r.weight > 0.8 RETURN a.name, type(r), b.name'

# Find who manages whom
gcyphrq -g examples/with-attributes.gexf --ext gexf -e 'MATCH (a:Employee)-[r:MANAGES]->(b:Employee) RETURN a.name, b.name'
```

### Undirected graph

```bash
# List all city connections
gcyphrq -g examples/undirected.gexf --ext gexf -e 'MATCH (a:City)--(b:City) RETURN a.name, b.name'

# Find cities connected to Paris
gcyphrq -g examples/undirected.gexf --ext gexf -e 'MATCH (c:City {name: "Paris"})--(neighbor:City) RETURN neighbor.name'
```

### Mixed graph

```bash
# List all directed edges (FOLLOWS)
gcyphrq -g examples/mixed.gexf --ext gexf -e 'MATCH (a:User)-[r]->(b:User) RETURN a.name, type(r), b.name'

# List all edges (FOLLOWS + FRIEND)
gcyphrq -g examples/mixed.gexf --ext gexf -e 'MATCH (a:User)-[r]-(b:User) RETURN a.name, type(r), b.name'
```

## License

MIT

