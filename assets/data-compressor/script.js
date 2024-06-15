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
  const codes = buildCodes(buildHTree(countFreq(state.content)));

  const encoded = encode(state.content);

  const encodedLengthBytes = Math.ceil(encoded.join("").length / 8);
  const originalLengthBytes = (new TextEncoder().encode(state.content)).length
  const compressionPercentage =
    originalLengthBytes == 0
    ? 0
    : Math.floor((100 * (encodedLengthBytes / originalLengthBytes)));

  return [
    h("label", {}, [ text("White your content") ]),
    h(
      "textarea",
      { style: `
          display: block;
          max-width: 100%;
          width: 30em;
          height: 8em;`,
        onInput : e => ({ setContent: e.target.value })
      },
      []
    ),
    h("p", {}, [ text(`Compression: ${compressionPercentage}%`)]),
    h("p", {}, [ text("Content:")]),
    h("p", {}, [ text(state.content) ]),
    h("p", {}, [ text("Encoded:")]),
    h( "div",
      { class: "h-encoded" },
      encoded.map(c => h("span",{}, [text(c)]))
    ),
    h("div", {}, [...codes.entries()].map(x => {
      const [char, code] = x;
      return h("p", {}, [ text(char + ": " + code) ]);
    }))
  ];
}

window.initHuffmanVisualisation = function (root) {
  const initialState = {
    content: ""
  };
  init(root, initialState, update, view);
}
}
