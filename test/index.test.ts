import { describe, it, expect } from 'vitest';
import gexfExtension from '../src/index.js';

const simpleGexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3" version="1.3">
  <graph defaultedgetype="directed">
    <attributes class="node">
      <attribute id="0" title="name" type="string"/>
    </attributes>
    <nodes>
      <node id="0" label="Person">
        <attvalues>
          <attvalue for="0" value="Alice"/>
        </attvalues>
      </node>
      <node id="1" label="Person">
        <attvalues>
          <attvalue for="0" value="Bob"/>
        </attvalues>
      </node>
    </nodes>
    <edges>
      <edge id="0" source="0" target="1" label="KNOWS"/>
    </edges>
  </graph>
</gexf>`;

const undirectedGexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3" version="1.3">
  <graph defaultedgetype="undirected">
    <attributes class="node">
      <attribute id="0" title="name" type="string"/>
    </attributes>
    <nodes>
      <node id="a" label="City">
        <attvalues>
          <attvalue for="0" value="Paris"/>
        </attvalues>
      </node>
      <node id="b" label="City">
        <attvalues>
          <attvalue for="0" value="Lyon"/>
        </attvalues>
      </node>
    </nodes>
    <edges>
      <edge id="e1" source="a" target="b"/>
    </edges>
  </graph>
</gexf>`;

const attrGexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3" version="1.3">
  <graph defaultedgetype="directed">
    <attributes class="node">
      <attribute id="0" title="name" type="string"/>
      <attribute id="1" title="age" type="integer"/>
    </attributes>
    <attributes class="edge">
      <attribute id="0" title="weight" type="float"/>
    </attributes>
    <nodes>
      <node id="0">
        <attvalues>
          <attvalue for="0" value="Alice"/>
          <attvalue for="1" value="30"/>
        </attvalues>
      </node>
      <node id="1">
        <attvalues>
          <attvalue for="0" value="Bob"/>
          <attvalue for="1" value="25"/>
        </attvalues>
      </node>
    </nodes>
    <edges>
      <edge id="e1" source="0" target="1">
        <attvalues>
          <attvalue for="0" value="2.5"/>
        </attvalues>
      </edge>
    </edges>
  </graph>
</gexf>`;

const mixedGexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3" version="1.3">
  <graph defaultedgetype="directed">
    <attributes class="node">
      <attribute id="0" title="name" type="string"/>
    </attributes>
    <nodes>
      <node id="0" label="User">
        <attvalues>
          <attvalue for="0" value="Alice"/>
        </attvalues>
      </node>
      <node id="1" label="User">
        <attvalues>
          <attvalue for="0" value="Bob"/>
        </attvalues>
      </node>
      <node id="2" label="User">
        <attvalues>
          <attvalue for="0" value="Charlie"/>
        </attvalues>
      </node>
    </nodes>
    <edges>
      <edge id="e1" source="0" target="1" label="FOLLOWS"/>
      <edge id="e2" source="0" target="2" type="undirected" label="FRIEND"/>
    </edges>
  </graph>
</gexf>`;

describe('gexf extension', () => {
  it('converts a simple GEXF file', async () => {
    const result = await gexfExtension.convert({
      content: simpleGexf,
      filePath: 'test.gexf',
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.key).toBe('0');
    expect(result.nodes[1]?.key).toBe('1');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('0');
    expect(result.edges[0]?.target).toBe('1');
  });

  it('converts an undirected GEXF file', async () => {
    const result = await gexfExtension.convert({
      content: undirectedGexf,
      filePath: 'test.gexf',
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('a');
    expect(result.edges[0]?.target).toBe('b');
  });

  it('throws on invalid input', async () => {
    await expect(
      gexfExtension.convert({
        content: 'not xml',
        filePath: 'invalid.gexf',
      })
    ).rejects.toThrow();
  });

  it('preserves node label as node kind', async () => {
    const result = await gexfExtension.convert({
      content: simpleGexf,
      filePath: 'test.gexf',
    });

    expect(result.nodes[0]?.attributes.label).toBe('Person');
    expect(result.nodes[1]?.attributes.label).toBe('Person');
  });

  it('maps GEXF edge label to type attribute', async () => {
    const result = await gexfExtension.convert({
      content: simpleGexf,
      filePath: 'test.gexf',
    });

    expect(result.edges[0]?.attributes.type).toBe('KNOWS');
    expect(result.edges[0]?.attributes.label).toBeUndefined();
  });

  it('respects custom edgeTypeProperty', async () => {
    const result = await gexfExtension.convert({
      content: simpleGexf,
      filePath: 'test.gexf',
      edgeTypeProperty: 'relType',
    });

    expect(result.edges[0]?.attributes.relType).toBe('KNOWS');
    expect(result.edges[0]?.attributes.type).toBeUndefined();
  });

  it('sets graph options for undirected graphs', async () => {
    const result = await gexfExtension.convert({
      content: undirectedGexf,
      filePath: 'test.gexf',
    });

    expect(result.options?.type).toBe('undirected');
  });

  it('omits options for directed graphs (default)', async () => {
    const result = await gexfExtension.convert({
      content: simpleGexf,
      filePath: 'test.gexf',
    });

    expect(result.options).toBeUndefined();
  });

  it('parses GEXF attribute model for nodes and edges', async () => {
    const result = await gexfExtension.convert({
      content: attrGexf,
      filePath: 'test.gexf',
    });

    // Node attributes from <attributes> model
    expect(result.nodes[0]?.attributes.name).toBe('Alice');
    expect(result.nodes[0]?.attributes.age).toBe(30);
    expect(result.nodes[1]?.attributes.name).toBe('Bob');
    expect(result.nodes[1]?.attributes.age).toBe(25);

    // Edge attributes from <attributes> model
    expect(result.edges[0]?.attributes.weight).toBe(2.5);
  });

  it('sets graph options for mixed graphs', async () => {
    const result = await gexfExtension.convert({
      content: mixedGexf,
      filePath: 'test.gexf',
    });

    expect(result.options?.type).toBe('mixed');
  });

  it('marks undirected edges in mixed graphs', async () => {
    const result = await gexfExtension.convert({
      content: mixedGexf,
      filePath: 'test.gexf',
    });

    const e1 = result.edges.find((e) => e.key === 'e1');
    const e2 = result.edges.find((e) => e.key === 'e2');

    expect(e1?.undirected).toBeUndefined(); // directed
    expect(e2?.undirected).toBe(true);       // undirected
  });
});
