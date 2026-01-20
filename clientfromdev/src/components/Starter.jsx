import axios from "axios";
import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser } from "../utils/userSlice";
const Starter = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [emailId, setemailId] = useState("arpit@test.com");
  const [password, setpassword] = useState("Test@1234");
  const [errorMsg, setErrorMsg] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const response = await axios.post(
        BASE_URL + "/login",
        {
          emailId,
          password,
        },
        {
          withCredentials: true,
        },
      );
      dispatch(addUser(response.data.user));
      // navigate("/");
      navigate("/feed");
      console.log(response.data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-300"
        >
          <source src="./v1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.10),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/80 to-white" />
      </div>

      <nav className="relative z-30 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3 font-extrabold text-xl sm:text-2xl tracking-tight">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            🧭
          </span>
          <span>Lost &amp; Found</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Login
          </button>
          <button className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black shadow-sm transition">
            Sign Up
          </button>
        </div>
      </nav>

      {showLogin && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowLogin(false)}
          ></div>

          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center text-slate-900">
              Welcome back
            </h2>

            <input
              type="email"
              placeholder="Email"
              value={emailId}
              onChange={(e) => setemailId(e.target.value)}
              className="w-full mb-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setpassword(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 transition shadow"
              onClick={handleLogin}
            >
              Login
            </button>

            <button
              onClick={() => setShowLogin(false)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700 block mx-auto"
            >
              Close
            </button>
          </div>
        </>
      )}

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-90 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05),transparent_60%)]" />
        </div>

        <div className="relative w-full max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs sm:text-sm text-slate-600 shadow-sm">
            <span>🔎</span>
            <span>Find lost items faster, together</span>
            <span>🧩</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Lost &amp; Found
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600">
            A community-powered platform to report, track, and recover lost
            items across trusted local hubs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition">
              Report Lost
            </button>
            <button className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-emerald-700 transition">
              Report Found
            </button>
            <button className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm sm:text-base font-semibold text-slate-700 hover:bg-slate-50 transition">
              Login / Sign Up
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm">
              📍 Local hubs
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm">
              🧭 Live tracking
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm">
              🤝 Community verified
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Starter;
