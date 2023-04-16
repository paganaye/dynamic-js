export function User() {
  var user = ref({
    firstName: 'John',
    lastName: 'Doe'
  });
  return <>
    <p>User: {watch(() => user.value)}</p>
    <button onClick={() => { count.value++; }}>Click me</button>
  </>;
}