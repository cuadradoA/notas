const undoRegistry = new Map();

function buildKey(userId, scope) {
  return `${userId}:${scope}`;
}

exports.register = ({ userId, scope, action }) => {
  undoRegistry.set(buildKey(userId, scope), action);
};

exports.consume = async ({ userId, scope }) => {
  const key = buildKey(userId, scope);
  const action = undoRegistry.get(key);

  if (!action) {
    throw new Error("No undo action available for this session");
  }

  undoRegistry.delete(key);
  return action.undo();
};
