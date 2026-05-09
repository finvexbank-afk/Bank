import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [userAuth, setUserAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [authReady, setAuthReady] = useState(false);
    const [card, setCard] = useState(null);
    
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Initial Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUserAuth(firebaseUser);
            if (!firebaseUser) {
                setUser(null);
                setTransactions([]);
                setAuthReady(true);
            }
        });
        return unsubscribe;
    }, []);

    // Fetch User Profile from Firestore securely
    useEffect(() => {
        if (userAuth) {
            const docRef = doc(db, 'users', userAuth.uid);
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUser({ id: docSnap.id, ...docSnap.data() });
                    // Clear registration flag so future logins work normally
                    localStorage.removeItem('justRegistered');
                } else {
                    setUser(null);
                }
                setAuthReady(true);
            });
            return unsubscribe;
        }
    }, [userAuth]);

    // Fetch Transactions from Firestore
    useEffect(() => {
        if (userAuth) {
            const q = query(
                collection(db, 'transactions'),
                where('userId', '==', userAuth.uid)
            );
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const txs = [];
                querySnapshot.forEach((doc) => {
                    txs.push({ id: doc.id, ...doc.data() });
                });
                // Sort locally to avoid Firebase Index requirement
                txs.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTransactions(txs);
            }, (error) => {
                console.error("Firestore error:", error);
            });
            return unsubscribe;
        }
    }, [userAuth]);

    // Fetch Virtual Card from Firestore
    useEffect(() => {
        if (userAuth) {
            const q = query(
                collection(db, 'cards'),
                where('userId', '==', userAuth.uid)
            );
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const cardDoc = querySnapshot.docs[0];
                    setCard({ id: cardDoc.id, ...cardDoc.data() });
                } else {
                    setCard(null);
                }
            });
            return unsubscribe;
        }
    }, [userAuth]);

    const logout = async () => {
        try {
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
            window.location.href = '/auth';
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const topUp = (amount) => {
        console.warn("Direct top up is disabled. Use proper Firestore updates.");
    };

    const toggleUserStatus = () => {};
    const approveKyc = () => {};
    const usersList = user ? [user] : [];

    if (!authReady) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', color: 'var(--primary)' }}>
                <h2>Finvex Bank</h2>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'ping 1s infinite' }}></div>
                    <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'ping 1s infinite 0.2s' }}></div>
                    <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'ping 1s infinite 0.4s' }}></div>
                </div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ 
            user, setUser, 
            usersList, toggleUserStatus, approveKyc,
            transactions,
            card,
            topUp,
            logout,
            isTransferModalOpen, setIsTransferModalOpen
        }}>
            {children}
        </AppContext.Provider>
    );
};
