const USERS_KEY = "viventUsers";

const readUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const saveUser = (user) => {
  const users = readUsers();
  const normalized = {
    username: user.username.trim(),
    email: user.email.trim().toLowerCase(),
    phoneNumber: user.phoneNumber?.trim() || "",
    password: user.password,
    accountType: user.accountType,
  };

  const index = users.findIndex(
    (item) =>
      item.email.toLowerCase() === normalized.email ||
      item.username.toLowerCase() === normalized.username
  );

  if (index >= 0) {
    users[index] = normalized;
  } else {
    users.unshift(normalized);
  }

  writeUsers(users);
  return normalized;
};

export const findUserForLogin = ({ identifier, password, accountType }) => {
  const users = readUsers();
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return users.find(
    (user) =>
      user.accountType === accountType &&
      user.password === password &&
      (user.username.toLowerCase() === normalizedIdentifier ||
        user.email.toLowerCase() === normalizedIdentifier)
  );
};

export const findUserByEmail = (email) => {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail);
};

export const updateUserPassword = (email, nextPassword) => {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const updatedUsers = users.map((user) =>
    user.email.toLowerCase() === normalizedEmail
      ? { ...user, password: nextPassword }
      : user
  );

  writeUsers(updatedUsers);
};

