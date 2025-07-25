import { db } from '../firebase';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Save new contract
export const saveContract = async (contractData) => {
  try {
    const docRef = await addDoc(collection(db, 'contracts'), contractData);
    return docRef.id;
  } catch (err) {
    console.error('Failed to save contract:', err);
    throw err;
  }
};

// Update contract (e.g. accept/play)
export const acceptContract = async (contractId, playerId) => {
  try {
    await updateDoc(doc(db, 'contracts', contractId), {
      status: 'accepted',
      acceptedBy: playerId,
    });
  } catch (err) {
    console.error('Failed to accept contract:', err);
    throw err;
  }
};

// Get contracts by game
export const getContractsByGame = async (gameName) => {
  try {
    const q = query(collection(db, 'contracts'), where('game', '==', gameName), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Failed to fetch contracts:', err);
    throw err;
  }
};
