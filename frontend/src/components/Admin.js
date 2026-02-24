import { useEffect, useState } from "react";
import api from "../services/api";

function Admin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data))
      .catch(() => alert("Not authorized"));
  }, []);

  return (
    <div>
      <h2>Admin Panel</h2>
      {users.map((u) => (
        <div key={u.id}>
          {u.name} - {u.email} - {u.role}
        </div>
      ))}
    </div>
  );
}

export default Admin;