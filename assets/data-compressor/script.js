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

  return nodes;
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
  const htree = buildHTree(countFreq(state.content));
  console.log(JSON.stringify(htree, {}, 2));
  return [
    h("label", {}, [ text("White your content") ]),
    h("input", { onInput : e => ({ setContent: e.target.value }) }, []),
    h("p", {}, [
      text("Content: " + state.content)
    ])
  ];
}

window.initHuffmanVisualisation = function (root) {
  const initialState = {
    content: ""
  };
  init(root, initialState, update, view);
}
}
