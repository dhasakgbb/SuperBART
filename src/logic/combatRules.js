export function isStompCollision(playerBody, enemyBody) {
  const touchingTop =
    Boolean(playerBody.touching?.down) && Boolean(enemyBody.touching?.up);
  const isFalling = playerBody.velocity.y > 20;
  const fromAboveByCenter = playerBody.center.y < enemyBody.center.y;
  const fromAboveByBottom = playerBody.bottom <= enemyBody.top + 10;

  return touchingTop || (isFalling && (fromAboveByCenter || fromAboveByBottom));
}

export function resolveEnemyCollision(playerBody, enemyBody) {
  return isStompCollision(playerBody, enemyBody) ? 'stomp' : 'damage';
}
