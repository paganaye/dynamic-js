export function Counter() {
  var count = ref(1);
  return <>
    <h1>Counter {() => count.value} {() => count.value & 1 ? "odd" : "even"}</h1>
    <p>Increment value <button onClick={() => count.value++}>+1</button></p>
    <p>Decrement value <button onClick={() => count.value--}>-1</button></p>
    <p></p>
    <ul>
      {() => [...Array(count.value)].map((x, i) => <p>{i}</p>)}
    </ul>
  </>;
}