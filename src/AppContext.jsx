import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { getBankFieldsForFirestore } from './utils/bankDetails';
import { createDefaultClientCodes } from './utils/transferCodes';
import { callTransferApi } from './utils/transferApi';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [userAuth, setUserAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [authReady, setAuthReady] = useState(false);
    const [card, setCard] = useState(null);
    const [notifications, setNotifications] = useState([]);
    
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('finvex_pending_transfer') || 'null');
        } catch {
            return null;
        }
    });
    const [isPendingTransferOpen, setIsPendingTransferOpen] = useState(false);

    useEffect(() => {
        const refresh = () => {
            try {
                setPendingTransfer(JSON.parse(localStorage.getItem('finvex_pending_transfer') || 'null'));
            } catch {
                setPendingTransfer(null);
            }
        };
        window.addEventListener('finvex:pending-change', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('finvex:pending-change', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    // Initial Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUserAuth(firebaseUser);
            if (!firebaseUser) {
                setUser(null);
                setTransactions([]);
                setNotifications([]);
                setPendingTransfer(null);
                setIsPendingTransferOpen(false);
                try { localStorage.removeItem('finvex_pending_transfer'); } catch { /* ignore */ }
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
                } else {
                    setUser(null);
                }
                setAuthReady(true);
            });
            return unsubscribe;
        }
    }, [userAuth]);

    // Backfill banking details and transfer codes for older client accounts.
    useEffect(() => {
        if (!userAuth || !user || user.role !== 'client') return;
        const patch = {};
        if (!user.iban) Object.assign(patch, getBankFieldsForFirestore(user));
        if (!Array.isArray(user.transferCodes) || user.transferCodes.length === 0) {
            patch.transferCodes = createDefaultClientCodes('en');
        }
        if (Object.keys(patch).length === 0) return;
        updateDoc(doc(db, 'users', userAuth.uid), patch)
            .catch((err) => console.error('Account backfill error:', err));
    }, [userAuth, user]);

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
                // Sort locally to avoid Firebase Index requirement.
                // `date` is a localized string (dd/mm/yyyy), so Date.parse alone is unreliable.
                const timeOf = (tx) => {
                    const created = tx.createdAt?.toMillis
                        ? tx.createdAt.toMillis()
                        : (tx.createdAt ? Date.parse(tx.createdAt) : NaN);
                    if (!Number.isNaN(created)) return created;
                    const parsed = Date.parse(tx.date);
                    if (!Number.isNaN(parsed)) return parsed;
                    const match = String(tx.date || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:[ ,]+(\d{2}):(\d{2}))?/);
                    if (match) {
                        return new Date(
                            Number(match[3]), Number(match[2]) - 1, Number(match[1]),
                            Number(match[4] || 0), Number(match[5] || 0)
                        ).getTime();
                    }
                    return 0;
                };
                txs.sort((a, b) => timeOf(b) - timeOf(a));
                setTransactions(txs);
            }, (error) => {
                console.error("Firestore error:", error);
            });
            return unsubscribe;
        }
    }, [userAuth]);

    // Live notifications for the connected user
    useEffect(() => {
        if (!userAuth) return undefined;
        const q = query(collection(db, 'notifications'), where('userId', '==', userAuth.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
            items.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
                const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
                return bTime - aTime;
            });
            setNotifications(items);
        }, (error) => {
            console.error('Notifications error:', error);
        });
        return unsubscribe;
    }, [userAuth]);

    const markNotificationAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), { read: true });
        } catch (error) {
            console.error('Mark notification error:', error);
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            await Promise.all(notifications.filter((item) => !item.read).map((item) =>
                updateDoc(doc(db, 'notifications', item.id), { read: true })
            ));
        } catch (error) {
            console.error('Mark all notifications error:', error);
        }
    };

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

    // Reconcile the locally stored pending transfer with the server.
    // The localStorage copy can be lost (other device, cleared storage, private tab),
    // in which case an in-flight transfer would become unreachable.
    const [pendingProbeTick, setPendingProbeTick] = useState(0);

    const refreshPendingTransfer = useCallback(() => {
        setPendingProbeTick((value) => value + 1);
    }, []);

    useEffect(() => {
        if (!user?.id) return undefined;
        let cancelled = false;

        (async () => {
            try {
                const result = await callTransferApi('pending', {});
                if (cancelled) return;
                const request = result?.request;
                if (request && request.requestId) {
                    const payload = {
                        requestId: request.requestId,
                        transfer: request.transfer || {},
                        phase: request.status === 'awaiting_otp' ? 'otp' : 'code',
                        serverStatus: request.status,
                        updatedAt: Date.now()
                    };
                    try { localStorage.setItem('finvex_pending_transfer', JSON.stringify(payload)); } catch { /* ignore */ }
                    setPendingTransfer(payload);
                } else {
                    try { localStorage.removeItem('finvex_pending_transfer'); } catch { /* ignore */ }
                    setPendingTransfer(null);
                    setIsPendingTransferOpen(false);
                }
            } catch {
                /* offline or not authorised: keep whatever is cached locally */
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id, pendingProbeTick]);

    const logout = async () => {
        try {
            try { localStorage.removeItem('finvex_pending_transfer'); } catch { /* ignore */ }
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
            notifications,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            card,
            topUp,
            logout,
            isTransferModalOpen, setIsTransferModalOpen,
            pendingTransfer,
            refreshPendingTransfer,
            isPendingTransferOpen, setIsPendingTransferOpen
        }}>
            {children}
        </AppContext.Provider>
    );
};
