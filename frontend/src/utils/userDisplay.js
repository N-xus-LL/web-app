export const getItemOwnerId = (item) => String(item?.owner_id ?? item?.ownerId ?? "");

export const buildUsernameMap = (users) => {
  const map = {};

  users.forEach((user) => {
    if (user?.id != null && user?.username) {
      map[String(user.id)] = user.username;
    }
  });

  return map;
};

export const getOwnerUsername = (item, usernameById) => {
  const ownerId = getItemOwnerId(item);
  return ownerId ? usernameById[ownerId] || "Unknown user" : "Unknown user";
};
