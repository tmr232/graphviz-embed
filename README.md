# graphviz-embed

This is a proof-of-concept & demo for embedding HTML in Graphviz SVG graphs.

Click [here for the demo][demo].

## Using the code

Copy [`graphEmbed.ts`](src/graphEmbed.ts) into your project,
and add [`ts-graphviz`](https://www.npmjs.com/package/ts-graphviz)[^parsing] and [`wasm-graphviz`](https://www.npmjs.com/package/@hpcc-js/wasm-graphviz)[^rendering] as dependencies.

I considered publishing an NPM package, but

1. it's a lot more work than I initially expected;
2. the code is short, simple, and contained;
3. small adjustments may be required for advanced use-cases.

With that in mind, just letting people copy it seemed a better choice than adding yet another NPM dependency.

## Running locally

We're using [Bun] for management.

Run `bun install` to install the dependencies, then `bun dev` to start the server.

The demo is a very basic [Svelte] app, and all the code is in [`App.svelte`](src/App.svelte).

## How it works

Graphviz can't render HTML so it can't directly embed it in the graph.
But it does give us several features that let us do it ourselves:
1. per-node width and height can be percisely specified in the DOT language;
2. Graphviz renders to a stable SVG;
3. the resulting SVG includes metadata, such as node `id` attributes.

So our solution includes the following steps:
1. render the relevant HTML embeddings _outside_ the graph;
2. get their sizes using [`getBoundingClientRect()`];
3. set the node sizes in the DOT graph;
4. render the graph;
5. embed our HTML elements into SVG using [`<foreignObject>`] elements.

For the extra details you can read the code.
I tried to document all the relevant parts.


[demo]: https://tmr232.github.io/graphviz-embed
[`getBoundingClientRect()`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
[`<foreignObject>`]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/foreignObject
[Bun]: https://bun.sh/
[Svelte]: https://svelte.dev/

[^parsing]: We use `ts-grapgviz` to parse and modify DOT-language graphs.
            You can make it work without it, but this makes things easier.
            
[^rendering]: `wasm-graphviz` uses WASM-compiled Graphviz to convert DOT to SVG.
