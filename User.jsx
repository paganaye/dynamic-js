export function User({ user }) {
  return <div>
    <label>First name: <input type="text"
      value={() => user.value.firstName}
      onInput={(v) => user.value = { ...user.value, firstName: v.target.value }} /></label>
    <label>Last name: <input type="text"
      value={() => user.value.lastName}
      onInput={(v) => user.value = { ...user.value, lastName: v.target.value }} /></label>
  </div>;
}