/* global __app_id, __initial_auth_token */
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, query, updateDoc, deleteDoc, writeBatch, Timestamp, orderBy, limit, addDoc } from 'firebase/firestore';

// --- BIBLIOTHÈQUE DE GRAPHIQUES ---
const loadChartJs = () => {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve(window.Chart);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve(window.Chart);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// --- SYSTÈME DE TRADUCTION ---
const translations = {
    fr: {
        // General
        loading: "Chargement de l'application...",
        logout: "Déconnexion",
        back: "Retour",
        // Login
        loginTitle: "Mon Programme",
        loginSubtitle: "Connectez-vous pour commencer",
        usernamePlaceholder: "Nom d'utilisateur",
        passwordPlaceholder: "Mot de passe",
        loginButton: "Connexion",
        loginError: "Nom d'utilisateur ou mot de passe incorrect.",
        // Dashboard
        welcome: "Bienvenue",
        coachNotes: "Notes du Coach",
        myProgression: "Ma Progression",
        // Admin
        adminTitle: "Tableau de Bord Coach",
        quit: "Quitter",
        addStudentTitle: "Ajouter un élève",
        fullNamePlaceholder: "Nom complet",
        addStudentButton: "Ajouter l'élève",
        studentListTitle: "Liste des élèves",
        progressionButton: "Progression",
        historyButton: "Historique",
        manageProgramButton: "Gérer Prog.",
        notesForStudent: "Notes pour l'élève",
        saveChanges: "Enregistrer les modifications",
        weightTrackingButton: "Suivi Poids",
        lexiconButton: "Bibliothèque d'Exercices",
        recentActivity: "Activité Récente",
        noRecentActivity: "Aucune activité récente.",
        // History
        historyOf: "Historique de",
        noHistory: "Aucun historique d'entraînement pour cet élève.",
        // Progression
        progressionOf: "Progression de",
        chooseExercise: "Choisir un exercice :",
        selectExercise: "-- Sélectionnez un exercice --",
        maxWeightLifted: "Poids max soulevé (kg) pour",
        // Weight Tracking
        weightTrackingOf: "Suivi du poids de",
        addWeightEntry: "Ajouter une pesée",
        weightInKg: "Poids (kg)",
        add: "Ajouter",
        weightHistory: "Historique des pesées"
    },
    en: {
        // General
        loading: "Loading application...",
        logout: "Logout",
        back: "Back",
        // Login
        loginTitle: "My Program",
        loginSubtitle: "Login to get started",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        loginButton: "Login",
        loginError: "Incorrect username or password.",
        // Dashboard
        welcome: "Welcome",
        coachNotes: "Coach's Notes",
        myProgression: "My Progression",
        // Admin
        adminTitle: "Coach Dashboard",
        quit: "Quit",
        addStudentTitle: "Add a student",
        fullNamePlaceholder: "Full Name",
        addStudentButton: "Add Student",
        studentListTitle: "Student List",
        progressionButton: "Progression",
        historyButton: "History",
        manageProgramButton: "Manage Prog.",
        notesForStudent: "Notes for the student",
        saveChanges: "Save Changes",
        weightTrackingButton: "Weight Tracking",
        lexiconButton: "Exercise Library",
        recentActivity: "Recent Activity",
        noRecentActivity: "No recent activity.",
        // History
        historyOf: "History of",
        noHistory: "No training history for this student.",
        // Progression
        progressionOf: "Progression of",
        chooseExercise: "Choose an exercise:",
        selectExercise: "-- Select an exercise --",
        maxWeightLifted: "Max weight lifted (kg) for",
        // Weight Tracking
        weightTrackingOf: "Weight Tracking for",
        addWeightEntry: "Add a weight entry",
        weightInKg: "Weight (kg)",
        add: "Add",
        weightHistory: "Weight History"
    }
};


// --- CONFIGURATION FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// --- INITIALISATION DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- COMPOSANTS DE L'INTERFACE ---

const LanguageSwitcher = ({ setLanguage, className = '' }) => (
    <div className={`flex gap-2 ${className}`}>
        <button onClick={() => setLanguage('fr')} className="text-2xl">🇫🇷</button>
        <button onClick={() => setLanguage('en')} className="text-2xl">🇬🇧</button>
    </div>
);

const Loader = ({ text }) => ( 
    <div className="flex flex-col justify-center items-center h-screen bg-stone-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-amber-600 font-semibold">{text}</p>
    </div> 
);

const LoginScreen = ({ onLogin, error, t, setLanguage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (username && password) {
            onLogin(username, password);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 p-4 text-stone-800 relative">
            <LanguageSwitcher setLanguage={setLanguage} className="absolute top-4 right-4" />
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
                <h1 className="text-4xl font-bold mb-2 text-amber-600">{t.loginTitle}</h1>
                <p className="text-stone-500 mb-8">{t.loginSubtitle}</p>
                {error && <p className="bg-red-500/10 text-red-600 p-3 rounded-lg mb-4">{error}</p>}
                <div className="space-y-4">
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernamePlaceholder} className="w-full p-3 bg-stone-100 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} className="w-full p-3 bg-stone-100 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <button onClick={handleLogin} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition duration-300 mt-6">{t.loginButton}</button>
            </div>
        </div>
    );
};

const DashboardScreen = ({ student, onSelectFolder, onLogout, t, setLanguage, onShowProgression }) => (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t.welcome}, <span className="text-amber-600">{student.name}</span></h1>
                    <p className="text-stone-500 text-lg">{student.program?.name}</p>
                </div>
                 <div className="flex items-center gap-4">
                    <LanguageSwitcher setLanguage={setLanguage} />
                    <button onClick={onShowProgression} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">{t.myProgression}</button>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">{t.logout}</button>
                </div>
            </div>
            {student.coachNotes && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-bold text-amber-600 mb-2">{t.coachNotes}</h2>
                    <p className="text-stone-600 whitespace-pre-wrap">{student.coachNotes}</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {student.program?.folders?.map((folder, index) => (
                    <div key={index} onClick={() => onSelectFolder(folder)} className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <h3 className="text-xl font-bold text-amber-600 mb-2">{folder.name}</h3>
                        <p className="text-stone-500">{folder.sessions?.length || 0} séance(s)</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const FolderDetailScreen = ({ folder, onSelectSession, onBack, t }) => (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-amber-600">{folder.name}</h2>
                <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">{t.back}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {folder.sessions?.map((session, index) => (
                    <div key={index} onClick={() => onSelectSession(session)} className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <h3 className="text-xl font-bold text-amber-600 mb-2">{session.name}</h3>
                        <p className="text-stone-500">Cliquez pour commencer</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const Timer = ({ duration, onFinish }) => {
    const [secondsLeft, setSecondsLeft] = useState(duration);

    useEffect(() => {
        if (secondsLeft <= 0) {
            onFinish();
            return;
        }
        const intervalId = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [secondsLeft, onFinish]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg text-stone-800 border-2 border-amber-500 z-50">
            <div className="text-4xl font-bold text-amber-600">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <button onClick={onFinish} className="w-full mt-2 text-sm text-red-500">Arrêter</button>
        </div>
    );
};


const SessionDetailScreen = ({ session, student, onBack, onShowExerciseDetails, onCompleteSession, t }) => {
    const [performance, setPerformance] = useState({});
    const [comment, setComment] = useState('');
    const [checkedItems, setCheckedItems] = useState({});
    const [timerKey, setTimerKey] = useState(0);
    const [timerDuration, setTimerDuration] = useState(0);
    const [isTimerVisible, setIsTimerVisible] = useState(false);
    const [displayedWorkout, setDisplayedWorkout] = useState(JSON.parse(JSON.stringify(session.workout)));

    const handleSwapExercise = (exoIndex) => {
        const newWorkout = JSON.parse(JSON.stringify(displayedWorkout));
        const exercise = newWorkout.exercises[exoIndex];
        if (exercise.substitution && exercise.substitution.name) {
            const originalExo = { name: exercise.name, sets: exercise.sets };
            const substitutionExo = { name: exercise.substitution.name, sets: exercise.substitution.sets };
            
            exercise.name = substitutionExo.name;
            exercise.sets = substitutionExo.sets;
            exercise.substitution.name = originalExo.name;
            exercise.substitution.sets = originalExo.sets;

            setDisplayedWorkout(newWorkout);
        }
    };

    const startTimer = (restString) => {
        const seconds = parseInt(restString, 10);
        if (!isNaN(seconds) && seconds > 0) {
            setTimerDuration(seconds);
            setTimerKey(prev => prev + 1);
            setIsTimerVisible(true);
        }
    };

    const handlePerformanceChange = (exoIndex, setIndex, field, value) => {
        const key = `${exoIndex}-${setIndex}`;
        setPerformance(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };
    
    const handleCheckChange = (type, exoIndex) => {
        const key = `${type}-${exoIndex}`;
        setCheckedItems(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleComplete = () => {
        const sessionData = {
            studentId: student.id, studentName: student.name, sessionName: session.name,
            completedAt: Timestamp.now(), comment: comment,
            warmup: session.warmup?.map((exo, index) => ({
                name: exo.name,
                completed: !!checkedItems[`warmup-${index}`]
            })) || [],
            workout: {
                type: displayedWorkout.type,
                exercises: displayedWorkout.exercises.map((exo, exoIndex) => ({
                    name: exo.name,
                    completed: !!checkedItems[`workout-${exoIndex}`],
                    sets: exo.sets.map((set, setIndex) => ({
                        target: `Répétitions: ${set.reps}, Charge: ${set.load}`,
                        performance: { 
                            weight: performance[`${exoIndex}-${setIndex}`]?.weight || 'N/A', 
                            reps: performance[`${exoIndex}-${setIndex}`]?.reps || 'N/A' 
                        }
                    }))
                })) || []
            }
        };
        onCompleteSession(sessionData);
    };

    return (
        <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800 pb-28">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-amber-600">{session.name}</h2>
                    <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">{t.back}</button>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h3 className="text-2xl font-bold text-orange-500 mb-4">Échauffement</h3>
                    <div className="space-y-3">
                        {session.warmup?.map((exo, index) => (
                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg bg-stone-100 transition-all ${checkedItems[`warmup-${index}`] ? 'opacity-50' : ''}`}>
                                <button onClick={() => onShowExerciseDetails(exo.name)} className="font-semibold text-stone-800 hover:text-amber-600">{exo.name} ↗</button>
                                <div className="flex items-center">
                                    <span className="mr-4 text-stone-600 font-medium">{exo.duration}</span>
                                    <input id={`check-warmup-${index}`} type="checkbox" checked={!!checkedItems[`warmup-${index}`]} onChange={() => handleCheckChange('warmup', index)} className="h-6 w-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold text-orange-500 mb-4">Workout: <span className="text-stone-800">{displayedWorkout.type}</span></h3>
                    <div className="space-y-6">
                        {displayedWorkout.exercises.map((exo, exoIndex) => (
                            <div key={exoIndex} className={`bg-stone-100 p-4 rounded-xl transition-all ${checkedItems[`workout-${exoIndex}`] ? 'opacity-50' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onShowExerciseDetails(exo.name)} className="text-xl font-bold text-stone-800 text-left hover:text-amber-600 transition">{exo.name} ↗</button>
                                        {exo.substitution && exo.substitution.name && (
                                            <button onClick={() => handleSwapExercise(exoIndex)} className="text-2xl hover:opacity-75 transition-opacity">
                                                🔄
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <label htmlFor={`check-workout-${exoIndex}`} className="mr-2 text-stone-600">Fait</label>
                                        <input id={`check-workout-${exoIndex}`} type="checkbox" checked={!!checkedItems[`workout-${exoIndex}`]} onChange={() => handleCheckChange('workout', exoIndex)} className="h-6 w-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {exo.sets?.map((set, setIndex) => (
                                        <div key={setIndex} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-white rounded-lg">
                                            <div>
                                                <div className="text-sm font-semibold text-stone-500">Série {setIndex + 1}</div>
                                                <div className="font-bold text-amber-600 text-lg">{set.reps} reps x {set.load}</div>
                                            </div>
                                            <input type="text" placeholder="Poids (kg)" onChange={(e) => handlePerformanceChange(exoIndex, setIndex, 'weight', e.target.value)} className="p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <input type="text" placeholder="Reps" onChange={(e) => handlePerformanceChange(exoIndex, setIndex, 'reps', e.target.value)} className="p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <button onClick={() => startTimer(set.rest)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-sm">Repos ({set.rest})</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                     <h3 className="text-xl font-bold text-amber-600 mb-2">Commentaires sur la séance</h3>
                     <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment vous êtes-vous senti ? Des difficultés particulières ?" rows="4" className="w-full p-3 bg-stone-100 border border-stone-300 rounded-lg"></textarea>
                </div>
                <button onClick={handleComplete} className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg text-xl">Terminer et Enregistrer la Séance</button>
            </div>
            {isTimerVisible && <Timer key={timerKey} duration={timerDuration} onFinish={() => setIsTimerVisible(false)} />}
        </div>
    );
};

const ExerciseDetailModal = ({ exercise, onClose }) => {
    if (!exercise) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 text-stone-800 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-stone-400 hover:text-stone-800">&times;</button>
                <h2 className="text-3xl font-bold text-amber-600 mb-4">{exercise.name}</h2>
                <p className="bg-amber-500/20 text-amber-700 inline-block px-3 py-1 rounded-full text-sm mb-4 font-semibold">{exercise.muscleGroup}</p>
                <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="block bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center font-bold py-4 px-6 rounded-lg mb-4 text-lg hover:scale-105 transition-transform">
                    Voir le Reel sur Instagram
                </a>
                <h3 className="text-xl font-bold mb-2">Description</h3>
                <p className="text-stone-600 whitespace-pre-wrap">{exercise.description}</p>
            </div>
        </div>
    );
};
const LexiconManagerScreen = ({ lexicon, onAdd, onUpdate, onDelete, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentExo, setCurrentExo] = useState({ id: null, name: '', muscleGroup: '', description: '', videoUrl: '' });

    const handleEdit = (exo) => {
        setIsEditing(true);
        setCurrentExo(exo);
    };

    const handleSave = () => {
        if (currentExo.name && currentExo.muscleGroup && currentExo.description && currentExo.videoUrl) {
            if (isEditing) {
                onUpdate(currentExo.id, currentExo);
            } else {
                onAdd(currentExo);
            }
            handleCancel();
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentExo({ id: null, name: '', muscleGroup: '', description: '', videoUrl: '' });
    };

    return (
        <div className="min-h-screen bg-stone-100 p-8 text-stone-800">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Bibliothèque d'Exercices</h1>
                    <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">Retour Admin</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-bold text-amber-600 mb-4">{isEditing ? "Modifier l'exercice" : "Ajouter un exercice"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={currentExo.name} onChange={e => setCurrentExo({...currentExo, name: e.target.value})} placeholder="Nom de l'exercice" className="p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                        <input type="text" value={currentExo.muscleGroup} onChange={e => setCurrentExo({...currentExo, muscleGroup: e.target.value})} placeholder="Groupe musculaire" className="p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                        <textarea value={currentExo.description} onChange={e => setCurrentExo({...currentExo, description: e.target.value})} placeholder="Description (technique, conseils...)" rows="4" className="md:col-span-2 p-3 bg-stone-100 border border-stone-300 rounded-lg"></textarea>
                        <input type="text" value={currentExo.videoUrl} onChange={e => setCurrentExo({...currentExo, videoUrl: e.target.value})} placeholder="URL du Reel Instagram" className="md:col-span-2 p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleSave} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg">{isEditing ? "Enregistrer" : "Ajouter"}</button>
                        {isEditing && <button onClick={handleCancel} className="w-full bg-stone-500 hover:bg-stone-600 text-white font-bold py-3 rounded-lg">Annuler</button>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-amber-600 mb-4">Exercices existants</h2>
                    <ul className="space-y-3">
                        {lexicon.map(exo => (
                            <li key={exo.id} className="bg-stone-100 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-semibold block">{exo.name}</span>
                                    <span className="text-sm text-amber-700">{exo.muscleGroup}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(exo)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded">Modifier</button>
                                    <button onClick={() => onDelete(exo.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ProgramManagerScreen = ({ student, onUpdateProgram, onBack, allStudents, t }) => {
    const [program, setProgram] = useState(JSON.parse(JSON.stringify(student.program)));
    const [coachNotes, setCoachNotes] = useState(student.coachNotes || '');
    const [isSchemaSelectorOpen, setIsSchemaSelectorOpen] = useState(false);
    const [currentFolderIndex, setCurrentFolderIndex] = useState(null);
    const [isCopySessionModalOpen, setIsCopySessionModalOpen] = useState(false);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessionToCopy, setSelectedSessionToCopy] = useState('');

    useEffect(() => {
        const allSess = [];
        allStudents.forEach(s => {
            s.program?.folders?.forEach(folder => {
                folder.sessions?.forEach(session => {
                    allSess.push({
                        displayName: `${session.name} (${s.name})`,
                        sessionData: session
                    });
                });
            });
        });
        setAvailableSessions(allSess);
    }, [allStudents]);

    const handleProgramNameChange = (e) => setProgram({ ...program, name: e.target.value });
    const handleFolderNameChange = (fIndex, value) => {
        const updated = [...program.folders]; updated[fIndex].name = value;
        setProgram({ ...program, folders: updated });
    };
    const handleSessionNameChange = (fIndex, sIndex, value) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].name = value;
        setProgram({ ...program, folders: updated });
    };
    const handleWorkoutTypeChange = (fIndex, sIndex, value) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].workout.type = value;
        setProgram({ ...program, folders: updated });
    };
    const handleWarmupExerciseChange = (fIndex, sIndex, wIndex, field, value) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].warmup[wIndex][field] = value;
        setProgram({ ...program, folders: updated });
    };
    const handleWorkoutExerciseChange = (fIndex, sIndex, eIndex, field, value) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].workout.exercises[eIndex][field] = value;
        setProgram({ ...program, folders: updated });
    };
     const handleWorkoutExerciseSubstitutionChange = (fIndex, sIndex, eIndex, field, value) => {
        const updated = [...program.folders]; 
        if (!updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution) {
            updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution = { name: '', sets: [] };
        }
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution[field] = value;
        setProgram({ ...program, folders: updated });
    };
    const handleSetChange = (fIndex, sIndex, eIndex, setIndex, field, value) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].workout.exercises[eIndex].sets[setIndex][field] = value;
        setProgram({ ...program, folders: updated });
    };
    const handleSubstitutionSetChange = (fIndex, sIndex, eIndex, setIndex, field, value) => {
        const updated = [...program.folders]; 
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution.sets[setIndex][field] = value;
        setProgram({ ...program, folders: updated });
    };
    
    const addFolder = () => setProgram({ ...program, folders: [...(program.folders || []), { name: "Nouveau Dossier", sessions: [] }] });
    const deleteFolder = (fIndex) => setProgram({ ...program, folders: program.folders.filter((_, i) => i !== fIndex) });
    
    const openAddSessionModal = (fIndex) => {
        setCurrentFolderIndex(fIndex);
        setIsSchemaSelectorOpen(true); 
    };

    const addSessionFromSchema = (schema) => {
        const fIndex = currentFolderIndex;
        let newSession = { name: "Nouvelle Séance", warmup: [], workout: { type: 'Force', exercises: [] } };

        if (schema === 'force') {
            newSession.name = "Séance Force";
            newSession.workout.exercises = Array(4).fill(null).map(() => ({
                name: "Nom de l'exercice",
                substitution: { name: "", sets: [] },
                sets: Array(4).fill(null).map(() => ({ reps: "4", load: "0kg", rest: "120s" }))
            }));
        } else if (schema === 'hypertrophy') {
            newSession.name = "Séance Hypertrophie";
            newSession.workout.exercises = Array(4).fill(null).map(() => ({
                name: "Nom de l'exercice",
                substitution: { name: "", sets: [] },
                sets: Array(4).fill(null).map(() => ({ reps: "10", load: "0kg", rest: "60s" }))
            }));
        } else if (schema === 'crossfit') {
            newSession.name = "Nouveau WOD";
            newSession.warmup = [{ name: "Corde à sauter", duration: "3min" }];
            newSession.workout = {
                type: "AMRAP 15min",
                exercises: Array(3).fill(null).map(() => ({
                    name: "Nom de l'exercice",
                    substitution: { name: "", sets: [] },
                    sets: [{ reps: "10", load: "0kg", rest: "0" }]
                }))
            };
        }

        const updated = [...program.folders]; 
        updated[fIndex].sessions.push(newSession);
        setProgram({ ...program, folders: updated });
        setIsSchemaSelectorOpen(false);
        setCurrentFolderIndex(null);
    };

    const handleCopySession = () => {
        if (!selectedSessionToCopy || currentFolderIndex === null) return;

        const sessionToCopy = JSON.parse(selectedSessionToCopy).sessionData;
        const updatedProgram = JSON.parse(JSON.stringify(program));
        updatedProgram.folders[currentFolderIndex].sessions.push(sessionToCopy);
        setProgram(updatedProgram);

        setIsCopySessionModalOpen(false);
        setSelectedSessionToCopy('');
        setCurrentFolderIndex(null);
    };

    const deleteSession = (fIndex, sIndex) => {
        const updated = [...program.folders]; updated[fIndex].sessions = updated[fIndex].sessions.filter((_, i) => i !== sIndex);
        setProgram({ ...program, folders: updated });
    };
    const addWarmupExercise = (fIndex, sIndex) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].warmup.push({ name: "Jumping Jacks", duration: "60s" });
        setProgram({ ...program, folders: updated });
    };
    const deleteWarmupExercise = (fIndex, sIndex, wIndex) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].warmup = updated[fIndex].sessions[sIndex].warmup.filter((_, i) => i !== wIndex);
        setProgram({ ...program, folders: updated });
    };
    const addWorkoutExercise = (fIndex, sIndex) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].workout.exercises.push({ name: "Nouvel Exercice", substitution: { name: "", sets: [] }, sets: [] });
        setProgram({ ...program, folders: updated });
    };
    const deleteWorkoutExercise = (fIndex, sIndex, eIndex) => {
        const updated = [...program.folders]; updated[fIndex].sessions[sIndex].workout.exercises = updated[fIndex].sessions[sIndex].workout.exercises.filter((_, i) => i !== eIndex);
        setProgram({ ...program, folders: updated });
    };
    const addSet = (fIndex, sIndex, eIndex) => {
        const updated = [...program.folders];
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].sets.push({ reps: "10", load: "0kg", rest: "60s" });
        setProgram({ ...program, folders: updated });
    };
    const deleteSet = (fIndex, sIndex, eIndex, setIndex) => {
        const updated = [...program.folders];
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].sets = updated[fIndex].sessions[sIndex].workout.exercises[eIndex].sets.filter((_, i) => i !== setIndex);
        setProgram({ ...program, folders: updated });
    };
    const addSubstitutionSet = (fIndex, sIndex, eIndex) => {
        const updated = [...program.folders];
        if (!updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution) {
            updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution = { name: "", sets: [] };
        }
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution.sets.push({ reps: "10", load: "0kg", rest: "60s" });
        setProgram({ ...program, folders: updated });
    };
    const deleteSubstitutionSet = (fIndex, sIndex, eIndex, setIndex) => {
        const updated = [...program.folders];
        updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution.sets = updated[fIndex].sessions[sIndex].workout.exercises[eIndex].substitution.sets.filter((_, i) => i !== setIndex);
        setProgram({ ...program, folders: updated });
    };
     const AddSessionModal = ({ onClose, onSchemaSelect, onCopySelect, availableSessions }) => {
        const [sessionToCopy, setSessionToCopy] = useState('');

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 text-stone-800">
                    <h3 className="text-2xl font-bold text-amber-600 mb-6 text-center">Ajouter une nouvelle séance</h3>
                    <div className="space-y-3">
                        <button onClick={() => onSchemaSelect('force')} className="w-full text-left p-3 bg-stone-100 hover:bg-stone-200 rounded-lg">Modèle Force (4x4)</button>
                        <button onClick={() => onSchemaSelect('hypertrophy')} className="w-full text-left p-3 bg-stone-100 hover:bg-stone-200 rounded-lg">Modèle Hypertrophie (4x10)</button>
                        <button onClick={() => onSchemaSelect('crossfit')} className="w-full text-left p-3 bg-stone-100 hover:bg-stone-200 rounded-lg">Modèle CrossFit (AMRAP)</button>
                    </div>
                    <div className="border-t my-6"></div>
                    <div>
                        <h4 className="text-lg font-semibold mb-2 text-center">Ou copier une séance existante</h4>
                        <select value={sessionToCopy} onChange={e => setSessionToCopy(e.target.value)} className="w-full p-3 bg-stone-100 border border-stone-300 rounded-lg mb-3">
                            <option value="">-- Choisir une séance à copier --</option>
                            {availableSessions.map((s, i) => (
                                <option key={i} value={JSON.stringify(s)}>{s.displayName}</option>
                            ))}
                        </select>
                        <button onClick={() => onCopySelect(sessionToCopy)} disabled={!sessionToCopy} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg disabled:bg-stone-300">Copier la séance</button>
                    </div>
                    <button onClick={onClose} className="w-full mt-6 text-stone-500 hover:text-stone-800">Annuler</button>
                </div>
            </div>
        );
    };

    return (
        <>
            {isSchemaSelectorOpen && (
                <AddSessionModal 
                    onClose={() => setIsSchemaSelectorOpen(false)}
                    onSchemaSelect={addSessionFromSchema}
                    onCopySelect={(sessionJSON) => {
                        setSelectedSessionToCopy(sessionJSON);
                        handleCopySession();
                    }}
                    availableSessions={availableSessions}
                />
            )}
            <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold">Gestion de <span className="text-amber-600">{student.name}</span></h1>
                        <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">Retour Admin</button>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                        <label className="text-lg font-bold text-amber-600">Nom du Programme</label>
                        <input type="text" value={program.name} onChange={handleProgramNameChange} className="w-full mt-2 p-3 bg-stone-100 border border-stone-300 rounded-lg" />
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                        <label className="text-lg font-bold text-amber-600">{t.notesForStudent}</label>
                        <textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} rows="4" className="w-full mt-2 p-3 bg-stone-100 border border-stone-300 rounded-lg"></textarea>
                    </div>
                    {program.folders?.map((folder, fIndex) => (
                        <div key={fIndex} className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-amber-500">
                            <div className="flex justify-between items-center mb-4">
                                <input type="text" value={folder.name} onChange={(e) => handleFolderNameChange(fIndex, e.target.value)} className="text-2xl font-bold bg-transparent border-b-2 border-stone-300 focus:border-amber-500 focus:outline-none w-2/3" />
                                <button onClick={() => deleteFolder(fIndex)} className="text-red-500 hover:text-red-400 font-semibold">Supprimer Dossier</button>
                            </div>
                            {folder.sessions?.map((session, sIndex) => (
                                 <div key={sIndex} className="bg-stone-100 p-4 rounded-lg mb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <input type="text" value={session.name} onChange={(e) => handleSessionNameChange(fIndex, sIndex, e.target.value)} className="text-xl font-bold bg-transparent border-b-2 border-stone-300 focus:border-amber-500 focus:outline-none w-2/3" />
                                        <button onClick={() => deleteSession(fIndex, sIndex)} className="text-sm text-red-500 hover:text-red-400 font-semibold">Supprimer Séance</button>
                                    </div>
                                    <div className="p-3 bg-orange-500/10 rounded-lg mb-4">
                                        <h4 className="font-bold text-orange-600 mb-2">Échauffement</h4>
                                        {session.warmup?.map((exo, wIndex) => (
                                            <div key={wIndex} className="flex gap-2 items-center mb-2">
                                                <input type="text" value={exo.name} onChange={e => handleWarmupExerciseChange(fIndex, sIndex, wIndex, 'name', e.target.value)} placeholder="Exo" className="flex-grow p-2 bg-white border border-stone-300 rounded" />
                                                <input type="text" value={exo.duration} onChange={e => handleWarmupExerciseChange(fIndex, sIndex, wIndex, 'duration', e.target.value)} placeholder="Durée" className="w-24 p-2 bg-white border border-stone-300 rounded" />
                                                <button onClick={() => deleteWarmupExercise(fIndex, sIndex, wIndex)} className="text-red-500 p-2 rounded-full hover:bg-red-500/10">X</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addWarmupExercise(fIndex, sIndex)} className="mt-2 text-orange-600 hover:text-orange-500 font-semibold text-sm">+ Exo Échauffement</button>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <h4 className="font-bold text-blue-600 mb-2">Workout</h4>
                                        <input type="text" value={session.workout?.type} onChange={e => handleWorkoutTypeChange(fIndex, sIndex, e.target.value)} placeholder="Type de workout (ex: AMRAP 12min)" className="w-full p-2 mb-4 bg-white border border-stone-300 rounded" />
                                        {session.workout?.exercises?.map((exo, eIndex) => (
                                            <div key={eIndex} className="bg-white p-3 rounded-lg mb-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <input type="text" value={exo.name} onChange={(e) => handleWorkoutExerciseChange(fIndex, sIndex, eIndex, 'name', e.target.value)} placeholder="Nom de l'exercice" className="text-lg font-semibold bg-transparent border-b-2 border-stone-200 focus:border-amber-500 focus:outline-none w-2/3" />
                                                    <button onClick={() => deleteWorkoutExercise(fIndex, sIndex, eIndex)} className="text-red-500 hover:text-red-400 font-semibold text-sm">Supprimer Exo</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {exo.sets?.map((set, setIndex) => (
                                                        <div key={setIndex} className="grid grid-cols-5 gap-2 items-center">
                                                            <span className="font-semibold text-stone-500">Série {setIndex + 1}</span>
                                                            <input type="text" value={set.reps} onChange={e => handleSetChange(fIndex, sIndex, eIndex, setIndex, 'reps', e.target.value)} placeholder="Reps" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                            <input type="text" value={set.load} onChange={e => handleSetChange(fIndex, sIndex, eIndex, setIndex, 'load', e.target.value)} placeholder="Charge" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                            <input type="text" value={set.rest} onChange={e => handleSetChange(fIndex, sIndex, eIndex, setIndex, 'rest', e.target.value)} placeholder="Repos" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                            <button onClick={() => deleteSet(fIndex, sIndex, eIndex, setIndex)} className="text-red-500 p-2 rounded-full hover:bg-red-500/10 text-xs">X</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => addSet(fIndex, sIndex, eIndex)} className="mt-2 text-blue-600 hover:text-blue-500 font-semibold text-sm">+ Ajouter une série</button>
                                                
                                                <div className="mt-4 pt-4 border-t border-stone-300">
                                                     <input type="text" value={exo.substitution?.name || ''} onChange={(e) => handleWorkoutExerciseSubstitutionChange(fIndex, sIndex, eIndex, 'name', e.target.value)} placeholder="Exercice de substitution (optionnel)" className="w-full p-2 mt-1 mb-2 bg-stone-50 border border-stone-200 rounded-lg text-sm" />
                                                     {exo.substitution?.name && (
                                                         <>
                                                            <div className="space-y-2">
                                                                {exo.substitution.sets?.map((set, setIndex) => (
                                                                    <div key={setIndex} className="grid grid-cols-5 gap-2 items-center">
                                                                        <span className="font-semibold text-stone-500 text-xs">Série Sub. {setIndex + 1}</span>
                                                                        <input type="text" value={set.reps} onChange={e => handleSubstitutionSetChange(fIndex, sIndex, eIndex, setIndex, 'reps', e.target.value)} placeholder="Reps" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                                        <input type="text" value={set.load} onChange={e => handleSubstitutionSetChange(fIndex, sIndex, eIndex, setIndex, 'load', e.target.value)} placeholder="Charge" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                                        <input type="text" value={set.rest} onChange={e => handleSubstitutionSetChange(fIndex, sIndex, eIndex, setIndex, 'rest', e.target.value)} placeholder="Repos" className="p-2 bg-stone-100 border border-stone-300 rounded" />
                                                                        <button onClick={() => deleteSubstitutionSet(fIndex, sIndex, eIndex, setIndex)} className="text-red-500 p-2 rounded-full hover:bg-red-500/10 text-xs">X</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button onClick={() => addSubstitutionSet(fIndex, sIndex, eIndex)} className="mt-2 text-amber-600 hover:text-amber-500 font-semibold text-sm">+ Ajouter série de substitution</button>
                                                         </>
                                                     )}
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addWorkoutExercise(fIndex, sIndex)} className="mt-2 text-blue-600 hover:text-blue-500 font-semibold text-sm">+ Ajouter un exercice au Workout</button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openAddSessionModal(fIndex)} className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 font-bold py-2 rounded-lg">+ Ajouter une séance à ce dossier</button>
                        </div>
                    ))}
                    <button onClick={addFolder} className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-700 font-bold py-3 rounded-lg mb-6">+ Ajouter un dossier</button>
                    <button onClick={() => onUpdateProgram(student.id, program, coachNotes)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-xl">{t.saveChanges}</button>
                </div>
            </div>
        </>
    );
};

const AdminScreen = ({ students, onAddStudent, onManageStudent, onManageLexicon, onShowHistory, onLogout, onShowProgression, t, setLanguage, onShowWeightTracking, recentActivity }) => {
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [newStudentPassword, setNewStudentPassword] = useState('');

    const handleAdd = () => {
        if (newStudentName.trim() && newStudentUsername.trim() && newStudentPassword.trim()) {
            onAddStudent(newStudentName.trim(), newStudentUsername.trim(), newStudentPassword.trim());
            setNewStudentName(''); setNewStudentUsername(''); setNewStudentPassword('');
        }
    };
    
    return (
        <div className="min-h-screen bg-stone-100 p-8 text-stone-800">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">{t.adminTitle}</h1>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher setLanguage={setLanguage} />
                        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">{t.quit}</button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-bold text-amber-600 mb-4">{t.addStudentTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder={t.fullNamePlaceholder} className="p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                        <input type="text" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} placeholder={t.usernamePlaceholder} className="p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                        <input type="password" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} placeholder={t.passwordPlaceholder} className="md:col-span-2 p-3 bg-stone-100 border border-stone-300 rounded-lg"/>
                    </div>
                    <button onClick={handleAdd} className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg">{t.addStudentButton}</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-bold text-amber-600 mb-4">{t.studentListTitle}</h2>
                    <ul className="space-y-3">
                        {students.map(student => (
                            <li key={student.id} className="bg-stone-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-2 md:mb-0">
                                    <span className="font-semibold block">{student.name}</span>
                                    <span className="text-sm text-stone-500">Utilisateur: {student.username}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => onShowWeightTracking(student)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">{t.weightTrackingButton}</button>
                                    <button onClick={() => onShowProgression(student)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.progressionButton}</button>
                                    <button onClick={() => onShowHistory(student)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg">{t.historyButton}</button>
                                    <button onClick={() => onManageStudent(student)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg">{t.manageProgramButton}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <button onClick={onManageLexicon} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-lg">{t.lexiconButton}</button>
                </div>
            </div>
        </div>
    );
};
const TrainingHistoryScreen = ({ history, studentName, onBack, t }) => (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">{t.historyOf} <span className="text-amber-600">{studentName}</span></h1>
                <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">{t.back}</button>
            </div>
            <div className="space-y-6">
                {history.length > 0 ? history.map(entry => (
                    <div key={entry.id} className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-baseline mb-4">
                            <h2 className="text-xl font-bold text-amber-600">{entry.sessionName}</h2>
                            <p className="text-sm text-stone-500">{new Date(entry.completedAt.seconds * 1000).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="space-y-4">
                            {entry.workout?.exercises?.map((exo, index) => (
                                <div key={index} className="p-3 bg-stone-100 rounded-lg">
                                    <h3 className="font-bold text-lg">{exo.name}</h3>
                                    <ul className="mt-2 pl-4 space-y-1 list-disc list-inside">
                                        {exo.sets?.map((set, setIndex) => (
                                            <li key={setIndex} className="text-sm text-stone-600">
                                                Série {setIndex + 1}: <span className="font-semibold text-emerald-600">{set.performance.weight} x {set.performance.reps} reps</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        {entry.comment && (
                            <div className="border-t border-stone-200 pt-4 mt-4">
                                <h4 className="font-bold text-stone-700">Commentaire de l'élève :</h4>
                                <p className="text-stone-600 italic mt-1">"{entry.comment}"</p>
                            </div>
                        )}
                    </div>
                )) : <p className="text-center text-stone-500">{t.noHistory}</p>}
            </div>
        </div>
    </div>
);

const ProgressionScreen = ({ studentName, history, onBack, t }) => {
    const chartRef = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [exerciseList, setExerciseList] = useState([]);

    useEffect(() => {
        const exercises = new Set();
        history.forEach(session => {
            session.workout.exercises.forEach(exo => {
                exercises.add(exo.name);
            });
        });
        setExerciseList(Array.from(exercises));
    }, [history]);

    useEffect(() => {
        if (selectedExercise && history.length > 0) {
            loadChartJs().then(Chart => {
                if (chartInstance) {
                    chartInstance.destroy();
                }

                const dataForExercise = history
                    .map(session => {
                        const exercise = session.workout.exercises.find(e => e.name === selectedExercise);
                        if (!exercise) return null;

                        const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.performance.weight) || 0));
                        return {
                            date: new Date(session.completedAt.seconds * 1000),
                            maxWeight: maxWeight
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.date - b.date);

                const newChartInstance = new Chart(chartRef.current, {
                    type: 'line',
                    data: {
                        labels: dataForExercise.map(d => d.date.toLocaleDateString('fr-FR')),
                        datasets: [{
                            label: `${t.maxWeightLifted} ${selectedExercise}`,
                            data: dataForExercise.map(d => d.maxWeight),
                            borderColor: 'rgb(245, 158, 11)',
                            tension: 0.1
                        }]
                    }
                });
                setChartInstance(newChartInstance);
            });
        }
    }, [selectedExercise, history, t.maxWeightLifted]);

    return (
        <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">{t.progressionOf} <span className="text-amber-600">{studentName}</span></h1>
                    <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">{t.back}</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="mb-4">
                        <label htmlFor="exercise-select" className="block text-sm font-medium text-stone-700 mb-2">{t.chooseExercise}</label>
                        <select
                            id="exercise-select"
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="w-full p-3 bg-stone-100 border border-stone-300 rounded-lg"
                        >
                            <option value="">{t.selectExercise}</option>
                            {exerciseList.map(exo => <option key={exo} value={exo}>{exo}</option>)}
                        </select>
                    </div>
                    <div>
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WeightTrackingScreen = ({ studentName, onBack, t, studentId, studentsCollectionPath }) => {
    const chartRef = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);
    const [weightHistory, setWeightHistory] = useState([]);
    const [newWeight, setNewWeight] = useState('');
    const weightHistoryPath = `${studentsCollectionPath}/${studentId}/weightHistory`;

    const fetchWeightHistory = async () => {
        const q = query(collection(db, weightHistoryPath), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        setWeightHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        fetchWeightHistory();
    }, []);

    useEffect(() => {
        if (weightHistory.length > 0) {
            loadChartJs().then(Chart => {
                if (chartInstance) {
                    chartInstance.destroy();
                }
                const newChartInstance = new Chart(chartRef.current, {
                    type: 'line',
                    data: {
                        labels: weightHistory.map(d => new Date(d.date.seconds * 1000).toLocaleDateString('fr-FR')),
                        datasets: [{
                            label: `Poids (kg)`,
                            data: weightHistory.map(d => d.weight),
                            borderColor: 'rgb(132, 204, 22)',
                            tension: 0.1
                        }]
                    }
                });
                setChartInstance(newChartInstance);
            });
        }
    }, [weightHistory]);

    const handleAddWeight = async () => {
        if (newWeight && !isNaN(newWeight)) {
            await addDoc(collection(db, weightHistoryPath), {
                date: Timestamp.now(),
                weight: parseFloat(newWeight)
            });
            setNewWeight('');
            fetchWeightHistory();
        }
    };

    return (
        <div className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">{t.weightTrackingOf} <span className="text-amber-600">{studentName}</span></h1>
                    <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg">{t.back}</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-bold text-amber-600 mb-4">{t.addWeightEntry}</h2>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            value={newWeight} 
                            onChange={(e) => setNewWeight(e.target.value)} 
                            placeholder={t.weightInKg}
                            className="flex-grow p-3 bg-stone-100 border border-stone-300 rounded-lg"
                        />
                        <button onClick={handleAddWeight} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg">{t.add}</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-bold text-amber-600 mb-4">{t.weightHistory}</h2>
                    <div className="space-y-2 mb-4">
                        {weightHistory.map(entry => (
                            <div key={entry.id} className="flex justify-between p-2 bg-stone-50 rounded">
                                <span>{new Date(entry.date.seconds * 1000).toLocaleDateString('fr-FR')}</span>
                                <span className="font-semibold">{entry.weight} kg</span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- COMPOSANT PRINCIPAL DE L'APPLICATION ---
export default function App() {
    const [appState, setAppState] = useState('LOADING');
    const [students, setStudents] = useState([]);
    const [exerciseLexicon, setExerciseLexicon] = useState([]);
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [currentScreen, setCurrentScreen] = useState('login');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentToManage, setStudentToManage] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showingExercise, setShowingExercise] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [language, setLanguage] = useState('fr');
    const t = translations[language];

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionPath = `/artifacts/${appId}/public/data/students`;
    const lexiconCollectionPath = `/artifacts/${appId}/public/data/exerciseLexicon`;
    
    useEffect(() => {
        const initApp = async () => {
            try {
                if (!auth.currentUser) {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) { await signInWithCustomToken(auth, token); } else { await signInAnonymously(auth); }
                }
                
                const studentsQuery = query(collection(db, studentsCollectionPath));
                const lexiconQuery = query(collection(db, lexiconCollectionPath));

                const [studentsSnapshot, lexiconSnapshot] = await Promise.all([
                    getDocs(studentsQuery),
                    getDocs(lexiconQuery)
                ]);

                if (studentsSnapshot.empty) {
                    await seedData();
                    const newStudentsSnapshot = await getDocs(studentsQuery);
                    setStudents(newStudentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

                if (lexiconSnapshot.empty) {
                    await seedLexiconData();
                    const newLexiconSnapshot = await getDocs(lexiconQuery);
                    setExerciseLexicon(newLexiconSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    setExerciseLexicon(lexiconSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

                setAppState('READY');
            } catch (error) { 
                console.error("Erreur d'initialisation de l'application:", error);
                setAppState('ERROR');
            }
        };
        initApp();
    }, []);
    
    const fetchHistory = async (studentId) => {
        const historyPath = `${studentsCollectionPath}/${studentId}/trainingHistory`;
        const q = query(collection(db, historyPath), orderBy('completedAt', 'desc'));
        const snapshot = await getDocs(q);
        setTrainingHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    const fetchRecentActivity = async (currentStudents) => {
        const allActivity = [];
        for (const student of currentStudents) {
            const historyPath = `${studentsCollectionPath}/${student.id}/trainingHistory`;
            const historyQuery = query(collection(db, historyPath), orderBy('completedAt', 'desc'), limit(10));
            const snapshot = await getDocs(historyQuery);
            snapshot.forEach(doc => {
                allActivity.push({ id: doc.id, ...doc.data() });
            });
        }
        allActivity.sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);
        setRecentActivity(allActivity.slice(0, 10));
    };

    const seedData = async () => {
        const batch = writeBatch(db);
        const studentsRef = collection(db, studentsCollectionPath);
    
        // 1. Create Alex's main document
        const alexDocRef = doc(studentsRef);
        const alexProgram = {
            name: "Prise de Masse - 2025",
            folders: [
                { 
                    name: "Mois 1", 
                    sessions: [
                        { name: "Semaine 1 - PUSH", warmup: [{name: "Jumping Jacks", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Développé couché", sets: [{reps: "12", load: "60kg", rest: "90s"}] }, { name: "Écarté incliné", sets: [{reps: "15", load: "12kg", rest: "60s"}] } ] } },
                        { name: "Semaine 1 - PULL", warmup: [{name: "Corde à sauter", duration: "180s"}], workout: { type: "Force", exercises: [ { name: "Tirage vertical", sets: [{reps: "12", load: "50kg", rest: "90s"}] } ] } },
                        { name: "Semaine 2 - LEGS", warmup: [{name: "Montées de genoux", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Squat", sets: [{reps: "10", load: "80kg", rest: "120s"}] } ] } },
                        { name: "Semaine 2 - PUSH", warmup: [{name: "Jumping Jacks", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Développé couché", sets: [{reps: "10", load: "65kg", rest: "90s"}] } ] } }
                    ]
                },
                {
                    name: "Mois 2",
                    sessions: [
                        { name: "Semaine 3 - PUSH", warmup: [{name: "Jumping Jacks", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Développé couché", sets: [{reps: "8", load: "70kg", rest: "90s"}] } ] } },
                        { name: "Semaine 3 - PULL", warmup: [{name: "Corde à sauter", duration: "180s"}], workout: { type: "Force", exercises: [ { name: "Tirage vertical", sets: [{reps: "10", load: "55kg", rest: "90s"}] } ] } },
                        { name: "Semaine 4 - LEGS", warmup: [{name: "Montées de genoux", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Squat", sets: [{reps: "8", load: "85kg", rest: "120s"}] } ] } },
                        { name: "Semaine 4 - PUSH", warmup: [{name: "Jumping Jacks", duration: "60s"}], workout: { type: "Force", exercises: [ { name: "Développé couché", sets: [{reps: "6", load: "75kg", rest: "90s"}] } ] } }
                    ]
                }
            ]
        };
    
        batch.set(alexDocRef, { name: "Alex Dubois", username: "alex", password: "password123", program: alexProgram, coachNotes: "Prochaines séances : Lundi 10h, Mercredi 18h. Pense à bien t'hydrater !" });
    
        // 2. Create fake history for Alex
        const historyRef = collection(db, `${studentsCollectionPath}/${alexDocRef.id}/trainingHistory`);
        const fakeHistory = [
            { date: new Date('2025-01-06'), sessionName: 'Semaine 1 - PUSH', exo: 'Développé couché', weight: '60' },
            { date: new Date('2025-01-08'), sessionName: 'Semaine 1 - PULL', exo: 'Tirage vertical', weight: '50' },
            { date: new Date('2025-01-13'), sessionName: 'Semaine 2 - LEGS', exo: 'Squat', weight: '80' },
            { date: new Date('2025-01-15'), sessionName: 'Semaine 2 - PUSH', exo: 'Développé couché', weight: '65' },
            { date: new Date('2025-02-03'), sessionName: 'Semaine 3 - PUSH', exo: 'Développé couché', weight: '70' },
            { date: new Date('2025-02-05'), sessionName: 'Semaine 3 - PULL', exo: 'Tirage vertical', weight: '55' },
            { date: new Date('2025-02-10'), sessionName: 'Semaine 4 - LEGS', exo: 'Squat', weight: '85' },
            { date: new Date('2025-02-12'), sessionName: 'Semaine 4 - PUSH', exo: 'Développé couché', weight: '75' },
        ];
    
        fakeHistory.forEach(entry => {
            const historyDocRef = doc(historyRef);
            batch.set(historyDocRef, {
                studentId: alexDocRef.id,
                studentName: "Alex Dubois",
                sessionName: entry.sessionName,
                completedAt: Timestamp.fromDate(entry.date),
                comment: "Bonne séance, un peu difficile.",
                workout: {
                    exercises: [{
                        name: entry.exo,
                        sets: [{ performance: { weight: entry.weight, reps: '8' } }]
                    }]
                }
            });
        });

        // 3. Create fake weight history for Alex
        const weightHistoryRef = collection(db, `${studentsCollectionPath}/${alexDocRef.id}/weightHistory`);
        const fakeWeightHistory = [
            { date: new Date('2025-01-01'), weight: 80.5 },
            { date: new Date('2025-01-15'), weight: 80.1 },
            { date: new Date('2025-02-01'), weight: 79.5 },
            { date: new Date('2025-02-15'), weight: 79.2 },
        ];
        fakeWeightHistory.forEach(entry => {
            const weightDocRef = doc(weightHistoryRef);
            batch.set(weightDocRef, {
                date: Timestamp.fromDate(entry.date),
                weight: entry.weight
            });
        });
    
        await batch.commit();
    };
    const seedLexiconData = async () => {
        const demoExercises = [
            { name: "Développé couché", muscleGroup: "Pectoraux", description: "Allongé sur un banc, descendre la barre au niveau de la poitrine et la repousser.", videoUrl: "https://www.instagram.com/p/C5q4Z_gR1gD/" },
            { name: "Squat", muscleGroup: "Jambes", description: "Fléchir les genoux en gardant le dos droit, comme pour s'asseoir sur une chaise.", videoUrl: "https://www.instagram.com/p/C47Xg89rV2v/" },
            { name: "Goblet Squat", muscleGroup: "Jambes", description: "Tenir un haltère verticalement contre sa poitrine et effectuer un squat.", videoUrl: "https://www.instagram.com/p/C2_-_ygrYgC/" },
            { name: "Jumping Jacks", muscleGroup: "Cardio", description: "Écarter les jambes et lever les bras simultanément en sautant.", videoUrl: "https://www.instagram.com/p/C2_-_ygrYgC/" },
            { name: "Montées de genoux", muscleGroup: "Cardio", description: "Courir sur place en montant les genoux le plus haut possible.", videoUrl: "https://www.instagram.com/p/C2_-_ygrYgC/" },
            { name: "Corde à sauter", muscleGroup: "Cardio", description: "Sauter au-dessus d'une corde en la faisant tourner.", videoUrl: "https://www.instagram.com/p/C2_-_ygrYgC/" },
            { name: "Pompes", muscleGroup: "Pectoraux", description: "En position de planche, fléchir les bras pour amener la poitrine vers le sol, puis pousser pour revenir à la position initiale.", videoUrl: "https://www.instagram.com/p/C5q4Z_gR1gD/" }
        ];
        const batch = writeBatch(db);
        demoExercises.forEach(exo => batch.set(doc(collection(db, lexiconCollectionPath)), exo));
        await batch.commit();
    };
    
    const handleAddStudent = async (name, username, password) => {
        const newStudent = { name, username, password, program: { name: "Nouveau programme", folders: [] } };
        await addDoc(collection(db, studentsCollectionPath), newStudent);
        const q = query(collection(db, studentsCollectionPath));
        const snapshot = await getDocs(q);
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const handleUpdateProgram = async (studentId, newProgram, newNotes) => {
        await updateDoc(doc(db, studentsCollectionPath, studentId), { program: newProgram, coachNotes: newNotes });
        const q = query(collection(db, studentsCollectionPath));
        const snapshot = await getDocs(q);
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCurrentScreen('admin');
    };
    const handleAddExercise = async (exoData) => {
        await addDoc(collection(db, lexiconCollectionPath), exoData);
        const q = query(collection(db, lexiconCollectionPath));
        const snapshot = await getDocs(q);
        setExerciseLexicon(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const handleUpdateExercise = async (id, exoData) => {
        await updateDoc(doc(db, lexiconCollectionPath, id), exoData);
        const q = query(collection(db, lexiconCollectionPath));
        const snapshot = await getDocs(q);
        setExerciseLexicon(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const handleDeleteExercise = async (id) => {
        await deleteDoc(doc(db, lexiconCollectionPath, id));
        const q = query(collection(db, lexiconCollectionPath));
        const snapshot = await getDocs(q);
        setExerciseLexicon(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const handleCompleteSession = async (sessionData) => {
        const historyPath = `${studentsCollectionPath}/${sessionData.studentId}/trainingHistory`;
        await addDoc(collection(db, historyPath), sessionData);
        alert('Séance enregistrée !');
        setCurrentScreen('folderDetail');
    };

    const handleLogin = async (username, password) => {
        setLoginError('');
        if ((username === 'admin' && password === 'admin') || (username === 'coach' && password === 'coach')) {
            await fetchRecentActivity(students);
            setSelectedStudent(null); 
            setStudentToManage(null);
            setSelectedFolder(null); 
            setSelectedSession(null);
            setCurrentScreen('admin'); 
            return;
        }
        const student = students.find(s => s.username === username && s.password === password);
        if (student) { 
            setSelectedStudent(student); 
            setCurrentScreen('dashboard'); 
        } 
        else { setLoginError(t.loginError); }
    };
    const handleLogout = () => { 
        setSelectedStudent(null); 
        setStudentToManage(null);
        setSelectedFolder(null); 
        setSelectedSession(null); 
        setCurrentScreen('login'); 
    };
    const handleManageStudent = (student) => { 
        setStudentToManage(student); 
        setCurrentScreen('programManager'); 
    };
    const handleSelectFolder = (folder) => { setSelectedFolder(folder); setCurrentScreen('folderDetail'); };
    const handleSelectSession = (session) => { setSelectedSession(session); setCurrentScreen('session'); };
    const handleBackToDashboard = () => { setSelectedFolder(null); setCurrentScreen('dashboard'); };
    const handleBackToFolderDetail = () => { setSelectedSession(null); setCurrentScreen('folderDetail'); };
    const handleShowExerciseDetails = (exerciseName) => {
        const exercise = exerciseLexicon.find(e => e.name === exerciseName);
        if (exercise) { setShowingExercise(exercise); } 
        else { alert(`Détails pour "${exerciseName}" non trouvés dans la bibliothèque.`); }
    };
    const handleShowHistory = async (student) => {
        setStudentToManage(student);
        await fetchHistory(student.id);
        setCurrentScreen('trainingHistory');
    };
    const handleShowProgression = async (student) => {
        setStudentToManage(student);
        await fetchHistory(student.id); 
        setCurrentScreen('progression');
    };
     const handleShowStudentProgression = async (student) => {
        await fetchHistory(student.id); 
        setCurrentScreen('studentProgression');
    };
    const handleShowWeightTracking = (student) => {
        setStudentToManage(student);
        setCurrentScreen('weightTracking');
    };
    
    if (appState === 'LOADING') return <Loader text={t.loading} />;
    if (appState === 'ERROR') return <div className="text-center p-8 text-red-500">Une erreur est survenue. Veuillez rafraîchir la page.</div>

    let screenToRender;
    switch (currentScreen) {
        case 'programManager': 
            if (!studentToManage) { setCurrentScreen('admin'); return <Loader text="Redirection..."/>; }
            screenToRender = <ProgramManagerScreen student={studentToManage} onUpdateProgram={handleUpdateProgram} onBack={() => setCurrentScreen('admin')} allStudents={students} t={t} />; 
            break;
        case 'lexiconManager': 
            screenToRender = <LexiconManagerScreen lexicon={exerciseLexicon} onAdd={handleAddExercise} onUpdate={handleUpdateExercise} onDelete={handleDeleteExercise} onBack={() => setCurrentScreen('admin')} />; 
            break;
        case 'trainingHistory': 
             if (!studentToManage) { setCurrentScreen('admin'); return <Loader text="Redirection..."/>; }
            screenToRender = <TrainingHistoryScreen history={trainingHistory} studentName={studentToManage?.name} onBack={() => setCurrentScreen('admin')} t={t} />; 
            break;
        case 'progression':
            if (!studentToManage) { setCurrentScreen('admin'); return <Loader text="Redirection..."/>; }
            screenToRender = <ProgressionScreen studentName={studentToManage.name} history={trainingHistory} onBack={() => setCurrentScreen('admin')} t={t} />;
            break;
        case 'weightTracking':
            if (!studentToManage) { setCurrentScreen('admin'); return <Loader text="Redirection..."/>; }
            screenToRender = <WeightTrackingScreen studentName={studentToManage.name} studentId={studentToManage.id} onBack={() => setCurrentScreen('admin')} t={t} studentsCollectionPath={studentsCollectionPath} />;
            break;
        case 'admin': 
            screenToRender = <AdminScreen students={students} onAddStudent={handleAddStudent} onManageStudent={handleManageStudent} onManageLexicon={() => setCurrentScreen('lexiconManager')} onShowHistory={handleShowHistory} onLogout={handleLogout} recentActivity={recentActivity} onShowProgression={handleShowProgression} onShowWeightTracking={handleShowWeightTracking} t={t} setLanguage={setLanguage} />; 
            break;
        case 'dashboard': 
            screenToRender = selectedStudent ? <DashboardScreen student={selectedStudent} onSelectFolder={handleSelectFolder} onLogout={handleLogout} t={t} setLanguage={setLanguage} onShowProgression={() => handleShowStudentProgression(selectedStudent)} /> : <LoginScreen onLogin={handleLogin} error={loginError} t={t} setLanguage={setLanguage} />; 
            break;
        case 'studentProgression':
            screenToRender = <ProgressionScreen studentName={selectedStudent.name} history={trainingHistory} onBack={() => setCurrentScreen('dashboard')} t={t} />;
            break;
        case 'folderDetail': 
            screenToRender = selectedFolder ? <FolderDetailScreen folder={selectedFolder} onSelectSession={handleSelectSession} onBack={handleBackToDashboard} t={t} /> : <DashboardScreen student={selectedStudent} onSelectFolder={handleSelectFolder} onLogout={handleLogout} t={t} setLanguage={setLanguage} />; 
            break;
        case 'session': 
            screenToRender = selectedSession ? <SessionDetailScreen session={selectedSession} student={selectedStudent} onBack={handleBackToFolderDetail} onShowExerciseDetails={handleShowExerciseDetails} onCompleteSession={handleCompleteSession} t={t} /> : <FolderDetailScreen folder={selectedFolder} onSelectSession={handleSelectSession} onBack={handleBackToDashboard} t={t} />; 
            break;
        default: 
            screenToRender = <LoginScreen onLogin={handleLogin} error={loginError} t={t} setLanguage={setLanguage} />;
    }

    return (
        <>
            {screenToRender}
            {showingExercise && <ExerciseDetailModal exercise={showingExercise} onClose={() => setShowingExercise(null)} />}
        </>
    );
}

