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
  }
}

function view(state) {
  const freqs = countFreq(state.content);
  const codes = buildCodes(buildHTree(freqs));

  const encoded = encode(state.content);

  const compressedBytes = Math.ceil(encoded.join("").length / 8);
  const originalBytes = (new TextEncoder().encode(state.content)).length
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
    h("label", {}, [ text("White your content") ]),
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
    h("p", {}, [ text(`Original size: ${originalBytes} bytes`)]),
    h("p", {}, [ text(`Compressed size: ${compressedBytes} bytes`)]),
    h("p", {}, [ text(`Compression: ${compressionPercentage}%`)]),
    h("p", {}, [ text("Content:")]),
    h("p", { style: "word-wrap: break-word;" }, [ text(state.content) ]),
    h("p", {}, [ text("Encoded:")]),
    h( "div",
      { class: "h-encoded" },
      encoded.reduce(
        ({ counter, acc }, code) => {
          acc.push([counter, code]);
          return { counter: counter + code.length, acc };
        }, { counter: 0, acc: [] }
      )
      .acc
      .map(x => {
        const [ offset, code ] = x;
        const withSpaces = code.split("").flatMap((char, ix) => {
          const isByteBoundary = (ix + offset) % 8 === 0;
          return isByteBoundary ? (" " + char) : char;
        }).join("");
        return h("span",{}, [text(withSpaces)])
      })
    ),
    h("p", {}, [ text("Code words:")]),
    h("table", { class: "h-table" },
      [ h("tr", {}, [
          h("th", {}, [text("Character")]),
          h("th", {}, [text("Occurrences")]),
          h("th", {}, [text("Code word")]),
        ])
      ].concat(histogram.map(({ char, freq, code }) => {
          return h("tr", {style : "font-family: monospace"}, [
            h("td", {}, [text(char)]),
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
  ];
}

window.initHuffmanVisualisation = function (root) {
  const initialState = {
    content: `
    asdfasdfasdfasdfasdfkkksdkfskdfasdnasdalsdfjasdlkfasdibnfasdjfna;sdlfjasdkfja;sldkfn dasdlfasdfjaklsdjfalksdjfa;sdfkajsdfkajsdkfjaskdfjaskdkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    `
  };
  init(root, initialState, update, view);
}
}
