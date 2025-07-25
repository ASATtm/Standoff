let cachedKey = null;

export async function getPublicEncryptionKey() {
  if (cachedKey) return cachedKey;

  const res = await fetch('/api/crypto/public-key');
  if (!res.ok) throw new Error(`Failed to fetch public key: ${res.status}`);
  const json = await res.json();
  cachedKey = json.publicKey;
  return cachedKey;
}
