import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome to Time Bank</h1>

      <button onClick={() => navigate("/login")}>
        Login
      </button>

      <button onClick={() => navigate("/signup")}>
        Signup
      </button>
    </div>
  );
}

export default Home;