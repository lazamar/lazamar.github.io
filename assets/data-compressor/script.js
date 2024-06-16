{

// String -> Map Char Int
function countFreq(str) {
  const f = (map, char) => {
    const val = map.get(char) || 0;
    map.set(char, val + 1);
    return map;
  }
  return str.split("").reduce(f, new Map());
}

// HTree :
//    { weight: Int, leaf : Char  } |
//    { weight: Int, fork : { left : HTree, right : HTree } }

// Map Char Int -> HTree
function buildHTree(freqs) {
  let nodes = [];
  for (const [ char, weight ] of freqs.entries()) {
    nodes.push({ leaf: char, weight });
  }

  while(nodes.length > 1) {
    nodes.sort((l, r) => l.weight - r.weight);
    const left = nodes[0];
    const right = nodes[1];
    const merged = {
      fork: { left, right },
      weight: left.weight + right.weight
    }
    nodes = nodes.slice(2);
    nodes.push(merged);
  }

  return nodes[0];
}

// HTree -> Map Char String
function buildCodes(htree) {
  const toCode = (prefix, acc) => {
    if (prefix == null) {
      return acc.join("");
    }
    acc.push(prefix.value)
    return toCode(prefix.next, acc);
  }

  const codes = new Map();
  const stack = []
  if (htree == undefined) return codes;
  stack.push([htree, null]);
  while (stack.length > 0) {
    const [tree, prefix] = stack.pop();
    if (tree.leaf) {
      codes.set(tree.leaf, toCode(prefix, []));
    } else {
      stack.push([tree.fork.left, { value: '0', next: prefix }]);
      stack.push([tree.fork.right, { value: '1', next: prefix }]);
    }
  }

  return codes;
}

// String -> [String]
function encode(string) {
  const codes = buildCodes(buildHTree(countFreq(string)));
  return string.split("").map(char => codes.get(char));
}

const { init, h, text } = SMVC;

function update(state, msg) {
  const action = Object.keys(msg)[0];
  switch (action) {
    case "setContent":
      return { ...state, content :  msg.setContent };
    case "setHighlighted":
      return { ...state, highlighted :  msg.setHighlighted };
  }
}

// size in bytes of a string
function stringBytes(str) {
 return (new TextEncoder().encode(str)).length
}

function charName(char) {
  return char == " "
    ? "<space>"
    : char == "\n"
    ? "<newline>"
    : char;
}


function view(state) {
  const freqs = countFreq(state.content);
  const codes = buildCodes(buildHTree(freqs));

  // Map Code Char
  const codeChar = [...codes.entries()].reduce((acc, x) => acc.set(x[1], x[0]), new Map())

  const encoded = encode(state.content);
  const encodedWithDetails = encoded.reduce(
    ({ offset, acc }, code) => {
      const char = codeChar.get(code);
      acc.push({ offset, code, char });
      return { offset: offset + code.length, acc };
    },
    { offset: 0, acc: [] }
  ).acc;

  const encodedBytes = Math.ceil(encoded.map(v => v.length).reduce((x,y) => x + y, 0) / 8);
  const compressedBytes = encodedBytes;
  const originalBytes = stringBytes(state.content);
  const compressionPercentage =
    originalBytes == 0
    ? 0
    : Math.floor((100 * (1 - (compressedBytes / originalBytes))));

  const histogram = [...codes.entries()]
    .map(x => {
      const [char, code] = x;
      const freq = freqs.get(char);
      return { char, freq, code };
    })
    .sort((l,r) => l.freq - r.freq)
    .reverse();

  const maxFreq = histogram.reduce((acc, v) => Math.max(acc, v.freq), 0);

  return [
    h("label", {}, [ text("Write your content") ]),
    h("div", { class: "columns" }, [
      h("div", { class: "column" }, [
        h(
          "textarea",
          { style: `
              display: block;
              width: 100%;
              height: 8em;`,
            value: state.content,
            onInput : e => ({ setContent: e.target.value })
          },
          []
        ),
      ]),
      h("div", { class: "column" }, [
        h("table",{}, [
          h("tr", {}, [
            h("td",{}, [text("Original size")]),
            h("td",{}, [text(`${originalBytes} bytes`) ])
          ]),
          h("tr", {}, [
            h("td",{}, [text("Encoded size")]),
            h("td",{}, [text(`${encodedBytes} bytes`) ])
          ]),
          h("tr", {}, [
            h("td",{}, [text("Compression")]),
            h("td",{ style: "font-weight: bold" }, [text(`${compressionPercentage}%`) ])
          ]),
        ]),
      ]),
    ]),
    h("div", { onMouseLeave: () => ({ setHighlighted: null }) }, [
      h("p", {}, [ text("Content:")]),
      h("pre", { class: "h-content" },
        state.content.split("").map(char =>
          h("span",
            { class: "h-code " + (state.highlighted === char ? "highlighted" : ""),
              onMouseOver: () => ({ setHighlighted: char })
            },
            [ text(char)
            , h("div", { class: "h-code-char" }, [ text(codes.get(char)) ])
            ]
          )
        )
      ),
      h("p", {}, [ text("Encoded:")]),
      h( "div",
        { class: "h-encoded", onMouseLeave: () => ({ setHighlighted: null }) },
        encodedWithDetails.map(({ offset, code, char }) => {
          const withSpaces = code.split("").flatMap((char, ix) => {
            const isByteBoundary = (ix + offset) % 8 === 0;
            return isByteBoundary ? (" " + char) : char;
          }).join("");
          return h(
            "span",
            { class: "h-code " + (state.highlighted === char ? "highlighted" : ""),
              onMouseOver: () => ({ setHighlighted: char }),
            },
            [ text(withSpaces)
            ]
          )
        })
        .concat(
          state.highlighted !== null
            ? [h("div", { class: "h-code-label" }, [ text(charName(state.highlighted)) ])]
            : []
        )
      ),
      h("p", {}, [ text("Code words:")]),
      h("table", { class: "table-striped" },
        [ h("tr", {}, [
            h("th", {}, [text("Character")]),
            h("th", {}, [text("Occurrences")]),
            h("th", {}, [text("Code word")]),
          ])
        ].concat(histogram.map(({ char, freq, code }) => {
            return h("tr", {
              style : "font-family: monospace",
              class : char == state.highlighted ? "highlighted" : "",
              onMouseOver: () => ({ setHighlighted: char })
            }, [
              h("td", {}, [text(charName(char))]),
              h("td", { style: "position: relative" }, [
                text(freq),
                h("div", { style: `
                  width: ${100 * (freq / maxFreq)}%;
                  height: 100%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  background-color: #2e9fff59;
                  ` }, [])
              ]),
              h("td", {}, [text(code)]),
            ]);
          })
        )
      )
    ])
  ];
}

window.initHuffmanVisualisation = function (root) {
  const initialState = {
    content: "Try it out with your own content.",
    highlighted: null,
  };
  init(root, initialState, update, view);
}
}
