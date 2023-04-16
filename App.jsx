const { Counter } = await import('./Counter');

console.log("App.jsx starting...", Counter);

render(<>
    <h1>App.jsx</h1>
    <Counter />
</>, document.getElementById('app'));

