export function User({ user }) {
  var user = ref({
    firstName: 'John',
    lastName: 'Doe'
  });
  return <div>
    <label>First name: <input type="text" value={user.firstName} /></label>
    <label>Last name: <input type="text" value={user.lastName} /></label>
  </div>;
}