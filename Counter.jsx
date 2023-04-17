// var acorn = await import("acorn");
// var jsx = await import("acorn-jsx");
// acorn.Parser.extend(jsx()).parse("my(<jsx/>, 'code');");

export function Counter({ value }) {
  var count = ref(value ?? 1);
  return <>
    <h1>Counter {() => count.value} {() => count.value & 1 ? "odd" : "even"}</h1>
    <p>Increment value <button onClick={() => count.value++}>+1</button></p>
    <p>Decrement value <button onClick={() => count.value--}>-1</button></p>
  </>;
}