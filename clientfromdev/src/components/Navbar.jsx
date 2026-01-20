import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
const RedditNavbar = () => {
  const user = useSelector((store) => store.user);
  // console.log(user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
      dispatch(removeUser());
      return navigate("/", { replace: true });
    } catch (err) {
      throw new Error(" " + err);
    }
  };
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Lost &amp; Found
            </span>
          </div>

          {/* Center: Nav Links */}
          {/* <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Feed
            </Link>
            <Link
              to="/lost"
              className="px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Lost
            </Link>
            <Link
              to="/found"
              className="px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Found
            </Link>
          </div> */}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/create"
              className="hidden sm:inline-flex items-center rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-black transition"
            >
              Create
            </Link>

            <button className="hidden sm:inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
              Feed
            </button>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm hover:bg-slate-50 transition"
              >
                <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-indigo-200">
                  <img
                    src={
                      user?.photoUrl || user?.photoURL || "/default-avatar.png"
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="hidden sm:inline-block text-sm font-semibold text-slate-800">
                  {user ? user.username : "Login"}
                </span>
              </div>

              <ul
                tabIndex={-1}
                className="menu menu-sm dropdown-content bg-white text-slate-800 rounded-xl z-50 mt-3 w-52 p-2 shadow-xl border border-slate-200"
              >
                <li>
                  <Link
                    to="/profile"
                    className="rounded-lg hover:bg-slate-100 font-medium"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/requests"
                    className="rounded-lg hover:bg-slate-100 font-medium"
                  >
                    Requests
                  </Link>
                </li>
                <li>
                  <Link
                    to="/connections"
                    className="rounded-lg hover:bg-slate-100 font-medium"
                  >
                    Connections
                  </Link>
                </li>
                <li>
                  <a
                    className="rounded-lg hover:bg-red-50 font-medium text-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden pb-3 flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 text-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Feed
          </Link>
          <Link
            to="/lost"
            className="flex-1 text-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Lost
          </Link>
          <Link
            to="/found"
            className="flex-1 text-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Found
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default RedditNavbar;
