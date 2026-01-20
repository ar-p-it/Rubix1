import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import {
  resetFeed,
  addFeed,
  incrementPage,
  setHasMore,
} from "../utils/feedSlice";
import { addClaim, withdrawByPostId } from "../utils/claimsSlice";
import ClaimModal from "./ClaimModal";

const Feed = () => {
  const dispatch = useDispatch();
  const items = useSelector((store) => store.feed.items);
  const page = useSelector((store) => store.feed.page);
  const hasMore = useSelector((store) => store.feed.hasMore);

  // Filters
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [hubSlug, setHubSlug] = useState("");
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("prompt"); // 'prompt' | 'granted' | 'denied'

  const loadingRef = useRef(false);
  const abortRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 400);
    return () => clearTimeout(handler);
  }, [q]);

  const fetchFeed = useCallback(
    async (pageToLoad = 1, { replace = false } = {}) => {
      if (!replace && (!hasMore || loadingRef.current)) return;

      loadingRef.current = true;
      setLoading(true);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const tagParam =
          tag && typeof tag === "string"
            ? tag
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined;

        // Build params
        const params = {
          page: pageToLoad,
          limit: 5,
          sort: "-createdAt",
          type: type || undefined,
          status: status || undefined,
          hubSlug: hubSlug || undefined,
          tag: tagParam,
          q: debouncedQ || undefined,
        };

        // Add location if available
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }

        const res = await axios.get(`${BASE_URL}/posts`, {
          params,
          withCredentials: true,
          signal: controller.signal,
        });

        const posts = res?.data?.data || [];
        const totalPages = res?.data?.pagination?.pages || 1;

        if (replace) {
          dispatch(resetFeed());
        }

        if (posts.length) {
          dispatch(addFeed(posts));
          dispatch(incrementPage());
        }

        dispatch(setHasMore(pageToLoad < totalPages));
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Failed to fetch feed:", err);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [hasMore, type, status, hubSlug, tag, debouncedQ, userLocation, dispatch],
  );

  // Request location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  }, []);

  // Initial load + refetch on filter/location change
  useEffect(() => {
    fetchFeed(1, { replace: true });
  }, [type, status, hubSlug, tag, debouncedQ, userLocation]);

  const claimed = useSelector((s) => s.claims.items);
  const isPostClaimed = (postId) => claimed.some((c) => c.post?._id === postId);

  const [selectedPost, setSelectedPost] = useState(null);

  const handleClaimSuccess = (post, serverData) => {
    const claimObj = serverData?.claim || serverData?.data?.claim || serverData;
    const claimId = claimObj?._id;
    const status = claimObj?.status || "PENDING";
    const createdAt = claimObj?.createdAt || new Date().toISOString();
    const claim = {
      id:
        claimId ||
        (crypto && crypto.randomUUID && crypto.randomUUID()) ||
        String(Date.now()),
      post,
      status,
      createdAt,
    };
    dispatch(addClaim(claim));
  };

  const handleWithdraw = async (postId) => {
    const claimForPost = claimed.find((c) => c.post?._id === postId);
    const claimId = claimForPost?.id;
    if (!claimId) {
      alert("No claim found for this post.");
      return;
    }
    if (!window.confirm("Withdraw your claim for this item?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/verification/${claimId}`, {
        withCredentials: true,
      });
      dispatch(withdrawByPostId(postId));
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw claim.");
    }
  };

  return (
    <div className="bg-slate-50/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setType("")}
            className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
              !type
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setType("LOST")}
            className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === "LOST"
                ? "bg-rose-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setType("FOUND")}
            className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === "FOUND"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Found
          </button>
          <button
            onClick={() => setStatus("OPEN")}
            className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === "OPEN"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatus("CLOSED")}
            className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === "CLOSED"
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Closed
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search items, locations, or tags"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Hub slug (e.g. central-hub)"
            value={hubSlug}
            onChange={(e) => setHubSlug(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Location status */}
        {locationStatus === "denied" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            🌍 Location access denied. Showing global feed. Enable location for
            local results.
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              📦
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No items yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing filters or search terms.
            </p>
          </div>
        )}

        {/* Posts */}
        {items.map((post) => (
          <div
            key={post._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold tracking-wide ${
                  post.type === "LOST"
                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                {post.type === "LOST" ? "Lost" : "Found"}
              </span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-3">
              {post.title}
            </h2>

            {post.description && (
              <p className="text-slate-700 mt-2 text-sm leading-relaxed line-clamp-3">
                {post.description}
              </p>
            )}

            {post.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-600">Status:</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {post.status}
                </span>
                {post.hubId?.name && <span>📍 {post.hubId.name}</span>}
              </div>
              <div>
                {isPostClaimed(post._id) ? (
                  <button
                    className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-rose-100 transition"
                    onClick={() => handleWithdraw(post._id)}
                  >
                    Withdraw
                  </button>
                ) : (
                  <button
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-black transition"
                    onClick={() => setSelectedPost(post)}
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between py-4">
          <button
            disabled={page <= 1 || loading}
            onClick={() => fetchFeed(Math.max(1, page - 1), { replace: true })}
            className="btn rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            ⏮ Prev
          </button>

          <button
            disabled={!hasMore || loading}
            onClick={() => fetchFeed(page + 1)}
            className="btn rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Next ⏭
          </button>
        </div>

        {loading && <p className="text-center text-slate-400">Loading…</p>}

        {!hasMore && (
          <p className="text-center text-slate-400">
            You’ve reached the end 🚀
          </p>
        )}

        {selectedPost && (
          <ClaimModal
            postId={selectedPost._id}
            postTitle={selectedPost.title}
            questions={selectedPost.questions || []}
            onClose={() => setSelectedPost(null)}
            onSuccess={(serverData) =>
              handleClaimSuccess(selectedPost, serverData)
            }
          />
        )}
      </div>
    </div>
  );
};

export default Feed;
