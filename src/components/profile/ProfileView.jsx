"use client";
import React from 'react';
import ChallengeBoxes from './ChallengeBoxes';
import FriendSection from './FriendSection';
import PastOpponentsBox from './PastOpponentsBox';
import ProfileHeader from './ProfileHeader';
import StatsPopup from '../StatsPopup';
import GreenDriftfield from '../GreenDriftfield'; // ✅ animated background

const ProfileView = ({
  connected,
  publicKey,
  currentUserId,
  currentUsername,
  copyToClipboard,
  activeChallenges,
  pendingContracts,
  handleAccept,
  handleDecline,
  handleCancelContract,
  setShowChallengesModal,
  setShowContractsModal,
  onlineUsers,
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
  pastOpponents,
  challengeOpponent,
  challengeGame,
  challengeWager,
  setChallengeGame,
  setChallengeWager,
  showChallengeModal,
  handleSubmitChallenge,
  solPrice,
  solEquivalent,
}) => {
  const [selectedStatsUserId, setSelectedStatsUserId] = React.useState(null);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <GreenDriftfield />
      <div className="relative z-10 p-6 font-sans space-y-6">
        <div className="bg-gray-900 p-6 rounded-xl shadow max-w-screen-xl mx-auto">
          <ProfileHeader
            connected={connected}
            publicKey={publicKey}
            currentUserId={currentUserId}
            currentUsername={currentUsername}
            copyToClipboard={copyToClipboard}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-screen-xl mx-auto">
          <div className="bg-gray-900 p-6 rounded-xl shadow w-full">
            <ChallengeBoxes
              activeChallenges={activeChallenges}
              pendingContracts={pendingContracts}
              handleAccept={handleAccept}
              handleDecline={handleDecline}
              handleCancelContract={handleCancelContract}
              onlineUsers={onlineUsers}
              solPrice={solPrice}
              setShowChallengesModal={setShowChallengesModal}
            />
          </div>

          <div className="bg-gray-900 p-6 rounded-xl shadow w-full">
            <FriendSection
              friends={friends}
              friendRequests={friendRequests}
              searchedUser={searchedUser}
              friendSearchId={friendSearchId}
              setFriendSearchId={setFriendSearchId}
              setSearchedUser={setSearchedUser}
              handleAcceptFriend={handleAcceptFriend}
              handleDeclineFriend={handleDeclineFriend}
              handleSearchUser={handleSearchUser}
              handleSendFriendRequest={handleSendFriendRequest}
              setShowAddFriendModal={setShowAddFriendModal}
              setShowFriendsModal={setShowFriendsModal}
              setShowRequestsModal={setShowRequestsModal}
              setChallengeOpponent={setChallengeOpponent}
              setShowChallengeModal={setShowChallengeModal}
              showAddFriendModal={showAddFriendModal}
              onlineUsers={onlineUsers}
            />
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow max-w-screen-xl mx-auto">
          <PastOpponentsBox
            pastOpponents={pastOpponents}
            setChallengeOpponent={setChallengeOpponent}
            setShowChallengeModal={setShowChallengeModal}
            onlineUsers={onlineUsers}
            setSelectedStatsUserId={setSelectedStatsUserId}
          />
        </div>

        {showChallengeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-gray-900 p-6 rounded w-96">
              <h3 className="text-xl font-bold text-green-400 mb-4">Send Challenge</h3>
              <p className="text-white mb-2">To: {challengeOpponent}</p>

              <select
                value={challengeGame}
                onChange={(e) => setChallengeGame(e.target.value)}
                className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
              >
                <option value="">Select a game</option>
                {["Stand Off", "Catapult", "Coin Toss", "Steal", "Duel"].map((game) => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Wager ($)"
                value={challengeWager}
                onChange={(e) => setChallengeWager(e.target.value)}
                className="w-full p-2 mb-1 bg-gray-700 text-white rounded"
              />

              <p className="text-sm text-gray-400 mb-3">
                ≈ {(challengeWager && solPrice)
                  ? (parseFloat(challengeWager) / solPrice).toFixed(4)
                  : "0.0000"} SOL
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitChallenge}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowChallengeModal(false)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedStatsUserId && (
          <StatsPopup
            uid={selectedStatsUserId}
            onClose={() => setSelectedStatsUserId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileView;
