const REQUIRED_OBJECT_TYPES = ['spawn', 'coin', 'enemy', 'goal'];

function propertiesToObject(properties = []) {
  return properties.reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {});
}

export function parseLevelObjects(levelData) {
  const entitiesLayer = levelData.layers.find(
    (layer) => layer.type === 'objectgroup' && layer.name === 'entities'
  );

  if (!entitiesLayer) {
    throw new Error('Missing object layer "entities" in level data');
  }

  const parsed = {
    spawn: null,
    coins: [],
    enemies: [],
    goal: null
  };

  for (const obj of entitiesLayer.objects) {
    const props = propertiesToObject(obj.properties);
    if (obj.type === 'spawn') {
      parsed.spawn = { x: obj.x, y: obj.y };
    } else if (obj.type === 'coin') {
      parsed.coins.push({ x: obj.x, y: obj.y });
    } else if (obj.type === 'enemy') {
      parsed.enemies.push({
        x: obj.x,
        y: obj.y,
        patrolMin: Number(props.patrolMin ?? obj.x - 64),
        patrolMax: Number(props.patrolMax ?? obj.x + 64)
      });
    } else if (obj.type === 'goal') {
      parsed.goal = { x: obj.x, y: obj.y };
    }
  }

  if (!parsed.spawn) {
    throw new Error('Missing spawn object in level entities');
  }
  if (!parsed.goal) {
    throw new Error('Missing goal object in level entities');
  }

  return parsed;
}

export function validateLevelContract(levelData) {
  const errors = [];

  if (!Number.isInteger(levelData.width) || !Number.isInteger(levelData.height)) {
    errors.push('Level must define integer width and height.');
  }

  const groundLayer = levelData.layers.find(
    (layer) => layer.type === 'tilelayer' && layer.name === 'ground'
  );
  if (!groundLayer) {
    errors.push('Missing tile layer "ground".');
  } else if (groundLayer.data.length !== levelData.width * levelData.height) {
    errors.push('Ground tile data length does not match level dimensions.');
  }

  const entitiesLayer = levelData.layers.find(
    (layer) => layer.type === 'objectgroup' && layer.name === 'entities'
  );
  if (!entitiesLayer) {
    errors.push('Missing object layer "entities".');
  } else {
    const seenTypes = new Set(entitiesLayer.objects.map((obj) => obj.type));
    for (const type of REQUIRED_OBJECT_TYPES) {
      if (!seenTypes.has(type)) {
        errors.push(`Missing required object type: ${type}`);
      }
    }
  }

  return errors;
}
