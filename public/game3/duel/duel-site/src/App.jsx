import { useEffect } from "react";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function App() {
  const room = new URLSearchParams(window.location.search).get("room") || "testroom";
  const name = new URLSearchParams(window.location.search).get("name") || "Guest";

  // 🔁 Send launch data to Unity
  useEffect(() => {
    const data = `${room}|${name}`;
    console.log("🌐 Waiting to send launch data to Unity:", data);

    const interval = setInterval(() => {
      const frame = document.getElementById("unityFrame");
      const uWin = frame?.contentWindow;
      const uInst = uWin?.unityInstance;

      if (uInst && typeof uInst.SendMessage === "function") {
        uInst.SendMessage("JSBridge", "SetLaunchData", data);
        console.log("✅ Sent to Unity:", data);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room, name]);

  // ✅ Expose to Unity: Save game result in Firebase
  useEffect(() => {
    window.reportGameResult = async function (resultJson) {
      console.log("📥 reportGameResult raw JSON:", resultJson);

      try {
        const result = JSON.parse(resultJson);

        if (!result.winnerId || !result.loserId) {
          console.warn("⚠️ Incomplete game result received:", result);
          return;
        }

        alert(`🎮 Game Ended!\nWinner: ${result.winnerId}\nLoser: ${result.loserId}`);

        await addDoc(collection(db, "gameResults"), {
          game: "Duel",
          roomId: result.roomId || "unknown",
          winnerId: result.winnerId,
          loserId: result.loserId,
          contractId: result.contractId || null,
          timestamp: serverTimestamp(),
        });

        console.log("✅ Game result saved to Firebase:", result);
      } catch (err) {
        console.error("❌ Failed to save game result:", err);
      }
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <iframe
        id="unityFrame"
        src="/Build/index.html"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allowFullScreen
        title="Unity WebGL Game"
      />
    </div>
  );
}

export default App;
