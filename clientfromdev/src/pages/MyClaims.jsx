import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { BASE_URL } from "../utils/constants";

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClaims = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/verification/my-claims`, {
        withCredentials: true,
      });
      setClaims(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status !== 404) {
        setError("Could not load claims. Are you logged in?");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCancel = async (claimId) => {
    if (!window.confirm("Are you sure you want to withdraw this claim?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/verification/${claimId}`, {
        withCredentials: true,
      });
      setClaims((prev) => prev.filter((c) => c._id !== claimId));
    } catch (err) {
      alert("Failed to cancel claim."+err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Claim Requests</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading your activity...</div>
      ) : claims.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Active Claims</h3>
          <p className="text-gray-500 mt-1">You haven't claimed any items yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
              
              {/* Icon / Image Placeholder */}
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-2xl text-gray-400">
                {claim.postId?.title?.charAt(0) || "?"}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-gray-800">{claim.postId?.title || "Unknown Item"}</h3>
                  <StatusBadge status={claim.status || "PENDING"} />
                </div>
                <p className="text-sm text-gray-500">Submitted on {new Date(claim.createdAt).toLocaleDateString()}</p>
                
                {/* Trust Score Indicator */}
                {claim.verification && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${claim.verification.systemTrustScore > 70 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                        style={{ width: `${claim.verification.systemTrustScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{claim.verification.systemTrustScore}% Trust</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 self-end md:self-center">
                {claim.verification?.imageProofUrl && (
                  <a 
                    href={claim.verification.imageProofUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                    title="View Proof"
                  >
                    <ExternalLink size={20} />
                  </a>
                )}
                
                {claim.status !== "ACCEPTED" && (
                  <button 
                    onClick={() => handleCancel(claim._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Cancel Claim"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    PENDING: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    VERIFICATION_SUBMITTED: { color: "bg-blue-100 text-blue-700", icon: Clock },
    ACCEPTED: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    REJECTED: { color: "bg-red-100 text-red-700", icon: XCircle },
  };
  const { color, icon: Icon } = config[status] || config.PENDING;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${color}`}>
      <Icon size={12} />
      {status.replace("_", " ")}
    </span>
  );
};

export default MyClaims;