export function Counter() {
  var count = ref(1);
  return <>
    <h1>Counter {watch(() => count.value)}</h1>
    <p>Increment value <button onClick={() => { count.value++; }}>+1</button></p>
    <p>Decrement value <button onClick={() => { count.value--; }}>-1</button></p>
    <p>{watch(() => count.value & 1 ? "odd" : "even")}</p>
    <ul>
      {watch(() => [...Array(count.value)].map((x, i) =>
        <p>{x} {i}</p>
      ))}

    </ul>
  </>;
}