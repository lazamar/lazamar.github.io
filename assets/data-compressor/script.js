{
const { init, h, text } = SMVC;

function update(state, msg) {
  const action = Object.keys(msg)[0];
  switch (action) {
    case "setContent":
      return { ...state, content :  msg.setContent };
  }
}

function view(state) {
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
