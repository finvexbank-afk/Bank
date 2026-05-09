import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwgDTBZOw7Nwz4CcH-bhHlWqWI-vsk1Bs",
  authDomain: "finvexbank-c86bb.firebaseapp.com",
  projectId: "finvexbank-c86bb",
  storageBucket: "finvexbank-c86bb.firebasestorage.app",
  messagingSenderId: "1006017340196",
  appId: "1:1006017340196:web:3d840ce1d303890e8449b1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAccount(email, password, name, pin, role) {
    try {
        console.log(`Creating account: ${email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            pin: pin,
            balance: role === 'admin' ? 1000000 : 0.00,
            currency: 'EUR',
            accountStatus: 'Active',
            role: role,
            limit: 50000,
            createdAt: new Date().toISOString()
        });
        console.log(`Successfully created ${role}: ${email}`);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`Account ${email} already exists.`);
        } else {
            console.error(`Error creating ${email}:`, error.message);
        }
    }
}

async function run() {
    await createAccount("client@finvex.com", "Finvex2026!", "John Client", "1234", "client");
    await createAccount("admin@finvex.com", "FinvexAdmin2026!", "System Admin", "0000", "admin");
    process.exit(0);
}

run();
