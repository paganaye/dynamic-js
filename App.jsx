const { Counter } = await import('./Counter');
const { User } = await import('./User');

console.log("App.jsx starting...", Counter);

const a = ref(1);
const user = ref({ firstName: "Pascal", lastName: "Ganaye" })
render(() => <>
    <h1>App.jsx</h1>
    <a href="https://www.google.com" target='_blank'>google</a>
    <Counter value={a} />
    <pre>{user.value}</pre>
    <User user={user}>text here</User >
</>, document.getElementById('app'));

