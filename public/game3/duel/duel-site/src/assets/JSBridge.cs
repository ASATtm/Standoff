using UnityEngine;
using System.Runtime.InteropServices;

public class JSBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void reportGameResult(string json);
#endif

    [System.Serializable]
    public class GameResult
    {
        public string winnerId;
        public string loserId;
        public string roomId;
        public string contractId;
    }

    public void ReportGameEnd(string winnerId, string loserId, string roomId, string contractId)
    {
        GameResult result = new GameResult
        {
            winnerId = winnerId,
            loserId = loserId,
            roomId = roomId,
            contractId = contractId
        };

        string json = JsonUtility.ToJson(result);
        Debug.Log($"📤 Sending Game Result to JS: {json}");

#if UNITY_WEBGL && !UNITY_EDITOR
        reportGameResult(json);
#else
        Debug.Log("🧪 Would call JS (non-WebGL build)");
#endif
    }
}
