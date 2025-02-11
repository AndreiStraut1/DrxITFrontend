import { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

function Authentication() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const register = async () => {
    try {
      const response = await api.post("/auth/signup", { username, password });
      console.log("User registered", response.data);
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  const login = async () => {
    try {
      const response = await api.post("/auth/signin", { username, password });
      console.log("User logged in", response.data);
      setAuthenticated(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div>
      <h1>Authentication</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
      {authenticated && <p>Authenticated</p>}
    </div>
  );
}

export default Authentication;
