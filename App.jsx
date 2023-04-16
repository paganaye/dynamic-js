const counter = await import('./Counter');

console.log("App.jsx starting...", counter);

render(<div>
    <h1>App.jsx</h1>
    <counter.Counter />
</div>, document.getElementById('app'));

