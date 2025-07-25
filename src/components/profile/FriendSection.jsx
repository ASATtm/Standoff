"use strict";
import React, { useState } from "react";
import OnlineIndicator from "../OnlineIndicator";
import StatsPopup from "../StatsPopup"; // ✅ Global import

const FriendSection = ({
  friends,
  friendRequests,
  searchedUser,
  friendSearchId,
  setFriendSearchId,
  setSearchedUser,
  handleAcceptFriend,
  handleDeclineFriend,
  handleSearchUser,
  handleSendFriendRequest,
  setShowAddFriendModal,
  setShowFriendsModal,
  setShowRequestsModal,
  setChallengeOpponent,
  setShowChallengeModal,
  showAddFriendModal,
  onlineUsers
}) => {
  const [selectedStatsUserId, setSelectedStatsUserId] = useState(null);

  return (
    <div className="flex gap-4 mt-4">
      {/* Friends Box */}
      <div className="bg-gray-900 p-4 rounded w-80 h-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-green-400">Friends</h3>
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
          >
            Add Friend
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2">
          {friends.length > 0 ? (
            <ul>
              {friends.slice(0, 3).map((friend, index) => (
                <li
                  key={friend.id}
                  className={`text-white py-2 ${
                    index < friends.length - 1 ? "border-b border-gray-700" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <OnlineIndicator uid={friend.id?.trim()} />
                      <span>{friend.username || "Unknown User"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setChallengeOpponent(friend.id);
                          setShowChallengeModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                      >
                        Challenge
                      </button>
                      <button
                        onClick={() => setSelectedStatsUserId(friend.id)}
                        className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
                      >
                        Stats
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No Friends</p>
          )}
        </div>

        <button
          onClick={() => setShowFriendsModal(true)}
          className="mt-2 text-green-400 underline text-sm"
        >
          View All
        </button>
      </div>

      {/* Friend Requests Box */}
      <div className="bg-gray-900 p-4 rounded w-80 h-full">
        <h3 className="text-xl font-bold text-green-400 mb-2">Friend Requests</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {friendRequests.length > 0 ? (
            <ul>
              {friendRequests.map((req, index) => (
                <li
                  key={req.id}
                  className={`text-white py-2 ${
                    index < friendRequests.length - 1
                      ? "border-b border-gray-700"
                      : ""
                  }`}
                >
                  <p>From: {req.senderUsername}</p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() =>
                        handleAcceptFriend(
                          req.id,
                          req.senderId,
                          req.senderUsername
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineFriend(req.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No Friend Requests</p>
          )}
        </div>
        <button
          onClick={() => setShowRequestsModal(true)}
          className="mt-2 text-green-400 underline text-sm"
        >
          View All
        </button>
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h3 className="text-xl font-bold text-green-400 mb-4">Add Friend</h3>
            <input
              type="text"
              value={friendSearchId}
              onChange={(e) => setFriendSearchId(e.target.value)}
              placeholder="Enter User ID"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
            />
            {searchedUser && (
              <div className="text-white mb-4">
                <p>User Found: {searchedUser.username}</p>
                <button
                  onClick={handleSendFriendRequest}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm mt-2"
                >
                  Send Request
                </button>
              </div>
            )}
            <button
              onClick={handleSearchUser}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Search
            </button>
            <button
              onClick={() => setShowAddFriendModal(false)}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedStatsUserId && (
        <StatsPopup uid={selectedStatsUserId} onClose={() => setSelectedStatsUserId(null)} />
      )}
    </div>
  );
};

export default FriendSection;
