import type { User, Article } from '../types';

// Simple password "hashing" for demonstration.
// In a real app, use a robust library like bcrypt.
const hashValue = (value: string, salt: string): string => {
  try {
    // A simple salt makes it slightly better than just encoding.
    return btoa(`${value}${salt}`);
  } catch (e) {
    return Buffer.from(`${value}${salt}`).toString('base64');
  }
};

const DB_KEY = 'geoSeoAppDB';
const SESSION_KEY = 'geoSeoAppSession';

interface Database {
  users: User[];
  articles: Article[];
}

const getDB = (): Database => {
  try {
    const db = localStorage.getItem(DB_KEY);
    return db ? JSON.parse(db) : { users: [], articles: [] };
  } catch (error) {
    console.error("Failed to parse DB from localStorage", error);
    return { users: [], articles: [] };
  }
};

const saveDB = (db: Database) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const initialize = (): void => {
  const db = getDB();
  const adminExists = db.users.some(user => user.username === 'admin');

  if (!adminExists) {
    const adminUser: User = {
      id: crypto.randomUUID(),
      username: 'admin',
      passwordHash: hashValue('admin123', 'admin'),
      role: 'admin',
      secretQuestion: 'Default admin question?',
      secretAnswerHash: hashValue('Default answer', 'admin'),
    };
    db.users.push(adminUser);
    saveDB(db);
  }
};

// --- User Management ---

export const registerUser = (username: string, password: string, secretQuestion: string, secretAnswer: string): User => {
  if (!username.trim() || !password.trim() || !secretQuestion.trim() || !secretAnswer.trim()) {
    throw new Error('All fields are required.');
  }
  const db = getDB();
  const existingUser = db.users.find(user => user.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    throw new Error('Username already exists. Please choose another one.');
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashValue(password, username),
    role: 'user',
    secretQuestion,
    secretAnswerHash: hashValue(secretAnswer, username),
  };

  db.users.push(newUser);
  saveDB(db);
  return newUser;
};

export const loginUser = (username: string, password: string): User => {
  const db = getDB();
  const user = db.users.find(u => u.username === username);

  if (!user || user.passwordHash !== hashValue(password, username)) {
    throw new Error('Invalid username or password.');
  }
  return user;
};

export const getUsers = (): (User & { articleCount: number })[] => {
  const db = getDB();
  return db.users.map(user => {
    const articleCount = db.articles.filter(article => article.userId === user.id).length;
    return { ...user, articleCount };
  });
};

export const deleteUser = (userId: string): void => {
  const db = getDB();
  db.users = db.users.filter(u => u.id !== userId);
  // Also delete all articles by this user
  db.articles = db.articles.filter(a => a.userId !== userId);
  saveDB(db);
};

export const changeUserRole = (userId: string, newRole: 'admin' | 'user'): void => {
  const db = getDB();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    db.users[userIndex].role = newRole;
    saveDB(db);
  } else {
    throw new Error('User not found.');
  }
};

// --- Password Management ---
export const changePassword = (userId: string, oldPassword: string, newPassword: string): void => {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found.');
    
    const user = db.users[userIndex];
    if (user.passwordHash !== hashValue(oldPassword, user.username)) {
        throw new Error('Incorrect current password.');
    }
    if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
    }
    
    user.passwordHash = hashValue(newPassword, user.username);
    db.users[userIndex] = user;
    saveDB(db);
};

export const getUserSecretQuestion = (username: string): string => {
    const db = getDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new Error('User not found.');
    return user.secretQuestion;
};

export const resetPassword = (username: string, secretAnswer: string, newPassword: string): void => {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (userIndex === -1) throw new Error('User not found.');
    
    const user = db.users[userIndex];
    if (user.secretAnswerHash !== hashValue(secretAnswer, user.username)) {
        throw new Error('The provided answer is incorrect.');
    }
     if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
    }

    user.passwordHash = hashValue(newPassword, user.username);
    db.users[userIndex] = user;
    saveDB(db);
};

// --- Session Management ---

export const createSession = (user: User): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const getSession = (): User | null => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error("Failed to parse session", error);
    return null;
  }
};

export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

// --- Article Management ---

export const getArticlesForUser = (userId: string): Article[] => {
  const db = getDB();
  return db.articles
    .filter(article => article.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addArticleForUser = (userId: string, articleData: Omit<Article, 'id' | 'userId' | 'createdAt'>): Article => {
  const db = getDB();
  const newArticle: Article = {
    ...articleData,
    id: crypto.randomUUID(),
    userId: userId,
    createdAt: new Date().toISOString(),
  };
  db.articles.push(newArticle);
  saveDB(db);
  return newArticle;
};

export const updateArticleForUser = (userId: string, articleId: string, updates: Partial<Omit<Article, 'id'>>): Article | null => {
  const db = getDB();
  const articleIndex = db.articles.findIndex(a => a.id === articleId && a.userId === userId);

  if (articleIndex === -1) {
    return null;
  }

  const updatedArticle = { ...db.articles[articleIndex], ...updates };
  db.articles[articleIndex] = updatedArticle;
  saveDB(db);
  return updatedArticle;
};

export const deleteArticleForUser = (userId: string, articleId: string): void => {
  const db = getDB();
  db.articles = db.articles.filter(a => !(a.id === articleId && a.userId === userId));
  saveDB(db);
};
