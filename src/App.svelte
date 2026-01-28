<script lang="ts" module>
    import type { Action } from "svelte/action";
    import { renderCodeSegments } from "./codeRender";
    import { EmbeddingRenderer } from "./graphEmbed";

    const renderer = await EmbeddingRenderer.load();

    const renderCodeGraph: Action<HTMLDivElement> = (node) => {
        renderCodeSegments(
            new Map([
                ["a", "// Before the loop\nfor (int k = 0;"],
                ["b", "k < 10"],
                ["c", 'puts("Hello, World!");\n++k'],
                ["d", "}\n// After the loop"],
            ]),
            { language: "c", fontSize: "14px", padding: "10px" },
        ).then((segments) => {
            node.appendChild(
                renderer.render(
                    `digraph {
          edge [penwidth=2 color=blue headport=n tailport=s]

          a [id="a"];
          b [id="b"];
          c [id="c"];
          d [id="d"];

          a -> b
          b -> c [color=green]
          b -> d [color=red]
          b -> c [penwidth=4 dir=back headport=s tailport=n]
          }
          `,
                    segments,
                ),
            );
        });
    };

    const blue = "#b5daff";
    const green = "rgb(204, 255, 181)";
    const red = "rgb(255, 181, 181)";
    let editableBgColor = $state(blue);

    const renderElementGraph: Action<HTMLDivElement, string> = (node, dot) => {
        const embeddings = new Map<string, Element>();
        for (const child of node.children) {
            if (!(child instanceof Element)) {
                continue;
            }
            embeddings.set(child.id, child);
        }

        node.appendChild(renderer.render(dot, embeddings));
    };
</script>

<div class="center">
    <main>
        <h1># Embedding HTML in Graphviz DOT Graphs</h1>
        <p>We can embed static, highlighted code;</p>
        <div use:renderCodeGraph></div>
        <p>or, alternatively, put any HTML elements we want into graphs.</p>
        <div
            use:renderElementGraph={`digraph {
        edge [penwidth=2 headport=n tailport=s]

      r [id="red"]
      g [id="green"]
      b [id="blue"]
      e1 [id="e1"]
      e2 [id="e2"]

      r -> e1 [color=red]
      g -> e2 [color=green]
      r -> e2 [dir=back color=red]
      e1 -> b [color=blue]
      e2 -> b [color=blue]
      r -> g [color=green]
      e1 -> e2
      }`}
        >
            <!-- <div> -->
            <button id="red" onclick={() => (editableBgColor = red)}
                >Red (click me!)</button
            >
            <button id="green" onclick={() => (editableBgColor = green)}
                >Green</button
            >
            <button id="blue" onclick={() => (editableBgColor = blue)}
                >Blue</button
            >
            <div
                class="editable"
                id="e1"
                contenteditable="true"
                style="background-color: {editableBgColor};"
            >
                You can edit me!
            </div>

            <div
                class="editable"
                id="e2"
                contenteditable="true"
                style="background-color: {editableBgColor};"
            >
                I'm editable too!
            </div>
        </div>
        <p>
            Visit <a href="https://github.com/tmr232/graphviz-embed"
                >tmr232/graphviz-embed</a
            >
            for the source-code and explanation.
        </p>
    </main>
</div>

<style>
    :root {
        background-color: rgb(255, 252, 245);
    }
    main {
        font-family: monospace;
        width: 55em;
    }

    .center {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    h1,
    p {
        color: #657b83;
        font-weight: 200;
    }
    p {
        font-size: 1.5em;
        padding-top: 1em;
        padding-bottom: 1em;
        line-height: 1.4;
    }
    .editable {
        font-size: 1em;
        width: 10em;
        height: 5em;
        padding: 1em;
        filter: drop-shadow(5px 5px 5px rgb(183, 167, 125));
    }
    button {
        font-size: 1em;
    }

    :global svg {
        filter: drop-shadow(5px 5px 5px rgb(183, 167, 125));
    }

    a {
        color: #657b83;
    }
</style>
